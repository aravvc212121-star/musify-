import React, { useState, useEffect, useCallback, useRef } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiSearch, FiX, FiPlus, FiMusic, FiClock } from 'react-icons/fi'
import { useSearch } from '../hooks/useSearch.js'

/* ─── Persistent Recent Searches ─── */
const RECENT_KEY = 'rhym_recent_searches'
const MAX_RECENT = 10

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (raw) return JSON.parse(raw).slice(0, MAX_RECENT)
  } catch {}
  return []
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)))
  } catch {}
}

/* ═══════════════════════════════════════════════
   SEARCH ROW — shared component for both states
   ═══════════════════════════════════════════════ */
function SearchRow({ song, showRemove, onPlay, onRemove, onAdd }) {
  const [hovered, setHovered] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  const thumb = imgErr ? null : (song.albumArt || song.thumbnail || null)
  const title = song.title || 'Unknown'
  const artist = song.artist || song.channelTitle || 'Unknown'
  const subtitle = song.album && song.album !== 'Unknown'
    ? `Song • ${artist}`
    : `Single • ${artist}`

  return (
    <div
      onClick={() => onPlay?.(song)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={(e) => {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('open-context-menu', {
          detail: { x: e.clientX, y: e.clientY, song, type: 'song' }
        }))
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderRadius: 10,
        cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        transition: 'background 0.15s ease',
        touchAction: 'manipulation',
        userSelect: 'none',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 52, height: 52, borderRadius: 6,
        overflow: 'hidden', flexShrink: 0,
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {thumb ? (
          <img
            src={thumb}
            alt=""
            width={52}
            height={52}
            loading="lazy"
            decoding="async"
            onError={() => setImgErr(true)}
            style={{ width: 52, height: 52, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <FiMusic size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
        )}
      </div>

      {/* Title + Subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 15, fontWeight: 600, color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.3,
        }}>
          {title}
        </p>
        <p style={{
          margin: '3px 0 0', fontSize: 13, fontWeight: 400,
          color: 'rgba(255,255,255,0.45)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.2,
        }}>
          {subtitle}
        </p>
      </div>

      {/* + Add icon */}
      <button
        onClick={(e) => { e.stopPropagation(); onAdd?.(song) }}
        style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
          cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center',
          justifyContent: 'center', borderRadius: '50%', flexShrink: 0,
          transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'none' }}
        aria-label="Add to library"
      >
        <FiPlus size={20} />
      </button>

      {/* X Remove icon (only in recent searches) */}
      {showRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.(song) }}
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: '50%', flexShrink: 0,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'none' }}
          aria-label="Remove from recent"
        >
          <FiX size={18} />
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SEARCH PAGE
   ═══════════════════════════════════════════════ */
export default function SearchPage({ isMobile }) {
  const {
    searchQuery, setSearchQuery,
    masterPlaylistData, playSong,
    userPlaylists
  } = usePlayer()

  const [recentSongs, setRecentSongs] = useState(loadRecent)
  const searchResults = useSearch(searchQuery, masterPlaylistData, userPlaylists)
  const containerRef = useRef(null)

  // Escape key clears search
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setSearchQuery('') }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setSearchQuery])

  // ─── Recent search helpers ───
  const addToRecent = useCallback((song) => {
    if (!song?.videoId) return
    const entry = {
      videoId: song.videoId,
      title: song.title || 'Unknown',
      artist: song.artist || song.channelTitle || 'Unknown',
      thumbnail: song.albumArt || song.thumbnail || '',
      album: song.album || '',
    }
    setRecentSongs(prev => {
      const updated = [entry, ...prev.filter(s => s.videoId !== song.videoId)].slice(0, MAX_RECENT)
      saveRecent(updated)
      return updated
    })
  }, [])

  const removeFromRecent = useCallback((song) => {
    setRecentSongs(prev => {
      const updated = prev.filter(s => s.videoId !== song.videoId)
      saveRecent(updated)
      return updated
    })
  }, [])

  const clearAllRecent = useCallback(() => {
    setRecentSongs([])
    saveRecent([])
  }, [])

  // ─── Play handlers ───
  const handlePlayRecent = useCallback((song, list, idx) => {
    if (!song?.videoId) return
    // Move to top of recent
    addToRecent(song)
    playSong(song, list, idx)
  }, [playSong, addToRecent])

  const handlePlayResult = useCallback((song, list, idx) => {
    if (!song?.videoId) return
    addToRecent(song)
    playSong(song, list, idx)
  }, [playSong, addToRecent])

  const handleAdd = useCallback((song) => {
    window.dispatchEvent(new CustomEvent('open-context-menu', {
      detail: { x: window.innerWidth / 2, y: window.innerHeight / 2, song, type: 'song' }
    }))
  }, [])

  const isEmpty = searchQuery.trim().length === 0
  const displaySongs = searchResults.isArtistMatch ? searchResults.artistSongs : searchResults.songs
  const hasResults = displaySongs.length > 0

  return (
    <div ref={containerRef} style={{
      padding: isMobile ? '8px 4px 100px' : '12px 24px 100px',
      minHeight: '100%',
    }}>

      {/* ═══ STATE 1: RECENT SEARCHES (when search is empty) ═══ */}
      {isEmpty && (
        <div style={{ animation: 'searchFadeIn 0.2s ease' }}>

          {recentSongs.length > 0 ? (
            <>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: isMobile ? '8px 12px 4px' : '8px 12px 8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiClock size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <h2 style={{
                    fontSize: 16, fontWeight: 700, color: '#fff', margin: 0,
                    letterSpacing: '0.2px',
                  }}>
                    Recent Searches
                  </h2>
                </div>
                <button
                  onClick={clearAllRecent}
                  style={{
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '6px 14px',
                    borderRadius: 20, transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'none' }}
                >
                  Clear All
                </button>
              </div>

              {/* Recent rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentSongs.slice(0, MAX_RECENT).map((song, i) => (
                  <SearchRow
                    key={song.videoId || i}
                    song={song}
                    showRemove={true}
                    onPlay={(s) => handlePlayRecent(s, recentSongs, i)}
                    onRemove={removeFromRecent}
                    onAdd={handleAdd}
                  />
                ))}
              </div>
            </>
          ) : (
            /* Empty recent state */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '120px 24px', textAlign: 'center',
            }}>
              <FiSearch size={48} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 20 }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 600, margin: 0 }}>
                Search for songs, artists, or albums
              </p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: '8px 0 0' }}>
                Your recent searches will appear here
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ STATE 2: LIVE SEARCH RESULTS (when typing) ═══ */}
      {!isEmpty && (
        <div style={{ animation: 'searchFadeIn 0.2s ease' }}>

          {/* Artist match header */}
          {searchResults.isArtistMatch && searchResults.matchedArtist && hasResults && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', marginBottom: 8, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.08), rgba(0, 210, 255, 0.02))',
              border: '1px solid rgba(0, 210, 255, 0.1)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.25), rgba(0, 210, 255, 0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FiMusic size={18} style={{ color: 'var(--accent, #00d2ff)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                  margin: 0, letterSpacing: '0.8px', textTransform: 'uppercase',
                }}>
                  Songs by
                </p>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>
                  {searchResults.matchedArtist}
                </p>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.2)',
                flexShrink: 0,
              }}>
                {displaySongs.length} {displaySongs.length === 1 ? 'song' : 'songs'}
              </span>
            </div>
          )}

          {/* Results list */}
          {hasResults ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {displaySongs.map((song, i) => (
                <SearchRow
                  key={song.videoId || `r-${i}`}
                  song={song}
                  showRemove={false}
                  onPlay={(s) => handlePlayResult(s, displaySongs, i)}
                  onAdd={handleAdd}
                />
              ))}

              {/* Loading spinner for API results */}
              {searchResults.loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.08)',
                    borderTopColor: 'rgba(255,255,255,0.35)',
                    animation: 'searchSpin 0.6s linear infinite',
                  }} />
                </div>
              )}
            </div>
          ) : searchResults.loading ? (
            /* Loading state — no results yet */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '80px 24px',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '2.5px solid rgba(255,255,255,0.08)',
                borderTopColor: 'rgba(255,255,255,0.4)',
                animation: 'searchSpin 0.6s linear infinite',
                marginBottom: 16,
              }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
                Searching…
              </p>
            </div>
          ) : (
            /* No results found */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '100px 24px', textAlign: 'center',
            }}>
              <FiSearch size={44} style={{ color: 'rgba(255,255,255,0.12)', marginBottom: 20 }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, margin: 0 }}>
                No results found for
              </p>
              <p style={{
                color: '#fff', fontSize: 17, fontWeight: 700,
                margin: '6px 0 10px',
              }}>
                "{searchQuery}"
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}>
                Check your spelling or try different keywords
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Scoped Styles ─── */}
      <style>{`
        @keyframes searchFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes searchSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
