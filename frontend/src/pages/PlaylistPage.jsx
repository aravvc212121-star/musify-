import React, { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiPlay, FiClock, FiHeart, FiMoreHorizontal, FiArrowLeft, FiSearch, FiMusic } from 'react-icons/fi'
import { getTrending, searchSongs } from '../utils/api.js'

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function PlaylistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const playlistName = decodeURIComponent(id)
  
  const { 
    playSong, currentSong, savedSongs, toggleSavedSong, isSongSaved, 
    userPlaylists 
  } = usePlayer()

  const [dynamicSongs, setDynamicSongs] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const isLikedPlaylist = playlistName === 'Liked Songs'
  const isNewReleases = playlistName === 'New Releases'
  const isRecommended = playlistName === 'Recommended For You'
  const isSpecial = isNewReleases || isRecommended

  // Find persistent playlist from context
  const persistentPlaylist = userPlaylists.find(p => p.name === playlistName)
  
  // Load dynamic data for special categories
  useEffect(() => {
    if (!isSpecial || persistentPlaylist) return
    
    const loadData = async () => {
      setIsLoading(true)
      try {
        let data = []
        if (isNewReleases) data = await getTrending()
        else if (isRecommended) data = await searchSongs('recommended music 2024')
        setDynamicSongs(data || [])
      } catch (err) {
        console.error('Failed to load special playlist:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [playlistName, isSpecial, persistentPlaylist])

  const songs = useMemo(() => {
    if (isLikedPlaylist) return savedSongs
    if (persistentPlaylist) return persistentPlaylist.songs || []
    if (isSpecial) return dynamicSongs
    return []
  }, [isLikedPlaylist, savedSongs, persistentPlaylist, isSpecial, dynamicSongs])

  const color = useMemo(() => {
    if (persistentPlaylist?.color) return persistentPlaylist.color
    if (isLikedPlaylist) return '#007799'
    if (isNewReleases) return 'var(--accent)'
    if (isRecommended) return '#1E3264'
    // Fallback generate color from name
    let hash = 0;
    for (let i = 0; i < playlistName.length; i++) hash = playlistName.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash % 360)}, 50%, 30%)`
  }, [playlistName, isLikedPlaylist, persistentPlaylist, isNewReleases, isRecommended])

  const openHeaderMenu = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    window.dispatchEvent(new CustomEvent('open-context-menu', {
      detail: { x: rect.left, y: rect.bottom + 8, type: 'playlist', playlistName }
    }))
  }

  return (
    <div style={{ 
      paddingBottom: 100, 
      animation: 'fadeIn 0.3s ease',
      background: `linear-gradient(to bottom, ${color.includes('gradient') ? 'rgba(0,0,0,0)' : color + '33'}, transparent 500px)`,
      minHeight: '100%'
    }}>
      {/* ─── Hero Section ─── */}
      <div className="playlist-hero" style={{
        background: color.includes('gradient') 
          ? `${color}, linear-gradient(to bottom, transparent, var(--bg-primary))` 
          : `linear-gradient(to bottom, ${color}, var(--bg-primary))`,
        position: 'relative', zIndex: 10,
        transition: 'background 0.5s ease'
      }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: '16px', left: '16px',
            background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', transition: 'background 0.2s ease'
          }}
          className="hover-bg-card"
        >
          <FiArrowLeft size={20} />
        </button>

        <div className="playlist-cover" style={{
          background: isLikedPlaylist ? 'linear-gradient(135deg, var(--hero-start), #001a1a)' : (color.includes('gradient') ? color : '#282828'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          flexShrink: 0
        }}>
          {isLikedPlaylist ? '💜' : '🎵'}
        </div>
        <div className="playlist-info" style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Playlist</p>
          <h1 className="playlist-title truncate" style={{ fontWeight: 900, margin: '0 0 16px 0', color: '#fff', lineHeight: 1 }}>
            {playlistName}
          </h1>
          <div className="playlist-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fff', fontWeight: 700 }}>Musify</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>• {songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
          </div>
        </div>
      </div>

      {/* ─── Controls Row ─── */}
      <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '32px' }}>
        <button 
          onClick={() => songs.length > 0 && playSong(songs[0], songs, 0)}
          style={{
            width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
            cursor: songs.length > 0 ? 'pointer' : 'not-allowed', color: '#fff',
            opacity: songs.length > 0 ? 1 : 0.5,
            transition: 'transform 0.1s ease, background 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 210, 255, 0.3)'
          }}
          className="play-btn-big"
        >
          <FiPlay size={24} style={{ fill: 'currentcolor', marginLeft: '4px' }} />
        </button>
        
        {!isLikedPlaylist && (
          <button onClick={openHeaderMenu} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '8px' }} onMouseEnter={e=>e.currentTarget.style.color='#fff'} onMouseLeave={e=>e.currentTarget.style.color='#b3b3b3'}>
            <FiMoreHorizontal size={32} />
          </button>
        )}
      </div>

      {/* ─── Song List ─── */}
      <div className="song-list-container">
        {songs.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#b3b3b3' }}>
            <FiMusic size={64} style={{ marginBottom: '24px', opacity: 0.3 }} />
            <h2 style={{ color: '#fff', fontSize: '24px', margin: '0 0 8px 0' }}>{isLikedPlaylist ? 'Songs you like will appear here' : 'This playlist is empty'}</h2>
            <p style={{ fontSize: '14px' }}>Find more of the music you love in search</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', color: '#b3b3b3', borderBottom: 'none', paddingBottom: '8px', marginBottom: '16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600 }}>
              <div style={{ width: '40px', textAlign: 'center' }}>#</div>
              <div style={{ flex: 1 }}>Title</div>
              <div className="col-album" style={{ flex: 1 }}>Album</div>
              <div style={{ width: '100px', textAlign: 'right', paddingRight: '32px' }}><FiClock size={16} /></div>
            </div>

            {songs.map((song, i) => {
              const isPlaying = currentSong?.videoId === song.videoId
              const saved = isSongSaved(song.videoId)
              return (
                <div
                  key={song.videoId}
                  className="song-row"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('open-context-menu', {
                      detail: { x: e.clientX, y: e.clientY, song, playlistName, type: 'song' }
                    }));
                  }}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '8px 0', borderRadius: '4px',
                    color: isPlaying ? 'var(--accent)' : 'var(--text-primary)',
                    transition: 'all 0.2s ease',
                    height: '56px'
                  }}
                >
                  <div 
                    onClick={() => playSong(song, songs, i)}
                    style={{ width: '40px', textAlign: 'center', color: isPlaying ? 'var(--accent)' : '#b3b3b3', fontSize: '14px', cursor: 'pointer' }}
                  >
                    {isPlaying ? (
                      <div className="playing-bars">
                        <div className="bar"></div><div className="bar"></div><div className="bar"></div>
                      </div>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <div 
                    onClick={() => playSong(song, songs, i)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', minWidth: 0 }}
                  >
                    <img src={song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/default.jpg`} style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} alt="" />
                    <div style={{ minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: '16px', fontWeight: 600, color: isPlaying ? 'var(--accent)' : '#fff' }}>{song.title}</div>
                      <div className="truncate" style={{ fontSize: '14px', color: '#b3b3b3' }}>{song.artist || 'Unknown Artist'}</div>
                    </div>
                  </div>
                  <div className="col-album truncate" style={{ flex: 1, fontSize: '14px', color: '#b3b3b3' }}>
                    {song.album || 'Single'}
                  </div>
                  
                  <div style={{ width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', paddingRight: '16px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSavedSong(song) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: saved ? 'var(--accent)' : '#b3b3b3' }}
                      className="hover-pop"
                    >
                      <FiHeart size={18} style={{ fill: saved ? 'var(--accent)' : 'none' }} />
                    </button>
                    
                    <span style={{ fontSize: '14px', color: '#b3b3b3', width: '40px', textAlign: 'right' }}>{fmt(song.duration || 210)}</span>
                    
                    <button
                      className="row-more-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        window.dispatchEvent(new CustomEvent('open-context-menu', {
                          detail: { x: rect.left - 180, y: rect.bottom + 8, song, playlistName }
                        }))
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b3b3b3', padding: '4px' }}
                    >
                      <FiMoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>


      <style>{`
        .song-row:hover { background-color: rgba(255,255,255,0.1); }
        .row-more-btn { opacity: 0; }
        .song-row:hover .row-more-btn { opacity: 1; }
        
        .play-btn-big:hover { transform: scale(1.05); }
        .hover-pop:active { transform: scale(1.3); transition: transform 0.1s; }
        
        .playing-bars { display: flex; align-items: flex-end; gap: 2px; height: 14px; width: 14px; margin: 0 auto; }
        .playing-bars .bar { width: 3px; background: var(--accent); animation: playBar 0.8s infinite ease-in-out; }
        .playing-bars .bar:nth-child(2) { animation-delay: 0.2s; }
        .playing-bars .bar:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes playBar {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .playlist-hero {
          padding: 64px 32px 32px;
          display: flex;
          align-items: flex-end;
          gap: 24px;
        }
        .playlist-cover {
          width: 232px;
          height: 232px;
          font-size: 84px;
        }
        .playlist-title {
          font-size: 96px;
          letter-spacing: -4px;
        }
        .song-list-container {
          padding: 0 32px;
        }
        
        @media (max-width: 768px) {
          .col-album { display: none !important; }
          .playlist-hero {
            padding: 72px 16px 24px;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
            gap: 16px;
          }
          .playlist-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .playlist-cover {
            width: 140px;
            height: 140px;
            font-size: 56px;
          }
          .playlist-title {
            font-size: 32px;
            letter-spacing: -1px;
            white-space: normal;
          }
          .song-list-container {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  )
}
