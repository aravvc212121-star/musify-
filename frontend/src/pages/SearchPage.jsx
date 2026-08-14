import React, { useState, useEffect } from 'react'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiPlay, FiMusic, FiChevronRight, FiSearch, FiX, FiClock, FiUser } from 'react-icons/fi'
import SongCard from '../components/ui/SongCard.jsx'
import { useSearch } from '../hooks/useSearch.js'

const CATEGORIES = [
  { name: 'Pop', color: '#E13300', emoji: '🎤' },
  { name: 'Hip-Hop', color: '#BA5D07', emoji: '🎧' },
  { name: 'Rock', color: '#1E3264', emoji: '🎸' },
  { name: 'Electronic', color: '#0D73EC', emoji: '🎹' },
  { name: 'Lo-Fi', color: '#148A08', emoji: '☁️' },
  { name: 'Classical', color: '#509BF5', emoji: '🎻' },
  { name: 'Jazz', color: '#E8115B', emoji: '🎷' },
  { name: 'R&B', color: '#8400E7', emoji: '🥃' },
  { name: 'Synthwave', color: '#4B0082', emoji: '🌃' },
  { name: 'Acoustic', color: '#BC5900', emoji: '🪵' },
  { name: 'Workout', color: '#E91429', emoji: '💪' },
  { name: 'Focus', color: '#00d2ff', emoji: '🧠' },
  { name: 'Chill', color: '#1E3264', emoji: '🧊' },
  { name: 'Party', color: '#AF2896', emoji: '🎉' },
  { name: 'Sleep', color: '#1E3264', emoji: '😴' },
  { name: 'Gaming', color: '#0D73EC', emoji: '🎮' },
  { name: 'Indie', color: '#E91429', emoji: '🎸' },
  { name: 'Soul', color: '#BC5900', emoji: '🔥' },
  { name: 'Romance', color: '#E91429', emoji: '💖' },
  { name: 'K-Pop', color: '#AF2896', emoji: '🇰🇷' },
  { name: 'Metal', color: '#1E3264', emoji: '🤘' },
  { name: 'Country', color: '#BC5900', emoji: '🤠' },
  { name: 'Blues', color: '#0D73EC', emoji: '🎸' },
  { name: 'Reggae', color: '#148A08', emoji: '🦁' }
]

