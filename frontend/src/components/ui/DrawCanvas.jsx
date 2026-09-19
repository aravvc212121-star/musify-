import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useBlend } from '../../context/BlendContext.jsx'

// ─── Rainbow hue helpers ───
function hslColor(hue, alpha = 1) {
  return `hsla(${hue % 360}, 90%, 58%, ${alpha})`
}

// ─── DrawCanvas Component ───
export default function DrawCanvas({ eraserActive, scrollRef, drawMode, clearTrigger }) {
  const { socket, room } = useBlend()
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)

  // Drawing state
  const isDrawingRef = useRef(false)
  const currentStrokeRef = useRef(null)
  const pointsRef = useRef([])
  const startHueRef = useRef(0)
  const activePointersRef = useRef(0) // Track number of fingers
  const lastTouchYRef = useRef(null) // For manual 2-finger scroll

  // All strokes for replay
  const allStrokesRef = useRef({})

  // Batching for pointermove
  const pendingPointsRef = useRef([])
  const rafIdRef = useRef(null)

  // Eraser state
  const eraserActiveRef = useRef(false)
  useEffect(() => { eraserActiveRef.current = eraserActive }, [eraserActive])

  // My hue offset: host starts at 0, other user at 180
  const myHueOffset = useRef(0)

  useEffect(() => {
    if (room && socket) {
      const members = room.members || []
      const myIndex = members.findIndex(m => m.id === socket.id)
      myHueOffset.current = myIndex <= 0 ? 0 : 180
    }
  }, [room, socket])

  // ─── Canvas setup ───
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctxRef.current = ctx
      // Redraw all strokes after resize
      redrawAll()
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ─── Native gesture handling (prevent zoom, allow JS scroll) ───
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length >= 2) {
        // Average Y of the first two fingers
        const y = (e.touches[0].clientY + e.touches[1].clientY) / 2
        lastTouchYRef.current = y
      }
    }

    const handleTouchMove = (e) => {
      // Prevent browser default for BOTH 1-finger (prevents pull-to-refresh/scroll)
      // AND 2-finger (prevents pinch-to-zoom)
      e.preventDefault()

      if (e.touches && e.touches.length >= 2) {
        const y = (e.touches[0].clientY + e.touches[1].clientY) / 2
        if (lastTouchYRef.current !== null && scrollRef && scrollRef.current) {
          const deltaY = lastTouchYRef.current - y
          scrollRef.current.scrollTop += deltaY
        }
        lastTouchYRef.current = y
      }
    }

    const handleTouchEnd = (e) => {
      if (!e.touches || e.touches.length < 2) {
        lastTouchYRef.current = null
      }
    }

    const handleWheel = (e) => {
      if (scrollRef && scrollRef.current) {
        scrollRef.current.scrollTop += e.deltaY
      }
    }

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false })
    canvas.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      canvas.removeEventListener('touchcancel', handleTouchEnd)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [scrollRef])


  // ─── Redraw all stored strokes ───
  const redrawAll = useCallback(() => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

    Object.values(allStrokesRef.current).forEach(stroke => {
      if (stroke.erased) return // Legacy erased flag support
      drawStrokeFromPoints(ctx, stroke.points, stroke.startHue, stroke.strokeWidth, stroke.isEraser)
    })
  }, [])

  // ─── Auto-clear local canvas when turning off drawMode ───
  useEffect(() => {
    if (!drawMode) {
      allStrokesRef.current = {}
      const ctx = ctxRef.current
      if (ctx) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      }
    }
  }, [drawMode])

  // ─── Programmatic clear from header button ───
  useEffect(() => {
    if (clearTrigger > 0) {
      allStrokesRef.current = {}
      const ctx = ctxRef.current
      if (ctx) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      }
    }
  }, [clearTrigger])

  // ─── Draw a full stroke from points array ───
  function drawStrokeFromPoints(ctx, points, startHue, strokeWidth = 4, isEraser = false) {
    if (!points || points.length < 2) return

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = 30 // Thicker eraser
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = strokeWidth
    }

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const hue = (startHue + i * 3) % 360

      ctx.beginPath()
      if (!isEraser) {
        ctx.strokeStyle = hslColor(hue)
      }

      if (i >= 2) {
        const prevPrev = points[i - 2]
        const cpx = prev.x
        const cpy = prev.y
        ctx.moveTo((prevPrev.x + prev.x) / 2, (prevPrev.y + prev.y) / 2)
        ctx.quadraticCurveTo(cpx, cpy, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2)
      } else {
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(curr.x, curr.y)
      }
      ctx.stroke()
    }
    
    ctx.globalCompositeOperation = 'source-over' // Reset
  }

  // ─── Draw an incremental segment (for live drawing) ───
  function drawSegment(ctx, points, pointIndex, startHue, strokeWidth = 4, isEraser = false) {
    if (pointIndex < 1 || pointIndex >= points.length) return

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = 30 // Thicker eraser
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = strokeWidth
    }

    const prev = points[pointIndex - 1]
    const curr = points[pointIndex]
    const hue = (startHue + pointIndex * 3) % 360

    ctx.beginPath()
    if (!isEraser) {
      ctx.strokeStyle = hslColor(hue)
    }

    if (pointIndex >= 2) {
      const prevPrev = points[pointIndex - 2]
      ctx.moveTo((prevPrev.x + prev.x) / 2, (prevPrev.y + prev.y) / 2)
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2)
    } else {
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(curr.x, curr.y)
    }
    ctx.stroke()

    ctx.globalCompositeOperation = 'source-over' // Reset
  }

  // ─── Pointer handlers (local drawing) ───
  const getPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handlePointerDown = useCallback((e) => {
    if (e.target !== canvasRef.current) return
    
    activePointersRef.current++
    
    // Only capture drawing if exactly 1 finger/pointer is used.
    if (activePointersRef.current > 1) {
      // Cancel drawing if multi-touch happens (e.g., user wants to scroll)
      isDrawingRef.current = false
      return
    }

    const pos = getPos(e)
    isDrawingRef.current = true
    const strokeId = `${socket?.id || 'local'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const startHue = myHueOffset.current + Math.random() * 60
    currentStrokeRef.current = strokeId
    startHueRef.current = startHue
    pointsRef.current = [pos]

    const isEraser = eraserActiveRef.current

    // Store stroke
    allStrokesRef.current[strokeId] = {
      strokeId,
      startHue,
      strokeWidth: 4,
      points: [pos],
      isEraser,
    }

    // Emit start
    if (socket && room) {
      socket.emit('draw:start', {
        userId: socket.id,
        strokeId,
        strokeWidth: 4,
        startHue,
        x: pos.x,
        y: pos.y,
        isEraser,
      })
    }
  }, [socket, room])

  const handlePointerMove = useCallback((e) => {
    if (!isDrawingRef.current || activePointersRef.current > 1) return

    const pos = getPos(e)
    const strokeId = currentStrokeRef.current
    if (!strokeId) return

    pointsRef.current.push(pos)

    const stroke = allStrokesRef.current[strokeId]
    if (stroke) {
      stroke.points.push(pos)
      // Draw incremental segment
      const ctx = ctxRef.current
      if (ctx) {
        drawSegment(ctx, stroke.points, stroke.points.length - 1, stroke.startHue, stroke.strokeWidth, stroke.isEraser)
      }
    }

    // Batch points for network
    pendingPointsRef.current.push(pos)
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(flushPoints)
    }
  }, [socket, room])

  const handlePointerUp = useCallback((e) => {
    if (activePointersRef.current > 0) {
      activePointersRef.current--
    }

    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    const strokeId = currentStrokeRef.current
    if (!strokeId) return

    // Flush remaining points
    flushPoints()

    // Emit end
    if (socket && room) {
      socket.emit('draw:end', { strokeId })
    }

    currentStrokeRef.current = null
    pointsRef.current = []
  }, [socket, room])

  // ─── Flush batched points ───
  const flushPoints = useCallback(() => {
    rafIdRef.current = null
    if (pendingPointsRef.current.length === 0) return
    if (!socket || !room) {
      pendingPointsRef.current = []
      return
    }

    const strokeId = currentStrokeRef.current
    if (!strokeId) {
      pendingPointsRef.current = []
      return
    }

    socket.emit('draw:point', {
      strokeId,
      points: [...pendingPointsRef.current],
    })
    pendingPointsRef.current = []
  }, [socket, room])


  // ─── Socket listeners for remote drawing ───
  useEffect(() => {
    if (!socket) return

    const handleRemoteStart = ({ userId, strokeId, strokeWidth, startHue, x, y, isEraser }) => {
      if (userId === socket.id) return
      const points = [{ x, y }]
      allStrokesRef.current[strokeId] = {
        strokeId,
        startHue,
        strokeWidth: strokeWidth || 4,
        points,
        isEraser: isEraser || false,
      }
    }

    const handleRemotePoint = ({ strokeId, points }) => {
      const stroke = allStrokesRef.current[strokeId]
      if (!stroke) return

      const ctx = ctxRef.current
      if (!ctx) return

      points.forEach(pt => {
        stroke.points.push(pt)
        drawSegment(ctx, stroke.points, stroke.points.length - 1, stroke.startHue, stroke.strokeWidth, stroke.isEraser)
      })
    }

    const handleRemoteClear = () => {
      allStrokesRef.current = {}
      const ctx = ctxRef.current
      if (ctx) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      }
    }

    // Replay existing strokes when entering draw mode
    const handleStrokeHistory = (strokes) => {
      if (!strokes || !Array.isArray(strokes)) return
      strokes.forEach(stroke => {
        allStrokesRef.current[stroke.strokeId] = {
          ...stroke,
          isEraser: stroke.isEraser || false,
        }
      })
      redrawAll()
    }

    socket.on('draw:start', handleRemoteStart)
    socket.on('draw:point', handleRemotePoint)
    socket.on('draw:clear', handleRemoteClear)
    socket.on('draw:history', handleStrokeHistory)
    
    // Legacy support for clear (though button is removed, someone might send it)
    socket.on('draw:erase', () => { /* No longer needed with new partial erase logic */ })

    // Request stroke history when entering draw mode
    if (room) {
      socket.emit('draw:requestHistory', { roomId: room.roomId })
    }

    return () => {
      socket.off('draw:start', handleRemoteStart)
      socket.off('draw:point', handleRemotePoint)
      socket.off('draw:clear', handleRemoteClear)
      socket.off('draw:history', handleStrokeHistory)
      socket.off('draw:erase')
    }
  }, [socket, room, redrawAll])


  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 5,
      background: 'transparent',
      pointerEvents: 'none',
    }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          // touchAction is omitted here since we handle touchmove manually,
          // allowing native scroll when 2+ fingers are used.
          cursor: eraserActive ? 'crosshair' : 'default',
          pointerEvents: drawMode ? 'auto' : 'none',
        }}
      />
    </div>
  )
}
