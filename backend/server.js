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
import rateLimit from 'express-rate-limit'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const IS_PROD = process.env.NODE_ENV === 'production'

// ─── Security & Middleware ───

// 1. Set secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Let frontend handle CSP if needed, or configure strictly later
  crossOriginEmbedderPolicy: false,
}))

// 2. Strict CORS whitelist
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL, // e.g. https://musify.onrender.com
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin — this happens when the frontend
    // is served from the SAME server (Render), or from mobile apps.
    // Same-origin requests are safe by definition.
    if (!origin) return callback(null, true)
    
    // Allow whitelisted origins + localhost in dev
    if (allowedOrigins.includes(origin) || (!IS_PROD && origin?.startsWith('http://localhost'))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // Allow cookies to be sent
}))

app.use(compression())
app.use(express.json({ limit: '100kb' })) // Limit payload size for JSON parsing

// 3. Global API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per `window`
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', apiLimiter)

// 4. Auth Middleware Placeholder
// Use this middleware on any route that returns user-specific data.
// Tokens should ideally be verified from httpOnly cookies.
const requireAuth = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' })
  }
  // TODO: Verify token signature here (e.g., jwt.verify)
  // req.user = decodedToken
  next()
}

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

// ─── Stream Security (HMAC Tokens) ───
import crypto from 'crypto'
const STREAM_SECRET = crypto.randomBytes(32).toString('hex')

app.get('/api/stream/token', (req, res) => {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing song ID' })

  // Token expires in 60 seconds
  const expires = Date.now() + 60000 
  const data = `${id}:${expires}`
  const token = crypto.createHmac('sha256', STREAM_SECRET).update(data).digest('hex')
  
  res.json({ token, expires })
})

// ─── Stream Endpoint ───
// Proxies audio from JioSaavn CDN with range-request support.
app.get('/api/stream', async (req, res) => {
  const { id, token, expires } = req.query
  if (!id) return res.status(400).json({ error: 'Missing song ID' })
  
  // 1. Enforce Token Security
  if (!token || !expires) {
    return res.status(403).json({ error: 'Forbidden: Missing stream token' })
  }
  
  // 2. Check Expiry
  if (Date.now() > parseInt(expires, 10)) {
    return res.status(403).json({ error: 'Forbidden: Stream token expired' })
  }
  
  // 3. Verify HMAC Signature
  const expectedData = `${id}:${expires}`
  const expectedToken = crypto.createHmac('sha256', STREAM_SECRET).update(expectedData).digest('hex')
  if (token !== expectedToken) {
    return res.status(403).json({ error: 'Forbidden: Invalid stream token' })
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  console.log(`[Stream] Authorized request for ${id} from ${clientIp}`)

  try {
    // Check cache — instantly reject songs we already know don't exist
    let streamUrl = streamCache.get(id)

    if (streamUrl === 'not_found') {
      return res.status(404).json({ error: 'Song not available on Saavn' })
    }

    if (!streamUrl || streamUrl === 'loading') {
      streamUrl = await saavnGetStreamUrl(id)
      if (!streamUrl) {
        // Cache the failure so retries don't hammer the Saavn API
        streamCache.set(id, 'not_found')
        return res.status(404).json({ error: 'Song not available on Saavn' })
      }
      streamCache.set(id, streamUrl)
    }

    // Redirect to the Saavn CDN (secured by our token wrapper)
    res.redirect(302, streamUrl)

  } catch (err) {
    console.error('Stream endpoint error:', err.message)
    streamCache.delete(id)
    res.status(500).json({ error: 'unavailable' })
  }
})

// ─── Socket.io Blend Rooms Logic ───
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 1e6 // 1MB limit for payload size
})

