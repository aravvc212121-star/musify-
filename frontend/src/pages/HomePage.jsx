import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiPlay, FiPlus, FiChevronLeft, FiChevronRight, FiCircle, FiUser, FiCheck, FiPause, FiMusic } from 'react-icons/fi'
import { useIsMobile } from '../hooks/useIsMobile.js'
import BottomSheet from '../components/ui/BottomSheet.jsx'
import { useBlend } from '../context/BlendContext.jsx'
import { searchSongs, getTrending } from '../utils/api.js'
import Footer from '../components/ui/Footer.jsx'

/* ─── Greeting based on time ─── */
// Keeping for future use
// eslint-disable-next-line no-unused-vars
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/* ─── Top Artists Data ─── */
const TOP_ARTISTS = [
  { name: 'Seedhe Maut', img: 'https://cdn-images.dzcdn.net/images/artist/dbd4cd0d5c2e3f1000b742542d3d7a07/500x500-000000-80-0-0.jpg' },
  { name: 'Karan Aujla', img: 'https://cdn-images.dzcdn.net/images/artist/a91a1d5ea91e85e4f0966569b50e8d6a/500x500-000000-80-0-0.jpg' },
  { name: 'The Weeknd', img: 'https://cdn-images.dzcdn.net/images/artist/581693b4724a7fcfa754455101e13a44/500x500-000000-80-0-0.jpg' },
  { name: 'Dua Lipa', img: 'https://cdn-images.dzcdn.net/images/artist/877872aaf75694f11d53c318700ab2b5/500x500-000000-80-0-0.jpg' },
  { name: 'Taylor Swift', img: 'https://cdn-images.dzcdn.net/images/artist/e528e270424103b527f8a27ac625563b/500x500-000000-80-0-0.jpg' },
  { name: 'Arijit Singh', img: 'https://cdn-images.dzcdn.net/images/artist/ac5350cff290edd5b69fa584b8b1bd4f/500x500-000000-80-0-0.jpg' },
  { name: 'Diljit Dosanjh', img: 'https://cdn-images.dzcdn.net/images/artist/79b85e695e0ca6529e56bf3b628e92bd/500x500-000000-80-0-0.jpg' },
  { name: 'Honey Singh', img: 'https://cdn-images.dzcdn.net/images/artist/64af370d73cfbc33006b8adcb2508bce/500x500-000000-80-0-0.jpg' },
  { name: 'Drake', img: 'https://cdn-images.dzcdn.net/images/artist/70223888f501f4b843142e071abda364/500x500-000000-80-0-0.jpg' },
  { name: 'Post Malone', img: 'https://cdn-images.dzcdn.net/images/artist/a5a8cca44e7eab2db7d44e039bed2574/500x500-000000-80-0-0.jpg' },
  { name: 'Lata Mangeshkar', img: 'https://cdn-images.dzcdn.net/images/artist/837d46f90f541736e07817f463317c80/500x500-000000-80-0-0.jpg' },
]

const MORE_ARTISTS = [
  ...TOP_ARTISTS,
  { name: 'Kishore Kumar', img: 'https://cdn-images.dzcdn.net/images/artist/dbd4cd0d5c2e3f1000b742542d3d7a07/500x500-000000-80-0-0.jpg' },
  { name: 'Ed Sheeran', img: 'https://cdn-images.dzcdn.net/images/artist/a91a1d5ea91e85e4f0966569b50e8d6a/500x500-000000-80-0-0.jpg' },
  { name: 'Justin Bieber', img: 'https://cdn-images.dzcdn.net/images/artist/581693b4724a7fcfa754455101e13a44/500x500-000000-80-0-0.jpg' },
  { name: 'Eminem', img: 'https://cdn-images.dzcdn.net/images/artist/877872aaf75694f11d53c318700ab2b5/500x500-000000-80-0-0.jpg' },
  { name: 'Badshah', img: 'https://cdn-images.dzcdn.net/images/artist/e528e270424103b527f8a27ac625563b/500x500-000000-80-0-0.jpg' },
  { name: 'Neha Kakkar', img: 'https://cdn-images.dzcdn.net/images/artist/ac5350cff290edd5b69fa584b8b1bd4f/500x500-000000-80-0-0.jpg' },
  { name: 'Armaan Malik', img: 'https://cdn-images.dzcdn.net/images/artist/79b85e695e0ca6529e56bf3b628e92bd/500x500-000000-80-0-0.jpg' },
  { name: 'Darshan Raval', img: 'https://cdn-images.dzcdn.net/images/artist/64af370d73cfbc33006b8adcb2508bce/500x500-000000-80-0-0.jpg' },
  { name: 'Kr$na', img: 'https://cdn-images.dzcdn.net/images/artist/70223888f501f4b843142e071abda364/500x500-000000-80-0-0.jpg' },
  { name: 'MC Stan', img: 'https://cdn-images.dzcdn.net/images/artist/a5a8cca44e7eab2db7d44e039bed2574/500x500-000000-80-0-0.jpg' },
  { name: 'Divine', img: 'https://cdn-images.dzcdn.net/images/artist/837d46f90f541736e07817f463317c80/500x500-000000-80-0-0.jpg' },
  { name: 'Naezy', img: 'https://cdn-images.dzcdn.net/images/artist/dbd4cd0d5c2e3f1000b742542d3d7a07/500x500-000000-80-0-0.jpg' },
  { name: 'Shreya Ghoshal', img: 'https://cdn-images.dzcdn.net/images/artist/a91a1d5ea91e85e4f0966569b50e8d6a/500x500-000000-80-0-0.jpg' },
  { name: 'Sonu Nigam', img: 'https://cdn-images.dzcdn.net/images/artist/581693b4724a7fcfa754455101e13a44/500x500-000000-80-0-0.jpg' },
  { name: 'Raftaar', img: 'https://cdn-images.dzcdn.net/images/artist/dbd4cd0d5c2e3f1000b742542d3d7a07/500x500-000000-80-0-0.jpg' },
  { name: 'King', img: 'https://cdn-images.dzcdn.net/images/artist/a91a1d5ea91e85e4f0966569b50e8d6a/500x500-000000-80-0-0.jpg' },
  { name: 'Guru Randhawa', img: 'https://cdn-images.dzcdn.net/images/artist/581693b4724a7fcfa754455101e13a44/500x500-000000-80-0-0.jpg' },
  { name: 'Mika Singh', img: 'https://cdn-images.dzcdn.net/images/artist/877872aaf75694f11d53c318700ab2b5/500x500-000000-80-0-0.jpg' },
  { name: 'Jubin Nautiyal', img: 'https://cdn-images.dzcdn.net/images/artist/e528e270424103b527f8a27ac625563b/500x500-000000-80-0-0.jpg' },
  { name: 'Anirudh', img: 'https://cdn-images.dzcdn.net/images/artist/ac5350cff290edd5b69fa584b8b1bd4f/500x500-000000-80-0-0.jpg' },
  { name: 'A.R. Rahman', img: 'https://cdn-images.dzcdn.net/images/artist/79b85e695e0ca6529e56bf3b628e92bd/500x500-000000-80-0-0.jpg' },
  { name: 'Billie Eilish', img: 'https://cdn-images.dzcdn.net/images/artist/64af370d73cfbc33006b8adcb2508bce/500x500-000000-80-0-0.jpg' },
  { name: 'Olivia Rodrigo', img: 'https://cdn-images.dzcdn.net/images/artist/70223888f501f4b843142e071abda364/500x500-000000-80-0-0.jpg' },
]

