import React, { useEffect, useState, useRef } from 'react'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { 
  FiChevronDown, FiHeart, FiMoreHorizontal, 
  FiShuffle, FiSkipBack, FiPlay, FiPause, FiSkipForward, FiRepeat,
  FiVolume2, FiVolumeX, FiClock, FiMinimize2, FiSliders, FiList, FiX, FiShare2,
  FiYoutube, FiUser, FiMusic, FiMonitor, FiExternalLink, FiMaximize2, FiDisc, FiPlusCircle
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getLyrics } from '../../utils/api.js'
import { Reorder, motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion'
import html2canvas from 'html2canvas'
import { haptics } from '../../utils/haptics.js'
import { useScrollBounce } from '../../hooks/useScrollBounce.js'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return isMobile
}

const SWATCHES = [
  { name: 'Cyan Blue', value: '#00d2ff', text: 'light', glow: 'rgba(0, 210, 255, 0.5)' },
  { name: 'Deep Teal', value: '#006466', text: 'light', glow: 'rgba(0, 100, 102, 0.5)' },
  { name: 'Coral Flame', value: '#FF5E5B', text: 'light', glow: 'rgba(255, 94, 91, 0.5)' },
  { name: 'Amber Gold', value: '#FFB800', text: 'dark', glow: 'rgba(255, 184, 0, 0.5)' },
  { name: 'Midnight Navy', value: '#0A192F', text: 'light', glow: 'rgba(10, 25, 47, 0.5)' },
  { name: 'Rose Quartz', value: '#F4A261', text: 'dark', glow: 'rgba(244, 162, 97, 0.5)' },
  { name: 'Spotify Green', value: '#1DB954', text: 'dark', glow: 'rgba(29, 185, 84, 0.5)' },
  { name: 'Black', value: '#000000', text: 'light', glow: 'rgba(255, 255, 255, 0.2)' },
];

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function parseLRC(lrcContent) {
  if (!lrcContent) return []
  const lines = lrcContent.split('\n')
  const result = []
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/

  lines.forEach(line => {
    const match = timeRegex.exec(line)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = parseInt(match[3])
      const time = minutes * 60 + seconds + milliseconds / (match[3].length === 3 ? 1000 : 100)
      const text = line.replace(timeRegex, '').trim()
      if (text) result.push({ time, text })
    }
  })
  return result.sort((a, b) => a.time - b.time)
}

