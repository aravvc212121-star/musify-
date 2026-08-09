import React, { useEffect, useState, useRef } from 'react'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { 
  FiX, FiMoreHorizontal, FiHeart, FiPlay, FiPause, 
  FiSkipBack, FiSkipForward, FiRepeat, FiShuffle, FiClock
} from 'react-icons/fi'
import { Reorder, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'


function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function SongRow({ song, isPlaying, isCurrent, showAdd, onClick, onMore }) {
  const { addToQueue } = usePlayer()
  const [added, setAdded] = useState(false)

  if (!song) return null

  const hue = ((song.title?.charCodeAt(0) || 0) * 37) % 360;
  const bg = song.color || `hsl(${hue}, 35%, 25%)`
  const initial = song.title?.charAt(0).toUpperCase()

  const handleAdd = (e) => {
    e.stopPropagation()
    if (added) return
    addToQueue(song)
    setAdded(true)
    toast.success('Added to queue', { position: 'bottom-center' })
  }

  return (
    <div 
      onClick={onClick}
      className={`premium-song-row ${isCurrent ? 'active' : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 20px',
        margin: '0 8px', borderRadius: '8px', cursor: 'pointer',
        background: isCurrent ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
        borderLeft: isCurrent ? '3px solid var(--accent)' : '3px solid transparent',
        transition: 'background 0.2s ease'
      }}
    >
      <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 6, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }} className="song-poster">
        {song.thumbnail ? (
          <img src={song.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : song.emoji ? (
          <span style={{ fontSize: '20px', lineHeight: '44px' }}>{song.emoji}</span>
        ) : (
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{initial}</span>
        )}
        
        {isCurrent && (
          <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
            <div className="eq-bar" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
            <div className="eq-bar" style={{ animationDelay: '150ms', animationPlayState: isPlaying ? 'running' : 'paused' }} />
            <div className="eq-bar" style={{ animationDelay: '300ms', animationPlayState: isPlaying ? 'running' : 'paused' }} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: isCurrent ? 'var(--accent-hover)' : '#fff' }} className="truncate">{song.title}</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#b3b3b3' }} className="truncate">{song.artist}</p>
      </div>

      <span style={{ fontSize: '12px', color: '#b3b3b3', opacity: 0.7, flexShrink: 0 }} className="row-duration">{fmt(song.duration)}</span>
      
      <div style={{ flexShrink: 0, width: 24, display: 'flex', justifyContent: 'flex-end' }}>
        {showAdd ? (
          <button onClick={handleAdd} style={{
            width: 20, height: 20, borderRadius: '50%', border: added ? '1px solid var(--accent)' : '1px solid #535353',
            background: 'none', color: added ? 'var(--accent)' : '#b3b3b3', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s'
          }} className="add-btn">
            {added ? '✓' : '+'}
          </button>
        ) : (
          <button 
            onClick={(e) => { e.stopPropagation(); onMore && onMore(e, song) }}
            style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <FiMoreHorizontal size={14} color="#b3b3b3" className="row-dots" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function RightSidebar() {
  const { 
    currentSong, isRightSidebarOpen, setIsRightSidebarOpen, queue, queueIndex,
    isPlaying, togglePlay, playNext, playPrevious, toggleSavedSong, isSongSaved, playSong,
    shuffle, setShuffle, repeat, setRepeat,
    sleepTimer, sleepTimerRemaining, startSleepTimer, cancelSleepTimer,
    reorderQueue
  } = usePlayer()
  
  // Local state to control the fade animation independent of the width transition
  const [contentVisible, setContentVisible] = useState(isRightSidebarOpen)
  const sidebarScrollRef = useRef(null)
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)

  // Local Time / Duration from <audio> directly
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    let interval;
    if (isRightSidebarOpen) {
      interval = setInterval(() => {
        const audio = document.querySelector('audio') || window.__rhymAudio
        if (audio) {
          setCurrentTime(audio.currentTime || 0)
          setDuration(audio.duration || 0)
        }
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isRightSidebarOpen])

  const handleSeek = (e) => {
    const audio = document.querySelector('audio') || window.__rhymAudio
    if (audio) audio.currentTime = Number(e.target.value)
  }

  const saved = currentSong ? isSongSaved(currentSong.videoId) : false


  const handleClose = () => {
    setContentVisible(false) // Trigger fade out
    setTimeout(() => {
      setIsRightSidebarOpen(false) // Trigger width shrink after fade out
    }, 150)
  }

  const handleOpen = () => {
    setIsRightSidebarOpen(true) // Trigger width expand
    setTimeout(() => {
      setContentVisible(true)
    }, 400)
  }

  // Handle external toggle (from Player.jsx)
  useEffect(() => {
    if (isRightSidebarOpen) {
      const t = setTimeout(() => setContentVisible(true), 400)
      return () => clearTimeout(t)
    } else {
      setContentVisible(false)
    }
  }, [isRightSidebarOpen])

  useEffect(() => {
    const onExternalClose = () => handleClose()
    window.addEventListener('close-right-sidebar', onExternalClose)
    return () => window.removeEventListener('close-right-sidebar', onExternalClose)
  }, [])

  const openMenu = (e, song, fromQueue = false) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    window.dispatchEvent(new CustomEvent('open-context-menu', {
      detail: { x: rect.left, y: rect.bottom + 8, song, fromQueue }
    }))
  }

  const addToQueue = (song) => {
    window.dispatchEvent(new CustomEvent('add-to-queue', { detail: { song } }))
    toast('Added to queue')
  }

  // Next 20 songs
  const upNextList = []
  if (queue && queue.length > 0 && queueIndex >= 0) {
    for (let i = queueIndex + 1; i < Math.min(queue.length, queueIndex + 21); i++) {
      upNextList.push(queue[i])
    }
  }

  return (
    <div className="right-sidebar" 
      onClick={() => !isRightSidebarOpen && handleOpen()}
      style={{
      position: 'relative',
      height: '100%',
      background: !isRightSidebarOpen ? '#121212' : '#121212',
      borderLeft: !isRightSidebarOpen ? '2px solid var(--accent)' : 'none',
      transition: 'background 0.3s ease, border-left 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      cursor: !isRightSidebarOpen ? 'pointer' : 'default'
    }}>
      
      {!isRightSidebarOpen ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button 
            onClick={handleOpen}
            style={{ 
              background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
              padding: '16px 8px', fontSize: '18px', fontWeight: 'bold'
            }}
          >
            ❯
          </button>
        </div>
      ) : (
        <div style={{
          opacity: contentVisible ? 1 : 0,
          transition: contentVisible ? 'opacity 0.2s ease' : 'opacity 0.15s ease',
          height: '100%', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Now Playing</h3>
            <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)' }}>
              <button onClick={(e) => openMenu(e, currentSong)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <FiMoreHorizontal size={20} />
              </button>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <FiX size={20} />
              </button>
            </div>
          </div>

          <div style={{ padding: '0 20px 20px', overflowY: 'auto' }} className="hide-scrollbar" ref={sidebarScrollRef}>
            {currentSong ? (
              <>
                <style>{`
                  @keyframes sidebarPulse {
                    0% { box-shadow: 0 0 15px rgba(0, 210, 255, 0.2); }
                    50% { box-shadow: 0 0 30px rgba(0, 210, 255, 0.35); }
                    100% { box-shadow: 0 0 15px rgba(0, 210, 255, 0.2); }
                  }
                `}</style>
                <div className="glass-box" style={{ borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', marginBottom: '20px' }}>
                    <img
                      src={currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.videoId}/maxresdefault.jpg`}
                      alt={currentSong.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        boxShadow: isPlaying ? '0 8px 32px rgba(0, 210, 255, 0.3)' : '0 8px 32px rgba(0,0,0,0.5)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <h2 className="truncate" style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                      {currentSong.title}
                    </h2>
                    <p className="truncate" style={{ color: 'var(--accent-hover)', fontSize: '14px', fontWeight: 600 }}>
                      {currentSong.artist}
                    </p>
                  </div>
                </div>

                {/* Up Next Section */}
                <div className="glass-box up-next-section" style={{
                  borderRadius: '12px',
                  padding: '16px 0',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Up Next</h4>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#b3b3b3', opacity: 0.6 }}>
                      {queue.length - queueIndex - 1} Tracks Left
                    </span>
                  </div>
                  
                  <Reorder.Group 
                    axis="y" 
                    values={queue} 
                    onReorder={reorderQueue}
                    style={{ listStyle: 'none', padding: 0, margin: 0 }}
                  >
                    {queue.map((song, i) => {
                      if (i <= queueIndex) return null;
                      return (
                        <Reorder.Item 
                          key={song.videoId || i} 
                          value={song}
                          whileDrag={{ scale: 1.02, background: 'rgba(255,255,255,0.05)', zIndex: 1 }}
                        >
                          <SongRow song={song} onClick={() => playSong(song)} onMore={(e, s) => openMenu(e, s, true)} />
                        </Reorder.Item>
                      )
                    })}
                  </Reorder.Group>
                  {repeat !== 'context' && upNextList.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#b3b3b3', fontSize: '13px', marginTop: '16px' }}>End of queue</p>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                padding: '40px 0'
              }}>
                <p>No song playing</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive Styles Injection */}
      <style>{`
        @media (max-width: 1024px) {
          .right-sidebar { display: none !important; }
        }
        
        .premium-song-row:hover { background: rgba(255,255,255,0.06) !important; }
        .premium-song-row:hover .song-poster { filter: brightness(1.1); }
        .premium-song-row:hover .row-duration, 
        .premium-song-row:hover .row-dots { opacity: 1 !important; }
        .premium-song-row:hover .add-btn { border-color: #fff !important; color: #fff !important; }

        @keyframes eqBar {
          from { height: 4px; }
          to { height: 14px; }
        }
        .eq-bar {
          width: 3px; border-radius: 2px; background: var(--accent);
          animation: eqBar 0.6s ease-in-out infinite alternate;
        }

        @keyframes eq {
          0% { height: 2px; }
          50% { height: 10px; }
          100% { height: 2px; }
        }
      `}</style>
    </div>
  )
}
