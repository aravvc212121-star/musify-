/**
 * RHYM — useLongPress hook
 * Detects a tap-and-hold gesture on any element.
 */

import { useRef, useState, useCallback } from 'react'

export function useLongPress({ onLongPress, onTap, delay = 350 } = {}) {
  const timerRef = useRef(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const [isPressed, setIsPressed] = useState(false)
  const firedRef = useRef(false)

  const triggerHaptic = useCallback(() => {
    try {
      if (navigator.vibrate) navigator.vibrate(12)
    } catch (_) {}
  }, [])

  const start = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return
    firedRef.current = false
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    startPosRef.current = { x: clientX, y: clientY }
    setIsPressed(true)
    timerRef.current = setTimeout(() => {
      firedRef.current = true
      triggerHaptic()
      setIsPressed(false)
      if (onLongPress) onLongPress(e, { x: clientX, y: clientY })
    }, delay)
  }, [onLongPress, delay, triggerHaptic])

  const cancel = useCallback((e) => {
    clearTimeout(timerRef.current)
    setIsPressed(false)
    if (!firedRef.current && onTap) onTap(e)
    firedRef.current = false
  }, [onTap])

  const move = useCallback((e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const dx = Math.abs(clientX - startPosRef.current.x)
    const dy = Math.abs(clientY - startPosRef.current.y)
    if (dx > 8 || dy > 8) {
      clearTimeout(timerRef.current)
      setIsPressed(false)
      firedRef.current = false
    }
  }, [])

  return {
    isPressed,
    handlers: {
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onPointerMove: move,
    }
  }
}
