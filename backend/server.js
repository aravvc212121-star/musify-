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
import play from 'play-dl'
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


// ─── Stealth Identity Mimicry ───
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0'
]

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// ─── Retry Helper ───
async function withRetry(fn, retries = 2, baseDelay = 200) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries) throw err
      await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)))
    }
  }
}

// ─── Play-DL Initialization ───
async function initPlayDl() {
  try {
    // Basic search doesn't need tokens, but this ensures it's ready
    console.log('✅ play-dl search engine initialized')
  } catch (err) {
    console.error('⚠️ play-dl init error:', err.message)
  }
}

// ─── Duration Helpers ───
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function parseDurationText(text) {
  // e.g. "3:45" or "1:02:30"
  if (!text) return 0
  const parts = text.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

// ─── Search Helper (play-dl) ───
async function performSearch(query, limit = 20) {
  try {
    const musicQuery = query.toLowerCase().includes('song') || query.toLowerCase().includes('music')
      ? query
      : `${query} song`

    const videos = await withRetry(() => play.search(musicQuery, { 
      limit: limit + 10,
      source: { youtube: 'video' }
    }), 3, 300)

    const formattedResults = videos
      .filter(v => {
        const title = (v.title || '').toLowerCase()
        if (v.durationInSec < 60) return false

        const blacklist = [
          'lyrics', 'lyric', 'karaoke', 'sing along', '4k', '8k', '1080p', '720p', 
          'hd video', 'full video', 'unplugged', 'acoustic', 'cover', 'remake', 
          'tribute', 'piano version', 'guitar version', 'instrumental', 'reaction', 
          'react', 'review', 'explained', 'behind the scenes', 'making of', 'bts', 
          'interview', 'teaser', 'trailer', 'lofi', 'reverbed', 'reverb', 'slowed'
        ]
        if (blacklist.some(word => title.includes(word))) return false
        return true
      })
      .map(v => {
        const title = (v.title || '').toLowerCase()
        const channelName = (v.channel?.name || '').toLowerCase()
        let score = 0

        // Heuristic for "official" results
        if (channelName.includes('topic') || channelName.includes('vevo')) score = 10
        else if (title.includes('official') || title.includes('audio')) score = 8
        else score = 1

        return { ...v, _score: score }
      })
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score
        return b.views - a.views
      })
      .slice(0, limit)
      .map(v => ({
        videoId: v.id,
        title: v.title || 'Unknown',
        artist: v.channel?.name || 'Unknown',
        channelTitle: v.channel?.name || 'Unknown',
        thumbnail: v.thumbnails[0]?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
        duration: v.durationRaw || '0:00',
        views: v.views || 0,
        publishedAt: v.uploadedAt || 'recently'
      }))

    // Pre-fetch streams for the top 1 result in the background
    if (formattedResults.length > 0) {
      prefetchStream(formattedResults[0].videoId)
    }

    return formattedResults
  } catch (err) {
    console.error('Search error:', err.message)
    return []
  }
}

// ─── Stream URL Extractor (with Piped API Fallback) ───
import youtubedl from 'youtube-dl-exec'

// Piped is an open-source YouTube proxy network. We use its /videoplayback proxy
// endpoint so audio bytes are served by Piped's servers, not Render's (which YouTube blocks).
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.projectsegfau.lt',
  'https://pipedapi.adminforge.de',
  'https://piped-api.garudalinux.org',
  'https://api.piped.yt',
]

// Derive the Piped frontend domain from the API domain (pipedapi.x.y -> piped.x.y)
function getPipedProxyBase(apiInstance) {
  return apiInstance
    .replace('pipedapi.', 'proxy.')
    .replace('piped-api.', 'proxy.')
    .replace('api.piped.', 'proxy.piped.')
}

async function getPipedStreamUrl(videoId) {
  for (const instance of PIPED_INSTANCES) {
    try {
      console.log(`[Stream] Trying Piped instance: ${instance}`)
      const res = await fetch(`${instance}/streams/${videoId}`, {
        headers: { 'User-Agent': getRandomUA() },
        signal: AbortSignal.timeout(6000)
      })

      if (!res.ok) {
        console.log(`[Stream] Piped ${instance} returned ${res.status}, trying next...`)
        continue
      }

      const data = await res.json()
      const audioStreams = data.audioStreams || []
      if (audioStreams.length === 0) continue

      // Get best quality audio stream
      const sorted = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))
      const best = sorted.find(s => s.mimeType?.includes('mp4') || s.mimeType?.includes('m4a')) || sorted[0]

      if (!best || !best.url) continue

      // The URL from Piped is a /videoplayback URL that goes through Piped's own proxy server.
      // We must keep the host of the original Piped proxy — do NOT redirect to the raw YouTube CDN.
      // Parse the URL to find the proxy host and reconstruct
      let proxyUrl = best.url
      
      // Piped streams sometimes come with a relative-looking path or a different host.
      // Ensure we're using the proxy host, not googlevideo.com
      if (proxyUrl.includes('googlevideo.com') || proxyUrl.includes('youtube.com')) {
        // Rebuild via Piped's own videoplayback proxy endpoint
        const proxyBase = getPipedProxyBase(instance)
        const parsed = new URL(proxyUrl)
        proxyUrl = `${proxyBase}/videoplayback${parsed.search}`
      }

      console.log(`[Stream] ${videoId} resolved via Piped proxy (${instance})`)
      return {
        url: proxyUrl,
        mime: best.mimeType || 'audio/mp4',
        size: 0,
        client: 'PIPED',
        redirect: true // Signal to the stream endpoint to use redirect instead of proxying
      }
    } catch (e) {
      console.log(`[Stream] Piped instance ${instance} failed: ${e.message}`)
    }
  }
  return null
}


