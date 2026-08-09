/**
 * RHYM — Library Screen (Liked Songs)
 * Hero gradient card + song list + context actions
 */

import { useState } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'
import { shareSong } from '../utils/share.js'
import { FiHeart, FiPlay, FiShuffle, FiMoreHorizontal } from 'react-icons/fi'

/* ─── Song Row ─── */
function SongRow({ song, index, onPlay, onRemove, isSaved }) {
  const [removed, setRemoved] = useState(false)

  const handleRemove = (e) => {
    e.stopPropagation()
    setRemoved(true)
    setTimeout(() => {
      onRemove()
    }, 200)
  }

  return (
    <div className="song-row" style={{ 
      position: 'relative',
      opacity: removed ? 0 : 1,
      height: removed ? 0 : 56,
      overflow: 'hidden',
      transition: 'opacity 0.2s ease, height 0.2s ease',
      marginBottom: removed ? 0 : 8
    }}>
      <div
        onClick={onPlay}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          width: '100%', height: 56, padding: '0 16px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', touchAction: 'manipulation',
          borderRadius: 8
        }}
        className="hover-bg-card"
      >
        <img src={song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/default.jpg`} alt="" width={48} height={48} loading="lazy"
          style={{ borderRadius: 'var(--radius-base)', flexShrink: 0, objectFit: 'cover' }} />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <p className="truncate" style={{ fontSize: 16, fontWeight: 500 }}>{song.title}</p>
          <p className="truncate" style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>
            {song.artist || 'Unknown Artist'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRemove}
            style={{
              background: 'none', border: 'none', padding: 8, cursor: 'pointer',
              color: 'var(--accent)', touchAction: 'manipulation',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.2s ease'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.8)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <FiHeart size={20} style={{ fill: 'var(--accent)' }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              window.dispatchEvent(new CustomEvent('open-context-menu', {
                detail: { x: rect.left, y: rect.bottom + 8, song }
              }))
            }}
            style={{
              background: 'none', border: 'none', padding: 8, cursor: 'pointer',
              color: 'var(--text-secondary)', touchAction: 'manipulation',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <FiMoreHorizontal size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══ LIBRARY PAGE ═══ */
import { useNavigate } from 'react-router-dom'

export default function LibraryPage() {
  const { savedSongs, recentlyPlayed, userPlaylists, playSong } = usePlayer()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All') // 'All', 'Playlists', 'Recently Played', 'Albums', 'Liked Songs'

  const showRecentlyPlayed = filter === 'All' || filter === 'Recently Played'
  const showPlaylists = filter === 'All' || filter === 'Playlists'
  const showLikedSongs = filter === 'All' || filter === 'Liked Songs'

  return (
    <div style={{
      paddingBottom: 24,
      animation: 'libraryFadeIn 0.25s ease',
      transformOrigin: 'top center'
    }} className="library-page-container">
      <style>{`
        @keyframes libraryFadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .filter-pill {
          padding: 8px 16px;
          border-radius: 500px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-pill.active {
          background: #fff;
          color: #000;
        }
        .filter-pill.inactive {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .filter-pill.inactive:hover {
          background: rgba(255,255,255,0.2);
        }
        .lib-card:hover {
          background: #282828 !important;
          transform: scale(1.04) !important;
        }
        .lib-card:hover .card-play-btn {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        
        /* Mobile 3x3 grid */
        @media (max-width: 767px) {
          .library-page-container {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .library-header {
            padding: 24px 8px 12px !important;
          }
          .library-content {
            padding: 0 8px !important;
          }
          .library-playlist-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 4px !important;
          }
          .playlist-card-item {
            padding: 8px !important;
            gap: 8px !important;
            border-radius: 4px !important;
          }
          .playlist-card-item > div:first-child {
            font-size: 24px !important;
          }
          .playlist-card-item > div:last-child p:first-child {
            font-size: 11px !important;
          }
          .playlist-card-item > div:last-child p:last-child {
            font-size: 10px !important;
          }
          .filter-pill {
            padding: 6px 12px !important;
            font-size: 12px !important;
          }
        }
      `}</style>

      {/* ─── Header ─── */}
      <div style={{ padding: '48px 32px 16px' }} className="library-header">
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['Playlists', 'Recently Played', 'Liked Songs'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(filter === f ? 'All' : f)}
              className={`filter-pill ${filter === f ? 'active' : 'inactive'}`}
              style={{ border: 'none' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px' }} className="library-content">
        {/* ─── Section A: Recently Listened ─── */}
        {showRecentlyPlayed && recentlyPlayed.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Recently Listened</h2>
            <div style={{ 
              display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16,
              scrollSnapType: 'x mandatory'
            }} className="hide-scrollbar">
              {recentlyPlayed.map((song, i) => (
                <div 
                  key={i} 
                  className="lib-card"
                  onClick={() => playSong(song, recentlyPlayed, i)}
                  style={{
                    minWidth: 140, maxWidth: 140, background: '#282828',
                    padding: 12, borderRadius: 8, cursor: 'pointer',
                    transition: 'background 0.2s ease', scrollSnapAlign: 'start'
                  }}
                >
                  <img 
                    src={song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`} 
                    alt="" 
                    style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 4, marginBottom: 12 }} 
                  />
                  <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{song.title}</p>
                  <p className="truncate" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{song.artist}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Section B: Your Playlists ─── */}
        {showPlaylists && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Your Playlists</h2>
              <button 
                onClick={() => {
                  // Trigger sidebar's create playlist modal by dispatching custom event
                  window.dispatchEvent(new CustomEvent('open-create-playlist'))
                }}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 24, padding: '0 8px'
                }}
              >
                +
              </button>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
              gap: 16 
            }} className="library-playlist-grid">
              {userPlaylists.map((pl, i) => {
                const isObj = typeof pl === 'object' && pl !== null
                const name = isObj ? pl.name : pl
                const urlName = encodeURIComponent(name)
                const songCount = isObj && pl.songs ? pl.songs.length : 12

                return (
                  <div 
                    key={i}
                    className="lib-card playlist-card-item"
                    onClick={() => navigate(`/playlist/${urlName}`)}
                    style={{
                      background: '#181818', padding: '16px', borderRadius: '8px', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', gap: '16px', transition: 'background 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      width: '100%', aspectRatio: '1/1', background: isObj && pl.color ? pl.color : `hsl(${i * 45}, 60%, 20%)`,
                      borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '48px', position: 'relative', overflow: 'hidden'
                    }}>
                      {isObj && pl.cover ? pl.cover : '🎵'}
                      {/* Hover Play Button */}
                      <div className="card-play-btn" style={{
                        position: 'absolute', bottom: '8px', right: '8px',
                        width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.3)', opacity: 0, transform: 'translateY(8px)',
                        transition: 'all 0.2s ease'
                      }}>
                        <FiPlay size={20} color="#fff" style={{ marginLeft: '4px' }} />
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p className="truncate" style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{name}</p>
                      <p className="truncate" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Playlist • {songCount} songs</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── Section C: Liked Songs ─── */}
        {showLikedSongs && (
          <div 
            onClick={() => navigate('/playlist/Liked%20Songs')}
            style={{
              background: 'linear-gradient(135deg, var(--hero-start), #001a1a)',
              borderRadius: 8, padding: '32px 24px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              minHeight: 180, transition: 'transform 0.3s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ flex: 1 }} />
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Liked Songs</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
              {savedSongs.length} liked song{savedSongs.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
