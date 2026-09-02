/**
 * useScrollBounce — iOS-style rubber-band bounce at scroll boundaries
 * 
 * Attaches to a scrollable container ref. When user overscrolls past
 * boundaries, applies a damped transform for rubber-band feel, then
 * spring-animates back via requestAnimationFrame.
 * 
 * Usage:
 *   const scrollRef = useRef(null)
 *   useScrollBounce(scrollRef, { axis: 'y', maxBounce: 80 })
 */

import { useEffect, useRef } from 'react'
import { haptics } from '../utils/haptics.js'

// Spring physics constants
const SPRING_STIFFNESS = 300
const SPRING_DAMPING = 25
const SPRING_MASS = 0.8
const DAMPING_FACTOR = 0.4 // How much the overscroll is damped (lower = more resistance)

export function useScrollBounce(containerRef, options = {}) {
  const {
    axis = 'y',            // 'x' or 'y'
    maxBounce = 80,        // Max stretch in px
    enabled = true,
  } = options

  const stateRef = useRef({
    startTouch: 0,
    currentBounce: 0,
    velocity: 0,
    isAtBoundary: false,
    boundaryType: null, // 'start' or 'end'
    animFrameId: null,
    hapticFired: false,
  })

  useEffect(() => {
    const el = containerRef?.current
    if (!el || !enabled) return

    const state = stateRef.current
    const prop = axis === 'y' ? 'translateY' : 'translateX'

    const getScrollPos = () => axis === 'y' ? el.scrollTop : el.scrollLeft
    const getScrollMax = () => axis === 'y'
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth
    const getTouchPos = (e) => axis === 'y'
      ? e.touches[0].clientY
      : e.touches[0].clientX

    const applyTransform = (px) => {
      el.style.transform = `${prop}(${px}px)`
      el.style.willChange = px !== 0 ? 'transform' : ''
    }

    // Spring animation back to 0
    const springBack = () => {
      let position = state.currentBounce
      let velocity = 0
      let lastTime = performance.now()

      const tick = (now) => {
        const dt = Math.min((now - lastTime) / 1000, 0.064) // Cap dt to prevent jumps
        lastTime = now

        // Spring force: F = -kx - cv
        const springForce = -SPRING_STIFFNESS * position
        const dampingForce = -SPRING_DAMPING * velocity
        const acceleration = (springForce + dampingForce) / SPRING_MASS

        velocity += acceleration * dt
        position += velocity * dt

        if (Math.abs(position) < 0.5 && Math.abs(velocity) < 0.5) {
          // Settled
          position = 0
          state.currentBounce = 0
          applyTransform(0)
          return
        }

        state.currentBounce = position
        applyTransform(position)
        state.animFrameId = requestAnimationFrame(tick)
      }

      state.animFrameId = requestAnimationFrame(tick)
    }

    const onTouchStart = (e) => {
      // Cancel any running spring animation
      if (state.animFrameId) {
        cancelAnimationFrame(state.animFrameId)
        state.animFrameId = null
      }

      state.startTouch = getTouchPos(e)
      state.hapticFired = false

      const scrollPos = getScrollPos()
      const scrollMax = getScrollMax()

      if (scrollMax <= 0) {
        state.isAtBoundary = true
        state.boundaryType = 'start'
      } else if (scrollPos <= 0) {
        state.isAtBoundary = true
        state.boundaryType = 'start'
      } else if (scrollPos >= scrollMax - 1) {
        state.isAtBoundary = true
        state.boundaryType = 'end'
      } else {
        state.isAtBoundary = false
        state.boundaryType = null
      }
    }

    const onTouchMove = (e) => {
      const scrollPos = getScrollPos()
      const scrollMax = getScrollMax()
      const touchPos = getTouchPos(e)
      const delta = touchPos - state.startTouch

      // Re-check boundary on each move
      const atStart = scrollPos <= 0 && delta > 0
      const atEnd = scrollPos >= scrollMax - 1 && delta < 0

      if (atStart || atEnd) {
        // Apply damped overscroll transform
        const rawBounce = atStart ? delta : delta
        const damped = rawBounce * DAMPING_FACTOR
        const clamped = Math.max(-maxBounce, Math.min(maxBounce, damped))
        
        state.currentBounce = clamped
        applyTransform(clamped)

        // Fire haptic at first boundary touch
        if (!state.hapticFired && Math.abs(clamped) > 5) {
          haptics.light()
          state.hapticFired = true
        }
      } else {
        // Not at boundary — reset any bounce
        if (state.currentBounce !== 0) {
          state.currentBounce = 0
          applyTransform(0)
        }
      }
    }

    const onTouchEnd = () => {
      if (state.currentBounce !== 0) {
        springBack()
      }
      state.isAtBoundary = false
      state.boundaryType = null
    }

    // Use passive: false only for touchmove (may need preventDefault in future)
    // touchstart and touchend are passive for performance
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      if (state.animFrameId) cancelAnimationFrame(state.animFrameId)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      // Clean up any lingering transform
      el.style.transform = ''
      el.style.willChange = ''
    }
  }, [containerRef, axis, maxBounce, enabled])
}
