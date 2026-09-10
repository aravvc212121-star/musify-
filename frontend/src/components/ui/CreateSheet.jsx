import React, { useCallback } from 'react'
import BottomSheet from './BottomSheet.jsx'
import { FiMusic } from 'react-icons/fi'
import toast from 'react-hot-toast'

/**
 * "Blend" icon – two overlapping circles
 */
function BlendIcon({ size = 26, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8.5" cy="12" r="5.5" stroke={color} strokeWidth={1.8} />
      <circle cx="15.5" cy="12" r="5.5" stroke={color} strokeWidth={1.8} />
    </svg>
  )
}

/**
 * Single row inside the Create sheet
 */
function SheetRow({ icon, title, subtitle, onClick }) {
  const [pressed, setPressed] = React.useState(false)

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        width: '100%',
        padding: '10px 8px',
        background: pressed ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
        border: 'none',
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s ease, transform 0.15s ease',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Circular icon container */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: '15px',
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.3,
        }}>
          {title}
        </p>
        <p style={{
          margin: '3px 0 0',
          fontSize: '13px',
          fontWeight: 400,
          color: 'rgba(255, 255, 255, 0.5)',
          lineHeight: 1.3,
        }}>
          {subtitle}
        </p>
      </div>
    </button>
  )
}

/**
 * CreateSheet — bottom sheet menu triggered by the + icon in the nav bar.
 *
 * Props:
 *  - isOpen  : boolean
 *  - onClose : () => void
 */
export default function CreateSheet({ isOpen, onClose }) {
  const handlePlaylist = useCallback(() => {
    onClose()
    // Open create playlist modal immediately
    window.dispatchEvent(new CustomEvent('open-create-playlist'))
  }, [onClose])

  const handleBlend = useCallback(() => {
    onClose()
    toast('Blend coming soon!', {
      icon: '✨',
      style: {
        borderRadius: '24px',
        background: '#282828',
        color: '#fff',
        fontSize: '13px',
      },
    })
  }, [onClose])

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      {/* Drag handle indicator */}
      <div style={{
        width: 36,
        height: 4,
        borderRadius: 2,
        background: 'rgba(255, 255, 255, 0.22)',
        margin: '2px auto 14px',
      }} />

      <SheetRow
        icon={<FiMusic size={24} color="#fff" strokeWidth={1.8} />}
        title="Playlist"
        subtitle="Create a playlist with songs or episodes"
        onClick={handlePlaylist}
      />

      <div style={{ height: 4 }} />

      <SheetRow
        icon={<BlendIcon size={26} color="#fff" />}
        title="Blend"
        subtitle="Combine your friends' tastes into a playlist"
        onClick={handleBlend}
      />
    </BottomSheet>
  )
}
