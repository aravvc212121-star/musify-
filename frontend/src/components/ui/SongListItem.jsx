/**
 * RHYM — SongListItem (Reusable)
 * ─────────────────────────────────────────────
 * A single row for any song list: Album, Popular Artists, Liked Songs, etc.
 * 56×56 square thumbnail · bold truncated title · "Song • Artist1, Artist2" subtitle · "+" add button
 *
 * Props:
 *  - song        {Object}   Song data ({ videoId, title, artist, thumbnail, ... })
 *  - songs       {Array}    Full list for queue context
 *  - index       {Number}   Position in list
 *  - onAdd       {Function} Optional override for the "+" button (receives song)
 *  - hideAdd     {Boolean}  Hide the "+" button entirely
 */

import { memo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { generateGradientUrl } from '../../utils/api.js'

const SongListItem = memo(({ song, songs = [], index = 0, onAdd, hideAdd = false }) => {
  const { playSong, currentSong, isPlaying, addToQueue } = usePlayer()
  const [imgError, setImgError] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [addPop, setAddPop] = useState(false)

  if (!song) return null

  const isCurrent = currentSong?.videoId === song.videoId
  const isActive = isCurrent && isPlaying

  const thumb = imgError
    ? generateGradientUrl(song.title || 'Music')
    : (song.albumArt || song.thumbnail || `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`)

  // Format subtitle: "Song • Artist1, Artist2"
  const artistText = song.artist || song.channelTitle || 'Unknown Artist'
  const subtitle = `Song • ${artistText}`

  const handleRowClick = () => {
    if (song.videoId) {
      playSong(song, songs.length > 0 ? songs : [song], index)
    }
  }

  const handleAdd = (e) => {
    e.stopPropagation()
    setAddPop(true)
    setTimeout(() => setAddPop(false), 300)
    if (onAdd) {
      onAdd(song)
    } else {
      addToQueue(song)
    }
  }

  return (
    <div
      onClick={handleRowClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className="sli-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 0',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        touchAction: 'manipulation',
        contain: 'layout style',
        minHeight: 72,
      }}
    >
      {/* ─── Thumbnail 56×56 ─── */}
      <div style={{
        width: 56, height: 56, borderRadius: 6,
        overflow: 'hidden', flexShrink: 0, position: 'relative',
      }}>
        <img
          src={thumb}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          style={{ width: 56, height: 56, objectFit: 'cover', display: 'block' }}
        />
        {/* Playing indicator overlay */}
        {isActive && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)',
            borderRadius: 8,
          }}>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 16 }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    width: 3, borderRadius: 2, background: 'var(--accent)',
                    animation: `sli-eq-bar 0.6s ease-in-out ${i * 0.12}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Title + Subtitle ─── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
        <p style={{
          fontSize: 16, fontWeight: 700, margin: 0,
          color: isCurrent ? 'var(--accent)' : '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}>
          {song.title || 'Unknown'}
        </p>
        <p style={{
          fontSize: 13, fontWeight: 500, margin: 0,
          color: isCurrent ? 'rgba(0, 210, 255, 0.6)' : '#9ca3af',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.2,
        }}>
          {subtitle}
        </p>
      </div>

      {/* ─── Add (+) Button ─── */}
      {!hideAdd && (
        <button
          onClick={handleAdd}
          aria-label="Add to queue"
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 4px',
            cursor: 'pointer',
            color: addPop ? 'var(--accent)' : '#6b7280',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease, transform 0.2s ease',
            transform: addPop ? 'scale(1.2)' : 'scale(1)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6b7280' }}
        >
          <FiPlus size={24} strokeWidth={2} />
        </button>
      )}

      {/* ─── Scoped Styles ─── */}
      <style>{`
        @keyframes sli-eq-bar {
          0% { height: 4px; }
          100% { height: 16px; }
        }
        .sli-row:hover {
          background: rgba(255,255,255,0.03) !important;
        }
      `}</style>
    </div>
  )
})

SongListItem.displayName = 'SongListItem'
export default SongListItem