async function getStreamUrl(videoId) {
  console.log(`[Stream] Extracting ${videoId} using yt-dlp...`)
  try {
    // Primary: yt-dlp — Extremely reliable for direct stream URLs (when not blocked by YouTube)
    const info = await withRetry(() => youtubedl(`https://www.youtube.com/watch?v=${videoId}`, { 
      dumpJson: true, 
      noWarnings: true, 
      noCheckCertificates: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      referer: 'https://www.youtube.com/',
      format: 'bestaudio/best',
      userAgent: getRandomUA()
    }), 2, 500)
    
    if (info && info.url) {
      console.log(`[Stream] ${videoId} extracted via yt-dlp`)
      const mimeMap = {
        'webm': 'audio/webm',
        'm4a': 'audio/mp4',
        'mp3': 'audio/mpeg',
        'opus': 'audio/ogg'
      }
      const mime = mimeMap[info.ext] || 'audio/webm'
      const size = info.filesize || info.filesize_approx || 0
      return { url: info.url, mime, size, client: 'YTDLP' }
    }
  } catch (err) {
    console.warn(`[Stream] yt-dlp failed for ${videoId} (likely IP block). Falling back to Piped API...`)
  }

  // ─── Fallback: Piped API (Proxies audio through their servers — Render-safe) ───
  const pipedResult = await getPipedStreamUrl(videoId)
  if (pipedResult) return pipedResult

  // ─── Last Resort: play-dl ───
  try {
    console.log(`[Stream] Trying play-dl as last resort for ${videoId}...`)
    const stream = await play.stream(`https://www.youtube.com/watch?v=${videoId}`, { quality: 2 })
    if (stream && stream.url) {
      return { url: stream.url, mime: 'audio/webm', size: 0, client: 'PLAYDL' }
    }
  } catch (e) {
    console.error(`[Stream] play-dl also failed: ${e.message}`)
  }

  throw new Error('All streaming methods failed (yt-dlp, Piped API, play-dl). YouTube is completely blocking requests.')
}


// ─── Stream Prefetcher ───
function prefetchStream(videoId) {
  if (streamCache.has(videoId)) return

  // Set a temporary flag so we don't duplicate requests
  streamCache.set(videoId, 'loading')

  getStreamUrl(videoId)
    .then(streamInfo => {
      streamCache.set(videoId, streamInfo)
    })
    .catch(() => {
      streamCache.delete(videoId) // Failed, remove flag
    })
}

// ─── Related Videos (Simplified for play-dl) ───
async function getRelatedVideos(videoId, limit = 15) {
  try {
    const info = await withRetry(() => play.video_info(`https://www.youtube.com/watch?v=${videoId}`), 2, 300)
    const related = info.related_videos || []

    if (related.length > 0) {
      return related.slice(0, limit).map(v => ({
        videoId: v.id,
        title: v.title || 'Unknown',
        artist: v.channel?.name || 'Unknown',
        channelTitle: v.channel?.name || 'Unknown',
        thumbnail: v.thumbnails[0]?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
        duration: v.durationRaw || '0:00',
        views: v.views || 0,
        publishedAt: v.uploadedAt || 'recently'
      }))
    }
  } catch (err) {
    console.warn('Related videos error (falling back to search):', err.message)
  }
  return []
}

// ─── Routes ───

// Search (no rate limiting)
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q
    if (!query) return res.json({ results: [] })

    const cacheKey = `search:${query.toLowerCase().trim()}`
    const cached = searchCache.get(cacheKey)
    if (cached) return res.json({ results: cached })

    const results = await performSearch(query)
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

// ─── Stream Endpoint ───
app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id
  if (!videoId) return res.status(400).json({ error: 'Missing video ID' })

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  console.log(`[Stream] Request for ${videoId} from ${clientIp} (Range: ${req.headers.range || 'none'})`)
  try {
    // Check cache for resolved stream info
    let streamInfo = streamCache.get(videoId)

    if (!streamInfo || streamInfo === 'loading') {
      streamInfo = await getStreamUrl(videoId)
      streamCache.set(videoId, streamInfo)
    }

    const streamUrl = streamInfo.url
    const mimeType = streamInfo.mime || 'audio/webm'
    const userAgent = getRandomUA()

    // ─── For Piped streams: redirect the browser directly to Piped's proxy URL ───
    // Piped stream URLs are served by Piped's own servers and are IP-locked to them.
    // If Render tries to fetch & proxy these bytes, it will get blocked.
    // Instead, we send a 302 redirect so the browser fetches audio directly from Piped.
    if (streamInfo.client === 'PIPED' || streamInfo.redirect) {
      console.log(`[Stream] Redirecting ${videoId} → Piped proxy (client handles stream)`)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 'public, max-age=1800')
      return res.redirect(302, streamUrl)
    }

    const CHUNK_SIZE = 1024 * 1024 * 10 // 10MB chunks for proxied streams

    
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
      console.error(`[Stream] Upstream 403 for ${videoId}. URL starts with: ${streamUrl.substring(0, 50)}...`)
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

    // Efficient piping using Node's stream conversion
    Readable.fromWeb(response.body).pipe(res)

  } catch (err) {
    console.error('Stream endpoint error:', err.message)
    if (err.message?.includes('403') || err.message?.includes('expired')) {
      streamCache.delete(videoId)
    }
    if (!res.headersSent) res.status(500).json({ error: 'unavailable' })
  }
})

// ─── Serve static files ───
app.use(express.static(path.join(__dirname, '../frontend/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

// ─── Start with keep-alive ───
initPlayDl().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🎵 Musify v4 (yt-dlp) running on port ${PORT}`)
  })

  server.keepAliveTimeout = 65000
  server.headersTimeout = 66000
})
