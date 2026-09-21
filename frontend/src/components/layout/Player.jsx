import React, { useState, useEffect, useRef, useCallback } from 'react'
import { usePlayer } from '../../context/PlayerContext.jsx'
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward,
  FiHeart, FiShuffle, FiRepeat,
  FiVolume2, FiVolumeX, FiList, FiMonitor, FiClock, FiMessageSquare, FiMaximize2, FiSquare
} from 'react-icons/fi'
import { getLyrics } from '../../utils/api.js'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { haptics } from '../../utils/haptics.js'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import ScrollingText from '../ui/ScrollingText.jsx'

/* ─── Time Formatter ─── */
function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

/* ─── Progress Hook ─── */
function usePlayerTime() {
  const { currentSong } = usePlayer()
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const audio = document.querySelector('audio') || window.__rhymAudio
      if (audio) {
        setCurrentTime(audio.currentTime || 0)
        setDuration(audio.duration || 0)
      }
    }, 250)
    return () => clearInterval(interval)
  }, [currentSong])

  return { currentTime, duration }
}

/* ─── Dominant Color Extractor ─── */
export function useDominantColor(thumb) {
  const [color, setColor] = useState('hsl(260, 75%, 32%)') // fallback
  useEffect(() => {
    if (!thumb) return
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      if (cancelled) return
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 40
        canvas.height = 40
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, 40, 40)
        const data = ctx.getImageData(0, 0, 40, 40).data
        
        // bucket colors to find the most dominant vibrant color
        const buckets = {}
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3]
          if (a < 128) continue
          const max = Math.max(r, g, b), min = Math.min(r, g, b)
          const sat = max === 0 ? 0 : (max - min) / max
          if (sat < 0.2) continue // skip pure greys/blacks/whites
          
          const key = `${Math.round(r/32)*32},${Math.round(g/32)*32},${Math.round(b/32)*32}`
          buckets[key] = (buckets[key] || 0) + 1 + sat // weight by occurrence and saturation
        }
        
        let best = null, bestScore = 0
        for (const [key, score] of Object.entries(buckets)) {
          if (score > bestScore) { bestScore = score; best = key }
        }
        
        if (best) {
          const [r, g, b] = best.split(',').map(Number)
          // Convert dominant RGB to HSL and boost saturation/set fixed lightness for consistency
          const max = Math.max(r,g,b)/255, min = Math.min(r,g,b)/255
          const l = (max+min)/2
          const h = max===min ? 0 : max===r/255 ? ((g-b)/255/(max-min)+6)%6*60
            : max===g/255 ? (b-r)/255/(max-min)*60+120
            : (r-g)/255/(max-min)*60+240
          
          setColor(`hsl(${Math.round(h)}, 80%, 32%)`)
        }
      } catch(e) {
        console.warn('Canvas color extraction failed:', e)
      }
    }
    img.onerror = () => {
      // Fallback to hash-based color if proxy fails
      if (cancelled) return
      let hash = 0
      for (let i = 0; i < thumb.length; i++) hash = thumb.charCodeAt(i) + ((hash << 5) - hash)
      setColor(`hsl(${Math.abs(hash % 360)}, 80%, 32%)`)
    }
    
    // Proxy the image to avoid canvas CORS taint using wsrv.nl (highly reliable image proxy)
    const proxyUrl = 'https://wsrv.nl/?url=' + encodeURIComponent(thumb)
    img.src = proxyUrl
    
    return () => { cancelled = true }
  }, [thumb])
  return color
}

