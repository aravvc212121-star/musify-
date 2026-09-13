/**
 * RHYM — LikedSongsPage
 * ─────────────────────────────────────────────
 * Displays the user's liked/saved songs.
 * Uses the reusable SongListItem component.
 */

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiPlay, FiArrowLeft, FiMusic, FiHeart, FiShuffle } from 'react-icons/fi'
import SongListItem from '../components/ui/SongListItem.jsx'
import { useIsMobile } from '../hooks/useIsMobile.js'

export default function LikedSongsPage() {
  const navigate = useNavigate()
  const { playSong, savedSongs } = usePlayer()
  const isMobile = useIsMobile()

  const songs = savedSongs || []

  // Black panel background
  useEffect(() => {
    const panel = document.querySelector('.center-panel')
    if (!panel) return
    const prev = panel.style.background
    panel.style.background = '#000000'
    return () => { panel.style.background = prev }
  }, [])

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
        background: 'linear-gradient(to bottom, hsl(200, 80%, 20%), #000000 100%)',
        padding: isMobile ? '48px 16px 24px' : '64px 32px 32px',
        display: 'flex',
        alignItems: isMobile ? 'center' : 'flex-end',
        gap: isMobile ? 16 : 24,
        position: 'relative',
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

        {/* Heart Cover */}
        <div style={{
          width: isMobile ? 100 : 220,
          height: isMobile ? 100 : 220,
          borderRadius: 8,
          flexShrink: 0,
          background: 'linear-gradient(135deg, var(--hero-start), #001a1a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <FiHeart size={isMobile ? 40 : 80} style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>Playlist</p>
          <h1 style={{
            fontSize: isMobile ? 28 : 52,
            fontWeight: 900,
            margin: '0 0 6px 0',
            color: '#fff',
            lineHeight: 1.05,
            letterSpacing: '-1.5px',
          }}>
            Liked Songs
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
        {songs.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#b3b3b3' }}>
            <FiHeart size={64} style={{ marginBottom: 24, opacity: 0.3 }} />
            <h2 style={{ color: '#fff', fontSize: 24, margin: '0 0 8px 0' }}>Songs you like will appear here</h2>
            <p style={{ fontSize: 14 }}>Save songs by tapping the heart icon.</p>
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
      `}</style>
    </div>
  )
}
