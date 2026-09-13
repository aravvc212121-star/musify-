/**
 * RHYM — AlbumPage
 * ─────────────────────────────────────────────
 * Displays songs from a specific album / search query.
 * Uses the reusable SongListItem component.
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { searchSongs } from '../utils/api.js'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiPlay, FiArrowLeft, FiMusic, FiShuffle } from 'react-icons/fi'
import SongListItem from '../components/ui/SongListItem.jsx'
import { useIsMobile } from '../hooks/useIsMobile.js'

export default function AlbumPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playSong } = usePlayer()
  const isMobile = useIsMobile()

  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  const albumName = decodeURIComponent(id || 'Album')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const results = await searchSongs(albumName)
        setSongs(results || [])
      } catch (err) {
        console.error('Album load error:', err)
      }
      setLoading(false)
    }
    load()
  }, [albumName])

  // Black panel background to match app-wide theme
  useEffect(() => {
    const panel = document.querySelector('.center-panel')
    if (!panel) return
    const prev = panel.style.background
    panel.style.background = '#000000'
    return () => { panel.style.background = prev }
  }, [])

  const color = useMemo(() => {
    let hash = 0
    for (let i = 0; i < albumName.length; i++) hash = albumName.charCodeAt(i) + ((hash << 5) - hash)
    return `hsl(${Math.abs(hash % 360)}, 55%, 28%)`
  }, [albumName])

  const coverThumb = songs[0]?.thumbnail || songs[0]?.albumArt || ''

  const playAll = () => {
    if (songs.length > 0) playSong(songs[0], songs, 0)
  }

  const shufflePlay = () => {
    if (songs.length > 0) {
      const idx = Math.floor(Math.random() * songs.length)
      playSong(songs[idx], songs, idx)
    }
  }

  return (
    <div style={{
      paddingBottom: 100,
      animation: 'fadeIn 0.3s ease',
      background: '#000000',
      minHeight: '100dvh'
    }}>
      {/* ─── Hero Section ─── */}
      <div style={{
        background: `linear-gradient(to bottom, ${color}, #121212 100%)`,
        padding: isMobile ? '48px 16px 24px' : '64px 32px 32px',
        display: 'flex',
        alignItems: isMobile ? 'center' : 'flex-end',
        gap: isMobile ? 16 : 24,
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', left: '16px',
            background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', zIndex: 10,
          }}
        >
          <FiArrowLeft size={20} />
        </button>

        {/* Album Art */}
        <div style={{
          width: isMobile ? 100 : 220,
          height: isMobile ? 100 : 220,
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          background: '#282828',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {coverThumb ? (
            <img src={coverThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <FiMusic size={isMobile ? 32 : 64} style={{ color: 'rgba(255,255,255,0.2)' }} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>Album</p>
          <h1 style={{
            fontSize: isMobile ? 24 : 48,
            fontWeight: 900,
            margin: '0 0 6px 0',
            color: '#fff',
            lineHeight: 1.05,
            letterSpacing: '-1px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: isMobile ? 'nowrap' : 'normal',
          }}>
            {albumName}
          </h1>
          <p style={{ fontSize: isMobile ? 12 : 14, color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: 500 }}>
            {songs.length} {songs.length === 1 ? 'song' : 'songs'}
          </p>
        </div>
      </div>

      {/* ─── Controls Row ─── */}
      <div style={{ padding: isMobile ? '12px 16px' : '16px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={playAll}
          style={{
            width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
            cursor: songs.length > 0 ? 'pointer' : 'not-allowed', color: '#fff',
            opacity: songs.length > 0 ? 1 : 0.5,
            boxShadow: '0 4px 16px rgba(0, 210, 255, 0.3)',
            transition: 'transform 0.15s ease',
          }}
          className="play-btn-big"
        >
          <FiPlay size={22} style={{ fill: 'currentcolor', marginLeft: 3 }} />
        </button>
        <button
          onClick={shufflePlay}
          style={{
            width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
            cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
        >
          <FiShuffle size={18} />
        </button>
      </div>

      {/* ─── Song List ─── */}
      <div style={{ padding: isMobile ? '0 8px' : '0 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-pulse" style={{ height: 72, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#b3b3b3' }}>
            <FiMusic size={64} style={{ marginBottom: 24, opacity: 0.3 }} />
            <h2 style={{ color: '#fff', fontSize: 24, margin: '0 0 8px 0' }}>No songs found</h2>
            <p style={{ fontSize: 14 }}>We couldn't find any tracks for this album.</p>
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
        .play-btn-big:hover { transform: scale(1.06); }
        .play-btn-big:active { transform: scale(0.95); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .skeleton-pulse {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: pulse-bg 1.5s infinite;
        }
        @keyframes pulse-bg { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  )
}
