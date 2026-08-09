/**
 * MUSIFY v2.0 — PlayerContext
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Switched from YouTube IFrame API to HTML <audio> with /api/stream
 * - Removed playlist feature entirely
 * - Removed history/recentlyPlayed tracking
 * - Removed searchHistory tracking
 * - Removed Clerk/guest mode dependency
 * - Kept: savedSongs (liked), queue, recommendations, shuffle, repeat
 * - Simplified crossfade to a quick volume ramp
 * - Media Session API for lock screen controls
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { getRecommendations } from '../utils/api.js'
import { crossfadeManager } from '../utils/crossfade.js'

const PlayerContext = createContext(null)
const PlayerTimeContext = createContext(null)

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used within PlayerProvider')
  return context
}

export function usePlayerTime() {
  const context = useContext(PlayerTimeContext)
  if (!context) throw new Error('usePlayerTime must be used within PlayerProvider')
  return context
}

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(-1)

  const [savedSongs, setSavedSongs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedSongs') || '[]')
      return Array.isArray(saved) ? saved : []
    } catch { return [] }
  })

  const [recommendations, setRecommendations] = useState([])
  const [isRecLoading, setIsRecLoading] = useState(false)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('none')
  const [isFullScreenPlayer, setIsFullScreenPlayer] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)
  const [playbackHistory, setPlaybackHistory] = useState([])
  
  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [navHistory, setNavHistory] = useState([window.location.pathname])
  const [navIndex, setNavIndex] = useState(0)

  // Master Playlist Data (Flattened songs for global search)
  const [masterPlaylistData, setMasterPlaylistData] = useState([])
  
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sidebarCollapsed') || 'false')
    } catch { return false }
  })
  const [preFSLeftSidebarState, setPreFSLeftSidebarState] = useState(false)

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isLeftSidebarCollapsed))
  }, [isLeftSidebarCollapsed])

  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]')
      return Array.isArray(saved) ? saved : []
    } catch { return [] }
  })

  const [userPlaylists, setUserPlaylists] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('userPlaylists_v2') || 'null')
      if (saved && Array.isArray(saved)) return saved
    } catch {}
    
    const defaults = [
      { name: 'Liked Songs', color: 'linear-gradient(135deg, #E6B3E6, #C9A3E6)' },
      { name: 'Chill Vibes', color: 'linear-gradient(135deg, #B3E6B3, #A3E6D7)' },
      { name: 'Workout Mix', color: 'linear-gradient(135deg, #FFB3B3, #FFCBA3)' },
      { name: 'Focus 2024', color: 'linear-gradient(135deg, #B3E6E6, #A3C9E6)' },
      { name: 'Roadtrip', color: 'linear-gradient(135deg, #FFE0B3, #FFCBA3)' },
      { name: 'Coding Flow', color: 'linear-gradient(135deg, #C9B3E6, #B3E0E6)' },
      { name: 'Discover Weekly', color: 'linear-gradient(135deg, #FFB3B3, #C9B3E6)' },
      { name: 'Release Radar', color: 'linear-gradient(135deg, #FFB3D9, #FFE0B3)' },
      { name: 'Synthwave', color: 'linear-gradient(135deg, #E6B3E0, #B3B3E6)' },
      { name: 'Lo-Fi Beats', color: 'linear-gradient(135deg, #C9E6B3, #B3E0E6)' },
      { name: 'Acoustic Covers', color: 'linear-gradient(135deg, #FFE6B3, #FFBFB3)' },
      { name: 'Classical', color: 'linear-gradient(135deg, #C9A3E6, #B3E6E6)' }
    ]
    return defaults.map(p => ({ name: p.name, songs: [], color: p.color }))
  })

  // Migration: Update existing playlists to pastel colors
  useEffect(() => {
    const pastelGradients = [
      'linear-gradient(135deg, #E6B3E6, #C9A3E6)',
      'linear-gradient(135deg, #B3E6B3, #A3E6D7)',
      'linear-gradient(135deg, #B3E6E6, #A3C9E6)',
      'linear-gradient(135deg, #FFB3B3, #FFCBA3)',
      'linear-gradient(135deg, #FFE0B3, #FFCBA3)',
      'linear-gradient(135deg, #C9B3E6, #B3E0E6)',
      'linear-gradient(135deg, #FFE0B3, #FFB3D9)'
    ]
    const defaults = [
      { name: 'Liked Songs', color: 'linear-gradient(135deg, #E6B3E6, #C9A3E6)' },
      { name: 'Chill Vibes', color: 'linear-gradient(135deg, #B3E6B3, #A3E6D7)' },
      { name: 'Workout Mix', color: 'linear-gradient(135deg, #FFB3B3, #FFCBA3)' },
      { name: 'Focus 2024', color: 'linear-gradient(135deg, #B3E6E6, #A3C9E6)' },
      { name: 'Roadtrip', color: 'linear-gradient(135deg, #FFE0B3, #FFCBA3)' },
      { name: 'Coding Flow', color: 'linear-gradient(135deg, #C9B3E6, #B3E0E6)' },
      { name: 'Discover Weekly', color: 'linear-gradient(135deg, #FFB3B3, #C9B3E6)' },
      { name: 'Release Radar', color: 'linear-gradient(135deg, #FFB3D9, #FFE0B3)' },
      { name: 'Synthwave', color: 'linear-gradient(135deg, #E6B3E0, #B3B3E6)' },
      { name: 'Lo-Fi Beats', color: 'linear-gradient(135deg, #C9E6B3, #B3E0E6)' },
      { name: 'Acoustic Covers', color: 'linear-gradient(135deg, #FFE6B3, #FFBFB3)' },
      { name: 'Classical', color: 'linear-gradient(135deg, #C9A3E6, #B3E6E6)' }
    ]

    setUserPlaylists(prev => {
      let changed = false
      const next = prev.map(pl => {
        const def = defaults.find(d => d.name === pl.name)
        if (def && pl.color !== def.color) {
          changed = true
          return { ...pl, color: def.color }
        }
        if (pl.color && pl.color.startsWith('hsl')) {
          changed = true
          return { ...pl, color: pastelGradients[Math.floor(Math.random() * pastelGradients.length)] }
        }
        return pl
      })
      return changed ? next : prev
    })
  }, [])

  // Update master data whenever recommendations or trending changes
  useEffect(() => {
    const allSongs = [
      ...(recommendations || []),
      ...(queue || []),
      ...(savedSongs || []),
      ...(recentlyPlayed || []),
      ...(userPlaylists?.flatMap(p => p.songs || []) || [])
    ]
    // Unique by videoId
    const unique = Array.from(new Map(allSongs.map(s => [s.videoId, s])).values())
    setMasterPlaylistData(unique)
  }, [recommendations, queue, savedSongs, recentlyPlayed, userPlaylists])

  // Persist playlists
  useEffect(() => {
    localStorage.setItem('userPlaylists_v2', JSON.stringify(userPlaylists))
  }, [userPlaylists])

  // Equalizer state
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0])
  const eqFiltersRef = useRef(null)

  // Crossfade state
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crossfadeEnabled') || 'true') } catch { return true }
  })
  const [crossfadeDuration, setCrossfadeDuration] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crossfadeDuration') || '6') } catch { return 6 }
  })

  // Sleep Timer state
  const [sleepTimer, setSleepTimer] = useState({
    active: false,
    endTime: null,
    stopAfterCurrent: false
  })
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(null)

  // HTML Audio element — also exposed globally for time polling
  const audioRef = useRef(new Audio())
  if (typeof window !== 'undefined') window.__rhymAudio = audioRef.current
  const timeUpdateRef = useRef(null)
  
  // Invisible preloader
  const preloaderRef = useRef(new Audio())

  // Refs to avoid stale closures
  const queueRef = useRef([])
  const queueIndexRef = useRef(-1)
  const recommendationsRef = useRef([])
  const shuffleRef = useRef(false)
  const repeatRef = useRef('none')
  const sleepTimerRef = useRef(sleepTimer)
  const playNextRef = useRef(null)
  const playSongRef = useRef(null)
  const volumeRef = useRef(volume)
  const retryCountRef = useRef(0)
  const currentSongRef = useRef(null)

  useEffect(() => { currentSongRef.current = currentSong }, [currentSong])

  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { queueIndexRef.current = queueIndex }, [queueIndex])
  useEffect(() => { recommendationsRef.current = recommendations }, [recommendations])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  useEffect(() => { repeatRef.current = repeat }, [repeat])
  useEffect(() => { sleepTimerRef.current = sleepTimer }, [sleepTimer])
  useEffect(() => { volumeRef.current = volume }, [volume])

  // Auto-collapse Left Sidebar on Full Screen
  useEffect(() => {
    if (isFullScreenPlayer) {
      setPreFSLeftSidebarState(isLeftSidebarCollapsed)
      setIsLeftSidebarCollapsed(true)
    } else {
      setIsLeftSidebarCollapsed(preFSLeftSidebarState)
    }
  }, [isFullScreenPlayer])

  useEffect(() => {
    localStorage.setItem('savedSongs', JSON.stringify(savedSongs))
  }, [savedSongs])

  useEffect(() => {
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed))
  }, [recentlyPlayed])

  useEffect(() => {
    localStorage.setItem('crossfadeEnabled', JSON.stringify(crossfadeEnabled))
    crossfadeManager.setEnabled(crossfadeEnabled)
  }, [crossfadeEnabled])

  useEffect(() => {
    localStorage.setItem('crossfadeDuration', JSON.stringify(crossfadeDuration))
    crossfadeManager.setDuration(crossfadeDuration)
  }, [crossfadeDuration])

  // ─── Audio Element Setup ───
  useEffect(() => {
    const audio = audioRef.current
    crossfadeManager.init(audio)
    
    audio.volume = volume / 100
    audio.preload = 'auto'

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)

      // Crossfade logic
      const hasNext = (queueIndexRef.current + 1 < queueRef.current.length) || (recommendationsRef.current.length > 0)
      
      const triggerNext = () => {
        if (queueIndexRef.current + 1 < queueRef.current.length) {
          if (playNextRef.current) playNextRef.current(true) // Pass true for isAutoCrossfade
        } else if (recommendationsRef.current.length > 0) {
          const nextSong = recommendationsRef.current[0]
          setRecommendations(prev => prev.slice(1))
          if (playSongRef.current) playSongRef.current(nextSong, null, 0, true) // Pass true
        }
      }

      crossfadeManager.checkCrossfade(
        audio.currentTime,
        audio.duration || 0,
        volumeRef.current / 100,
        hasNext,
        triggerNext
      )
    }

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0)
    }

    const onPlaying = () => {
      console.log('[Audio] Playing started')
      setIsPlaying(true)
      setIsAudioLoading(false)
    }

    const onWaiting = () => {
      console.log('[Audio] Buffering...')
      setIsAudioLoading(true)
    }

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    const onEnded = () => {
      // Sleep Timer: End of track
      if (sleepTimerRef.current.active && sleepTimerRef.current.stopAfterCurrent) {
        setIsPlaying(false)
        setSleepTimer({ active: false, endTime: null, stopAfterCurrent: false })
        return
      }

      // Repeat one
      if (repeatRef.current === 'one') {
        audio.currentTime = 0
        audio.play().catch(() => {})
        return
      }

      // Shuffle: play from recommendations
      if (shuffleRef.current && recommendationsRef.current.length > 0) {
        const nextSong = recommendationsRef.current[0]
        setRecommendations(prev => prev.slice(1))
        if (playSongRef.current) playSongRef.current(nextSong)
        return
      }

      // Next in queue
      const nextIdx = queueIndexRef.current + 1
      if (nextIdx < queueRef.current.length) {
        if (playNextRef.current) playNextRef.current()
        return
      }

      // Autoplay from recommendations
      if (recommendationsRef.current.length > 0) {
        const nextSong = recommendationsRef.current[0]
        setRecommendations(prev => prev.slice(1))
        if (playSongRef.current) playSongRef.current(nextSong)
      } else {
        setIsPlaying(false)
      }
    }

    const onError = () => {
      console.error('[Audio] Playback error', audio.error)
      if (retryCountRef.current < 2) {
        retryCountRef.current++
        console.log(`[Audio] Retrying... (${retryCountRef.current}/2)`)
        try {
          const url = new URL(audio.src, window.location.origin)
          url.searchParams.set('retry', Date.now())
          audio.oncanplay = null
          audio.src = url.toString()
          audio.load()
          const p = audio.play()
          if (p !== undefined) {
            p.catch(() => {
              audio.oncanplay = () => {
                audio.oncanplay = null
                audio.play().catch(() => {})
              }
            })
          }
        } catch(e) {
          console.error('Retry failed', e)
        }
      } else {
        toast.error('Playback error. Skipping...')
        retryCountRef.current = 0
        setTimeout(() => {
          if (playNextRef.current) playNextRef.current()
        }, 1500)
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [])

  // ─── Web Audio API Initialization ───
  const initWebAudio = useCallback(() => {
    if (eqFiltersRef.current || !audioRef.current) return
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const actx = new AudioContext()
      
      const source = actx.createMediaElementSource(audioRef.current)
      
      const freqs = [60, 250, 1000, 4000, 16000]
      const filters = freqs.map((f, i) => {
        const filter = actx.createBiquadFilter()
        filter.type = 'peaking'
        filter.frequency.value = f
        filter.Q.value = 1
        filter.gain.value = eqBands[i]
        return filter
      })

      source.connect(filters[0])
      for(let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i+1])
      }
      filters[filters.length - 1].connect(actx.destination)

      eqFiltersRef.current = filters
    } catch (err) {
      console.warn('Web Audio API setup failed', err)
    }
  }, [eqBands])

  const onEQChange = useCallback((index, value) => {
    setEqBands(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
    if (eqFiltersRef.current) {
      eqFiltersRef.current[index].gain.value = value
    }
  }, [])

  // Update volume on audio element
  useEffect(() => {
    audioRef.current.volume = volume / 100
  }, [volume])

  // ─── Sleep Timer Interval ───
  useEffect(() => {
    if (!sleepTimer.active || sleepTimer.stopAfterCurrent) return

    const interval = setInterval(() => {
      if (!sleepTimer.endTime) return
      
      const remaining = sleepTimer.endTime - Date.now()
      if (remaining <= 0) {
        audioRef.current.pause()
        setIsPlaying(false)
        setSleepTimer({ active: false, endTime: null, stopAfterCurrent: false })
        setSleepTimerRemaining(null)
        toast('Sleep timer ended. Playback paused.', { duration: 5000 })
      } else {
        setSleepTimerRemaining(remaining)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [sleepTimer])

  // ─── Media Session API ───
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist || currentSong.channelTitle,
        album: 'Rhym',
        artwork: [
          { src: currentSong.thumbnail, sizes: '320x180', type: 'image/jpeg' }
        ]
      })

      navigator.mediaSession.setActionHandler('play', () => togglePlay())
      navigator.mediaSession.setActionHandler('pause', () => togglePlay())
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious())
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext())

      if (duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1,
            position: Math.min(currentTime, duration)
          })
        } catch (e) { /* ignore */ }
      }
    }
  }, [currentSong, duration, currentTime])

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }
  }, [isPlaying])

  // ─── Fetch Recommendations ───
  const fetchRecommendations = useCallback(async (song) => {
    if (!song) return
    setIsRecLoading(true)
    try {
      const recs = await getRecommendations(song.videoId, song.artist, song.title)
      setRecommendations(recs)
    } catch (e) {
      console.error('Recs error:', e)
    }
    setIsRecLoading(false)
  }, [])

  useEffect(() => {
    if (currentSong) fetchRecommendations(currentSong)
  }, [currentSong, fetchRecommendations])

  // ─── Play Song ───
  const playSong = useCallback((song, songQueue = null, index = 0, isAutoCrossfade = false, isHistoryNav = false) => {
    if (!song) return
    const audio = audioRef.current

    // History Tracking: Push previous song to stack if not moving backward
    if (!isHistoryNav && !isAutoCrossfade && currentSongRef.current && song.videoId !== currentSongRef.current.videoId) {
      setPlaybackHistory(prev => [currentSongRef.current, ...prev].slice(0, 50))
    }

    audio.crossOrigin = 'anonymous'
    setCurrentSong(song)
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(s => s.videoId !== song.videoId)
      return [song, ...filtered].slice(0, 10) // keep last 10
    })
    initWebAudio()
    setCurrentTime(0)
    setDuration(0)
    setIsAudioLoading(true)
    setIsPlaying(true)
    retryCountRef.current = 0

    if (songQueue) {
      setQueue(songQueue)
      setQueueIndex(index)
    }

    // Clean up any previous canplay handler
    audio.oncanplay = null

    console.log(`[Audio] Loading: ${song.title}`)
    // Add cache-buster to avoid stale browser cache
    audio.src = `/api/stream?id=${song.videoId}&t=${Date.now()}`
    audio.load()

    // Try playing immediately
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(err => {
      })
    }
  }, [])

  // ─── Preload Next Track ───
  useEffect(() => {
    const preloader = preloaderRef.current
    preloader.preload = 'auto'
    preloader.volume = 0
    
    let nextSongId = null
    if (queue.length > 0 && queueIndex + 1 < queue.length) {
      nextSongId = queue[queueIndex + 1].videoId
    } else if (recommendations.length > 0) {
      nextSongId = recommendations[0].videoId
    }

    if (nextSongId) {
      console.log(`[Audio] Preloading next track ID: ${nextSongId}`)
      preloader.src = `/api/stream?id=${nextSongId}`
      preloader.load()
    }
  }, [queue, queueIndex, recommendations])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio.src) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }, [isPlaying])

  const seekTo = useCallback((time) => {
    const audio = audioRef.current
    audio.currentTime = time
    setCurrentTime(time)
    
    // Always force play when seeking to fix the skip bug
    if (audio.src) {
      audio.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [])

  const setPlayerVolume = useCallback((vol) => {
    setVolume(vol)
    audioRef.current.volume = vol / 100
  }, [])

  const playNext = useCallback((isAutoCrossfade = false) => {
    if (queue.length === 0) return
    const nextIndex = queueIndex + 1
    if (nextIndex < queue.length) {
      setQueueIndex(nextIndex)
      playSong(queue[nextIndex], queue, nextIndex, isAutoCrossfade)
    }
  }, [queue, queueIndex, playSong])

  useEffect(() => { playNextRef.current = playNext }, [playNext])
  useEffect(() => { playSongRef.current = playSong }, [playSong])

  const playPrevious = useCallback(() => {
    const audio = audioRef.current
    
    // If we've played more than 3 seconds, just restart the song
    if (audio.currentTime > 3) {
      audio.currentTime = 0
      audio.play().catch(() => {})
      return
    }

    // Try to pop from history stack first
    if (playbackHistory.length > 0) {
      const prevSong = playbackHistory[0]
      setPlaybackHistory(prev => prev.slice(1))
      
      // When going back from history, we need to see if it was in the queue
      const idxInQueue = queueRef.current.findIndex(s => s.videoId === prevSong.videoId)
      if (idxInQueue !== -1) {
        setQueueIndex(idxInQueue)
      }
      
      // Play it with isHistoryNav = true to avoid pushing the current song back to history
      playSong(prevSong, null, 0, false, true)
      return
    }

    // Fallback to queue index if history is empty
    if (queueRef.current.length > 0) {
      const prevIndex = queueIndexRef.current - 1
      if (prevIndex >= 0) {
        setQueueIndex(prevIndex)
        playSong(queueRef.current[prevIndex])
      }
    }
  }, [playbackHistory, playSong])

  const addToQueue = useCallback((song, atTop = false) => {
    setQueue(prev => {
      if (atTop) {
        const next = [...prev]
        next.splice(queueIndexRef.current + 1, 0, song)
        return next
      }
      return [...prev, song]
    })
    toast.success(atTop ? 'Playing next' : 'Added to queue')
  }, [])

  const removeFromQueue = useCallback((songId) => {
    setQueue(prev => prev.filter(s => s.videoId !== songId))
    toast.success('Removed from queue')
  }, [])

  const reorderQueue = useCallback((newQueue) => {
    setQueue(newQueue)
  }, [])

  // ─── Sleep Timer Actions ───
  const startSleepTimer = useCallback((minutes) => {
    if (minutes === 'track') {
      setSleepTimer({ active: true, endTime: null, stopAfterCurrent: true })
      setSleepTimerRemaining(null)
      toast.success('Timer set for end of track')
    } else {
      const endTime = Date.now() + minutes * 60000
      setSleepTimer({ active: true, endTime, stopAfterCurrent: false })
      setSleepTimerRemaining(minutes * 60000)
      toast.success(`Timer set for ${minutes} minutes`)
    }
  }, [])

  const cancelSleepTimer = useCallback(() => {
    setSleepTimer({ active: false, endTime: null, stopAfterCurrent: false })
    setSleepTimerRemaining(null)
    toast.success('Timer cancelled')
  }, [])

  // ─── Saved (Liked) Songs ───
  const toggleSavedSong = useCallback((song) => {
    setSavedSongs(prev => {
      const exists = prev.some(s => s.videoId === song.videoId)
      if (exists) {
        toast.success('Removed from liked')
        return prev.filter(s => s.videoId !== song.videoId)
      } else {
        toast.success('Added to liked')
        return [song, ...prev]
      }
    })
  }, [])

  const isSongSaved = useCallback((videoId) => {
    return savedSongs.some(s => s.videoId === videoId)
  }, [savedSongs])

  const addSongToPlaylist = useCallback((playlistName, song) => {
    setUserPlaylists(prev => prev.map(pl => {
      if (pl.name === playlistName) {
        const exists = pl.songs.some(s => s.videoId === song.videoId)
        if (exists) return pl
        return { ...pl, songs: [song, ...pl.songs] }
      }
      return pl
    }))
    toast.success(`Added to ${playlistName}`)
  }, [])

  const removeSongFromPlaylist = useCallback((playlistName, songId) => {
    setUserPlaylists(prev => prev.map(pl => {
      if (pl.name === playlistName) {
        return { ...pl, songs: pl.songs.filter(s => s.videoId !== songId) }
      }
      return pl
    }))
    toast.success(`Removed from ${playlistName}`)
  }, [])

  const deletePlaylist = useCallback((playlistName) => {
    setUserPlaylists(prev => prev.filter(pl => pl.name !== playlistName))
    toast.success(`Playlist deleted`)
  }, [])

  const updatePlaylist = useCallback((oldName, newData) => {
    setUserPlaylists(prev => prev.map(pl => {
      if (pl.name === oldName) {
        return { ...pl, ...newData }
      }
      return pl
    }))
    toast.success(`Playlist updated`)
  }, [])

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.code === 'ArrowRight' && e.ctrlKey) { e.preventDefault(); playNext() }
      if (e.code === 'ArrowLeft' && e.ctrlKey) { e.preventDefault(); playPrevious() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, playNext, playPrevious])

  const timeValue = useMemo(() => ({
    currentTime,
    duration
  }), [currentTime, duration])

  const value = useMemo(() => ({
    currentSong, isPlaying, volume, queue, queueIndex,
    savedSongs, recommendations, isRecLoading,
    recentlyPlayed,
    isSuggestionsOpen, setIsSuggestionsOpen,
    isFullScreenPlayer, setIsFullScreenPlayer,
    isRightSidebarOpen, setIsRightSidebarOpen,
    isLeftSidebarCollapsed, setIsLeftSidebarCollapsed,
    preFSLeftSidebarState, setPreFSLeftSidebarState,
    searchQuery, setSearchQuery,
    searchResults, setSearchResults,
    isSearchLoading, setIsSearchLoading,
    navHistory, setNavHistory,
    navIndex, setNavIndex,
    masterPlaylistData,
    userPlaylists, setUserPlaylists,
    isSearchOpen, setIsSearchOpen, isAudioLoading,
    sleepTimer, sleepTimerRemaining, startSleepTimer, cancelSleepTimer,
    crossfadeEnabled, setCrossfadeEnabled,
    crossfadeDuration, setCrossfadeDuration,
    playSong, togglePlay, seekTo, setPlayerVolume,
    playNext, playPrevious, addToQueue, removeFromQueue, reorderQueue,
    toggleSavedSong, isSongSaved,
    shuffle, setShuffle, repeat, setRepeat,
    eqBands, onEQChange,
    addSongToPlaylist, removeSongFromPlaylist, deletePlaylist, updatePlaylist
  }), [
    currentSong, isPlaying, volume, queue, queueIndex,
    savedSongs, recommendations, isRecLoading, recentlyPlayed, isSuggestionsOpen,
    isFullScreenPlayer, isSearchOpen, isAudioLoading,
    isRightSidebarOpen, isLeftSidebarCollapsed, preFSLeftSidebarState, userPlaylists,
    searchQuery, searchResults, isSearchLoading, navHistory, navIndex, masterPlaylistData,
    playSong, togglePlay, seekTo, setPlayerVolume,
    playNext, playPrevious, addToQueue, removeFromQueue, reorderQueue,
    toggleSavedSong, isSongSaved,
    shuffle, repeat, sleepTimer, sleepTimerRemaining,
    crossfadeEnabled, crossfadeDuration, eqBands, onEQChange,
    addSongToPlaylist, removeSongFromPlaylist, deletePlaylist, updatePlaylist
  ])

  return (
    <PlayerTimeContext.Provider value={timeValue}>
      <PlayerContext.Provider value={value}>
        {children}
      </PlayerContext.Provider>
    </PlayerTimeContext.Provider>
  )
}
