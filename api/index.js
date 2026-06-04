/**
 * MUSIFY BACKEND v4.0 — yt-dlp & play-dl Edition
 * ─────────────────────────────────────────────
 * REWRITE:
 * - Removed youtubei.js entirely (No more "Innertube" logs)
 * - Uses yt-dlp (via youtube-dl-exec) as the primary stream extractor
 * - Uses play-dl for fast, reliable search & metadata
 * - Retains LRU cache for high performance
 * - Optimization: Direct stream proxying with custom headers to prevent 403s
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import compression from 'compression'
import { LRUCache } from 'lru-cache'
import { Readable } from 'stream'
import os from 'os'

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
const streamCache = new LRUCache({ max: 100, ttl: 1000 * 60 * 60 })       // 1 hour
const searchCache = new LRUCache({ max: 200, ttl: 1000 * 60 * 30 })       // 30 min

// ─── External Modules ───
import { getRandomUA, initPlayDl, performSearch, getRelatedVideos } from './youtube.js'
import { searchMusic, getStream, getMetadata } from './musicRouter.js'

// ─── Routes ───

// Search (no rate limiting)
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

    const results = await performSearch('trending music 2025 hits', 25)
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

    const songs = await performSearch(`${artistId} top songs`, 30)
    const result = {
      artist: {
        id: artistId,
        name: artistId,
        image: songs[0]?.thumbnail || `https://picsum.photos/400/400?random=1`
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

// Recommendations — NOW using real YouTube "Up Next" data
app.get('/api/recommendations', async (req, res) => {
  try {
    const { videoId, artist, title } = req.query
    if (!videoId) return res.status(400).json({ error: 'Video ID is required' })

    const cacheKey = `rec:${videoId}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json({ results: cached })

    // Try real YouTube recommendations first
    let results = await getRelatedVideos(videoId)

    // Fallback to search-based if related videos returned too few
    if (results.length < 5) {
      const query = artist ? `${artist} similar songs` : `${title} remix mix`
      const searchResults = await performSearch(query, 15)
      // Merge: real recs first, then fill with search results
      const existingIds = new Set(results.map(r => r.videoId))
      const fillers = searchResults.filter(r => !existingIds.has(r.videoId) && r.videoId !== videoId)
      results = [...results, ...fillers].slice(0, 15)
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

    const songs = await performSearch(query, 30)
    const result = {
      chart: {
        id: chartId,
        name: chartId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: 'Automatically updated from YouTube trends.'
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

// Metadata Endpoint (NEW)
app.get('/api/metadata', async (req, res) => {
    try {
        const { id, source } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing song id' });
        const meta = await getMetadata(id, source || 'youtube');
        if (!meta) return res.status(404).json({ error: 'Metadata not found' });
        res.json(meta);
    } catch (err) {
        console.error('Metadata route error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── Stream Endpoint ───
app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id
  const source = req.query.source || 'youtube'
  if (!videoId) return res.status(400).json({ error: 'Missing video ID' })

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  console.log(`[Stream] Vercel Request for ${videoId} (${source}) from ${clientIp} (Range: ${req.headers.range || 'none'})`)

  try {
    // Check cache for resolved stream info
    const cacheKey = `${source}:${videoId}`
    let streamInfo = streamCache.get(cacheKey)

    if (!streamInfo || streamInfo === 'loading') {
      streamInfo = await getStream(videoId, source)
      streamCache.set(cacheKey, streamInfo)
    }

    const streamUrl = streamInfo.url
    const mimeType = streamInfo.mime || 'audio/webm'
    const userAgent = getRandomUA()

    // Force small 2MB chunk sizes for Vercel Serverless
    const CHUNK_SIZE = 1024 * 1024 * 2
    
    let range = req.headers.range || 'bytes=0-'
    let start = 0
    let end = undefined
    
    const parts = range.replace(/bytes=/, "").split("-")
    start = parseInt(parts[0], 10)
    if (parts[1]) end = parseInt(parts[1], 10)

    let totalSize = streamInfo.size || 0
    if (!totalSize) {
      try {
        const headRes = await fetch(streamUrl, { method: 'HEAD', headers: { 'User-Agent': userAgent } })
        totalSize = parseInt(headRes.headers.get('content-length') || '0', 10)
      } catch (e) {}
    }

    if (totalSize > 0) {
      if (end === undefined || end >= totalSize) end = totalSize - 1
      if (end - start + 1 > CHUNK_SIZE) end = start + CHUNK_SIZE - 1
    }

    const fetchOptions = { 
      headers: { 
        'Range': `bytes=${start}-${end !== undefined ? end : ''}`,
        'User-Agent': userAgent,
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com/',
        'Accept': '*/*',
        'Connection': 'keep-alive'
      } 
    }
    
    const response = await fetch(streamUrl, fetchOptions)

    if (!response.ok && response.status !== 206) {
      throw new Error(`Upstream returned ${response.status}`)
    }

    // Set headers correctly
    res.status(response.status === 206 ? 206 : 200)
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const upstreamRange = response.headers.get('content-range')
    const upstreamLength = response.headers.get('content-length')

    if (upstreamRange) res.setHeader('Content-Range', upstreamRange)
    else if (totalSize > 0 && response.status === 206) {
      res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`)
    }

    if (upstreamLength) res.setHeader('Content-Length', upstreamLength)
    else if (totalSize > 0) {
      res.setHeader('Content-Length', end !== undefined ? (end - start + 1) : (totalSize - start))
    }

    if (!response.body) return res.status(500).json({ error: 'Empty stream' })

    // Use Readable.fromWeb for clean piping on Node 18+ (Vercel's default)
    Readable.fromWeb(response.body).pipe(res)

  } catch (err) {
    console.error('Stream endpoint error:', err.message)

    if (err.message?.includes('403') || err.message?.includes('expired') || err.message?.includes('status')) {
      streamCache.delete(`${source}:${videoId}`)
    }

    if (!res.headersSent) {
      res.status(500).json({ error: 'unavailable' })
    }
  }
})

// ─── Initialize Clients for Serverless ───
initPlayDl().catch(console.error)

export default app