export default function Player() {
  const {
    currentSong, isPlaying, togglePlay,
    seekTo, playNext, playPrevious, playSong,
    shuffle, setShuffle, repeat, setRepeat,
    toggleSavedSong, isSongSaved, isAudioLoading,
    recommendations, 
    setVolume, volume,
    isRightSidebarOpen, setIsRightSidebarOpen,
    isFullScreenPlayer, setIsFullScreenPlayer,
    sleepTimer, sleepTimerRemaining, startSleepTimer, cancelSleepTimer
  } = usePlayer()

  const { currentTime, duration } = usePlayerTime()
  const [localVolume, setLocalVolume] = useState(1) // 0 to 1
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false)
  const isMobile = useIsMobile()
  const queueRef = useRef(null)
  
  // Motion values for smooth animations
  const dragY = useMotionValue(0)
  const heightValue = useTransform(dragY, [-250, 0], [180, 64], { clamp: true })
  const borderRadiusValue = useTransform(dragY, [-250, 0], [28, 12], { clamp: true })
  const scaleValue = useTransform(dragY, [-250, 0], [1.03, 1], { clamp: true })

  // Set global audio volume
  useEffect(() => {
    const audio = document.querySelector('audio') || window.__rhymAudio
    if (audio) audio.volume = localVolume
  }, [localVolume])

  // Close queue on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (queueRef.current && !queueRef.current.contains(e.target)) {
        setIsQueueOpen(false)
      }
    }
    if (isQueueOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isQueueOpen])


  const thumb = currentSong?.thumbnail || (currentSong ? `https://i.ytimg.com/vi/${currentSong.videoId}/mqdefault.jpg` : '')
  const dominantColor = useDominantColor(thumb)

  // Sync dominant color into a CSS variable so MobileNav can bleed it into the system nav bar area
  useEffect(() => {
    const root = document.documentElement
    if (currentSong && dominantColor) {
      root.style.setProperty('--mini-player-color', dominantColor)
      root.style.setProperty('--mini-player-visible', '1')
    } else {
      root.style.removeProperty('--mini-player-color')
      root.style.removeProperty('--mini-player-visible')
    }
    return () => {
      if (!currentSong) {
        root.style.removeProperty('--mini-player-color')
        root.style.removeProperty('--mini-player-visible')
      }
    }
  }, [dominantColor, currentSong])

  if (!currentSong) return null

  const saved = isSongSaved(currentSong.videoId)
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  if (isMobile) {
    return (
      <div 
        onClick={(e) => {
          // Only open fullscreen if clicking on non-interactive areas
          if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
            setIsFullScreenPlayer(true)
          }
        }}
        style={{
          position: 'fixed',
          // Dock closer above the bottom nav bar
          bottom: 'calc(58px + env(safe-area-inset-bottom, 0px))',
          left: '12px',
          right: '12px',
          height: '56px',
          background: dominantColor,
          transition: 'background 0.4s ease', // smooth color change between tracks
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderRadius: '12px', // Fixed radius
          overflow: 'hidden', // Contain the blurred background
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '12px',
          zIndex: 1001,
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.05)',
          cursor: 'pointer',
          touchAction: 'manipulation',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >


        {/* Content sits above the blurred background */}
        <div style={{ position: 'relative', zIndex: 1, width: 40, height: 40, borderRadius: '6px', overflow: 'hidden', flexShrink: 0, pointerEvents: 'none' }}>
          <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        
        <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <ScrollingText
            text={currentSong.title}
            style={{ fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0, lineHeight: 1.3 }}
          />
          <ScrollingText
            text={currentSong.artist}
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: '2px 0 0 0', lineHeight: 1.2 }}
            speed={22}
          />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); haptics.light(); toggleSavedSong(currentSong) }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
            color: saved ? 'var(--accent)' : '#fff',
            pointerEvents: 'auto',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <FiHeart size={18} style={{ fill: saved ? 'currentcolor' : 'none' }} />
        </button>



        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'auto' }}>
          <button
            onClick={(e) => { e.stopPropagation(); haptics.light(); playPrevious() }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{ background: 'none', border: 'none', color: '#fff', padding: '8px', cursor: 'pointer', pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }}
          >
            <FiSkipBack size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); haptics.medium(); togglePlay() }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{ background: 'none', border: 'none', color: '#fff', padding: '8px', cursor: 'pointer', pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }}
          >
            {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); haptics.light(); playNext() }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{ background: 'none', border: 'none', color: '#fff', padding: '8px', cursor: 'pointer', pointerEvents: 'auto', WebkitTapHighlightColor: 'transparent' }}
          >
            <FiSkipForward size={20} />
          </button>
        </div>

        {/* Progress bar line at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: '12px', right: '12px', height: '2px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px', overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: '#fff', transition: 'width 0.2s linear' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="bottom-bar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'relative',
      zIndex: 9999
    }}>
      {/* ─── LEFT: Track Info (30%) ─── */}
      <div 
        onClick={() => setIsFullScreenPlayer(true)}
        style={{ flex: '0 1 30%', minWidth: 0, display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
      >
        <img
          src={thumb}
          alt=""
          width={56} height={56}
          style={{ borderRadius: '4px', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <ScrollingText
            text={currentSong.title}
            style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}
          />
          <ScrollingText
            text={currentSong.artist}
            style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}
            speed={22}
          />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); haptics.light(); toggleSavedSong(currentSong) }}
          style={{
            background: 'none', border: 'none', padding: '8px', cursor: 'pointer',
            color: saved ? 'var(--accent)' : 'var(--text-secondary)',
            marginLeft: '8px'
          }}
        >
          <FiHeart size={16} style={{ fill: saved ? 'currentcolor' : 'none' }} />
        </button>
        
      </div>

      {/* ─── CENTER: Controls & Progress (40%) ─── */}
      <div style={{ flex: '0 1 40%', maxWidth: '722px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={() => setShuffle(!shuffle)}
            style={{ background: 'none', border: 'none', color: shuffle ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <FiShuffle size={16} />
            {shuffle && <div style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%', margin: '4px auto 0' }} />}
          </button>
          
          <button onClick={playPrevious} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
            <FiSkipBack size={20} style={{ fill: 'currentcolor' }} />
          </button>
          
          <button
            onClick={togglePlay}
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: '#fff',
              color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none'
            }}
          >
            {isPlaying ? <FiPause size={16} style={{ fill: 'currentcolor' }} /> : <FiPlay size={16} style={{ fill: 'currentcolor', marginLeft: '2px' }} />}
          </button>

          <button onClick={playNext} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
            <FiSkipForward size={20} style={{ fill: 'currentcolor' }} />
          </button>

          <button
            onClick={() => setRepeat(repeat === 'none' ? 'one' : 'none')}
            style={{ background: 'none', border: 'none', color: repeat !== 'none' ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <FiRepeat size={16} />
            {repeat !== 'none' && <div style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%', margin: '4px auto 0' }} />}
          </button>
        </div>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', minWidth: '32px', textAlign: 'right' }}>
            {fmt(currentTime)}
          </span>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="range" min={0} max={duration || 100} value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="spotify-slider"
              style={{ position: 'absolute', zIndex: 2, width: '100%', opacity: 0, cursor: 'pointer', touchAction: 'none' }}
            />
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', position: 'relative' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px' }} />
            </div>
            <input
              type="range" min={0} max={duration || 100} value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="spotify-slider"
              style={{
                position: 'absolute', zIndex: 3, width: '100%',
                background: `linear-gradient(to right, var(--accent) ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%)`
              }}
            />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', minWidth: '32px' }}>
            {fmt(duration)}
          </span>
        </div>
      </div>

      {/* ─── RIGHT: Volume & Extras (30%) ─── */}
      <div style={{ flex: '0 1 30%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsSleepTimerOpen(!isSleepTimerOpen)}
            style={{ 
              background: 'none', border: 'none', 
              color: sleepTimer.active ? 'var(--accent)' : 'var(--text-secondary)',
              position: 'relative'
            }}
          >
            <FiClock size={16} />
            {sleepTimer.active && sleepTimerRemaining > 0 && (
              <span style={{ 
                position: 'absolute', top: '-8px', right: '-12px', background: 'var(--accent)', 
                color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 4px', borderRadius: '8px' 
              }}>
                {Math.ceil(sleepTimerRemaining / 60000)}m
              </span>
            )}
          </button>
          
          {isSleepTimerOpen && (
            <div style={{
              position: 'absolute', bottom: '40px', right: '-110px', background: '#242424',
              borderRadius: '12px', padding: '16px', width: '220px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)', border: '1px solid #3a3a3a',
              zIndex: 300, animation: 'timerFadeIn 0.2s ease', cursor: 'default'
            }}>
              {sleepTimer.active ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Timer Active</p>
                  <p style={{ color: '#b3b3b3', fontSize: '12px', textAlign: 'center' }}>
                    {sleepTimer.stopAfterCurrent ? 'Ends after current song' : `Ends in ${Math.ceil(sleepTimerRemaining / 60000)} minutes`}
                  </p>
                  <button 
                    onClick={() => { cancelSleepTimer(); setIsSleepTimerOpen(false) }}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Cancel Timer
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Sleep Timer</h4>
                    <p style={{ color: '#b3b3b3', fontSize: '12px', margin: '4px 0 0 0' }}>Stop playing after:</p>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[5, 10, 15, 30, 45, 60].map(m => (
                      <button key={m} onClick={() => { startSleepTimer(m); setIsSleepTimerOpen(false) }} style={{
                        background: '#333', border: 'none', color: '#fff', padding: '8px 0',
                        borderRadius: '8px', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s'
                      }} onMouseEnter={e=>e.currentTarget.style.background='var(--accent)'} onMouseLeave={e=>e.currentTarget.style.background='#333'}>
                        {m} min
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #3a3a3a', paddingTop: '12px' }}>
                    <span style={{ color: '#fff', fontSize: '12px', width: '50px' }}>Custom:</span>
                    <input type="number" min="1" max="120" placeholder="1-120" id="custom-timer-input" style={{
                      background: '#1a1a1a', border: '1px solid #535353', color: '#fff', padding: '4px',
                      borderRadius: '4px', width: '60px', fontSize: '12px', outline: 'none'
                    }} />
                    <button onClick={() => {
                      const val = document.getElementById('custom-timer-input').value
                      if (val && !isNaN(val) && val > 0 && val <= 120) {
                        startSleepTimer(Number(val)); setIsSleepTimerOpen(false)
                      }
                    }} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>Set</button>
                  </div>

                  <button onClick={() => { startSleepTimer('endOfSong'); setIsSleepTimerOpen(false) }} style={{
                    background: '#333', border: 'none', color: '#fff', padding: '8px',
                    borderRadius: '8px', fontSize: '13px', cursor: 'pointer', width: '100%', transition: 'background 0.2s'
                  }} onMouseEnter={e=>e.currentTarget.style.background='var(--accent)'} onMouseLeave={e=>e.currentTarget.style.background='#333'}>
                    End of song
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
              });
            } else {
              document.exitFullscreen();
            }
          }}
          className="hover-white"
          style={{ 
            background: 'none', border: 'none', 
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.6,
            transition: 'all 0.2s ease'
          }}
          title="Browser Fullscreen"
        >
          <FiMonitor size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100px' }}>
          <button
            onClick={() => setLocalVolume(localVolume === 0 ? 1 : 0)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
          >
            {localVolume === 0 ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
          </button>
          <input
            type="range" min={0} max={1} step={0.01} value={localVolume}
            onChange={(e) => setLocalVolume(Number(e.target.value))}
            className="spotify-slider"
            style={{ flex: 1, background: `linear-gradient(to right, var(--text-primary) ${localVolume * 100}%, rgba(255,255,255,0.3) ${localVolume * 100}%)` }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes timerFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
