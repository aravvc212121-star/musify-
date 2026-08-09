/**
 * RHYM v2.0 — SongRow
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Removed playlist references (playlists, addToPlaylist)
 * - Removed backdrop-filter blur from menu
 * - Simplified context menu: Like + Add to Queue only
 * - No box-shadow, uses border
 */

import { FiPlay, FiHeart, FiMoreHorizontal, FiPlus } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { useState, useRef, useEffect, memo } from 'react'

const SongRow = memo(({ song, songs = [], index = 0, showIndex = false }) => {
  const { playSong, currentSong, isPlaying, toggleSavedSong, isSongSaved, addToQueue } = usePlayer()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const isActive = currentSong?.videoId === song.videoId

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handlePlay = (e) => {
    e.stopPropagation()
    playSong(song, songs.length > 0 ? songs : [song], songs.length > 0 ? index : 0)
  }

  return (
    <div
      onClick={handlePlay}
      className="song-item"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        height: 64, padding: '0 12px', borderRadius: 12,
        background: isActive ? 'rgba(0, 210, 255, 0.08)' : 'transparent',
        border: `1px solid ${isActive ? 'rgba(0, 210, 255, 0.15)' : 'transparent'}`,
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      {showIndex && (
        <span style={{ width: 28, textAlign: 'center', fontSize: 12, fontWeight: 700, color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }}>
          {index + 1}
        </span>
      )}

      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        <img src={song.thumbnail} alt="" width={40} height={40} loading="lazy" style={{ width: 40, height: 40, objectFit: 'cover' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: isActive ? 'var(--accent)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</p>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist || song.channelTitle}</p>
      </div>

      <div style={{ position: 'relative' }} ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer' }}
        >
          <FiMoreHorizontal size={16} />
        </button>

        {showMenu && (
          <div style={{
            position: 'absolute', right: 0, bottom: 40, zIndex: 100,
            width: 200, padding: 6, borderRadius: 12,
            background: 'rgba(18,18,26,0.98)',
            border: 'none',
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); toggleSavedSong(song); setShowMenu(false) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              <FiHeart size={14} style={isSongSaved(song.videoId) ? { fill: 'var(--accent)', color: 'var(--accent)' } : {}} />
              {isSongSaved(song.videoId) ? 'Unlike' : 'Like'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); addToQueue(song); setShowMenu(false) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              <FiPlus size={14} /> Add to Queue
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

export default SongRow
