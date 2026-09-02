/**
 * RHYM — Floating Pill Bottom Navigation
 * 3 tabs: Home, Search, Library
 * Matches mini-player glass design exactly
 * Features: sliding capsule indicator, drag-to-switch gesture, haptics
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiHome, FiSearch, FiBook, FiUser } from 'react-icons/fi'
import { haptics } from '../../utils/haptics.js'

const TABS = [
  { path: '/', label: 'Home', Icon: FiHome },
  { path: '/search', label: 'Search', Icon: FiSearch },
  { path: '/library', label: 'Library', Icon: FiBook },
  { path: '/auth', label: 'Profile', Icon: FiUser },
]

// Nav bar height exported so Player.jsx can position above it
export const NAV_BAR_HEIGHT = 58
export const NAV_BAR_BOTTOM_MARGIN = 6 // px above safe-area

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
      left: tabRect.left - navRect.left,
      width: tabRect.width,
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
    navigate(TABS[idx].path)
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
      navigate(TABS[dragOverIdx].path)
    }
    setIsDragging(false)
    setDragOverIdx(-1)
    // Snap capsule back to active if drag didn't change tab
    if (activeIndex >= 0) {
      requestAnimationFrame(() => updateCapsule(activeIndex))
    }
  }, [isDragging, dragOverIdx, activeIndex, navigate, updateCapsule])

  const visualActiveIdx = isDragging && dragOverIdx >= 0 ? dragOverIdx : activeIndex

  return (
    <nav
      ref={navRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        bottom: `calc(${NAV_BAR_BOTTOM_MARGIN}px + env(safe-area-inset-bottom, 0px))`,
        left: '16px',
        right: '16px',
        height: `${NAV_BAR_HEIGHT}px`,
        // ─── Ultra-Premium Glass ───
        background: 'rgba(20, 20, 20, 0.4)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        // 3D inner highlight for the bar itself
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 40px rgba(0, 0, 0, 0.6)',
        borderRadius: '24px',
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
      }}
    >
      {/* Premium Glass Sliding capsule indicator */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: capsuleStyle.left,
        width: capsuleStyle.width,
        height: '44px', // slightly taller for a better pill shape
        transform: 'translateY(-50%)',
        borderRadius: '22px', // perfectly rounded
        // Gradient shine for a 3D pill look
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.03) 100%)',
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -1px 1px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.2)',
        // Smooth spring-like slide between tabs
        transition: isDragging
          ? 'left 0.1s ease-out, width 0.1s ease-out'
          : 'left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {TABS.map(({ path, Icon }, idx) => {
        const isActive = idx === visualActiveIdx
        const isPressed = idx === pressedIdx

        return (
          <button
            key={path}
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
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              flex: 1,
              height: '44px',
              cursor: 'pointer',
              touchAction: 'none',
              WebkitTapHighlightColor: 'transparent',
              position: 'relative',
              zIndex: 1,
              // Tap spring animation
              transform: isPressed ? 'scale(0.85)' : 'scale(1)',
              transition: isPressed
                ? 'transform 0.1s ease-out'
                : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <Icon
              size={28}
              style={{
                strokeWidth: isActive ? 1.5 : 1.25,
                color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.75)',
                filter: isActive ? 'drop-shadow(0 4px 8px rgba(255, 255, 255, 0.3))' : 'none',
                // Active icons swell up slightly, inactive icons shrink slightly for depth
                transform: isActive ? 'scale(1.1) translateY(-2px)' : 'scale(0.95) translateY(0)',
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </button>
        )
      })}
    </nav>
  )
}
