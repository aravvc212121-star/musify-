import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { 
  FiHome as IconHome, FiSearch as IconSearch, FiBook as IconLibrary, 
  FiDisc as IconPlaylist, FiPlus as IconPlus, FiChevronDown, FiChevronRight
} from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'

import { FiX, FiDownload } from 'react-icons/fi'
import { useInstallPrompt } from '../../hooks/useInstallPrompt.js'

export default function LeftSidebar({ isMobile = false, onClose }) {
  const { 
    userPlaylists, isLeftSidebarCollapsed, setIsLeftSidebarCollapsed
  } = usePlayer()
  const { isInstallable, handleInstallClick } = useInstallPrompt()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isReady, setIsReady] = useState(false)
  const [isPlaylistsExpanded, setIsPlaylistsExpanded] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleCreateClick = () => {
    window.dispatchEvent(new CustomEvent('open-create-playlist'))
  }

  const onPlaylistContextMenu = (e, name) => {
    e.preventDefault()
    if (name === 'Liked Songs') return
    window.dispatchEvent(new CustomEvent('open-context-menu', {
      detail: { x: e.clientX, y: e.clientY, type: 'playlist', playlistName: name }
    }))
  }

  const navItems = [
    { path: '/', label: 'Home', Icon: IconHome },
    { path: '/search', label: 'Search', Icon: IconSearch },
    { path: '/library', label: 'Your Library', Icon: IconLibrary },
  ]
  const collapsed = isMobile ? false : isLeftSidebarCollapsed

  return (
    <div className="left-sidebar" 
      style={{ 
      padding: collapsed ? '24px 0' : '24px 12px', 
      position: 'relative',
      width: '100%',
      height: '100%',
      transition: isReady ? (collapsed ? 'width 0.35s cubic-bezier(0.4,0,0.2,1)' : 'width 0.35s cubic-bezier(0.34,1.56,0.64,1)') : 'none',
      display: 'flex', flexDirection: 'column',
      cursor: collapsed ? 'pointer' : 'default',
      background: '#0a0a0a',
      borderRadius: '0 20px 20px 0',
      overflow: 'hidden',
      overscrollBehavior: 'contain'
    }}>
      
      {/* Top Header Row */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0' : '0 12px', marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="28" height="28" viewBox="0 0 512 512" style={{ borderRadius: '6px', flexShrink: 0 }}>
            <rect width="512" height="512" rx="100" ry="100" fill="#000"/>
            <g fill="#fff">
              <rect x="148" y="200" width="22" height="160" rx="11"/>
              <rect x="192" y="145" width="22" height="270" rx="11"/>
              <rect x="236" y="95" width="22" height="322" rx="11"/>
              <rect x="280" y="130" width="22" height="290" rx="11"/>
              <rect x="324" y="175" width="22" height="200" rx="11"/>
            </g>
          </svg>
          {!collapsed && (
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '-0.5px' }}>Musify</span>
          )}
        </div>
        {isMobile && onClose ? (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px' }}>
            <FiX size={22} />
          </button>
        ) : (
          !collapsed && (
            <button onClick={() => setIsLeftSidebarCollapsed(true)} className="collapse-btn" style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px' }}>❯</button>
          )
        )}
      </div>

      {/* Nav Group - In a box */}
      <div className="ambient-box" style={{ 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: '12px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '4px', 
        padding: collapsed ? '8px' : '8px 12px', 
        margin: '0 4px 16px 4px',
        boxShadow: '0 0 30px rgba(0, 210, 255, 0.04), 0 0 15px rgba(138, 43, 226, 0.03), 0 4px 20px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.02)'
      }}>
        {navItems.map(({ path, label, Icon }) => {
          const isActive = pathname === path
          return (
            <NavLink 
              key={path} to={path} title={collapsed ? label : ''}
              className="nav-link-hover"
              onClick={() => isMobile && onClose?.()}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 12px', textDecoration: 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: isActive ? 500 : 400, borderRadius: '8px', transition: 'all 0.2s ease'
              }}
            >
              <Icon size={collapsed ? 20 : 24} />
              {!collapsed && <span style={{ fontSize: '14px' }}>{label}</span>}
            </NavLink>
          )
        })}
        
        {isInstallable && (
          <button 
            onClick={handleInstallClick}
            className="nav-link-hover"
            style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 12px', 
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: 'var(--accent)', background: 'rgba(0, 210, 255, 0.1)',
              border: '1px solid rgba(0, 210, 255, 0.2)',
              fontWeight: 500, borderRadius: '8px', transition: 'all 0.2s ease', cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            <FiDownload size={collapsed ? 20 : 24} />
            {!collapsed && <span style={{ fontSize: '14px' }}>Install App</span>}
          </button>
        )}
      </div>

      {/* Library Group - In a separate box */}
      {!collapsed ? (
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '12px', 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          margin: '0 4px 8px 4px',
          boxShadow: '0 0 30px rgba(0, 210, 255, 0.04), 0 0 15px rgba(138, 43, 226, 0.03), 0 4px 20px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.02)',
          overscrollBehavior: 'contain'
        }}>
          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <div onClick={() => setIsPlaylistsExpanded(!isPlaylistsExpanded)} style={{ display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 400, cursor: 'pointer' }} className="hover-text-primary">
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconPlaylist size={24} />
                {isPlaylistsExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
              </div>
              <span style={{ fontSize: '14px' }}>Playlists</span>
            </div>
            <button onClick={handleCreateClick} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} className="hover-text-primary">
              <IconPlus size={20} />
            </button>
          </div>

          <div className="hide-scrollbar" style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: isPlaylistsExpanded ? '8px 12px' : '0 12px', 
            maxHeight: isPlaylistsExpanded ? '1000px' : '0', 
            transition: 'all 0.3s ease', 
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}>
            {userPlaylists.map((playlist, i) => {
              const name = playlist.name
              const isLiked = name === 'Liked Songs'
              return (
                <NavLink
                  key={i} to={`/playlist/${encodeURIComponent(name)}`}
                  onContextMenu={(e) => onPlaylistContextMenu(e, name)}
                  onClick={() => isMobile && onClose?.()}
                  className={({ isActive }) => "sidebar-playlist " + (isActive ? "active" : "")}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '4px', textDecoration: 'none', marginBottom: '4px' }}
                >
                  <div style={{ width: '48px', height: '48px', background: playlist.color || '#282828', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 700 }}>
                    {isLiked ? '💜' : name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="truncate" style={{ fontSize: '14px', color: '#fff', fontWeight: 400 }}>{name}</span>
                  </div>
                </NavLink>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', paddingBottom: '24px' }}>
          <button onClick={() => setIsLeftSidebarCollapsed(false)} className="collapse-btn" style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '12px' }}>❮</button>
        </div>
      )}

      {/* Credit at bottom - outside the playlist box */}
      {!collapsed && (
        <div style={{ 
          padding: '12px 16px', 
          textAlign: 'center',
          marginTop: '8px'
        }}>
          <span style={{ 
            fontSize: '8px', 
            fontWeight: 500, 
            color: 'rgba(255,255,255,0.3)', 
            letterSpacing: '0.5px'
          }}>
            Designed & Created by Ayushman
          </span>
        </div>
      )}

      <style>{`
        .collapse-btn:hover { color: #fff !important; }
        .hover-text-primary:hover { color: #fff !important; }
        .sidebar-playlist { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .sidebar-playlist:hover { 
          background: rgba(255,255,255,0.03); 
          transform: scale(1.02);
        }
        .sidebar-playlist.active { background: rgba(255,255,255,0.06) !important; color: #fff !important; }
        .nav-link-hover { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .nav-link-hover:hover { 
          background: rgba(255,255,255,0.03); 
          color: #fff !important; 
          transform: scale(1.02);
        }
      `}</style>
    </div>
  )
}
