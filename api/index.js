/**
 * RHYM BACKEND v5.0 — JioSaavn Edition (Vercel Serverless)
 * ─────────────────────────────────────────────
 * REWRITE:
 * - Removed ALL YouTube dependencies (yt-dlp, play-dl, youtubei.js)
 * - 100% JioSaavn backend — works on any cloud platform
 * - Saavn CDN streams proxied for reliable CORS-free playback
 * - LRU cache for high performance
 * - No IP blocking issues — fully deployable
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import compression from 'compression'
import { LRUCache } from 'lru-cache'

dotenv.config()

const app = express()

// ─── Middleware ───
app.use(compression())
app.use(cors())
app.use(express.json())

// ─── Caches ───
const streamCache = new LRUCache({ max: 200, ttl: 1000 * 60 * 60 })       // 1 hour
const searchCache = new LRUCache({ max: 300, ttl: 1000 * 60 * 30 })       // 30 min

// ─── JioSaavn-only Backend ───
import {
  searchMusic,
  getStream,
  getMetadata,
  getRecommendationsForSong,
  getTrendingSongs,
  getArtistSongs,
  getChartSongs
} from './musicRouter.js'

// ─── Routes ───

// Search
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q
    if (!query) return res.json({ results: [] })

    const cacheKey = `search:${query.toLowerCase().trim()}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json({ results: cached })

    const results = await searchMusic(query)
    searchCache.set(cacheKey, results)
    res.json({ results })
  } catch (err) {
    console.error('Search route error:', err.message)
    res.json({ results: [] })
  }
})

// Trending
app.get('/api/trending', async (req, res) => {
  try {
    const cached = searchCache.get('trending')
    if (cached) return res.json({ results: cached })

    const results = await getTrendingSongs(25)
    searchCache.set('trending', results)
    res.json({ results })
  } catch (err) {
    console.error('Trending error:', err.message)
    res.json({ results: [] })
  }
})

// Artist Songs
app.get('/api/artist/:id/songs', async (req, res) => {
  try {
    const artistId = req.params.id
    const cacheKey = `artist:${artistId.toLowerCase()}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json(cached)

    const songs = await getArtistSongs(artistId, 30)
    const result = {
      artist: {
        id: artistId,
        name: artistId,
        image: songs[0]?.thumbnail || ''
      },
      songs
    }

    searchCache.set(cacheKey, result)
    res.json(result)
  } catch (err) {
    console.error('Artist error:', err.message)
    res.json({ artist: { id: req.params.id, name: req.params.id, image: '' }, songs: [] })
  }
})

// Recommendations
app.get('/api/recommendations', async (req, res) => {
  try {
    const { videoId, artist, title } = req.query
    if (!videoId) return res.status(400).json({ error: 'Song ID is required' })

    const cacheKey = `rec:${videoId}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json({ results: cached })

    const results = await getRecommendationsForSong(videoId, artist, title)
    searchCache.set(cacheKey, results)
    res.json({ results })
  } catch (err) {
    console.error('Recommendations error:', err.message)
    res.json({ results: [] })
  }
})

// Charts
app.get('/api/charts/:id', async (req, res) => {
  try {
    const chartId = req.params.id
    const cacheKey = `chart:${chartId}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json(cached)

    let query = chartId.replace(/_/g, ' ')
    if (chartId === 'top_hits') query = 'top hits 2025'

    const songs = await getChartSongs(query, 30)
    const result = {
      chart: {
        id: chartId,
        name: chartId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: 'Curated from JioSaavn.'
      },
      songs
    }

    searchCache.set(cacheKey, result)
    res.json(result)
  } catch (err) {
    console.error('Charts error:', err.message)
    res.json({ chart: { id: req.params.id, name: req.params.id }, songs: [] })
  }
})

// Metadata
app.get('/api/metadata', async (req, res) => {
  try {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing song id' })
    const meta = await getMetadata(id)
    if (!meta) return res.status(404).json({ error: 'Metadata not found' })
    res.json(meta)
  } catch (err) {
    console.error('Metadata route error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Stream Endpoint ───
// Proxies audio from JioSaavn CDN. Much simpler than YouTube proxying
// since Saavn CDN URLs are standard HTTP with native range-request support.
app.get('/api/stream', async (req, res) => {
  const songId = req.query.id
  if (!songId) return res.status(400).json({ error: 'Missing song ID' })

  console.log(`[Stream] Request for ${songId} (Range: ${req.headers.range || 'none'})`)

  try {
    // Check cache — instantly reject songs we already know don't exist
    let streamUrl = streamCache.get(songId)

    if (streamUrl === 'not_found') {
      return res.status(404).json({ error: 'Song not available on Saavn' })
    }

    if (!streamUrl || streamUrl === 'loading') {
      try {
        const streamInfo = await getStream(songId)
        streamUrl = streamInfo.url
        streamCache.set(songId, streamUrl)
      } catch (e) {
        // Cache the failure so retries don't hammer the Saavn API
        streamCache.set(songId, 'not_found')
        return res.status(404).json({ error: 'Song not available on Saavn' })
      }
    }

    // Vercel serverless functions have a 4.5MB response limit.
    // Instead of proxying the stream, we issue a 302 Redirect to the Saavn CDN.
    // The browser's <audio> element will automatically follow this redirect and
    // send Range headers directly to the CDN.
    res.redirect(302, streamUrl)

  } catch (err) {
    console.error('Stream endpoint error:', err.message)
    streamCache.delete(songId)
    res.status(500).json({ error: 'unavailable' })
  }
})

export default app
