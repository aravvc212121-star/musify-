/**
 * RHYM — Floating Pill Bottom Navigation
 * 3 tabs: Home, Search, Library
 * Matches mini-player glass design exactly
 * Features: sliding capsule indicator, drag-to-switch gesture, haptics
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MdHomeFilled } from 'react-icons/md'
import { BiSearch } from 'react-icons/bi'
import { FiBook, FiPlus } from 'react-icons/fi'
import { haptics } from '../../utils/haptics.js'

const TABS = [
  { path: '/', label: 'Home', Icon: MdHomeFilled },
  { path: '/search', label: 'Search', Icon: BiSearch },
  { action: 'create-playlist', label: 'Create', Icon: FiPlus },
  { path: '/library', label: 'Your Library', Icon: FiBook },
]

export const NAV_BAR_HEIGHT = 64
export const NAV_BAR_BOTTOM_MARGIN = 2 // px above safe-area

export default function MobileNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const navRef = useRef(null)
  const tabRefs = useRef([])
  const capsuleRef = useRef(null)

  const [pressedIdx, setPressedIdx] = useState(-1)
  const [capsuleStyle, setCapsuleStyle] = useState({ left: 0, width: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverIdx, setDragOverIdx] = useState(-1)

  const isDraggingRef = useRef(false)
  const isMouseDownRef = useRef(false)
  const dragStartClientX = useRef(0)
  const dragStartCapsuleLeft = useRef(0)
  const isNearCapsuleOnStart = useRef(false)
  const closestIdxRef = useRef(-1)
  const capsuleLeftRef = useRef(0)
  const capsuleWidthRef = useRef(0)
  const hasMountedRef = useRef(false)

  const activeIndex = TABS.findIndex(t => t.path === pathname)

  // Measure and position the capsule behind the active tab
  const updateCapsule = useCallback((idx) => {
    const tab = tabRefs.current[idx]
    const nav = navRef.current
    if (!tab || !nav) return
    const navRect = nav.getBoundingClientRect()
    const tabRect = tab.getBoundingClientRect()
    const left = (tabRect.left - navRect.left) + 16
    const width = Math.max(tabRect.width - 32, 40)
    capsuleLeftRef.current = left
    capsuleWidthRef.current = width
    setCapsuleStyle({ left, width })
    if (capsuleRef.current && !isDraggingRef.current) {
      capsuleRef.current.style.left = `${left}px`
      capsuleRef.current.style.width = `${width}px`
    }
  }, [])

  // Update capsule position when active tab changes or on mount
  useEffect(() => {
    if (activeIndex >= 0) {
      requestAnimationFrame(() => {
        updateCapsule(activeIndex)
        requestAnimationFrame(() => {
          hasMountedRef.current = true
        })
      })
    }
  }, [activeIndex, updateCapsule])

  // Also update on resize
  useEffect(() => {
    const handleResize = () => {
      if (activeIndex >= 0 && !isDraggingRef.current) updateCapsule(activeIndex)
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [activeIndex, updateCapsule])

  // Tap handler
  const handleTap = useCallback((idx) => {
    haptics.light()
    updateCapsule(idx)
    const tab = TABS[idx]
    if (tab.action === 'create-playlist') {
      window.dispatchEvent(new CustomEvent('open-create-playlist'))
    } else {
      navigate(tab.path)
    }
  }, [navigate, updateCapsule])

  // --- Smooth Drag Logic: Move pill freely with finger, snap to closest tab on release ---
  const startDrag = useCallback((clientX) => {
    dragStartClientX.current = clientX
    isDraggingRef.current = false
    const nav = navRef.current
    if (!nav) return
    const navRect = nav.getBoundingClientRect()
    const xInNav = clientX - navRect.left
    const curLeft = capsuleLeftRef.current
    const curWidth = capsuleWidthRef.current || 48

    // Did user touch on or near the highlight?
    isNearCapsuleOnStart.current = xInNav >= (curLeft - 28) && xInNav <= (curLeft + curWidth + 28)
    dragStartCapsuleLeft.current = curLeft
    closestIdxRef.current = activeIndex >= 0 ? activeIndex : 0
  }, [activeIndex])

  const moveDrag = useCallback((clientX) => {
    const dx = clientX - dragStartClientX.current
    const absDx = Math.abs(dx)
    const threshold = isNearCapsuleOnStart.current ? 3 : 7

    if (!isDraggingRef.current && absDx > threshold) {
      isDraggingRef.current = true
      setIsDragging(true)
      haptics.light()
    }

    if (isDraggingRef.current) {
      const nav = navRef.current
      if (!nav) return
      const navRect = nav.getBoundingClientRect()
      const capsuleWidth = capsuleWidthRef.current || 48

      let targetLeft
      if (isNearCapsuleOnStart.current) {
        targetLeft = dragStartCapsuleLeft.current + dx
      } else {
        targetLeft = (clientX - navRect.left) - capsuleWidth / 2
      }

      // Keep pill inside nav bar limits with padding
      const minLeft = 8
      const maxLeft = navRect.width - capsuleWidth - 8
      const clampedLeft = Math.max(minLeft, Math.min(targetLeft, maxLeft))

      // Direct DOM update for 120fps fluid response with zero lag
      if (capsuleRef.current) {
        capsuleRef.current.style.transition = 'none'
        capsuleRef.current.style.left = `${clampedLeft}px`
      }
      capsuleLeftRef.current = clampedLeft

      // Find closest tab button
      const capsuleCenter = clampedLeft + capsuleWidth / 2
      let closestIdx = 0
      let minDist = Infinity

      for (let i = 0; i < tabRefs.current.length; i++) {
        const tab = tabRefs.current[i]
        if (!tab) continue
        const tRect = tab.getBoundingClientRect()
        const tCenter = (tRect.left - navRect.left) + tRect.width / 2
        const dist = Math.abs(capsuleCenter - tCenter)
        if (dist < minDist) {
          minDist = dist
          closestIdx = i
        }
      }

      if (closestIdx !== closestIdxRef.current) {
        closestIdxRef.current = closestIdx
        setDragOverIdx(closestIdx)
        haptics.light() // Subtle tick on each button pass
      }
    }
  }, [])

  const endDrag = useCallback(() => {
    if (isDraggingRef.current) {
      const targetIdx = closestIdxRef.current >= 0 ? closestIdxRef.current : activeIndex
      const nav = navRef.current
      const tab = tabRefs.current[targetIdx]

      if (nav && tab) {
        const navRect = nav.getBoundingClientRect()
        const tabRect = tab.getBoundingClientRect()
        const finalLeft = (tabRect.left - navRect.left) + 16
        const finalWidth = Math.max(tabRect.width - 32, 40)

        // Smooth spring animation snapping into the closest button
        if (capsuleRef.current) {
          capsuleRef.current.style.transition = 'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease, transform 0.25s ease'
          capsuleRef.current.style.left = `${finalLeft}px`
          capsuleRef.current.style.width = `${finalWidth}px`
        }
        capsuleLeftRef.current = finalLeft
        capsuleWidthRef.current = finalWidth
        setCapsuleStyle({ left: finalLeft, width: finalWidth })
      }

      haptics.medium()

      const tabData = TABS[targetIdx]
      if (tabData) {
        if (tabData.action === 'create-playlist') {
          window.dispatchEvent(new CustomEvent('open-create-playlist'))
        } else if (tabData.path && tabData.path !== pathname) {
          navigate(tabData.path)
        }
      }

      isDraggingRef.current = false
      setIsDragging(false)
      setDragOverIdx(-1)
      isNearCapsuleOnStart.current = false
      return
    }

    isDraggingRef.current = false
    setIsDragging(false)
    setDragOverIdx(-1)
    isNearCapsuleOnStart.current = false
  }, [activeIndex, navigate, pathname])

  // Native touch listener on nav with { passive: false } to cancel page scroll during horizontal pill drag
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const handleNativeTouchMove = (e) => {
      if (isDraggingRef.current && e.cancelable) {
        e.preventDefault()
      }
      moveDrag(e.touches[0].clientX)
    }

    nav.addEventListener('touchmove', handleNativeTouchMove, { passive: false })
    return () => nav.removeEventListener('touchmove', handleNativeTouchMove)
  }, [moveDrag])

  // Global mouse handlers for desktop / mouse drag support
  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (!isMouseDownRef.current) return
      moveDrag(e.clientX)
    }
    const handleWindowMouseUp = () => {
      if (!isMouseDownRef.current) return
      isMouseDownRef.current = false
      endDrag()
    }

    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
    }
  }, [moveDrag, endDrag])

  const handleTouchStart = useCallback((e) => {
    startDrag(e.touches[0].clientX)
  }, [startDrag])

  const handleTouchEnd = useCallback(() => {
    endDrag()
  }, [endDrag])

  const handleMouseDown = useCallback((e) => {
    isMouseDownRef.current = true
    startDrag(e.clientX)
  }, [startDrag])

  const visualActiveIdx = isDragging && dragOverIdx >= 0 ? dragOverIdx : activeIndex

  return (
    <nav
      ref={navRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: `calc(${NAV_BAR_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        // ─── Transparent and black tinted ───
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: 'none',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.6)',
        borderRadius: 0,
        // Layout
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        // Layering
        zIndex: 1000,
        touchAction: 'none', // We handle all touch ourselves
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        overflow: 'hidden',
        // GPU acceleration for zero jitter
        willChange: 'transform',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {/* Sliding capsule indicator */}
      <div 
        ref={capsuleRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: capsuleStyle.left,
          width: capsuleStyle.width,
          height: '48px',
          transform: isDragging ? 'translateY(-50%) scale(1.05)' : 'translateY(-50%) scale(1)',
          borderRadius: '12px',
          background: isDragging ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.08)',
          boxShadow: isDragging 
            ? '0 0 20px rgba(0, 210, 255, 0.25), 0 4px 16px rgba(0,0,0,0.4)' 
            : '0 0 16px rgba(0, 210, 255, 0.08)',
          opacity: capsuleStyle.width > 0 ? 1 : 0,
          cursor: isDragging ? 'grabbing' : 'grab',
          // Smooth spring-like slide between tabs only when not actively dragging
          transition: isDragging
            ? 'none'
            : !hasMountedRef.current
              ? 'none'
              : 'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease, transform 0.2s ease, background 0.2s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }} 
      />

      {TABS.map(({ path, action, label, Icon }, idx) => {
        const isActive = idx === visualActiveIdx && !action
        const isPressed = idx === pressedIdx

        return (
          <button
            key={path || action}
            ref={el => tabRefs.current[idx] = el}
            onClick={() => {
              if (!isDraggingRef.current) handleTap(idx)
            }}
            onPointerDown={() => setPressedIdx(idx)}
            onPointerUp={() => setPressedIdx(-1)}
            onPointerLeave={() => setPressedIdx(-1)}
            onPointerCancel={() => setPressedIdx(-1)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px', // spacing between icon and text
              background: 'none',
              border: 'none',
              flex: 1,
              height: '48px',
              cursor: 'pointer',
              touchAction: 'none',
              WebkitTapHighlightColor: 'transparent',
              position: 'relative',
              zIndex: 1,
              // Tap spring animation + gentle scale up when hovered by dragged pill
              transform: isPressed ? 'scale(0.85)' : (isActive && isDragging ? 'scale(1.08)' : 'scale(1)'),
              transition: isPressed
                ? 'transform 0.1s ease-out'
                : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <Icon
              size={action === 'create-playlist' ? 32 : 28} // Make icons larger as requested
              style={{
                color: isActive ? '#fff' : '#a3a3a3', // Pure white if active, solid opaque gray if not
                filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.25))' : 'none',
                transition: hasMountedRef.current ? 'color 0.2s ease, filter 0.2s ease' : 'none',
              }}
            />
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 400, // Very thin, no bold
              color: isActive ? '#fff' : '#a3a3a3',
              transition: hasMountedRef.current ? 'color 0.2s ease' : 'none',
              lineHeight: 1
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
