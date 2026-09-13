/**
 * RHYM — PopularArtistsPage
 * ─────────────────────────────────────────────
 * Displays top/popular songs from trending or a curated list.
 * Uses the reusable SongListItem component.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrending } from '../utils/api.js'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiPlay, FiArrowLeft, FiMusic, FiTrendingUp } from 'react-icons/fi'
import SongListItem from '../components/ui/SongListItem.jsx'
import { useIsMobile } from '../hooks/useIsMobile.js'

export default function PopularArtistsPage() {
  const navigate = useNavigate()
  const { playSong } = usePlayer()
  const isMobile = useIsMobile()

  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const results = await getTrending()
        setSongs(results || [])
      } catch (err) {
        console.error('Popular Artists load error:', err)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Black panel background to match app-wide theme
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

  return (
    <div style={{
      paddingBottom: 16,
      animation: 'fadeIn 0.3s ease',
      background: '#000000',
      minHeight: '100dvh'
    }}>
      {/* ─── Hero Banner ─── */}
      <div style={{
        background: 'linear-gradient(to bottom, hsl(280, 60%, 25%), #121212 100%)',
        padding: isMobile ? '48px 16px 24px' : '64px 32px 32px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #E040FB, #7C4DFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(224, 64, 251, 0.4)',
          }}>
            <FiTrendingUp size={24} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, margin: 0 }}>Playlist</p>
            <h1 style={{
              fontSize: isMobile ? 28 : 48,
              fontWeight: 900,
              margin: 0,
              color: '#fff',
              lineHeight: 1.05,
              letterSpacing: '-1px',
            }}>
              Popular Artists
            </h1>
          </div>
        </div>
        <p style={{ fontSize: isMobile ? 12 : 14, color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', fontWeight: 500 }}>
          Trending hits from top artists · {songs.length} songs
        </p>
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
      </div>

      {/* ─── Song List ─── */}
      <div style={{ padding: isMobile ? '0 8px' : '0 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton-pulse" style={{ height: 72, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#b3b3b3' }}>
            <FiMusic size={64} style={{ marginBottom: 24, opacity: 0.3 }} />
            <h2 style={{ color: '#fff', fontSize: 24, margin: '0 0 8px 0' }}>No trending songs</h2>
            <p style={{ fontSize: 14 }}>Check back later for trending hits.</p>
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