export default function SearchPage({ isMobile }) {
  const { 
    searchQuery, setSearchQuery, 
    masterPlaylistData, playSong,
    userPlaylists
  } = usePlayer()

  const [recentSongs, setRecentSongs] = useState([])

  // Centralized search hook — handles fuzzy matching, API fetch, and artist grouping
  const searchResults = useSearch(searchQuery, masterPlaylistData, userPlaylists)

  // Load recent songs
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('rhym_recent_searches') || '[]')
    setRecentSongs(saved)
  }, [])

  const removeRecentSong = (videoId) => {
    const updated = recentSongs.filter(s => s.videoId !== videoId)
    setRecentSongs(updated)
    localStorage.setItem('rhym_recent_searches', JSON.stringify(updated))
  }

  const clearAllRecent = () => {
    setRecentSongs([])
    localStorage.setItem('rhym_recent_searches', JSON.stringify([]))
  }

  const saveToRecent = (song) => {
    if (!song || !song.videoId) return
    const songData = { 
      videoId: song.videoId, 
      title: song.title || 'Unknown', 
      artist: song.artist || song.channelTitle || 'Unknown',
      thumbnail: song.albumArt || song.thumbnail || ''
    }
    const saved = JSON.parse(localStorage.getItem('rhym_recent_searches') || '[]')
    let updated = [songData, ...saved.filter(s => s.videoId !== song.videoId)]
    updated = updated.slice(0, 10)
    setRecentSongs(updated)
    localStorage.setItem('rhym_recent_searches', JSON.stringify(updated))
  }

  // Escape key to clear search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSearchQuery('')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSearchQuery])

  const isEmpty = searchQuery.trim().length === 0
  const displaySongs = searchResults.isArtistMatch ? searchResults.artistSongs : searchResults.songs
  const hasResults = displaySongs.length > 0

  return (
    <div style={{ padding: isMobile ? '16px' : '24px 32px', minHeight: '100%' }}>
      
      {/* STATE 1: BROWSE CATEGORIES + RECENT SEARCHES */}
      <div style={{ display: isEmpty ? 'block' : 'none' }}>

        {/* Recent Searches Section — shows actual songs you played */}
        {recentSongs.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#b3b3b3', margin: 0 }}>History</h2>
              <button onClick={clearAllRecent} style={{
                background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600, padding: '4px 12px', borderRadius: '16px',
                transition: 'all 0.2s'
              }} className="clear-all-btn">Clear All</button>
            </div>
            <div style={{
              display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px'
            }} className="hide-scrollbar">
              {recentSongs.map((song, i) => (
                <div key={song.videoId || i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '8px', cursor: 'pointer', flexShrink: 0,
                  width: isMobile ? '80px' : '120px',
                  position: 'relative',
                  transition: 'transform 0.2s'
                }}
                  className="recent-card"
                  onClick={() => playSong(song, recentSongs, i)}
                >
                  <button onClick={(e) => { e.stopPropagation(); removeRecentSong(song.videoId) }} style={{
                    position: 'absolute', top: '-4px', right: '-4px', zIndex: 2,
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#b3b3b3', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: 0,
                    opacity: 0, transition: 'opacity 0.2s'
                  }} className="recent-remove-btn">
                    <FiX size={11} />
                  </button>
                  <div style={{
                    width: isMobile ? '80px' : '120px', height: isMobile ? '80px' : '120px',
                    borderRadius: isMobile ? '6px' : '12px', overflow: 'hidden',
                    background: song.thumbnail ? 'transparent' : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                  }}>
                    {song.thumbnail ? (
                      <img src={song.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <FiMusic size={isMobile ? 20 : 28} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    )}
                  </div>
                  <div style={{ width: '100%', textAlign: 'center', minWidth: 0 }}>
                    <p className="truncate" style={{ margin: 0, fontSize: isMobile ? '11px' : '13px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{song.title}</p>
                    <p className="truncate" style={{ margin: '2px 0 0', fontSize: isMobile ? '9px' : '11px', color: '#b3b3b3' }}>{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Separator line - doesn't connect to edges */}
        {recentSongs.length > 0 && (
          <div style={{
            width: '80%',
            maxWidth: '600px',
            height: '1px',
            background: 'rgba(255,255,255,0.1)',
            margin: '32px auto',
          }} />
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: isMobile ? '8px' : '16px'
        }}>
          {CATEGORIES.map(cat => (
            <div 
              key={cat.name} 
              onClick={() => setSearchQuery(cat.name)}
              style={{
                aspectRatio: '1 / 1', background: cat.color, borderRadius: isMobile ? '6px' : '8px',
                padding: isMobile ? '10px' : '16px', position: 'relative', overflow: 'hidden', cursor: 'pointer',
                transition: '0.2s ease'
              }}
              className="category-card"
            >
              <span style={{ fontSize: isMobile ? '11px' : '18px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{cat.name}</span>
              <span style={{
                position: 'absolute', bottom: '-10px', right: '-10px',
                fontSize: isMobile ? '42px' : '64px', transform: 'rotate(25deg)', opacity: 0.8
              }}>{cat.emoji}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STATE 2: SEARCH RESULTS */}
      {!isEmpty && (
        <div className="results-container" style={{ opacity: 1, transition: 'opacity 0.2s ease' }}>

          {/* Artist-Grouped Header */}
          {searchResults.isArtistMatch && searchResults.matchedArtist && hasResults && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', marginBottom: 20, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.08), rgba(0, 210, 255, 0.02))',
              border: '1px solid rgba(0, 210, 255, 0.1)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.25), rgba(0, 210, 255, 0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FiUser size={20} style={{ color: 'var(--accent, #00d2ff)' }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Songs by
                </p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
                  {searchResults.matchedArtist}
                </p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>
                {displaySongs.length} {displaySongs.length === 1 ? 'song' : 'songs'}
              </span>
            </div>
          )}

          {hasResults ? (
            <div style={{ animation: 'staggerIn 0.25s ease forwards' }}>
              {!searchResults.isArtistMatch && (
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>Songs</h2>
              )}
              {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {displaySongs.map((song, i) => (
                    <SongCard key={song.videoId} song={song} songs={displaySongs} index={i} showDuration={true} onPlay={(s) => saveToRecent(s)} />
                  ))}
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '20px'
                }}>
                  {displaySongs.map((song, i) => (
                    <div key={song.videoId} className="search-song-card" 
                      onClick={() => { saveToRecent(song); playSong(song, displaySongs, i) }} 
                      onContextMenu={(e) => {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('open-context-menu', {
                          detail: { x: e.clientX, y: e.clientY, song, type: 'song' }
                        }));
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                        <img src={song.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="search-card-play-btn" style={{
                          position: 'absolute', bottom: '8px', right: '8px',
                          width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0, transform: 'translateY(10px)', transition: 'all 0.2s'
                        }}>
                          <FiPlay size={18} style={{ fill: '#fff', color: '#fff', marginLeft: '2px' }} />
                        </div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p className="truncate" style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>{song.title}</p>
                        <p className="truncate" style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#b3b3b3' }}>
                          {song.artist || song.channelTitle || 'Unknown'}
                          {song.album && song.album !== 'Unknown' && ` · ${song.album}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Loading spinner when API results are still coming */}
              {searchResults.loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderTopColor: 'rgba(255,255,255,0.4)',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                </div>
              )}
            </div>
          ) : (
            /* NO RESULTS STATE */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
              <FiSearch size={48} style={{ color: '#fff', opacity: 0.4, marginBottom: '24px' }} />
              <p style={{ color: '#b3b3b3', fontSize: '16px', margin: 0 }}>No results found for</p>
              <p style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '4px 0 8px' }}>"{searchQuery}"</p>
              <p style={{ color: '#b3b3b3', fontSize: '13px' }}>Please make sure your words are spelled correctly.</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .category-card:hover { filter: brightness(1.15); transform: scale(1.04) !important; }
        .search-song-card:hover { 
          background: rgba(255,255,255,0.1) !important; 
          transform: scale(1.04) !important;
          box-shadow: 0 12px 24px rgba(0,0,0,0.3);
        }
        .search-song-card:hover .search-card-play-btn {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .recent-card:hover { transform: scale(1.05) !important; }
        .recent-card:hover .recent-remove-btn { opacity: 1 !important; }
        .clear-all-btn:hover { color: #fff !important; background: rgba(255,255,255,0.08); }
        
        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
