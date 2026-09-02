import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getArtistSongs } from '../utils/api.js'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiPlay, FiArrowLeft, FiMusic } from 'react-icons/fi'
import SongCard from '../components/ui/SongCard.jsx'

export default function ArtistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playSong } = usePlayer()
  const [artist, setArtist] = useState(null)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getArtistSongs(id)
        setArtist(data.artist)
        setSongs(data.songs || [])
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [id])

  const color = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash % 360)}, 50%, 30%)`
  }, [id])

  return (
    <div style={{ 
      paddingBottom: 100, 
      animation: 'fadeIn 0.3s ease',
      background: `linear-gradient(to bottom, ${color}33, transparent 500px)`,
      minHeight: '100%'
    }}>
      {/* ─── Hero Section ─── */}
      <div className="artist-hero" style={{
        background: `linear-gradient(to bottom, ${color}, var(--bg-primary))`,
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

        <div className="artist-cover" style={{
          borderRadius: '50%', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          flexShrink: 0,
          background: '#282828',
          border: 'none'
        }}>
          {artist?.image ? (
            <img src={artist.image.replace('mqdefault', 'hqdefault')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>👤</div>
          )}
        </div>
        <div className="artist-info" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3d91ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            </div>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', margin: 0, color: '#fff' }}>Verified Artist</p>
          </div>
          <h1 className="artist-title truncate" style={{ 
            fontWeight: 900, 
            margin: '0 0 6px 0', 
            color: '#fff', 
            lineHeight: 1 
          }}>
            {artist?.name || id}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontWeight: 700 }}>Rhym Premium</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>• {songs.length * 1234} listeners</span>
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
        
        <button style={{ 
          background: 'transparent', 
          border: 'none', 
          borderRadius: '4px', 
          padding: '8px 16px', 
          color: '#fff', 
          fontSize: '12px', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '1px',
          cursor: 'pointer'
        }}>
          Follow
        </button>
      </div>

      {/* ─── Songs Container ─── */}
      <div className="song-list-container">
        <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Popular</h2>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-pulse" style={{ height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#b3b3b3' }}>
            <FiMusic size={64} style={{ marginBottom: '24px', opacity: 0.3 }} />
            <h2 style={{ color: '#fff', fontSize: '24px', margin: '0 0 8px 0' }}>No songs found</h2>
            <p style={{ fontSize: '14px' }}>We couldn't find any tracks for this artist right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {songs.map((song, i) => (
              <SongCard key={song.videoId} song={song} songs={songs} index={i} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .play-btn-big:hover { transform: scale(1.08); }
        .play-btn-big:active { transform: scale(0.95); }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .skeleton-pulse {
          background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
          background-size: 200% 100%;
          animation: pulse-bg 1.5s infinite;
        }
        
        @keyframes pulse-bg {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .hover-bg-card:hover {
          background: rgba(255,255,255,0.1) !important;
        }
        .song-list-container {
          padding: 0 32px;
        }

        .artist-hero {
          padding: 64px 32px 32px;
          display: flex;
          align-items: flex-end;
          gap: 24px;
        }
        .artist-cover {
          width: 232px;
          height: 232px;
        }
        .artist-title {
          font-size: clamp(48px, 8vw, 96px);
          letter-spacing: -4px;
        }

        @media (max-width: 768px) {
          .artist-hero {
            padding: 48px 16px 16px;
            flex-direction: row;
            align-items: center;
            text-align: left;
            gap: 14px;
          }
          .artist-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            min-width: 0;
          }
          .artist-cover {
            width: 90px;
            height: 90px;
          }
          .artist-title {
            font-size: 22px;
            letter-spacing: -0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .song-list-container {
            padding: 0 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
