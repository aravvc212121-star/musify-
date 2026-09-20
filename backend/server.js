/**
 * RHYM BACKEND v5.0 — JioSaavn Edition (Local Dev Server)
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
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import helmet from 'helmet'
import xss from 'xss'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ───
// Hide express stack and add security headers
app.use(helmet({
  contentSecurityPolicy: false, // Don't break React app connections
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  referrerPolicy: false // Allow referrer to be sent to media CDNs if needed
}))
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

// ─── Socket.io Blend Rooms Logic ───
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e6 // 1MB limit for security
})

// Room state storage: { [roomId]: { members: [{ id, name }], currentTrack: null, isPlaying: false, position: 0 } }
const blendRooms = {}

// Draw canvas state per room: { [roomId]: { strokes: { [strokeId]: { strokeId, startHue, strokeWidth, points, erased } } } }
const drawCanvasState = {}

function generateRoomCode() {
  const code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return code
}

io.on('connection', (socket) => {
  console.log(`[Blend] Client connected: ${socket.id}`)

  socket.on('create-room', (callback) => {
    let roomId
    let attempts = 0
    let maxAttempts = 5
    let success = false
    
    while (attempts < maxAttempts) {
      roomId = generateRoomCode()
      if (!blendRooms[roomId]) {
        success = true
        break
      }
      attempts++
    }

    if (!success) {
      return callback({ success: false, error: 'Could not generate unique room code. Please try again.' })
    }

    blendRooms[roomId] = { hostId: null, members: [], currentTrack: null, isPlaying: false, position: 0 }
    // User doesn't join here yet, they call join-room right after
    callback({ success: true, roomId })
  })

  socket.on('join-room', (data, callback) => {
    const roomIdStr = typeof data === 'string' ? data : data.roomId
    const username = typeof data === 'object' && data.username ? data.username : null

    if (!roomIdStr) return callback({ success: false, error: 'Room code required' })
    const roomId = roomIdStr.toUpperCase()
    
    if (!blendRooms[roomId]) {
      return callback({ success: false, error: 'Room not found' })
    }
    
    if (blendRooms[roomId].members.length >= 3) {
      return callback({ success: false, error: 'Room is full (max 3 members)' })
    }

    // Leave any current room
    const currentRooms = Array.from(socket.rooms).filter(r => r !== socket.id)
    currentRooms.forEach(r => {
      socket.leave(r)
      if (blendRooms[r]) {
        blendRooms[r].members = blendRooms[r].members.filter(m => m.id !== socket.id)
        io.to(r).emit('room-updated', blendRooms[r])
      }
    })

    socket.join(roomId)
    // Add member
    if (blendRooms[roomId].members.length === 0) {
      blendRooms[roomId].hostId = socket.id
    }
    
    // Check if user is already in the room to avoid duplicates
    let member = blendRooms[roomId].members.find(m => m.id === socket.id)
    if (!member) {
      const fallbackName = `User ${blendRooms[roomId].members.length + 1}`
      member = { id: socket.id, name: username || fallbackName }
      blendRooms[roomId].members.push(member)
    } else if (username) {
      member.name = username // Update name if they rejoin with a new one
    }
    
    console.log(`[Blend] ${socket.id} joined room ${roomId}. Total: ${blendRooms[roomId].members.length}`)

    // Broadcast update
    io.to(roomId).emit('room-updated', blendRooms[roomId])
    
    // Return current room state to the joiner
    callback({ success: true, room: blendRooms[roomId] })
  })

  socket.on('leave-room', (roomId) => {
    if (blendRooms[roomId]) {
      socket.leave(roomId)
      
      if (blendRooms[roomId].hostId === socket.id) {
        console.log(`[Blend] Host ${socket.id} left. Destroying room ${roomId}.`)
        io.to(roomId).emit('room-destroyed', { reason: 'Host left the room' })
        delete blendRooms[roomId]
        delete drawCanvasState[roomId]
      } else {
        blendRooms[roomId].members = blendRooms[roomId].members.filter(m => m.id !== socket.id)
        console.log(`[Blend] ${socket.id} left room ${roomId}.`)
        if (blendRooms[roomId].members.length === 0) {
          delete blendRooms[roomId]
          delete drawCanvasState[roomId]
        } else {
          io.to(roomId).emit('room-updated', blendRooms[roomId])
        }
      }
    }
  })

  socket.on('disconnecting', () => {
    const currentRooms = Array.from(socket.rooms).filter(r => r !== socket.id)
    currentRooms.forEach(roomId => {
      if (blendRooms[roomId]) {
        if (blendRooms[roomId].hostId === socket.id) {
          console.log(`[Blend] Host ${socket.id} disconnected. Destroying room ${roomId}.`)
          io.to(roomId).emit('room-destroyed', { reason: 'Host disconnected' })
          delete blendRooms[roomId]
          delete drawCanvasState[roomId]
        } else {
          blendRooms[roomId].members = blendRooms[roomId].members.filter(m => m.id !== socket.id)
          if (blendRooms[roomId].members.length === 0) {
            delete blendRooms[roomId]
            delete drawCanvasState[roomId]
          } else {
            io.to(roomId).emit('room-updated', blendRooms[roomId])
          }
        }
      }
    })
  })

  socket.on('disconnect', () => {
    console.log(`[Blend] Client disconnected: ${socket.id}`)
  })

  // Playback sync events
  socket.on('player-event', ({ roomId, type, data }) => {
    if (!blendRooms[roomId]) return

    const room = blendRooms[roomId]
    const now = Date.now()

    if (type === 'track-change') {
      room.currentTrack = data.track
      room.position = 0
      // keep previous isPlaying state unless specified
      if (typeof data.isPlaying === 'boolean') {
        room.isPlaying = data.isPlaying
      }
    } else if (type === 'play') {
      room.isPlaying = true
      room.position = data.position || room.position
    } else if (type === 'pause') {
      room.isPlaying = false
      room.position = data.position || room.position
    } else if (type === 'seek') {
      room.position = data.position
    }

    // Broadcast to everyone else in the room
    socket.to(roomId).emit('player-event', {
      type,
      data,
      timestamp: now,
      senderId: socket.id
    })
  })

  // ─── Chat Messages ───
  socket.on('chat-message', ({ roomId, message, senderName }) => {
    if (!blendRooms[roomId]) return
    const member = blendRooms[roomId].members.find(m => m.id === socket.id)
    if (!member) return
    if (!socket.rooms.has(roomId)) return // Security: Verify room membership

    // Rate limiting: max 5 messages per 2 seconds
    const now = Date.now()
    if (!socket.rateLimits) socket.rateLimits = { chat: [] }
    socket.rateLimits.chat = socket.rateLimits.chat.filter(t => now - t < 2000)
    if (socket.rateLimits.chat.length >= 5) return // Rate limited
    socket.rateLimits.chat.push(now)

    // Sanitize message to prevent XSS
    const sanitizedMessage = xss((message || '').trim())
    if (!sanitizedMessage) return

    const chatMsg = {
      id: `${socket.id}-${now}`,
      senderId: socket.id,
      senderName: xss(senderName || member.name || 'User'),
      message: sanitizedMessage,
      timestamp: now,
    }

    // Broadcast to ALL members in the room (sender included for confirmation)
    io.to(roomId).emit('chat-message', chatMsg)
  })

  // Heartbeat to fix drift
  socket.on('heartbeat', ({ roomId, position, isPlaying }) => {
    if (!blendRooms[roomId] || !socket.rooms.has(roomId)) return // Security: Verify room membership
    const room = blendRooms[roomId]
    room.position = position
    room.isPlaying = isPlaying
    socket.to(roomId).emit('heartbeat', { position, isPlaying, timestamp: Date.now() })
  })

  // ─── Draw Together Events ───

  // Helper: find which room this socket is in
  function getSocketRoom() {
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id)
    for (const r of rooms) {
      if (blendRooms[r]) return r
    }
    return null
  }

  // Rate limiting helper for high-frequency drawing events
  function isRateLimited(type, limit, windowMs) {
    const now = Date.now()
    if (!socket.rateLimits) socket.rateLimits = {}
    if (!socket.rateLimits[type]) socket.rateLimits[type] = []
    socket.rateLimits[type] = socket.rateLimits[type].filter(t => now - t < windowMs)
    if (socket.rateLimits[type].length >= limit) return true
    socket.rateLimits[type].push(now)
    return false
  }

  socket.on('draw:start', ({ userId, strokeId, strokeWidth, startHue, x, y, isEraser }) => {
    const roomId = getSocketRoom()
    if (!roomId) return

    // Store stroke on server
    if (!drawCanvasState[roomId]) drawCanvasState[roomId] = { strokes: {} }
    drawCanvasState[roomId].strokes[strokeId] = {
      strokeId,
      startHue,
      strokeWidth: strokeWidth || 4,
      points: [{ x, y }],
      erased: false,
      isEraser: isEraser || false,
    }

    // Relay to others
    socket.to(roomId).emit('draw:start', { userId, strokeId, strokeWidth, startHue, x, y, isEraser })
  })

  socket.on('draw:point', ({ strokeId, points }) => {
    const roomId = getSocketRoom()
    if (!roomId || !socket.rooms.has(roomId)) return
    if (isRateLimited('draw_point', 30, 1000)) return // Max 30 point events per second

    // Append points to server-side stroke
    if (drawCanvasState[roomId] && drawCanvasState[roomId].strokes[strokeId]) {
      const stroke = drawCanvasState[roomId].strokes[strokeId]
      if (points && Array.isArray(points)) {
        // Enforce max points per payload
        const safePoints = points.slice(0, 100)
        stroke.points.push(...safePoints)
      }
    }

    // Relay to others
    socket.to(roomId).emit('draw:point', { strokeId, points })
  })

  socket.on('draw:end', ({ strokeId }) => {
    const roomId = getSocketRoom()
    if (!roomId) return
    socket.to(roomId).emit('draw:end', { strokeId })
  })

  socket.on('draw:erase', ({ points }) => {
    const roomId = getSocketRoom()
    if (!roomId || !drawCanvasState[roomId]) return

    // Mark strokes as erased on server
    if (points && Array.isArray(points)) {
      points.forEach(({ x, y, radius }) => {
        const r = radius || 20
        Object.values(drawCanvasState[roomId].strokes).forEach(stroke => {
          if (stroke.erased) return
          for (const pt of stroke.points) {
            const dx = pt.x - x
            const dy = pt.y - y
            if (dx * dx + dy * dy < r * r) {
              stroke.erased = true
              break
            }
          }
        })
      })
    }

    // Relay to others
    socket.to(roomId).emit('draw:erase', { points })
  })

  socket.on('draw:clear', () => {
    const roomId = getSocketRoom()
    if (!roomId) return

    // Clear server-side canvas state
    if (drawCanvasState[roomId]) {
      drawCanvasState[roomId].strokes = {}
    }

    // Relay to others
    socket.to(roomId).emit('draw:clear')
  })

  socket.on('draw:requestHistory', () => {
    const roomId = getSocketRoom()
    if (!roomId) return

    const state = drawCanvasState[roomId]
    if (state && state.strokes) {
      const strokesArr = Object.values(state.strokes)
      socket.emit('draw:history', strokesArr)
    } else {
      socket.emit('draw:history', [])
    }
  })
})

// ─── Serve static files ───
// Explicitly block sensitive files
app.use((req, res, next) => {
  if (req.url.includes('.env') || req.url.includes('.git')) {
    return res.status(404).send('Not Found')
  }
  next()
})

app.use(express.static(path.join(__dirname, '../frontend/dist'), {
  dotfiles: 'ignore' // Ignore hidden files
}))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

// ─── Generic 404 for API ───
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message)
  res.status(500).json({ error: 'Internal Server Error' })
})

// ─── Start ───
server.listen(PORT, () => {
  console.log(`🎵 Rhym v5 (JioSaavn) running on port ${PORT}`)
})

server.keepAliveTimeout = 65000
server.headersTimeout = 66000
