import React, { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Reusable BottomSheet — engineered for buttery-smooth 120fps GPU performance.
 *
 * Key Optimizations:
 * 1. Anchored at `bottom: 0` with padding-bottom for the nav bar. When sliding down,
 *    it translates past the bottom edge of the screen completely (102%), so no partial
 *    card edges remain visible through the semi-transparent nav bar.
 * 2. Retains DOM node once mounted with `pointer-events: none` and `aria-hidden` when closed.
 *    This completely eliminates the unmount flash / tear-down jitter at the end of the slide-down.
 * 3. Scrim uses touch isolation (`touchAction: 'none'`) avoiding any body layout reflow.
 */
export default function BottomSheet({ isOpen, onClose, children }) {
  const [visible, setVisible] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const isDraggingRef = useRef(false)
  const touchStartY = useRef(0)
  const hasEverOpened = useRef(false)

  useEffect(() => {
    if (isOpen) {
      hasEverOpened.current = true
      setDragOffset(0)
      const raf = requestAnimationFrame(() => {
        setVisible(true)
      })
      return () => cancelAnimationFrame(raf)
    } else {
      setVisible(false)
      setDragOffset(0)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Touch drag down to dismiss gesture
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY
    isDraggingRef.current = true
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isDraggingRef.current) return
    const currentY = e.touches[0].clientY
    const delta = currentY - touchStartY.current
    if (delta > 0) {
      setDragOffset(delta)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    if (dragOffset > 60) {
      onClose()
    } else {
      setDragOffset(0)
    }
  }, [dragOffset, onClose])

  // Don't render until first opened
  if (!hasEverOpened.current && !isOpen) return null

  return (
    <>
      {/* Scrim / backdrop */}
      <div
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.65)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'none',
          willChange: 'opacity',
        }}
      />

      {/* Sheet card — anchored to viewport bottom, translates 102% down off-screen */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-hidden={!visible}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1101,
          background: '#1c1c1c',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 16px 0',
          paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.6)',
          transform: !visible 
            ? 'translate3d(0, 102%, 0)' 
            : `translate3d(0, ${dragOffset}px, 0)`,
          WebkitTransform: !visible 
            ? 'translate3d(0, 102%, 0)' 
            : `translate3d(0, ${dragOffset}px, 0)`,
          transition: isDraggingRef.current 
            ? 'none' 
            : 'transform 0.26s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        {children}
      </div>
    </>
  )
}