function SongRow({ song, isPlaying, isCurrent, showAdd, onClick, onMore, addNext }) {
  const { addToQueue } = usePlayer()
  const [added, setAdded] = useState(false)

  if (!song) return null

  const hue = ((song.title?.charCodeAt(0) || 0) * 37) % 360;
  const bg = song.color || `hsl(${hue}, 35%, 25%)`
  const initial = song.title?.charAt(0).toUpperCase()

  const handleAdd = (e) => {
    e.stopPropagation()
    if (added) return
    addToQueue(song, addNext)
    setAdded(true)
    toast.success(addNext ? 'Playing next' : 'Added to queue', { position: 'bottom-center' })
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
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#fff' }} className="truncate">{song.title}</p>
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

export default function FullScreenPlayer() {
  const { 
    isFullScreenPlayer, setIsFullScreenPlayer,
    currentSong, isPlaying, togglePlay,
    playNext, playPrevious, toggleSavedSong, isSongSaved,
    shuffle, setShuffle, repeat, setRepeat,
    sleepTimer, sleepTimerRemaining, startSleepTimer, cancelSleepTimer,
    recommendations, playSong, queue, queueIndex, reorderQueue
  } = usePlayer()

  const [visible, setVisible] = useState(isFullScreenPlayer)
  const [lyricsData, setLyricsData] = useState({ plain: [], synced: [] })
  const [isLyricsLoading, setIsLyricsLoading] = useState(false)
  const [lyricsIdx, setLyricsIdx] = useState(-1)
  const [isFlipped, setIsFlipped] = useState(false)
  const [hintSeen, setHintSeen] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFsQueueOpen, setIsFsQueueOpen] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const lyricsContainerRef = useRef(null)
  const captureRef = useRef(null)
  const queueScrollRef = useRef(null)

  // iOS-style bounce on queue and lyrics scroll
  useScrollBounce(queueScrollRef, { axis: 'y', maxBounce: 60 })
  useScrollBounce(lyricsContainerRef, { axis: 'y', maxBounce: 40 })

  const [selectedLines, setSelectedLines] = useState([])
  const [selectedColorIdx, setSelectedColorIdx] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isShareMode, setIsShareMode] = useState(false)
  const [vibrantColor, setVibrantColor] = useState('#1a1a1a')
  const isMobile = useIsMobile()

  useEffect(() => {
    setHintSeen(localStorage.getItem('lyricsHintSeen') === 'true')
  }, [])

  // Extract vibrant color from album art
  useEffect(() => {
    if (!currentSong?.thumbnail) return
    
    const extractColor = async () => {
      try {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.src = currentSong.thumbnail
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
          let r = 0, g = 0, b = 0, count = 0
          
          // Sample every 10th pixel for performance
          for (let i = 0; i < imageData.length; i += 40) {
            r += imageData[i]
            g += imageData[i + 1]
            b += imageData[i + 2]
            count++
          }
          
          // Average and enhance vibrancy
          r = Math.min(255, Math.floor((r / count) * 1.4))
          g = Math.min(255, Math.floor((g / count) * 1.4))
          b = Math.min(255, Math.floor((b / count) * 1.4))
          
          setVibrantColor(`rgb(${r}, ${g}, ${b})`)
        }
      } catch (err) {
        console.error('Color extraction failed:', err)
        setVibrantColor('#1a1a1a')
      }
    }
    
    extractColor()
  }, [currentSong?.videoId])

  // Fetch Real Lyrics with Sync Support
  useEffect(() => {
    if (!currentSong) return
    const fetchLyrics = async () => {
      setIsLyricsLoading(true)
      const data = await getLyrics(currentSong.videoId, currentSong.artist, currentSong.title)
      if (data) {
        const synced = parseLRC(data.syncedLyrics)
        const plain = data.plainLyrics ? data.plainLyrics.split('\n').filter(l => l.trim() !== '') : []
        setLyricsData({ plain, synced })
      } else {
        setLyricsData({ plain: [], synced: [] })
      }
      setLyricsIdx(-1)
      setIsLyricsLoading(false)
    }
    fetchLyrics()
  }, [currentSong?.videoId])

  useEffect(() => {
    let interval;
    if (isFullScreenPlayer) {
      interval = setInterval(() => {
        const audio = document.querySelector('audio') || window.__rhymAudio
        if (audio) {
          setCurrentTime(audio.currentTime || 0)
          setDuration(audio.duration || 0)
          setVolume(audio.volume)
        }
      }, 50)
    }
    return () => clearInterval(interval)
  }, [isFullScreenPlayer])

  useEffect(() => {
    if (isFullScreenPlayer) setVisible(true)
    else {
      const t = setTimeout(() => setVisible(false), 350)
      return () => clearTimeout(t)
    }
  }, [isFullScreenPlayer])

  // Dim/restore underlying content for crossfade effect
  useEffect(() => {
    const el = document.getElementById('app-main-content')
    if (!el) return

    if (isFullScreenPlayer) {
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease, filter 0.4s ease, border-radius 0.4s ease'
        el.style.opacity = '0.3'
        el.style.transform = 'scale(0.92)'
        el.style.filter = 'blur(4px)'
        el.style.borderRadius = '16px'
      })
    }

    return () => {
      if (el) {
        el.style.transition = ''
        el.style.opacity = ''
        el.style.transform = ''
        el.style.filter = ''
        el.style.borderRadius = ''
      }
    }
  }, [isFullScreenPlayer])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFsQueueOpen) setIsFsQueueOpen(false)
        else if (isFullScreenPlayer) setIsFullScreenPlayer(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    
    // Cleanup body styles on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (isMobile) {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
      }
    }
  }, [isFullScreenPlayer, isFsQueueOpen, isMobile])

  // Sync lyrics with time
  useEffect(() => {
    if (!isFullScreenPlayer || !isPlaying || !isFlipped || isShareMode) return
    
    if (lyricsData.synced.length > 0) {
      let index = -1
      for (let i = 0; i < lyricsData.synced.length; i++) {
        if (currentTime >= lyricsData.synced[i].time) index = i
        else break
      }
      if (index !== lyricsIdx) {
        setLyricsIdx(index)
        const activeLine = document.getElementById(`lyric-line-${index}`)
        if (activeLine && lyricsContainerRef.current) {
          activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    } else if (lyricsData.plain.length > 0) {
      const lineDuration = duration / lyricsData.plain.length
      const currentLineIdx = Math.floor(currentTime / lineDuration)
      if (currentLineIdx !== lyricsIdx) setLyricsIdx(currentLineIdx)
    }
  }, [currentTime, duration, lyricsData, isFlipped, isPlaying, isFullScreenPlayer, isShareMode])

  const handleClose = () => setIsFullScreenPlayer(false)
  const handleSeek = (e) => {
    const audio = document.querySelector('audio') || window.__rhymAudio
    if (audio) audio.currentTime = Number(e.target.value)
  }
  const handleVolume = (e) => {
    const audio = document.querySelector('audio') || window.__rhymAudio
    if (audio) audio.volume = Number(e.target.value)
  }
  const openMenu = (e, song, fromQueue = false) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    window.dispatchEvent(new CustomEvent('open-context-menu', {
      detail: { x: rect.left - 200, y: rect.bottom + 8, song: song || currentSong, fromQueue }
    }))
  }
  const openEq = (e) => {
    e.stopPropagation()
    window.dispatchEvent(new CustomEvent('open-eq-modal'))
  }
  const toggleFsQueue = (e) => {
    e.stopPropagation()
    const newState = !isFsQueueOpen
    setIsFsQueueOpen(newState)
    
    // Lock body scroll when queue is open on mobile
    if (isMobile) {
      if (newState) {
        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.width = '100%'
      } else {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
      }
    }
  }

  const toggleLine = (idx) => {
    if (selectedLines.includes(idx)) {
      setSelectedLines(selectedLines.filter(i => i !== idx))
    } else if (selectedLines.length < 5) {
      setSelectedLines([...selectedLines, idx].sort((a,b) => a-b))
    } else {
      toast.error('Maximum 5 lines allowed')
    }
  }

  const handleCaptureShare = async () => {
    if (selectedLines.length === 0) return
    setIsCapturing(true)
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      })
      const imgData = canvas.toDataURL('image/png')
      const res = await fetch(imgData)
      const blob = await res.blob()
      const file = new File([blob], 'Lyrics_Share.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Lyrics from ${currentSong.title}`
        })
      } else {
        const link = document.createElement('a')
        link.download = `${currentSong.title}_Lyrics.png`
        link.href = imgData
        link.click()
        toast.success('Downloaded lyrics card!')
      }
    } catch (err) {
      console.error(err)
      toast.error('Capture failed')
    } finally {
      setIsCapturing(false)
      setIsShareMode(false)
      setSelectedLines([])
    }
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const diffX = touchStartX.current - touchEndX
    const diffY = touchStartY.current - touchEndY
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 70) {
        haptics.medium() // Haptic on swipe-to-skip
        if (diffX > 0) {
          setSwipeDirection(1)
          playNext()
        } else {
          setSwipeDirection(-1)
          playPrevious()
        }
      }
    }
  }

  const handleMouseDown = (e) => {
    if (isFsQueueOpen) return
    touchStartX.current = e.clientX
    touchStartY.current = e.clientY
  }

  const handleMouseUp = (e) => {
    if (isFsQueueOpen) return
    const mouseEndX = e.clientX
    const mouseEndY = e.clientY
    const diffX = touchStartX.current - mouseEndX
    const diffY = touchStartY.current - mouseEndY
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 100) { 
        if (diffX > 0) {
          setSwipeDirection(1)
          playNext()
        } else {
          setSwipeDirection(-1)
          playPrevious()
        }
      }
    }
  }

  if (!visible && !isFullScreenPlayer) return null
  if (!currentSong) return null

  const getHue = (str) => {
    if (!str) return 260;
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash % 360);
  }

  const hue = getHue(currentSong.videoId)
  const thumb = currentSong.thumbnail || `https://i.ytimg.com/vi/${currentSong.videoId}/maxresdefault.jpg`
  const saved = isSongSaved(currentSong.videoId)
  const activeLyrics = lyricsData.synced.length > 0 ? lyricsData.synced : lyricsData.plain.map(text => ({ text }))

  // Don't render if not visible
  if (!isFullScreenPlayer && !visible) return null

  return (
    <div 
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        display: isFullScreenPlayer ? 'flex' : 'none',
        flexDirection: 'column',
        color: '#fff',
        overflow: 'hidden',
        background: 'transparent',
        userSelect: 'none',
        pointerEvents: isFullScreenPlayer ? 'auto' : 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        // Push below notch/status bar in PWA standalone mode
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: -2,
        backgroundImage: `url(${thumb})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(80px) brightness(0.6) saturate(1.5)',
        transform: 'scale(1.2)',
        transition: 'background-image 0.8s ease'
      }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: `linear-gradient(to bottom, ${vibrantColor}dd 0%, ${vibrantColor}ee 100%)` }} />

      {/* Suggestions Panel */}
      <div 
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        style={{
        position: 'absolute', top: '64px', right: '16px',
        width: 'min(340px, 90vw)', bottom: '135px',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(24px)',
        borderRadius: '20px', border: 'none',
        display: 'flex', flexDirection: 'column', zIndex: 10001,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
        transform: isFsQueueOpen ? 'translateX(0)' : 'translateX(120%)',
        opacity: isFsQueueOpen ? 1 : 0, pointerEvents: isFsQueueOpen ? 'auto' : 'none', overflow: 'hidden',
        touchAction: 'pan-y'
      }}>
        <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: 'none', background: 'rgba(0,0,0,0.2)' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Up Next</span>
          <button onClick={() => {
            setIsFsQueueOpen(false)
            if (isMobile) {
              document.body.style.overflow = ''
              document.body.style.position = ''
              document.body.style.width = ''
            }
          }} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px' }}><FiX size={24} /></button>
        </div>
        <div 
          ref={queueScrollRef}
          style={{ flex: 1, overflowY: 'auto', padding: '8px 0', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }} 
          className="hide-scrollbar"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* NOW PLAYING SECTION */}
          <p style={{ fontSize: '10px', color: '#b3b3b3', fontWeight: 700, letterSpacing: '1.5px', padding: '16px 20px 8px', margin: 0 }}>NOW PLAYING</p>
          <SongRow song={currentSong} isPlaying={isPlaying} isCurrent={true} onMore={(e, s) => openMenu(e, s)} />
          
          {/* QUEUE SECTION */}
          {queue.length > queueIndex + 1 && (
            <>
              <p style={{ fontSize: '10px', color: '#b3b3b3', fontWeight: 700, letterSpacing: '1.5px', padding: '24px 20px 8px', margin: 0 }}>UP NEXT</p>
              {isMobile ? (
                // Static list for mobile - no reordering
                <div style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {queue.map((s, i) => {
                    if (i <= queueIndex) return null;
                    return (
                      <div key={s.videoId || i}>
                        <SongRow song={s} onClick={() => { setSwipeDirection(1); playSong(s) }} onMore={(e, s2) => openMenu(e, s2, true)} />
                      </div>
                    )
                  })}
                </div>
              ) : (
                // Draggable list for desktop
                <Reorder.Group 
                  axis="y" 
                  values={queue} 
                  onReorder={reorderQueue}
                  style={{ listStyle: 'none', padding: 0, margin: 0 }}
                >
                  {queue.map((s, i) => {
                    if (i <= queueIndex) return null;
                    return (
                      <Reorder.Item 
                        key={s.videoId || i} 
                        value={s}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        whileDrag={{ scale: 1.05, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 1 }}
                      >
                        <SongRow song={s} onClick={() => { setSwipeDirection(1); playSong(s) }} onMore={(e, s2) => openMenu(e, s2, true)} />
                      </Reorder.Item>
                    )
                  })}
                </Reorder.Group>
              )}
            </>
          )}

          {/* SUGGESTIONS SECTION */}
          {recommendations.length > 0 && (
            <>
              <p style={{ fontSize: '10px', color: '#b3b3b3', fontWeight: 700, letterSpacing: '1.5px', padding: '24px 20px 8px', margin: 0 }}>SUGGESTED FOR YOU</p>
              {recommendations.slice(0, 15).map((s, i) => (
                <SongRow key={s.videoId || i} song={s} showAdd={true} addNext={true} onClick={() => { setSwipeDirection(1); playSong(s) }} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Top Bar (Floating controls) */}
      <div style={{ 
        position: 'absolute', top: 0, right: 0, left: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: isMobile ? '12px 16px' : '24px',
        background: 'transparent', pointerEvents: 'none'
      }}>
        <button onClick={handleClose} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', backdropFilter: 'blur(12px)' }}>
          <FiChevronDown size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '8px', pointerEvents: 'auto' }}>
          {!isMobile && <button style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.7, cursor: 'pointer', padding: '8px' }}><FiDisc size={18} /></button>}
          {!isMobile && <button style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.7, cursor: 'pointer', padding: '8px' }}><FiYoutube size={18} /></button>}
          {!isMobile && <button style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.7, cursor: 'pointer', padding: '8px' }}><FiUser size={18} /></button>}
          <button onClick={(e) => openMenu(e, currentSong)} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.7, cursor: 'pointer', padding: '8px' }}><FiMoreHorizontal size={isMobile ? 24 : 18} /></button>
          {!isMobile && (
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.7, cursor: 'pointer', padding: '8px' }}>
              <FiMaximize2 size={18} />
            </button>
          )}
        </div>
      </div>      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }} className="hide-scrollbar">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Large Album Art */}
          <div 
            style={{ 
              width: isMobile ? 'min(360px, 85vw)' : 'min(540px, 70vw)', aspectRatio: '1/1', position: 'relative', 
              perspective: '1200px',
              cursor: 'pointer',
              marginTop: isMobile ? '-20px' : '0px'
            }}
          >
            <AnimatePresence mode="wait" initial={false} custom={swipeDirection}>
              <motion.div
                key={currentSong?.videoId}
                custom={swipeDirection}
                variants={{
                  enter: (direction) => ({
                    x: direction > 0 ? 1000 : -1000,
                    opacity: 0,
                    scale: 0.5,
                    rotateY: direction > 0 ? 45 : -45
                  }),
                  center: {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                    rotateY: 0,
                    transition: {
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                      rotateY: { duration: 0.4 }
                    }
                  },
                  exit: (direction) => ({
                    x: direction > 0 ? -1000 : 1000,
                    opacity: 0,
                    scale: 0.5,
                    rotateY: direction > 0 ? -45 : 45,
                    transition: {
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }
                  })
                }}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ width: '100%', height: '100%', position: 'absolute' }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div style={{
                  width: '100%', height: '100%', position: 'absolute', transformStyle: 'preserve-3d', 
                  transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)', transform: isFlipped ? 'rotateY(-180deg)' : 'rotateY(0deg)'
                }}>
                  <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 80px rgba(0,0,0,0.6)' }}>
                    <img src={thumb} loading="lazy" decoding="async" style={{width:'100%', height:'100%', objectFit:'cover'}} alt="" />
                  </div>
                  <div 
                    ref={lyricsContainerRef}
                    style={{
                      position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                      borderRadius: '12px', 
                      background: isShareMode ? SWATCHES[selectedColorIdx].value : `linear-gradient(135deg, ${vibrantColor} 0%, ${vibrantColor}dd 100%)`,
                      color: isShareMode ? (SWATCHES[selectedColorIdx].text === 'light' ? '#fff' : '#000') : '#fff',
                      backdropFilter: 'none',
                      transform: 'rotateY(180deg)', overflowY: 'auto', padding: '40px 24px',
                      display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center',
                      boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
                      border: 'none',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} className="hide-scrollbar"
                  >
                    {isLyricsLoading ? (
                      <div style={{ textAlign: 'center', color: '#b3b3b3', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div className="lyrics-loader" />
                      </div>
                    ) : activeLyrics.length > 0 ? (
                      activeLyrics.map((l, i) => {
                        const isSelected = selectedLines.includes(i)
                        const textColor = isShareMode ? (SWATCHES[selectedColorIdx].text === 'light' ? '#fff' : '#000') : '#fff';
                        const secondaryColor = isShareMode ? (SWATCHES[selectedColorIdx].text === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)') : 'rgba(255,255,255,0.4)';
                        
                        return (
                          <p 
                            key={i} 
                            id={`lyric-line-${i}`} 
                            onClick={(e) => {
                              if (isShareMode) {
                                e.stopPropagation()
                                toggleLine(i)
                              }
                            }}
                            style={{
                              fontSize: '18px', 
                              fontWeight: '700',
                              color: isSelected ? textColor : (i === lyricsIdx ? textColor : secondaryColor),
                              textAlign: 'center', margin: 0, 
                              transition: 'color 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', lineHeight: '1.4',
                              cursor: isShareMode ? 'pointer' : 'default',
                              padding: '8px 16px',
                              borderRadius: '12px',
                              background: isSelected ? (isShareMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)') : 'none',
                              boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                              transform: isSelected ? 'scale(1.05)' : (i === lyricsIdx ? 'scale(1.15)' : 'scale(1)'),
                            }}
                          >
                            {l.text}
                          </p>
                        )
                      })
                    ) : (
                      <div style={{ textAlign: 'center', color: '#b3b3b3', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p>No lyrics found</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
        
          {/* Selection / Color Palette Toolbar */}
          <AnimatePresence>
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{ 
                  position: 'absolute', bottom: '-48px', left: 0, right: 0,
                  width: '100%',
                  zIndex: 1000, display: 'flex', justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'auto', position: 'relative'
              }}>
                <AnimatePresence>
                  {isShareMode && (
                    <motion.div
                      initial={{ opacity: 0, x: 20, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.8 }}
                      style={{ 
                        display: 'flex', gap: '8px', alignItems: 'center', 
                        position: 'absolute', right: 'calc(100% + 12px)', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(32px)',
                        padding: '8px 16px', borderRadius: '32px', border: 'none',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap'
                      }}
                    >
                      {SWATCHES.map((swatch, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedColorIdx(idx)}
                          style={{
                            width: '20px', height: '20px', borderRadius: '50%', background: swatch.value,
                            border: selectedColorIdx === idx ? '2px solid #fff' : '2px solid transparent',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!isShareMode) setIsShareMode(true);
                    else if (selectedLines.length > 0) handleCaptureShare();
                    else setIsShareMode(false);
                  }}
                  style={{
                    background: isShareMode ? SWATCHES[selectedColorIdx].value : 'rgba(255,255,255,0.1)', 
                    backdropFilter: isShareMode ? 'none' : 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px',
                    padding: '6px 14px', 
                    color: isShareMode ? (SWATCHES[selectedColorIdx].text === 'light' ? '#fff' : '#000') : 'rgba(255,255,255,0.8)', 
                    fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', 
                    cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease',
                    position: 'relative', zIndex: 2
                  }}
                  className="zoom-hover"
                >
                  {isCapturing ? '...' : (isShareMode ? (selectedLines.length > 0 ? <><FiShare2 size={14}/> Share</> : <><FiX size={14}/> Cancel</>) : <><FiShare2 size={14}/> Share Lyrics</>)}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Hidden Capture Target */}
        <div 
          ref={captureRef}
          style={{ 
            position: 'absolute', top: '-2000px', left: '-2000px',
            width: '400px', height: '500px',
            background: SWATCHES[selectedColorIdx].value,
            color: SWATCHES[selectedColorIdx].text === 'light' ? '#fff' : '#000',
            padding: '40px', borderRadius: '24px', display: 'flex', flexDirection: 'column',
            zIndex: -100
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <img src={thumb} style={{ width: '64px', height: '64px', borderRadius: '12px' }} crossOrigin="anonymous" />
            <div>
              <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{currentSong.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.8 }}>{currentSong.artist}</p>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
            {selectedLines.map(idx => (
              <p key={idx} style={{ margin: 0, fontSize: '22px', fontWeight: 700, lineHeight: 1.3 }}>
                {activeLyrics[idx]?.text}
              </p>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6, marginTop: '24px' }}>
            <FiMusic size={20} />
            <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '4px' }}>RHYM</span>
          </div>
        </div>
      </div>
      </div>

      {/* Bottom Controls Bar */}
      <div style={{ 
        background: 'rgba(0,0,0,0.5)', 
        backdropFilter: 'blur(24px)', 
        padding: isMobile ? '16px' : '20px 32px', 
        borderTop: 'none', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isMobile ? '12px' : '0',
        borderRadius: isMobile ? '32px' : '0',
        margin: isMobile ? '0 16px 24px 16px' : '0',
        boxShadow: isMobile ? '0 12px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none'
      }}>
        
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '0' : '12px', gap: isMobile ? '12px' : '0' }}>
          
          {/* Left: Song Info */}
          <div style={{ width: isMobile ? '100%' : 'auto', flex: isMobile ? 'none' : 1, display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
              {!isMobile && <img src={thumb} style={{ width: '56px', height: '56px', borderRadius: '4px', objectFit: 'cover' }} alt="" />}
              <div style={{ minWidth: 0 }}>
                <p className="truncate" style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{currentSong.title}</p>
                <p className="truncate" style={{ margin: '2px 0 0 0', fontSize: isMobile ? '12px' : '13px', opacity: 0.6 }}>{currentSong.artist}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => { haptics.light(); toggleSavedSong(currentSong) }} style={{ background: 'none', border: 'none', color: saved ? 'var(--accent)' : '#fff', cursor: 'pointer', padding: '6px', touchAction: 'manipulation' }}>
                <FiHeart size={isMobile ? 18 : 20} style={{ fill: saved ? 'var(--accent)' : 'none', opacity: saved ? 1 : 0.4 }} />
              </button>
              {isMobile && (
                <button onClick={toggleFsQueue} style={{ background: 'none', border: 'none', color: isFsQueueOpen ? 'var(--accent)' : '#fff', opacity: isFsQueueOpen ? 1 : 0.6, cursor: 'pointer', padding: '6px' }}><FiList size={18} /></button>
              )}
            </div>
          </div>

          {/* Progress Bar (Mobile only, between Info and Controls) */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '4px 0' }}>
              <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700, width: '35px' }}>{fmt(currentTime)}</span>
              <div style={{ flex: 1, position: 'relative', height: '12px', display: 'flex', alignItems: 'center' }}>
                <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek} className="fs-seek-slider" style={{ width: '100%', height: '4px', borderRadius: '2px', appearance: 'none', outline: 'none', background: `linear-gradient(to right, #fff ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.15) ${(currentTime / (duration || 100)) * 100}%)`, cursor: 'pointer', touchAction: 'none' }} />
              </div>
              <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700, width: '35px', textAlign: 'right' }}>{fmt(duration)}</span>
            </div>
          )}

          {/* Center: Playback Controls */}
          <div style={{ width: isMobile ? '100%' : 'auto', flex: isMobile ? 'none' : 1, display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'center', gap: isMobile ? '0' : '20px' }}>
            <button onClick={() => { haptics.light(); setShuffle(!shuffle) }} style={{ background: 'none', border: 'none', color: shuffle ? 'var(--accent)' : '#fff', opacity: shuffle ? 1 : 0.4, cursor: 'pointer', padding: '6px', touchAction: 'manipulation' }}><FiShuffle size={16} /></button>
            <button onClick={() => { haptics.light(); setSwipeDirection(-1); playPrevious() }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', touchAction: 'manipulation' }}><FiSkipBack size={20} /></button>
            <button onClick={() => { haptics.medium(); togglePlay() }} style={{ background: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', touchAction: 'manipulation' }}>{isPlaying ? <FiPause size={20} color="#000" /> : <FiPlay size={20} color="#000" style={{ marginLeft: 3 }} />}</button>
            <button onClick={() => { haptics.light(); setSwipeDirection(1); playNext() }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', touchAction: 'manipulation' }}><FiSkipForward size={20} /></button>
            <button onClick={() => { haptics.light(); setRepeat(repeat === 'none' ? 'context' : 'none') }} style={{ background: 'none', border: 'none', color: repeat !== 'none' ? 'var(--accent)' : '#fff', opacity: repeat !== 'none' ? 1 : 0.4, cursor: 'pointer', padding: '6px', touchAction: 'manipulation' }}><FiRepeat size={16} /></button>
          </div>

          {/* Right: Utility Controls (Desktop Only) */}
          {!isMobile && (
            <div style={{ width: 'auto', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <button onClick={() => setIsFlipped(!isFlipped)} style={{ background: 'none', border: 'none', color: isFlipped ? 'var(--accent)' : '#fff', opacity: isFlipped ? 1 : 0.6, cursor: 'pointer', padding: '6px' }}><FiMusic size={16} /></button>
              <button onClick={toggleFsQueue} style={{ background: 'none', border: 'none', color: isFsQueueOpen ? 'var(--accent)' : '#fff', opacity: isFsQueueOpen ? 1 : 0.6, cursor: 'pointer', padding: '6px' }}><FiList size={16} /></button>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.6, cursor: 'pointer', padding: '6px' }}><FiMinimize2 size={18} /></button>
              <button onClick={() => { if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { document.exitFullscreen(); } }} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.6, cursor: 'pointer', padding: '6px' }}><FiMonitor size={16} /></button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '90px', marginLeft: '6px', marginRight: '10px' }}>
                <FiVolume2 size={14} style={{ opacity: 0.6 }} />
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolume} className="fs-vol-slider" style={{ flex: 1, height: '3px', borderRadius: '2px', appearance: 'none', background: `linear-gradient(to right, #fff ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`, cursor: 'pointer' }} />
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar (Desktop only) */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700, width: '35px' }}>{fmt(currentTime)}</span>
            <div style={{ flex: 1, position: 'relative', height: '12px', display: 'flex', alignItems: 'center' }}>
              <input type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek} className="fs-seek-slider" style={{ width: '100%', height: '4px', borderRadius: '2px', appearance: 'none', outline: 'none', background: `linear-gradient(to right, #fff ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.15) ${(currentTime / (duration || 100)) * 100}%)`, cursor: 'pointer', touchAction: 'none' }} />
            </div>
            <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700, width: '35px', textAlign: 'right' }}>{fmt(duration)}</span>
          </div>
        )}
      </div>

      <style>{`
        .fs-bottom-btn { background: none; border: none; color: #fff; cursor: pointer; transition: all 0.2s; padding: 8px; }
        .fs-bottom-btn:hover { transform: scale(1.04) !important; opacity: 1 !important; }
        @keyframes eqBar { from { height: 4px; } to { height: 14px; } }
        .eq-bar { width: 3px; border-radius: 2px; background: var(--accent); animation: eqBar 0.6s ease-in-out infinite alternate; }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 30px rgba(0, 210, 255, 0.2); } 50% { box-shadow: 0 0 80px rgba(0, 210, 255, 0.3); } 100% { box-shadow: 0 0 30px rgba(0, 210, 255, 0.2); } }
        .fs-seek-slider::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff; cursor: pointer; }
        @keyframes lyricsSpin { to { transform: rotate(360deg); } }
        .lyrics-loader { width: 28px; height: 28px; border: 2px solid transparent; border-top-color: #fff; border-radius: 50%; animation: lyricsSpin 0.8s linear infinite; }
        
        @keyframes vibrantGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
