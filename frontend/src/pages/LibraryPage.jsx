/**
 * RHYM — Library Screen
 * ─────────────────────────────────────────────
 * Spotify-style dark theme library with pills, liked songs card,
 * horizontally scrollable recently played, and vertical playlist cards.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiSearch, FiPlus, FiHeart, FiChevronRight, FiUser } from 'react-icons/fi'
import { useIsMobile } from '../hooks/useIsMobile.js'

export default function LibraryPage() {
  const { savedSongs, recentlyPlayed, userPlaylists, playSong } = usePlayer()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [activeFilter, setActiveFilter] = useState('All')

  const filters = ['All', 'Playlists', 'Artists', 'Albums']

  // Paint the scrollable panel black so there's no grey gap below the library content
  useEffect(() => {
    const panel = document.querySelector('.center-panel')
    if (!panel) return
    const prev = panel.style.background
    panel.style.background = '#000000'
    return () => { panel.style.background = prev }
  }, [])

  return (
    <div style={{
      background: '#000000',
      minHeight: '100dvh',
      color: '#ffffff',
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* ─── 1. Top Header ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px 6px 16px',
        position: 'sticky',
        top: 0,
        background: '#000000',
        zIndex: 100,
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/auth')}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#38b2ac', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', cursor: 'pointer',
              padding: 0
            }}
          >
            <FiUser size={16} style={{ color: '#000' }} />
          </button>
          <h1 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Your library</h1>
        </div>
        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button style={{ background: 'none', border: 'none', color: '#ffffff', padding: 0, cursor: 'pointer' }}>
            <FiSearch size={22} />
          </button>
          <button style={{ background: 'none', border: 'none', color: '#ffffff', padding: 0, cursor: 'pointer' }}>
            <FiPlus size={24} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ─── 2. Filter Pills Row ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }} className="hide-scrollbar">
        {filters.map(f => {
          const isActive = activeFilter === f
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: isActive ? '#ffffff' : '#232323',
                color: isActive ? '#000000' : '#e8e8e8',
                border: 'none',
                borderRadius: 500,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      <div style={{ padding: '8px 16px' }}>
        {/* ─── 3. Liked Songs Card ─── */}
        {(activeFilter === 'All' || activeFilter === 'Playlists') && (
          <div
            onClick={() => navigate('/liked-songs')}
            style={{
              background: 'linear-gradient(135deg, #0e7a8c 0%, #0a3a45 50%, #050f12 100%)',
              borderRadius: 14,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              marginBottom: 24,
              transition: 'transform 0.2s ease',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              marginRight: 14,
            }}>
              <FiHeart size={24} style={{ fill: '#22d3ee', color: '#22d3ee' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0', color: '#ffffff' }}>
                Liked songs
              </h2>
              <p style={{ fontSize: 13, color: '#a7a7a7', margin: 0, fontWeight: 500 }}>
                {savedSongs.length} {savedSongs.length === 1 ? 'song' : 'songs'}
              </p>
            </div>
            <FiChevronRight size={20} color="#a7a7a7" />
          </div>
        )}

        {/* ─── 4. Recently Played Section ─── */}
        {(activeFilter === 'All' || activeFilter === 'Albums') && recentlyPlayed.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#ffffff' }}>Recently played</h2>
              <button style={{ background: 'none', border: 'none', color: '#8a8a8a', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                See all
              </button>
            </div>
            
            <div style={{
              display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
              scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', margin: '0 -16px', paddingLeft: 16, paddingRight: 16
            }} className="hide-scrollbar">
              {recentlyPlayed.map((song, i) => (
                <div 
                  key={song.videoId || i} 
                  onClick={() => playSong(song, recentlyPlayed, i)}
                  style={{ width: 108, flexShrink: 0, cursor: 'pointer' }}
                >
                  <div style={{
                    width: 108, height: 108, borderRadius: 10,
                    background: '#1a1a1a', overflow: 'hidden',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    marginBottom: 8,
                  }}>
                    <img 
                      src={song.thumbnail || song.albumArt || `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`} 
                      alt="" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {song.title}
                  </p>
                  <p style={{ fontSize: 12, color: '#8a8a8a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {song.artist || 'Artist'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 5. Playlists Section ─── */}
        {(activeFilter === 'All' || activeFilter === 'Playlists') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#ffffff' }}>Playlists</h2>
              <button style={{ background: 'none', border: 'none', color: '#8a8a8a', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                See all
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {userPlaylists.filter(p => p.name !== 'Liked Songs').map((playlist, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/playlist/${encodeURIComponent(playlist.name)}`)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    background: '#141414',
                    borderRadius: 10,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                  onMouseLeave={e => e.currentTarget.style.background = '#141414'}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 8,
                    background: playlist.color || '#242424',
                    marginRight: 12, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ffffff', fontSize: 20, fontWeight: 800,
                  }}>
                    {playlist.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {playlist.name}
                    </p>
                    <p style={{ fontSize: 13, color: '#8a8a8a', margin: 0 }}>
                      Playlist • {playlist.songs ? playlist.songs.length : 0} songs
                    </p>
                  </div>
                  <FiPlus size={20} color="#8a8a8a" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
