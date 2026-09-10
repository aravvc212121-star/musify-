import React, { useState, useRef, useEffect } from 'react'

/**
 * ScrollingText
 * ─────────────────────────────────────────────────────────────────────────────
 * A reusable text component that measures its content width against its container.
 * If the text overflows the container, it smoothly scrolls with a seamless marquee
 * animation and subtle edge masking.
 *
 * Props:
 * - text: string | number
 * - className: string (optional)
 * - style: React.CSSProperties (optional)
 * - speed: number (pixels per second, default 28)
 * - gap: number (gap between text loops in px, default 36)
 * - fadeEdges: boolean (default true)
 * - as: string (HTML tag to render as, default 'div')
 */
export default function ScrollingText({
  text = '',
  className = '',
  style = {},
  speed = 28,
  gap = 36,
  fadeEdges = true,
  as = 'div',
  ...restProps
}) {
  const Tag = as
  const containerRef = useRef(null)
  const textRef = useRef(null)

  const [isOverflowing, setIsOverflowing] = useState(false)
  const [contentWidth, setContentWidth] = useState(0)

  const displayText = text != null ? String(text) : ''

  useEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl || !displayText) {
      setIsOverflowing(false)
      return
    }

    const measure = () => {
      if (!containerRef.current || !textRef.current) return
      const containerW = containerRef.current.clientWidth
      const textW = textRef.current.scrollWidth

      // Allow a 2px threshold to prevent fractional pixel sub-pixel false positives
      const overflows = textW > containerW + 2
      setIsOverflowing(overflows)
      setContentWidth(textW)
    }

    // Measure immediately
    measure()

    // Measure after fonts load
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(() => {})
    }

    // Observe size changes via ResizeObserver
    let resizeObserver = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        measure()
      })
      resizeObserver.observe(container)
    }

    // Fallback resize listener for window
    window.addEventListener('resize', measure)

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [displayText])

  // Calculate scroll duration based on distance so speed is consistent
  const totalDistance = contentWidth + gap
  const duration = Math.max(5, totalDistance / Math.max(speed, 1))

  // Mask image for smooth edge fade-out when overflowing
  const maskStyle = isOverflowing && fadeEdges
    ? {
        maskImage: 'linear-gradient(to right, #000 0%, #000 calc(100% - 16px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 calc(100% - 16px), transparent 100%)'
      }
    : {}

  return (
    <Tag
      ref={containerRef}
      className={`scrolling-text-container ${className}`.trim()}
      style={{
        display: 'block',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...maskStyle,
        ...style
      }}
      title={displayText}
      {...restProps}
    >
      <div
        className="scrolling-text-track"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          willChange: isOverflowing ? 'transform' : 'auto',
          animation: isOverflowing
            ? `rhym-marquee-scroll ${duration}s linear infinite`
            : 'none'
        }}
      >
        <span
          ref={textRef}
          style={{
            display: 'inline-block',
            flexShrink: 0,
            paddingRight: isOverflowing ? `${gap}px` : 0
          }}
        >
          {displayText}
        </span>

        {isOverflowing && (
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              flexShrink: 0,
              paddingRight: `${gap}px`
            }}
          >
            {displayText}
          </span>
        )}
      </div>

      <style>{`
        @keyframes rhym-marquee-scroll {
          0%, 12% {
            transform: translate3d(0, 0, 0);
          }
          88%, 100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .scrolling-text-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </Tag>
  )
}
