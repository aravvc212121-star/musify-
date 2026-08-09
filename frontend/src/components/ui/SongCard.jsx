/**
 * RHYM v2.0 — SongCard (Horizontal Item)
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Horizontal layout: 64px tall, thumbnail (40px) + title + artist
 * - No backdrop-filter blur
 * - border-radius: 12px
 * - No heavy shadows — uses border instead of box-shadow
 * - contain: layout style for scroll performance
 * - All img tags: loading="lazy" with explicit width/height
 * - Thumbnails: mqdefault.jpg (320px), object-fit: cover
 * - touch-action: manipulation
 */

import { memo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlay } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { enrichSongMetadata, generateGradientUrl } from '../../utils/api.js'

const SongCard = memo(({
  song: initialSong,
  songs = [],
  index = 0,
  isArtist = false,
  isChart = false,
  showDuration = true,
  onPlay
}) => {
  const navigate = useNavigate()
  const { playSong, currentSong, isPlaying } = usePlayer()
  const [song, setSong] = useState(initialSong)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!initialSong.isEnriched && initialSong.title && !isArtist && !isChart) {
      enrichSongMetadata(initialSong).then(enriched => setSong(enriched))
    } else {
      setSong(initialSong)
    }
  }, [initialSong, isArtist, isChart])

  const isCurrent = currentSong?.videoId === song.videoId
  const isActive = isCurrent && isPlaying

  const handleClick = () => {
    if (isChart) {
      navigate('/search', { state: { query: song.title + ' songs' } })
      return
    }
    if (isArtist) {
      navigate('/search', { state: { query: song.title || song.name } })
      return
    }
    if (song.videoId) {
      playSong(song, songs.length > 0 ? songs : [song], index)
    }
    if (onPlay) onPlay(song)
  }

  const displayImage = imgError
    ? generateGradientUrl(song.title || song.name || 'Music')
    : (song.albumArt || song.thumbnail || generateGradientUrl(song.title || song.name || 'Music'))

  return (
    <div
      onClick={handleClick}
      className="song-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        height: 64,
        padding: '0 12px',
        borderRadius: 12,
        background: isCurrent ? 'rgba(0, 210, 255, 0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isCurrent ? 'rgba(0, 210, 255, 0.2)' : 'transparent'}`,
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        touchAction: 'manipulation',
        contain: 'layout style',
      }}
      onMouseEnter={(e) => {
        if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={(e) => {
        if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 40, height: 40, borderRadius: isArtist ? '50%' : 8,
        overflow: 'hidden', flexShrink: 0, position: 'relative',
      }}>
        <img
          src={displayImage}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          onError={() => setImgError(true)}
          style={{ width: 40, height: 40, objectFit: 'cover', display: 'block' }}
        />
        {isActive && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    width: 2, borderRadius: 1, background: 'var(--accent)',
                    animation: `eq-bar 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 600,
            color: isCurrent ? 'var(--accent)' : '#fff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            lineHeight: 1.3,
          }}>
            {song.title || song.name || 'Unknown'}
          </p>
          <p style={{
            fontSize: 11, fontWeight: 500,
            color: 'rgba(255,255,255,0.35)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {song.artist || song.channelTitle || (isArtist ? 'Artist' : 'Unknown')}
          </p>
        </div>
        {/* Album */}
        {!isArtist && (
          <div className="album-col" style={{ width: '120px', minWidth: 0, flexShrink: 0, opacity: 0.6 }}>
            <p style={{
              fontSize: 12, fontWeight: 500, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {song.album || 'Single'}
            </p>
          </div>
        )}
      </div>

      {/* Duration */}
      {showDuration && song.duration && !isArtist && (
        <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
          {song.duration}
        </span>
      )}

      <style>{`
        @keyframes eq-bar {
          0% { height: 4px; }
          100% { height: 14px; }
        }
        @media (max-width: 768px) {
          .album-col { display: none !important; }
        }
      `}</style>
    </div>
  )
})

export default SongCard