/* ─── Section Header ─── */
function SectionHeader({ title, subtitle, poster, scrollRef, isMobile, rightElement }) {
  const scroll = (dir) => {
    if (scrollRef.current) {
      const amt = dir === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: amt, behavior: 'smooth' });
    }
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: isMobile ? '10px' : '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
        {poster && (
          <img 
            src={poster} 
            alt="" 
            loading="lazy"
            decoding="async"
            style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              borderRadius: '4px',
              objectFit: 'cover',
              boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
              flexShrink: 0
            }} 
          />
        )}
        <div>
          {subtitle && (
            <div style={{ 
              fontSize: isMobile ? '11px' : '13px', 
              color: '#b3b3b3', 
              fontWeight: 500,
              lineHeight: 1.2,
              marginBottom: '2px'
            }}>
              {subtitle}
            </div>
          )}
          <h2 style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
            {title}
          </h2>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {rightElement}
        {!isMobile && scrollRef && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => scroll('left')} 
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <FiChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scroll('right')} 
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Play Button (Hover) ─── */
function HoverPlayButton({ style }) {
  return (
    <div className="hover-play-btn" style={{
      position: 'absolute',
      width: '48px', height: '48px',
      borderRadius: '50%',
      background: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      opacity: 0,
      transform: 'translateY(8px)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      zIndex: 10,
      ...style
    }}>
      <FiPlay size={20} style={{ fill: '#ffffff', color: '#ffffff', marginLeft: '4px' }} />
    </div>
  )
}

/* ─── Vertical Card (Responsive) ─── */
function VerticalCard({ song, isArtist, isNewRelease, isRecommended, onClick, isMobile }) {
  const cardW = isMobile ? 125 : 168
  const cardH = isMobile ? 160 : 200
  const imgSize = isMobile ? 125 : 168
  const pad = 0

  return (
    <div 
      onClick={onClick} 
      onContextMenu={(e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-context-menu', {
          detail: { x: e.clientX, y: e.clientY, song, type: 'song' }
        }));
      }}
      style={{
      width: `${cardW}px`, height: `${cardH}px`,
      padding: `${pad}px`,
      borderRadius: isMobile ? '8px' : '12px',
      cursor: 'pointer',
      position: 'relative',
      flexShrink: 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
    className="vertical-card"
    >
      <div style={{ position: 'relative', width: `${imgSize}px`, height: `${imgSize}px`, marginBottom: isMobile ? '8px' : '16px', background: 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)', borderRadius: isArtist ? '50%' : '10px', aspectRatio: '1/1' }}>
        <img
          src={song.thumbnail || song.img} alt={song.title || song.name}
          width={imgSize}
          height={imgSize}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: isArtist ? '50%' : '10px' }}
        />
        {isNewRelease && (
          <div style={{
            position: 'absolute', top: isMobile ? '4px' : '8px', left: isMobile ? '4px' : '8px',
            background: 'var(--accent)', color: '#fff',
            fontSize: isMobile ? '7px' : '8px', fontWeight: 700, padding: '2px 6px',
            borderRadius: '500px', zIndex: 2
          }}>
            NEW
          </div>
        )}
        {!isMobile && <HoverPlayButton style={{ bottom: '8px', right: '8px' }} />}
      </div>
      <div style={{ width: '100%', textAlign: isArtist ? 'center' : 'left' }}>
        <p className="truncate" style={{ fontSize: isArtist ? (isMobile ? '13px' : '16px') : (isMobile ? '11px' : '14px'), fontWeight: 700, color: '#ffffff', marginBottom: isArtist ? '0' : '2px', marginTop: isArtist ? '6px' : '0' }}>
          {song.title || song.name}
        </p>
        {!isArtist && (
          <p className="truncate" style={{ fontSize: isMobile ? '10px' : '14px', color: isRecommended ? 'var(--accent-hover)' : '#b3b3b3' }}>
            {isRecommended ? song.genre || 'Electronic' : song.artist}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Skeleton Row ─── */
function SkeletonRow() {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div className="skeleton" style={{ width: '140px', height: '24px', marginBottom: '16px' }} />
      <div className="h-scroll" style={{ paddingBottom: 0 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ width: '180px', height: '220px', borderRadius: '12px', flexShrink: 0 }} />
        ))}
      </div>
    </div>
  )
}

/* ─── Persistent Home Cache (Prevents Top Radios & sections from reloading repeatedly) ─── */
const HOME_CACHE_KEY = 'rhym_home_sections_cache_v2'

function getInitialHomeCache() {
  try {
    const raw = localStorage.getItem(HOME_CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Date.now() - (parsed.timestamp || 0) < 4 * 60 * 60 * 1000) {
        return parsed.data || {}
      }
    }
  } catch {}
  return {}
}

let memoryHomeCache = getInitialHomeCache()

