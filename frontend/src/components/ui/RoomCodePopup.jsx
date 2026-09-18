import React, { useState, useEffect } from 'react'
import { useBlend } from '../../context/BlendContext.jsx'
import { FiCopy, FiCheck, FiX } from 'react-icons/fi'
import { NAV_BAR_HEIGHT, NAV_BAR_BOTTOM_MARGIN } from '../layout/MobileNav.jsx'

export default function RoomCodePopup() {
  const { room, showCodePopup, setShowCodePopup } = useBlend()
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Auto-dismiss after some time? Let's not, let the user dismiss it manually.

  if (!room || !showCodePopup) return null

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomId)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}?code=${room.roomId}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 1500)
  }

  return (
    <div style={{
      position: 'fixed',
      // Float it directly above the bottom nav + mini-player (which is ~120px tall combined, let's use 140px)
      bottom: `calc(${NAV_BAR_HEIGHT}px + 76px + 20px + env(safe-area-inset-bottom, 0px))`,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'rgba(26, 26, 29, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '24px 20px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '280px',
      animation: 'popup-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }}>
      <style>
        {`
          @keyframes popup-enter {
            0% { transform: translate(-50%, 20px) scale(0.9); opacity: 0; }
            100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          }
        `}
      </style>

      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <button 
          onClick={() => setShowCodePopup(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff'
          }}
        >
          <FiX size={14} />
        </button>
      </div>

      <div style={{ color: '#8a8a8f', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>Share this code</div>
      <div style={{ 
        color: '#ffffff', 
        fontSize: 36, 
        fontWeight: 600, 
        letterSpacing: '8px', 
        marginBottom: 20,
        fontVariantNumeric: 'tabular-nums',
        textShadow: '0 2px 10px rgba(0,0,0,0.5)'
      }}>
        {room.roomId}
      </div>

      <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: 16 }}>
        <button
          onClick={handleCopyCode}
          style={{
            flex: 1,
            background: copiedCode ? '#10b981' : '#2a2a2e',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background 0.2s'
          }}
        >
          {copiedCode ? <FiCheck size={16} /> : <FiCopy size={16} />}
          {copiedCode ? 'Copied!' : 'Code'}
        </button>
        
        <button
          onClick={handleCopyLink}
          style={{
            flex: 1,
            background: copiedLink ? '#10b981' : '#2a2a2e',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background 0.2s'
          }}
        >
          {copiedLink ? <FiCheck size={16} /> : <FiCopy size={16} />}
          {copiedLink ? 'Copied!' : 'Link'}
        </button>
      </div>

      <button 
        onClick={() => setShowCodePopup(false)}
        style={{
          background: 'transparent', 
          border: 'none', 
          color: '#8a8a8f', 
          fontSize: 13, 
          cursor: 'pointer',
          padding: '8px 16px',
          borderRadius: '8px'
        }}
      >
        Dismiss
      </button>
    </div>
  )
}
