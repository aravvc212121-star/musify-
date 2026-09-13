/**
 * RHYM — Floating Pill Bottom Navigation
 * 3 tabs: Home, Search, Library
 * Matches mini-player glass design exactly
 * Features: sliding capsule indicator, drag-to-switch gesture, haptics
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GoHome, GoHomeFill } from 'react-icons/go'
import { FiSearch, FiPlus } from 'react-icons/fi'
import { haptics } from '../../utils/haptics.js'
import CreateSheet from '../ui/CreateSheet.jsx'

/* Stacked-bars "library" icon — two rounded vertical bars side by side */
function LibraryIcon({ size = 24, color = 'currentColor' }) {
  const w = size
  const h = size
  const barW = w * 0.2
  const barGap = w * 0.18
  const r = barW * 0.4
  const tallH = h * 0.7
  const shortH = h * 0.5
  const startX = (w - (barW * 2 + barGap)) / 2
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x={startX} y={h - tallH - (h * 0.05)} width={barW} height={tallH} rx={r} fill="none" stroke={color} strokeWidth={1.5} />
      <rect x={startX + barW + barGap} y={h - shortH - (h * 0.05)} width={barW} height={shortH} rx={r} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}

const TABS = [
  { path: '/', label: 'Home', Icon: GoHome, ActiveIcon: GoHomeFill },
  { path: '/search', label: 'Search', Icon: FiSearch },
  { action: 'create-playlist', label: 'Create', Icon: FiPlus },
  { path: '/library', label: 'Your Library', Icon: LibraryIcon },
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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  // Mini-player dominant color — read from CSS variable set by Player.jsx
  const [miniPlayerColor, setMiniPlayerColor] = useState(null)

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

  // Auto-close create sheet on route change
  useEffect(() => {
    setIsCreateOpen(false)
  }, [pathname])

  // Read --mini-player-color CSS variable set by Player.jsx.
  // MutationObserver fires only when the html style attribute changes,
  // so this has zero cost when the mini-player color isn't changing.
  useEffect(() => {
    const readColor = () => {
      const root = document.documentElement
      const color = root.style.getPropertyValue('--mini-player-color').trim()
      const visible = root.style.getPropertyValue('--mini-player-visible').trim()
      setMiniPlayerColor(visible === '1' && color ? color : null)
    }
    // Read immediately on mount
    readColor()
    const observer = new MutationObserver(readColor)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [])

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
    const tab = TABS[idx]
    if (tab.action === 'create-playlist') {
      setIsCreateOpen(prev => !prev)
    } else {
      setIsCreateOpen(false)
      updateCapsule(idx)
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
          setIsCreateOpen(prev => !prev)
        } else if (tabData.path && tabData.path !== pathname) {
          setIsCreateOpen(false)
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
    <>
      <CreateSheet isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
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
          // ─── Soft Gradient Fade: Rich tint in between, feathered smooth fade out above ───
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.94) 25%, rgba(0, 0, 0, 0.85) 50%, rgba(0, 0, 0, 0.68) 72%, rgba(0, 0, 0, 0.40) 86%, rgba(0, 0, 0, 0.14) 95%, rgba(0, 0, 0, 0) 100%)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: 'none',
          boxShadow: 'none',
          borderRadius: 0,
          // Layout
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          // Layering (above bottom sheet scrim so nav bar remains visible)
          zIndex: 1102,
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
      {/*
        ── System nav-bar color bleed ───────────────────────────────────────────
        Purely visual strip rendered inside MobileNav's paddingBottom zone
        (the safe-area-inset-bottom region that sits behind the device's gesture
        pill / 3-button nav bar). When the mini-player is active, this fills
        that area with its dominant color so the mini-player color flows
        seamlessly all the way to the screen edge with no black gap.
        All tab buttons, the capsule, and the nav bar layout are untouched.
      */}
      {miniPlayerColor && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            // Only fills the safe-area-inset-bottom padding zone
            height: 'env(safe-area-inset-bottom, 0px)',
            background: miniPlayerColor,
            transition: 'background 0.4s ease',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

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

      {TABS.map(({ path, action, label, Icon, ActiveIcon }, idx) => {
        const isCreateTab = action === 'create-playlist'
        const isCreateActive = isCreateTab && isCreateOpen
        const isActive = idx === visualActiveIdx && !action
        const isPressed = idx === pressedIdx
        const DisplayIcon = (isActive && ActiveIcon) ? ActiveIcon : Icon
        const isHighlighted = isActive || isCreateActive

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
              gap: '3px', // spacing between icon and text
              paddingTop: '2px', // subtle offset to lower icons
              background: 'none',
              border: 'none',
              flex: 1,
              height: '48px',
              cursor: 'pointer',
              touchAction: 'none',
              WebkitTapHighlightColor: 'transparent',
              position: 'relative',
              zIndex: 1,
              // Tap spring animation (clean deceleration curve for Create tab to avoid wobble)
              transform: isPressed ? (isCreateTab ? 'scale(0.92)' : 'scale(0.85)') : (isActive && isDragging ? 'scale(1.08)' : 'scale(1)'),
              transition: isPressed
                ? 'transform 0.08s ease-out'
                : (isCreateTab ? 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)' : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'),
            }}
          >
            <DisplayIcon
              size={isCreateTab ? 32 : 28}
              color={isHighlighted ? '#fff' : '#8a8a8a'}
              style={{
                color: isHighlighted ? '#fff' : '#8a8a8a',
                filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))' : 'none',
                transition: hasMountedRef.current 
                  ? 'color 0.2s ease, filter 0.2s ease, transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)' 
                  : 'none',
                strokeWidth: isCreateTab ? 1.5 : undefined,
                transform: isCreateTab
                  ? (isCreateActive ? 'translate3d(0, 1.5px, 0) rotate(45deg)' : 'translate3d(0, 1.5px, 0) rotate(0deg)')
                  : 'translate3d(0, 1.5px, 0)',
                WebkitTransform: isCreateTab
                  ? (isCreateActive ? 'translate3d(0, 1.5px, 0) rotate(45deg)' : 'translate3d(0, 1.5px, 0) rotate(0deg)')
                  : 'translate3d(0, 1.5px, 0)',
                transformOrigin: 'center center',
                willChange: isCreateTab ? 'transform' : undefined,
              }}
            />
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 400,
              color: isHighlighted ? '#fff' : '#8a8a8a',
              transition: hasMountedRef.current ? 'color 0.2s ease' : 'none',
              lineHeight: 1
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  </>
  )
}
