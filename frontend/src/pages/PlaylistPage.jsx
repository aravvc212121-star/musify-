import React, { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiPlay, FiClock, FiHeart, FiMoreHorizontal, FiArrowLeft, FiSearch, FiMusic } from 'react-icons/fi'
import { getTrending, searchSongs } from '../utils/api.js'
import SongListItem from '../components/ui/SongListItem.jsx'

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

  // Black panel background to match app-wide theme
  useEffect(() => {
    const panel = document.querySelector('.center-panel')
    if (!panel) return
    const prev = panel.style.background
    panel.style.background = '#000000'
    return () => { panel.style.background = prev }
  }, [])

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
      background: '#000000',
      minHeight: '100dvh'
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
            position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', left: '16px',
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
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Playlist</p>
          <h1 className="playlist-title truncate" style={{ fontWeight: 900, margin: '0 0 6px 0', color: '#fff', lineHeight: 1 }}>
            {playlistName}
          </h1>
          <div className="playlist-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <span style={{ color: '#fff', fontWeight: 700 }}>Rhym</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>• {songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
          </div>
        </div>
      </div>

      {/* ─── Controls Row ─── */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
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
      <div className="song-list-container" style={{ padding: '0 16px' }}>
        {songs.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#b3b3b3' }}>
            <FiMusic size={64} style={{ marginBottom: '24px', opacity: 0.3 }} />
            <h2 style={{ color: '#fff', fontSize: '24px', margin: '0 0 8px 0' }}>{isLikedPlaylist ? 'Songs you like will appear here' : 'This playlist is empty'}</h2>
            <p style={{ fontSize: '14px' }}>Find more of the music you love in search</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {songs.map((song, i) => (
              <SongListItem key={song.videoId || i} song={song} songs={songs} index={i} />
            ))}
          </div>
        )}
      </div>


      <style>{`
        .play-btn-big:hover { transform: scale(1.05); }
        .hover-pop:active { transform: scale(1.3); transition: transform 0.1s; }
        
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
            padding: 48px 16px 16px;
            flex-direction: row;
            align-items: center;
            text-align: left;
            gap: 14px;
          }
          .playlist-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            min-width: 0;
          }
          .playlist-cover {
            width: 90px;
            height: 90px;
            font-size: 36px;
          }
          .playlist-title {
            font-size: 22px;
            letter-spacing: -0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .song-list-container {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  )
}