/* ═══ HOME PAGE ═══ */
export default function HomePage() {
  const navigate = useNavigate()
  const { playSong, currentSong, isPlaying, togglePlay, userPlaylists, recentlyPlayed, savedArtists, toggleSavedArtist, isArtistSaved } = usePlayer()
  const { room, roomHistory, leaveRoom, isChatOpen, openChat } = useBlend()
  const [trending, setTrending] = useState(() => memoryHomeCache.trending || [])
  const [madeForYou, setMadeForYou] = useState(() => memoryHomeCache.madeForYou || [])
  const [popularAlbums, setPopularAlbums] = useState(() => memoryHomeCache.popularAlbums || [])
  const [recommendations, setRecommendations] = useState(() => memoryHomeCache.recommendations || [])
  const [loading, setLoading] = useState(() => !(memoryHomeCache.madeForYou && memoryHomeCache.madeForYou.length > 0))
  const [dailySongs, setDailySongs] = useState([])
  const [activePosterIndex, setActivePosterIndex] = useState(0)
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false)

  const recentRef = useRef(null)
  const artistsRef = useRef(null)
  const listenRef = useRef(null)
  const newRef = useRef(null)
  const recomRef = useRef(null)
  const popularRef = useRef(null)
  const rapRef = useRef(null)
  const hollywoodRef = useRef(null)
  const bollywoodRef = useRef(null)
  const hindiRapRef = useRef(null)
  const postersScrollRef = useRef(null)

  const isMobile = useIsMobile()
  // Track whether the page has been scrolled past the collapse threshold
  const [isScrolled, setIsScrolled] = useState(false)

  const headerRef = useRef(null)

  // Collapse the "Rhym" wordmark into the logo when the user scrolls down
  // AND pin the header to the top during iOS overscroll bounce
  useEffect(() => {
    // The scrollable container is .center-panel (the nearest scrolling ancestor)
    const panel = document.querySelector('.center-panel')
    if (!panel) return
    let rafId = null
    const THRESHOLD = 20 // px before text starts collapsing
    const onScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const st = panel.scrollTop
        setIsScrolled(st > THRESHOLD)

        if (st < 0 && headerRef.current) {
          headerRef.current.style.transform = `translateY(${st}px)`
        } else if (headerRef.current) {
          headerRef.current.style.transform = `translateY(0px)`
        }
      })
    }
    panel.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      panel.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // Paint the scrollable panel black so there's no grey gap below content
  useEffect(() => {
    const panel = document.querySelector('.center-panel')
    if (!panel) return
    const prev = panel.style.background
    panel.style.background = ''
    return () => { panel.style.background = prev }
  }, [])

  // Get or generate daily songs (4 songs from DIFFERENT popular artists) based on current date
  useEffect(() => {
    const getDailySongs = async () => {
      try {
        const today = new Date().toDateString()
        
        // AGGRESSIVE CACHE CLEAR - Always check on mount
        const stored = localStorage.getItem('dailySongs')
        let shouldFetch = true
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            // Only use cache if it has version 5, is from today, and has valid data
            if (parsed.version === 5 && parsed.date === today && parsed.songs && parsed.songs.length >= 4) {
              console.log('[Daily Carousel] ✓ Using cached songs from multiple artists')
              setDailySongs(parsed.songs)
              shouldFetch = false
            } else {
              console.log('[Daily Carousel] ✗ Cache invalid or old version, clearing')
              localStorage.removeItem('dailySongs')
            }
          } catch {
            console.log('[Daily Carousel] ✗ Cache parse error, clearing')
            localStorage.removeItem('dailySongs')
          }
        } else {
          console.log('[Daily Carousel] ○ No cache found, fetching fresh')
        }
        
        if (!shouldFetch) return

        // Fetch ONE song from each of these 4 artists (Karan Aujla moved from last to first)
        const artists = [
          { name: 'Karan Aujla', query: 'Karan Aujla' },
          { name: 'Travis Scott', query: 'Travis Scott' },
          { name: 'Dua Lipa', query: 'Dua Lipa' },
          { name: 'Seedhe Maut', query: 'Seedhe Maut' }
        ]
        
        console.log('[Daily Carousel] 🎤 Fetching 1 song from each artist...')
        
        // Fetch songs from all 4 artists in parallel
        const songPromises = artists.map(artist => 
          searchSongs(artist.query).then(results => ({
            artist: artist.name,
            song: results && results.length > 0 ? results[0] : null
          }))
        )
        
        const artistResults = await Promise.all(songPromises)
        
        // Extract songs and filter out any nulls
        const songs = artistResults
          .filter(result => result.song !== null)
          .map(result => {
            console.log(`  ✓ ${result.artist}: ${result.song.title}`)
            return result.song
          })
        
        if (songs.length >= 4) {
          console.log(`[Daily Carousel] ✓ Loaded ${songs.length} songs from different artists`)
          
          setDailySongs(songs)
          localStorage.setItem('dailySongs', JSON.stringify({ 
            date: today, 
            songs, 
            version: 5, // Version 5 with last item moved to first
            timestamp: Date.now()
          }))
        } else {
          console.warn(`[Daily Carousel] ⚠ Only got ${songs.length} songs, need 4`)
          // Fallback to trending with last item moved to first
          const trending = await getTrending()
          if (trending && trending.length >= 4) {
            console.log('[Daily Carousel] ↻ Using trending fallback')
            const tSongs = trending.slice(0, 4)
            setDailySongs([tSongs[tSongs.length - 1], ...tSongs.slice(0, -1)])
          }
        }
      } catch (e) {
        console.error('[Daily Carousel] ✗ Error:', e)
        // Try trending on error
        try {
          const trending = await getTrending()
          if (trending && trending.length >= 4) {
            console.log('[Daily Carousel] ↻ Error recovery: using trending')
            const tSongs = trending.slice(0, 4)
            setDailySongs([tSongs[tSongs.length - 1], ...tSongs.slice(0, -1)])
          }
        } catch (err) {
          console.error('[Daily Carousel] ✗ All fallbacks failed:', err)
        }
      }
    }
    getDailySongs()
  }, [])

  // Track scroll position for poster dots — rAF-debounced to avoid layout thrashing
  useEffect(() => {
    const scrollContainer = postersScrollRef.current
    if (!scrollContainer || dailySongs.length <= 1) return

    // Cache offsetWidth outside the scroll handler to avoid forced reflow per frame
    let cachedItemWidth = scrollContainer.querySelector('.aesthetic-poster')?.offsetWidth || 0
    const gap = isMobile ? 12 : 20
    let rafId = null

    const handleScroll = () => {
      if (rafId) return // Already scheduled
      rafId = requestAnimationFrame(() => {
        rafId = null
        const scrollLeft = scrollContainer.scrollLeft
        // Re-measure only if cached width is 0 (e.g. first load)
        if (cachedItemWidth === 0) {
          cachedItemWidth = scrollContainer.querySelector('.aesthetic-poster')?.offsetWidth || 0
        }
        const totalWidth = cachedItemWidth + gap
        if (totalWidth > 0) {
          const index = Math.round(scrollLeft / totalWidth)
          setActivePosterIndex(Math.min(Math.max(index, 0), dailySongs.length - 1))
        }
      })
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [dailySongs.length, isMobile])

  useEffect(() => {
    // If we already have fresh data in memory/cache (within 30 min), do not re-fetch on every route visit
    const hasData = memoryHomeCache.madeForYou && memoryHomeCache.madeForYou.length > 0
    if (hasData && memoryHomeCache.timestamp && Date.now() - memoryHomeCache.timestamp < 30 * 60 * 1000) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const [trendData, mfyData, albumData, recomData] = await Promise.all([
          getTrending(),
          searchSongs('top hindi songs'),
          searchSongs('popular pop albums'),
          searchSongs('trending english songs')
        ])
        if (trendData?.length) setTrending(trendData)
        if (mfyData?.length) setMadeForYou(mfyData)
        if (albumData?.length) setPopularAlbums(albumData)
        if (recomData?.length) setRecommendations(recomData)

        const newData = {
          trending: trendData || [],
          madeForYou: mfyData || [],
          popularAlbums: albumData || [],
          recommendations: recomData || []
        }
        memoryHomeCache = { ...newData, timestamp: Date.now() }
        try {
          localStorage.setItem(HOME_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: newData
          }))
        } catch {}
      } catch (e) {
        console.error('Home load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handlePlaySong = (song, list, idx) => {
    if (!song.videoId) return // Prevent playing raw artist stubs
    playSong(song, list, idx)
  }

  const handleArtistClick = (name) => {
    navigate(`/artist/${encodeURIComponent(name)}`)
  }

  // 10 tracks for Top Radios
  const recentTracks = madeForYou.slice(0, 10)

  return (
    <div style={{ 
      position: 'relative', 
      padding: isMobile ? '0 8px 8px' : '0 32px 12px', 
    }}>
      {/* ─── Ambient Aurora Background Effect ─── */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          contain: 'strict',
          willChange: 'auto',
        }}>
          {/* Aurora Orbs — GPU-promoted for zero jitter */}
          <div className="aurora-orb aurora-orb-1" style={{
            position: 'absolute',
            width: isMobile ? '300px' : '600px',
            height: isMobile ? '300px' : '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 178, 172, 0.15) 0%, rgba(56, 178, 172, 0.05) 40%, transparent 70%)',
            filter: 'blur(60px)',
            top: '10%',
            left: '15%',
            animation: 'aurora-float-1 20s ease-in-out infinite',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }} />
          
          <div className="aurora-orb aurora-orb-2" style={{
            position: 'absolute',
            width: isMobile ? '250px' : '500px',
            height: isMobile ? '250px' : '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(168, 85, 247, 0.04) 40%, transparent 70%)',
            filter: 'blur(50px)',
            top: '40%',
            right: '10%',
            animation: 'aurora-float-2 25s ease-in-out infinite reverse',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }} />
          
          <div className="aurora-orb aurora-orb-3" style={{
            position: 'absolute',
            width: isMobile ? '280px' : '550px',
            height: isMobile ? '280px' : '550px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 94, 91, 0.1) 0%, rgba(255, 94, 91, 0.03) 40%, transparent 70%)',
            filter: 'blur(55px)',
            bottom: '15%',
            left: '10%',
            animation: 'aurora-float-3 22s ease-in-out infinite',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }} />
          
          <div className="aurora-orb aurora-orb-4" style={{
            position: 'absolute',
            width: isMobile ? '200px' : '400px',
            height: isMobile ? '200px' : '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29, 185, 84, 0.08) 0%, rgba(29, 185, 84, 0.02) 40%, transparent 70%)',
            filter: 'blur(45px)',
            top: '70%',
            right: '25%',
            animation: 'aurora-float-4 18s ease-in-out infinite',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }} />
        </div>
      )}
      
      {/* Content Container with relative positioning */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ─── Home Header: Rhym Logo + Brand Text + Profile Avatar ─── */}
        <header ref={headerRef} style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: isMobile ? '0 -8px 10px' : '0 -32px 14px',
          padding: isMobile 
            ? 'calc(6px + env(safe-area-inset-top, 0px)) 12px 6px' 
            : '10px 32px',
          userSelect: 'none',
          background: 'transparent',
        }}>
          {/* Left: Brand Lockup */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
            <svg
              width={isMobile ? 24 : 28}
              height={isMobile ? 24 : 28}
              viewBox="0 0 512 512"
              style={{
                borderRadius: '6.5px',
                flexShrink: 0,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)',
                opacity: isScrolled ? 0 : 1,
                pointerEvents: isScrolled ? 'none' : 'auto',
                transition: 'opacity 0.25s ease',
              }}
            >
              <defs>
                <linearGradient id="hdr-cyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38b2ac"/>
                  <stop offset="100%" stopColor="#38b2ac"/>
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="100" ry="100" fill="#0a0a0a"/>
              <path d="M160 400 L160 140 Q160 110 185 110 L280 110 Q340 110 340 170 Q340 230 280 230 L220 230"
                fill="none" stroke="#f0f0f0" strokeWidth="38" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="240" y1="230" x2="360" y2="400"
                stroke="url(#hdr-cyan)" strokeWidth="38" strokeLinecap="round"/>
              <circle cx="370" cy="110" r="16" fill="#38b2ac"/>
            </svg>
            <span style={{
              fontSize: isMobile ? '15px' : '17px',
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '-0.3px',
              lineHeight: 1,
              // Collapse text into logo on scroll
              maxWidth: isScrolled ? '0px' : '80px',
              opacity: isScrolled ? 0 : 1,
              // Cancel the parent flex gap when fully collapsed so no dead space remains
              marginLeft: isScrolled ? `${-(isMobile ? 8 : 10)}px` : '0px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'max-width, opacity',
            }}>
              Rhym
            </span>
          </div>

          {/* Right: Profile Avatar Button */}
          <button
            onClick={() => navigate('/settings')}
            style={{
              width: isMobile ? '28px' : '32px',
              height: isMobile ? '28px' : '32px',
              borderRadius: '50%',
              background: '#38b2ac',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              padding: 0,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              WebkitTapHighlightColor: 'transparent',
              opacity: isScrolled ? 0 : 1,
              pointerEvents: isScrolled ? 'none' : 'auto',
              transition: 'transform 0.15s ease, opacity 0.25s ease',
            }}
            onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)' }}
            onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            title="Profile"
            aria-label="Profile"
          >
            <FiUser size={16} style={{ color: '#000' }} />
          </button>
        </header>

        {/* ─── BLEND SHARED PLAYER CARD (If in room) ─── */}
        {room && (
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--mini-player-color, #1A1A1A)',
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(0,0,0,0.4))',
            borderRadius: '8px',
            padding: '10px 12px',
            marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>

            {/* Top row: live + members + leave */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Live dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '5px', height: '5px', borderRadius: '50%', background: '#FFFFFF',
                    boxShadow: '0 0 6px rgba(255, 255, 255, 0.5)',
                    animation: 'blend-pulse 2s ease-in-out infinite',
                  }} />
                  <span style={{ color: '#FFFFFF', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Live</span>
                </div>

                {/* Separator */}
                <div style={{ width: '1px', height: '12px', background: '#333333' }} />

                {/* Member name pills */}
                {room.members.map((m, i) => (
                  <span key={m.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: i === 0 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.2)',
                    color: i === 0 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '10px', fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: '500px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    lineHeight: 1,
                  }}>
                    {m.name || `User ${i + 1}`}
                  </span>
                ))}
              </div>



              {/* Leave */}
              <button
                onClick={(e) => { e.stopPropagation(); leaveRoom(); }}
                style={{
                  background: '#ef4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '500px',
                  padding: '3px 12px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
                onPointerEnter={e => { e.currentTarget.style.background = '#dc2626'; }}
                onPointerLeave={e => { e.currentTarget.style.background = '#ef4444'; }}
              >
                Leave
              </button>
            </div>

            {/* Song row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
              {/* Poster */}
              {currentSong ? (
                <img src={currentSong.thumbnail} alt="" style={{
                  width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }} />
              ) : (
                <div style={{
                  width: '38px', height: '38px', borderRadius: '4px',
                  background: '#282828',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FiMusic size={16} color="#6A6A6A" />
                </div>
              )}

              {/* Song info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {currentSong ? (
                  <>
                    <div className="truncate" style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 700, lineHeight: 1.3 }}>
                      {currentSong.title}
                    </div>
                    <div className="truncate" style={{ color: '#B3B3B3', fontSize: '11px', marginTop: '2px', fontWeight: 400 }}>
                      {currentSong.artist}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: '#B3B3B3', fontSize: '13px', fontWeight: 500 }}>No track playing</div>
                    <div style={{ color: '#6A6A6A', fontSize: '11px', marginTop: '2px' }}>Play something to sync</div>
                  </>
                )}
              </div>

              {/* Equalizer bars */}
              {currentSong && isPlaying && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '16px', flexShrink: 0 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '2.5px', borderRadius: '1px',
                      background: '#38b2ac',
                      animation: `blend-eq-${i} 0.8s ease-in-out infinite alternate`,
                    }} />
                  ))}
                </div>
              )}
            </div>

            {/* CSS Animations */}
            <style>{`
              @keyframes blend-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.3; transform: scale(0.8); }
              }
              @keyframes blend-eq-0 {
                0% { height: 3px; } 100% { height: 14px; }
              }
              @keyframes blend-eq-1 {
                0% { height: 9px; } 100% { height: 5px; }
              }
              @keyframes blend-eq-2 {
                0% { height: 5px; } 100% { height: 12px; }
              }
            `}</style>
          </div>
        )}

        {/* ─── Daily Songs Carousel (Aesthetic & Scrollable) ─── */}

        {dailySongs.length > 0 && (
          <div style={{
            marginBottom: isMobile ? '8px' : '12px',
            marginTop: '0px',
            position: 'relative'
          }}>
            <div 
              ref={postersScrollRef}
              className="posters-scroll"
            style={{
              display: 'flex',
              gap: isMobile ? '12px' : '20px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '8px'
            }}
          >
            {dailySongs.map((song, idx) => (
              <div
                key={song.videoId || idx}
                onClick={() => handlePlaySong(song, dailySongs, idx)}
                style={{
                  position: 'relative',
                  width: isMobile ? 'calc(100vw - 24px)' : '560px',
                  height: isMobile ? '210px' : '320px',
                  borderRadius: isMobile ? '12px' : '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
                className="aesthetic-poster"
              >
                {/* Background Image */}
                <img 
                  src={song.thumbnail} 
                  alt={song.title}
                  loading="lazy"
                  decoding="async"
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Gradient overlay for text readability */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)'
                }} />
                
                {/* Song Title at Bottom */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: isMobile ? '14px' : '22px',
                  zIndex: 2
                }}>
                  <h3 style={{
                    fontSize: isMobile ? '15px' : '20px',
                    fontWeight: 700,
                    color: '#fff',
                    margin: 0,
                    lineHeight: 1.3,
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {song.title}
                  </h3>
                  {song.artist && (
                    <p style={{
                      fontSize: isMobile ? '13px' : '15px',
                      color: 'rgba(255,255,255,0.85)',
                      fontWeight: 500,
                      margin: '4px 0 0 0',
                      textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {song.artist}
                    </p>
                  )}
                </div>
                
                {/* Hover play icon overlay */}
                <div 
                  className="poster-play-overlay"
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(8px)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <div style={{
                    width: isMobile ? '56px' : '80px',
                    height: isMobile ? '56px' : '80px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    transform: 'scale(0.9)',
                    transition: 'transform 0.3s ease'
                  }}
                  className="poster-play-icon"
                  >
                    <FiPlay 
                      size={isMobile ? 24 : 32} 
                      fill="currentColor" 
                      style={{ color: '#000', marginLeft: '4px' }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Static Dots Navigation - Outside carousel */}
          {dailySongs.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: isMobile ? '12px' : '16px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              zIndex: 10,
              pointerEvents: 'auto'
            }}>
              {dailySongs.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={(e) => {
                    e.stopPropagation()
                    const scrollContainer = postersScrollRef.current
                    if (scrollContainer) {
                      const poster = scrollContainer.querySelector('.aesthetic-poster')
                      if (poster) {
                        const posterWidth = poster.offsetWidth
                        const gap = isMobile ? 12 : 20
                        scrollContainer.scrollTo({
                          left: dotIdx * (posterWidth + gap),
                          behavior: 'smooth'
                        })
                      }
                    }
                  }}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: dotIdx === activePosterIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transform: dotIdx === activePosterIndex ? 'scale(1.2)' : 'scale(1)'
                  }}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 2. Top Radios (Scroll Row) ─── */}
      <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
        <div style={{ padding: isMobile ? '4px 16px 0 0' : '6px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
          <SectionHeader 
            title="Top Radios" 
            subtitle="More like"
            poster={recentTracks[0]?.thumbnail || recentTracks[0]?.img || TOP_ARTISTS[0]?.img}
            scrollRef={recentRef} 
            isMobile={isMobile} 
          />
        </div>
        {loading && recentTracks.length === 0 ? (
          <SkeletonRow />
        ) : (
          <div className="ambient-box">
            <div className="h-scroll" style={{ paddingBottom: 0 }} ref={recentRef}>
              {recentTracks.map((song, i) => (
                <VerticalCard 
                  key={song.videoId || song.id || `${song.title}-${i}`} 
                  song={song} 
                  isMobile={isMobile}
                  onClick={() => handlePlaySong(song, recentTracks, i)} 
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── 2b. Popular Artists (Scroll Row) ─── */}
      <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
        <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
          <SectionHeader 
            title="Popular Artists" 
            scrollRef={artistsRef} 
            isMobile={isMobile}
            rightElement={
              <button 
                onClick={() => setIsArtistModalOpen(true)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none', color: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transform: 'translateX(10px)'
                }}
              >
                <FiPlus size={20} />
              </button>
            }
          />
        </div>
        <div className="ambient-box">
          <div className="h-scroll" style={{ paddingBottom: 0 }} ref={artistsRef}>
            {MORE_ARTISTS.map((artist, i) => (
              <VerticalCard key={i} song={artist} isArtist isMobile={isMobile} onClick={() => handleArtistClick(artist.name)} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2c. Recently Listened (Scroll Row) or Room History ─── */}
      {room ? (
        <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
          <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Recent plays in this room" scrollRef={listenRef} isMobile={isMobile} />
          </div>
          <div className="ambient-box">
            <div className="h-scroll" style={{ paddingBottom: 0 }} ref={listenRef}>
              {roomHistory.length === 0 ? (
                <div style={{ color: '#8a8a8f', fontSize: '14px', padding: '12px 0' }}>No recent songs in this room yet</div>
              ) : (
                roomHistory.map((song, i) => (
                  <VerticalCard key={song.videoId || i} song={song} isMobile={isMobile} onClick={() => handlePlaySong(song, roomHistory, i)} />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        recentlyPlayed && recentlyPlayed.length > 0 && (
          <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
            <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
              <SectionHeader title="Recently Listened" scrollRef={listenRef} isMobile={isMobile} />
            </div>
            <div className="ambient-box">
              <div className="h-scroll" style={{ paddingBottom: 0 }} ref={listenRef}>
                {recentlyPlayed.slice(0, 10).map((song, i) => (
                  <VerticalCard key={song.videoId || i} song={song} isMobile={isMobile} onClick={() => handlePlaySong(song, recentlyPlayed, i)} />
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* ─── Categories ─── */}
      <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
        <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
          <SectionHeader title="Categories" isMobile={isMobile} />
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: isMobile ? '6px' : '16px', // Reduced gap on mobile to make boxes broader
          padding: isMobile ? '0 8px' : '0 20px' // Reduced padding on mobile to make boxes broader
        }}>
          {[
            { name: 'Pop', color: '#8B5CF6' },
            { name: 'EDM', color: '#F59E0B' },
            { name: 'Podcasts', color: '#0EA5E9' },
            { name: 'Rock', color: '#BE185D' },
            { name: 'Hip-Hop', color: '#0D9488' },
            { name: 'Jazz', color: '#EA580C' },
            { name: 'Classical', color: '#4F46E5' },
            { name: 'Country', color: '#16A34A' },
            { name: 'R&B', color: '#E11D48' },
          ].map((cat) => (
            <div
              key={cat.name}
              onClick={() => navigate(`/search?q=${encodeURIComponent(cat.name + ' music')}`)}
              style={{
                background: cat.color,
                borderRadius: isMobile ? '10px' : '14px',
                height: isMobile ? '72px' : '100px', // Fixed height ensures equal size
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 16px ${cat.color}44`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cat.color}66` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 16px ${cat.color}44` }}
            >
              <span style={{
                color: '#fff',
                fontSize: isMobile ? '15px' : '18px',
                fontWeight: 700,
                textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px'
              }}>
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 3. Your Playlists (2-row horizontal scroll on mobile) ─── */}
      <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
        <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
          <SectionHeader title="Your Playlists" isMobile={isMobile} />
        </div>
        <div className="ambient-box">
          <div className="playlists-grid" style={{
            paddingLeft: 0,
            paddingRight: isMobile ? '16px' : 0,
            paddingTop: 0,
            paddingBottom: isMobile ? '8px' : 0
          }}>
            {userPlaylists.slice(0, 10).map((playlist, i) => {
              const isLiked = playlist.name === 'Liked Songs'
              return (
                <div 
                  key={i} 
                  onClick={() => navigate(`/playlist/${encodeURIComponent(playlist.name)}`)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: isMobile ? '8px' : '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '8px' : '12px',
                    cursor: 'pointer',
                    transition: 'background 0.2s, transform 0.2s',
                    position: 'relative'
                  }}
                  className="playlist-quick-card"
                >
                  <div style={{
                    width: isMobile ? '42px' : '56px', height: isMobile ? '42px' : '56px',
                    background: playlist.color || 'var(--hero-start)',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: isMobile ? '18px' : '24px', fontWeight: 900,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    flexShrink: 0
                  }}>
                    {isLiked ? '💜' : playlist.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="truncate" style={{ fontSize: isMobile ? '12px' : '15px', fontWeight: 700, color: '#fff', margin: 0 }}>{playlist.name}</p>
                    <p style={{ fontSize: isMobile ? '10px' : '12px', color: '#b3b3b3', margin: '2px 0 0 0' }}>Playlist</p>
                  </div>
                  {!isMobile && (
                    <div className="card-play-btn" style={{
                      width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transform: 'scale(0.8)', transition: 'all 0.2s'
                    }}>
                      <FiPlay size={14} style={{ fill: '#fff', color: '#fff', marginLeft: '2px' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>


      {/* ─── 5. New Releases (Scroll Row) ─── */}
      {loading ? <SkeletonRow /> : trending.length > 0 && (
        <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
          <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader 
              title="New Releases" 
              subtitle="Latest"
              poster={trending[0]?.thumbnail || trending[0]?.img}
              scrollRef={newRef} 
              isMobile={isMobile} 
            />
          </div>
          <div className="ambient-box">
            <div className="h-scroll" style={{ paddingBottom: 0 }} ref={newRef}>
              {trending.slice(0, 8).map((song) => (
                <VerticalCard key={song.videoId} song={song} isNewRelease isMobile={isMobile} onClick={() => navigate(`/playlist/New%20Releases`)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 5b. Popular Albums (Scroll Row) ─── */}
      {loading ? <SkeletonRow /> : popularAlbums.length > 0 && (
        <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
          <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader 
              title="Popular Albums" 
              subtitle="Trending"
              poster={popularAlbums[0]?.thumbnail || popularAlbums[0]?.img}
              scrollRef={popularRef} 
              isMobile={isMobile} 
            />
          </div>
          <div className="ambient-box">
            <div className="h-scroll" style={{ paddingBottom: 0 }} ref={popularRef}>
              {popularAlbums.slice(0, 10).map((song, i) => (
                <VerticalCard 
                  key={song.videoId || i} 
                  song={song}
                  isMobile={isMobile}
                  onClick={() => navigate(`/playlist/${encodeURIComponent(song.title)}`)} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. Recommended For You (Scroll Row) ─── */}
      {loading ? <SkeletonRow /> : recommendations.length > 0 && (
        <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
          <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Recommended For You" scrollRef={recomRef} isMobile={isMobile} />
          </div>
          <div className="ambient-box">
            <div className="h-scroll" style={{ paddingBottom: 0 }} ref={recomRef}>
              {recommendations.slice(0, 10).map((song, i) => (
                <VerticalCard 
                  key={song.videoId || i} 
                  song={{...song, genre: 'Pop/Trending'}} 
                  isRecommended
                  isMobile={isMobile}
                  onClick={() => navigate(`/playlist/Recommended%20For%20You`)} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. Featured Podcasts (Large Cards) ─── */}
      <div style={{ 
        marginBottom: isMobile ? '20px' : '40px'
      }}>
        <SectionHeader title="Featured Podcasts" isMobile={isMobile} />
        <div className="podcast-grid-premium" style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '24px',
          maxHeight: '1020px', // Even more generous height
          overflow: 'hidden'
        }}>
          {[
            {
              title: "Episode 302 | The HAUNTED TRIP To HIMACHAL PRADESH",
              author: "Akshay Horror Podcast",
              thumbnail: "https://i.ytimg.com/vi/uxpDa-c-4Mc/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/SxTYjptEzZs/maxresdefault.jpg",
              date: "May 4", duration: "24 min 40 sec",
              color: "#7c0000",
              desc: "Watch as we explore the darkest corners of the supernatural world, uncovering secrets that..."
            },
            {
              title: "Lakshya Sen on Champion Mindset, Olympic Heartbreak...",
              author: "Raj Shamani's Figuring Out",
              thumbnail: "https://i.ytimg.com/vi/WHuBW3qKm9g/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/4NRXx6U8ABQ/maxresdefault.jpg",
              date: "May 2", duration: "2 hr 8 min",
              color: "#333333",
              desc: "Laksya Sen talks about his journey, mindset and what it takes to be a champion at the highest level..."
            },
            {
              title: "Bhoot Bangla - Haunted House | Horror Stories",
              author: "The Horror Show by Khooni Mond...",
              thumbnail: "https://i.ytimg.com/vi/uxpDa-c-4Mc/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/ic8j13piAhQ/maxresdefault.jpg",
              date: "Apr 18", duration: "11 min 31 sec",
              color: "#9b0000",
              desc: "A couple visits a strange old abandoned mansion on a trip, but what they didn't know..."
            },
            {
              title: "Elon Musk on AI, Mars and the Future of X",
              author: "The Joe Rogan Experience",
              thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/uxpDa-c-4Mc/maxresdefault.jpg",
              date: "May 1", duration: "2 hr 45 min",
              color: "#1e1e1e",
              desc: "Elon Musk returns to the podcast to discuss the rapid advancement of artificial intelligence..."
            },
            {
              title: "Simon Sinek: Why You Feel Unfulfilled & How To Fix It",
              author: "The Diary Of A CEO",
              thumbnail: "https://i.ytimg.com/vi/WHuBW3qKm9g/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/SxTYjptEzZs/maxresdefault.jpg",
              date: "Apr 25", duration: "1 hr 32 min",
              color: "#2a2a2a",
              desc: "Simon Sinek shares his profound insights on human psychology, leadership, and finding your why..."
            },
            {
              title: "Science of Optimization & Peak Performance",
              author: "Huberman Lab",
              thumbnail: "https://i.ytimg.com/vi/ic8j13piAhQ/mqdefault.jpg",
              poster: "https://i.ytimg.com/vi/4NRXx6U8ABQ/maxresdefault.jpg",
              date: "Apr 20", duration: "2 hr 12 min",
              color: "#0d2b45",
              desc: "Dr. Andrew Huberman discusses the latest science on sleep, nutrition, and neural circuits..."
            }
          ].slice(0, isMobile ? 2 : undefined).map((pod, i) => (
            <div key={i} style={{
              background: pod.color, borderRadius: '16px',
              padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
              cursor: 'pointer', transition: 'transform 0.2s ease',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }} className="podcast-card-premium">
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={pod.thumbnail} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 className="truncate-2" style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{pod.title}</h4>
                  <p className="truncate" style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiPlay size={10} fill="currentColor" /> Video
                    </span> • {pod.author}
                  </p>
                </div>
              </div>

              {/* Card Poster */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <img src={pod.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Card Footer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  {pod.date} • {pod.duration} • <span style={{ opacity: 0.8, fontWeight: 500 }}>{pod.desc}</span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <button style={{ 
                    background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '20px', 
                    padding: '8px 16px', color: '#fff', fontSize: '12px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                  }}>
                    <FiPlay size={12} fill="currentColor" /> Preview episode
                  </button>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FiPlus size={20} style={{ color: '#fff', cursor: 'pointer', opacity: 0.8 }} />
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <FiPlay size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* ─── 8. Top English Rap ─── */}
      {loading ? <SkeletonRow /> : madeForYou.length > 0 && (
        <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
          <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Top English Rap" scrollRef={rapRef} isMobile={isMobile} />
          </div>
          <div className="ambient-box">
            <div className="h-scroll" style={{ paddingBottom: 0 }} ref={rapRef}>
              {madeForYou.slice(0, 10).map((song, i) => (
                <VerticalCard
                  key={song.videoId || i}
                  song={{ ...song, genre: 'Rap / Hip-Hop' }}
                  isMobile={isMobile}
                  onClick={() => handlePlaySong(song, madeForYou, i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 9. Top Hollywood ─── */}
      {loading ? <SkeletonRow /> : popularAlbums.length > 0 && (
        <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
          <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Top Hollywood" scrollRef={hollywoodRef} isMobile={isMobile} />
          </div>
          <div className="ambient-box">
            <div className="h-scroll" style={{ paddingBottom: 0 }} ref={hollywoodRef}>
              {popularAlbums.slice(0, 10).map((song, i) => (
                <VerticalCard
                  key={song.videoId || i}
                  song={{ ...song, genre: 'Hollywood' }}
                  isMobile={isMobile}
                  onClick={() => handlePlaySong(song, popularAlbums, i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 10. Top Bollywood ─── */}
      {loading ? <SkeletonRow /> : trending.length > 0 && (
        <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
          <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Top Bollywood" scrollRef={bollywoodRef} isMobile={isMobile} />
          </div>
          <div className="ambient-box">
            <div className="h-scroll" style={{ paddingBottom: 0 }} ref={bollywoodRef}>
              {trending.slice(0, 10).map((song, i) => (
                <VerticalCard
                  key={song.videoId || i}
                  song={{ ...song, genre: 'Bollywood' }}
                  isMobile={isMobile}
                  onClick={() => handlePlaySong(song, trending, i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 11. Top Hindi Rap ─── */}
      {loading ? <SkeletonRow /> : recommendations.length > 0 && (
        <div>
          <div style={{ padding: isMobile ? '16px 16px 0 0' : '24px 20px 0 0', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Top Hindi Rap" scrollRef={hindiRapRef} isMobile={isMobile} />
          </div>
          <div className="ambient-box">
            <div className="h-scroll" style={{ paddingBottom: 0 }} ref={hindiRapRef}>
              {recommendations.slice(0, 10).map((song, i) => (
                <VerticalCard
                  key={song.videoId || i}
                  song={{ ...song, genre: 'Hindi Rap' }}
                  isMobile={isMobile}
                  onClick={() => handlePlaySong(song, recommendations, i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Scoped Styles ─── */}
      <style>{`
        /* Scrollable rows */
        .h-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          overflow-y: visible;
          scrollbar-width: none;
          padding-bottom: 8px;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          overscroll-behavior-y: auto;
          touch-action: pan-y pan-x;
        }
        @media (min-width: 768px) {
          .h-scroll {
            gap: 24px;
            padding-bottom: 24px;
          }
        }

        /* Vertical Card Hover */
        .vertical-card:hover {
        }
        .vertical-card:hover .hover-play-btn {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .recently-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          max-height: 144px;
          overflow: hidden;
        }
        
        .playlists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 14px;
          max-height: 176px;
          overflow: hidden;
        }

        @media (max-width: 1400px) {
          .playlists-grid { grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); }
        }
        @media (max-width: 1200px) {
          .playlists-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
        }
        @media (max-width: 768px) {
          .recently-grid { grid-template-columns: repeat(2, 1fr); }
          .playlists-grid { 
            grid-template-columns: none; 
            grid-template-rows: repeat(2, 1fr); 
            grid-auto-flow: column; 
            grid-auto-columns: calc(52vw - 10px); 
            gap: 10px;
            overflow-x: auto; 
            overflow-y: hidden;
            scrollbar-width: none;
            max-height: none; 
            padding-bottom: 8px;
          }
          .playlists-grid::-webkit-scrollbar {
            display: none;
          }
        }
        .recent-card:hover {
          background: #333333 !important;
        }
        .recent-card:hover .hover-play-btn {
          opacity: 1 !important;
        }

        .playlist-quick-card:hover {
          background: rgba(255, 255, 255, 0.10) !important;
          transform: scale(1.03) !important;
        }
        .playlist-quick-card:hover .card-play-btn {
          opacity: 1;
          transform: scale(1);
        }

        .hover-underline:hover {
          text-decoration: underline;
        }

        /* Poster Scroll Styles */
        .posters-scroll::-webkit-scrollbar {
          display: none;
        }

        .aesthetic-poster:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }

        .aesthetic-poster:hover .poster-play-overlay {
          opacity: 1;
        }

        .aesthetic-poster:hover .poster-play-icon {
          transform: scale(1);
        }

        /* Aurora Background Animations */
        @keyframes aurora-float-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          25% {
            transform: translate(30px, -50px) scale(1.1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-20px, -80px) scale(0.95);
            opacity: 1;
          }
          75% {
            transform: translate(40px, -30px) scale(1.05);
            opacity: 0.9;
          }
        }

        @keyframes aurora-float-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.9;
          }
          33% {
            transform: translate(-40px, 60px) scale(1.08);
            opacity: 1;
          }
          66% {
            transform: translate(30px, 90px) scale(0.92);
            opacity: 0.85;
          }
        }

        @keyframes aurora-float-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.95;
          }
          30% {
            transform: translate(50px, 40px) scale(1.12);
            opacity: 0.8;
          }
          60% {
            transform: translate(-30px, 70px) scale(0.98);
            opacity: 1;
          }
        }

        @keyframes aurora-float-4 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.85;
          }
          40% {
            transform: translate(-50px, -40px) scale(1.15);
            opacity: 1;
          }
          80% {
            transform: translate(20px, -60px) scale(0.9);
            opacity: 0.9;
          }
        }
      `}</style>
      
      <Footer />
      </div>

      {/* ─── Artist Selection Modal ─── */}
      <BottomSheet isOpen={isArtistModalOpen} onClose={() => setIsArtistModalOpen(false)}>
        <div style={{ padding: '0 4px', maxHeight: '70vh', overflowY: 'auto' }} className="hide-scrollbar">
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: '#fff', textAlign: 'center' }}>
            Select Artists
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            paddingBottom: '24px'
          }}>
            {MORE_ARTISTS.map((artist, idx) => {
              const isSelected = isArtistSaved(artist.name)
              return (
                <div 
                  key={idx}
                  onClick={() => toggleSavedArtist(artist)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    cursor: 'pointer', position: 'relative'
                  }}
                >
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: '#2a2a2a', marginBottom: '8px',
                    position: 'relative', overflow: 'hidden',
                    border: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'border 0.2s ease'
                  }}>
                    <img 
                      src={artist.img} alt={artist.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FiCheck size={24} color="#fff" />
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, color: isSelected ? 'var(--accent)' : '#fff',
                    textAlign: 'center', lineHeight: 1.2
                  }}>
                    {artist.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
