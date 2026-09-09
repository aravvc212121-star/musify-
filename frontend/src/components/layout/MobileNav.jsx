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
  const [pressedIdx, setPressedIdx] = useState(-1)
  const [capsuleStyle, setCapsuleStyle] = useState({ left: 0, width: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverIdx, setDragOverIdx] = useState(-1)
  const dragStartX = useRef(0)
  const hasFiredDragHaptic = useRef(false)

  const activeIndex = TABS.findIndex(t => t.path === pathname)

  // Measure and position the capsule behind the active tab
  const updateCapsule = useCallback((idx) => {
    const tab = tabRefs.current[idx]
    const nav = navRef.current
    if (!tab || !nav) return
    const navRect = nav.getBoundingClientRect()
    const tabRect = tab.getBoundingClientRect()
    setCapsuleStyle({
      // Inset the capsule by 16px on each side so it's a tight pill instead of a wide rectangle
      left: (tabRect.left - navRect.left) + 16,
      width: Math.max(tabRect.width - 32, 40),
    })
  }, [])

  // Update capsule position when active tab changes or on mount
  useEffect(() => {
    if (activeIndex >= 0) {
      // Small delay so DOM is ready
      requestAnimationFrame(() => updateCapsule(activeIndex))
    }
  }, [activeIndex, updateCapsule])

  // Also update on resize
  useEffect(() => {
    const handleResize = () => {
      if (activeIndex >= 0) updateCapsule(activeIndex)
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [activeIndex, updateCapsule])

  // --- Tap handler ---
  const handleTap = useCallback((idx) => {
    haptics.light()
    const tab = TABS[idx]
    if (tab.action === 'create-playlist') {
      window.dispatchEvent(new CustomEvent('open-create-playlist'))
    } else {
      navigate(tab.path)
    }
  }, [navigate])

  // --- Drag gesture handlers ---
  const getTabIndexFromX = useCallback((clientX) => {
    for (let i = 0; i < tabRefs.current.length; i++) {
      const el = tabRefs.current[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (clientX >= rect.left && clientX <= rect.right) return i
    }
    return -1
  }, [])

  const handleTouchStart = useCallback((e) => {
    dragStartX.current = e.touches[0].clientX
    hasFiredDragHaptic.current = false
    setIsDragging(false)
  }, [])

  const handleTouchMove = useCallback((e) => {
    const dx = Math.abs(e.touches[0].clientX - dragStartX.current)
    if (dx > 10) setIsDragging(true) // Only drag after 10px movement

    if (dx > 10) {
      const idx = getTabIndexFromX(e.touches[0].clientX)
      if (idx >= 0 && idx !== dragOverIdx) {
        setDragOverIdx(idx)
        // Move capsule to follow drag
        updateCapsule(idx)
      }
    }
  }, [dragOverIdx, getTabIndexFromX, updateCapsule])

  const handleTouchEnd = useCallback(() => {
    if (isDragging && dragOverIdx >= 0 && dragOverIdx !== activeIndex) {
      haptics.light()
      const tab = TABS[dragOverIdx]
      if (tab.action === 'create-playlist') {
        window.dispatchEvent(new CustomEvent('open-create-playlist'))
      } else {
        navigate(tab.path)
      }
    }
    setIsDragging(false)
    setDragOverIdx(-1)
    // Snap capsule back to active if drag didn't change tab
    if (activeIndex >= 0) {
      requestAnimationFrame(() => updateCapsule(activeIndex))
    }
  }, [isDragging, dragOverIdx, activeIndex, navigate, updateCapsule])

  // Fix #12: Use passive native listener for touchmove
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    nav.addEventListener('touchmove', handleTouchMove, { passive: true })
    return () => nav.removeEventListener('touchmove', handleTouchMove)
  }, [handleTouchMove])

  const visualActiveIdx = isDragging && dragOverIdx >= 0 ? dragOverIdx : activeIndex

  return (
    <nav
      ref={navRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: `calc(${NAV_BAR_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        // ─── Solid background for performance (Fix #5) ───
        background: 'rgba(0, 0, 0, 0.75)',
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
      <div style={{
        position: 'absolute',
        top: '50%',
        left: capsuleStyle.left,
        width: capsuleStyle.width,
        height: '48px',
        transform: 'translateY(-50%)',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.08)',
        boxShadow: '0 0 16px rgba(0, 210, 255, 0.08)',
        // Smooth spring-like slide between tabs
        transition: isDragging
          ? 'left 0.1s ease-out, width 0.1s ease-out'
          : 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {TABS.map(({ path, action, label, Icon }, idx) => {
        const isActive = idx === visualActiveIdx && !action
        const isPressed = idx === pressedIdx

        return (
          <button
            key={path || action}
            ref={el => tabRefs.current[idx] = el}
            onClick={() => {
              if (!isDragging) handleTap(idx)
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
              // Tap spring animation
              transform: isPressed ? 'scale(0.82)' : 'scale(1)',
              transition: isPressed
                ? 'transform 0.1s ease-out'
                : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <Icon
              size={action === 'create-playlist' ? 32 : 28} // Make icons larger as requested
              style={{
                color: isActive ? '#fff' : '#a3a3a3', // Pure white if active, solid opaque gray if not
                filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))' : 'none',
                transition: 'color 0.3s ease, filter 0.3s ease',
              }}
            />
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 400, // Very thin, no bold
              color: isActive ? '#fff' : '#a3a3a3',
              transition: 'color 0.3s ease',
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
