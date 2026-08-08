/**
 * MUSIFY BACKEND v5.0 — JioSaavn Edition (Local Dev Server)
 * ─────────────────────────────────────────────
 * REWRITE:
 * - Removed ALL YouTube dependencies (yt-dlp, play-dl, Invidious)
 * - 100% JioSaavn backend — identical logic to Vercel API
 * - Imports shared Saavn module from ../api/saavn.js
 * - Serves static frontend build + proxies Saavn CDN streams
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import compression from 'compression'
import { LRUCache } from 'lru-cache'
import { Readable } from 'stream'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ───
app.use(compression())
app.use(cors())
app.use(express.json())

// ─── Caches ───
const streamCache = new LRUCache({ max: 200, ttl: 1000 * 60 * 60 })       // 1 hour
const searchCache = new LRUCache({ max: 300, ttl: 1000 * 60 * 30 })       // 30 min

// ─── JioSaavn Module (shared with Vercel API) ───
import {
  saavnSearch,
  saavnGetStreamUrl,
  saavnGetMetadata,
  saavnGetRecommendations,
  saavnTrending,
  saavnArtistTopSongs,
  saavnGetChart
} from '../api/saavn.js'

// ─── Routes ───

// Search
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q
    if (!query) return res.json({ results: [] })

    const cacheKey = `search:${query.toLowerCase().trim()}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json({ results: cached })

    const results = await saavnSearch(query)
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

    const results = await saavnTrending(25)
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

    const songs = await saavnArtistTopSongs(artistId, 30)
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

    // Primary: Saavn reco API
    let results = await saavnGetRecommendations(videoId)

    // Supplement with search if too few
    if (results.length < 5 && (artist || title)) {
      const query = artist ? `${artist} similar songs` : `${title} songs`
      try {
        const searchResults = await saavnSearch(query, 15)
        const existingIds = new Set(results.map(r => r.id))
        const fillers = searchResults.filter(r => !existingIds.has(r.id) && r.id !== videoId)
        results = [...results, ...fillers].slice(0, 15)
      } catch (_) { /* ignore */ }
    }

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

    const songs = await saavnGetChart(query, 30)
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
    const meta = await saavnGetMetadata(id)
    if (!meta) return res.status(404).json({ error: 'Metadata not found' })
    res.json(meta)
  } catch (err) {
    console.error('Metadata route error:', err.message)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Stream Endpoint ───
// Proxies audio from JioSaavn CDN with range-request support.
app.get('/api/stream', async (req, res) => {
  const songId = req.query.id
  if (!songId) return res.status(400).json({ error: 'Missing song ID' })

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  console.log(`[Stream] Request for ${songId} from ${clientIp} (Range: ${req.headers.range || 'none'})`)

  try {
    // Check cache — instantly reject songs we already know don't exist
    let streamUrl = streamCache.get(songId)

    if (streamUrl === 'not_found') {
      return res.status(404).json({ error: 'Song not available on Saavn' })
    }

    if (!streamUrl || streamUrl === 'loading') {
      streamUrl = await saavnGetStreamUrl(songId)
      if (!streamUrl) {
        // Cache the failure so retries don't hammer the Saavn API
        streamCache.set(songId, 'not_found')
        return res.status(404).json({ error: 'Song not available on Saavn' })
      }
      streamCache.set(songId, streamUrl)
    }

    // For consistency with Vercel deployment, we issue a 302 Redirect
    // to the Saavn CDN instead of proxying the stream locally.
    res.redirect(302, streamUrl)

  } catch (err) {
    console.error('Stream endpoint error:', err.message)
    streamCache.delete(songId)
    res.status(500).json({ error: 'unavailable' })
  }
})

// ─── Serve static files ───
app.use(express.static(path.join(__dirname, '../frontend/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

// ─── Start ───
const server = app.listen(PORT, () => {
  console.log(`🎵 Musify v5 (JioSaavn) running on port ${PORT}`)
})

server.keepAliveTimeout = 65000
server.headersTimeout = 66000