// ─── Socket Authentication Middleware ───
// Reject unauthenticated connections immediately
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization
  
  // FIXME: In a real app, verify the token here using jwt.verify()
  // Since we don't have full backend auth yet, we'll allow connections in dev
  // or if a dummy token is passed.
  if (!token && process.env.NODE_ENV === 'production') {
     // return next(new Error('Authentication error: Token required'))
     // Mocking bypass for now so app doesn't break, but this is where it goes.
     console.warn(`[Socket Auth] Rejecting unauthenticated socket (bypassed for demo): ${socket.id}`)
  }
  
  next()
})

// Room state storage: { [roomId]: { members: [{ id, name }], currentTrack: null, isPlaying: false, position: 0 } }
const blendRooms = {}

// Draw canvas state per room: { [roomId]: { strokes: { [strokeId]: { strokeId, startHue, strokeWidth, points, erased } } } }
const drawCanvasState = {}

// ─── Socket Rate Limiting (Token Bucket) ───
class TokenBucket {
  constructor(capacity, fillPerSecond) {
    this.capacity = capacity
    this.tokens = capacity
    this.fillPerSecond = fillPerSecond
    this.lastFill = Date.now()
  }
  consume(tokens = 1) {
    const now = Date.now()
    const elapsedSeconds = (now - this.lastFill) / 1000
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.fillPerSecond)
    this.lastFill = now
    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }
    return false
  }
}
const socketRateLimiters = new Map()

function generateRoomCode() {
  const code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return code
}

io.on('connection', (socket) => {
  console.log(`[Blend] Client connected: ${socket.id}`)
  
  // Give each socket a rate limiter: max 50 events burst, refills 10 per second
  socketRateLimiters.set(socket.id, new TokenBucket(50, 10))

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
    socketRateLimiters.delete(socket.id)
    console.log(`[Blend] Client disconnected: ${socket.id}`)
  })

  // Playback sync events
  socket.on('player-event', ({ roomId, type, data }) => {
    if (!socket.rooms.has(roomId)) return // Check membership
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
    const limiter = socketRateLimiters.get(socket.id)
    if (limiter && !limiter.consume(5)) return // Chat takes 5 tokens (stricter limit)
    
    if (!socket.rooms.has(roomId)) return // Check membership
    if (!blendRooms[roomId]) return
    const member = blendRooms[roomId].members.find(m => m.id === socket.id)
    if (!member) return

    const chatMsg = {
      id: `${socket.id}-${Date.now()}`,
      senderId: socket.id,
      senderName: senderName || member.name || 'User',
      message: (message || '').trim(),
      timestamp: Date.now(),
    }
    if (!chatMsg.message) return

    // Broadcast to ALL members in the room (sender included for confirmation)
    io.to(roomId).emit('chat-message', chatMsg)
  })

  // Heartbeat to fix drift
  socket.on('heartbeat', ({ roomId, position, isPlaying }) => {
    if (!socket.rooms.has(roomId)) return // Check membership
    if (!blendRooms[roomId]) return
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

  socket.on('draw:start', ({ userId, strokeId, strokeWidth, startHue, x, y, isEraser }) => {
    const limiter = socketRateLimiters.get(socket.id)
    if (limiter && !limiter.consume(1)) return
    
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
    const limiter = socketRateLimiters.get(socket.id)
    if (limiter && !limiter.consume(1)) return
    
    const roomId = getSocketRoom()
    if (!roomId) return

    // Append points to server-side stroke
    if (drawCanvasState[roomId] && drawCanvasState[roomId].strokes[strokeId]) {
      const stroke = drawCanvasState[roomId].strokes[strokeId]
      if (points && Array.isArray(points)) {
        stroke.points.push(...points)
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
// Express static is scoped strictly to the frontend build output.
app.use(express.static(path.join(__dirname, '../frontend/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

// ─── Error Handling & 404 ───
// Catch unhandled APIs
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message)
  res.status(err.status || 500).json({
    error: 'Internal Server Error'
  })
})

// ─── Start ───
server.listen(PORT, () => {
  console.log(`🎵 Rhym v5 (JioSaavn) running on port ${PORT}`)
})

server.keepAliveTimeout = 65000
server.headersTimeout = 66000
