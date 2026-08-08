import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext.jsx'
import { searchSongs, getTrending } from '../utils/api.js'
import { FiPlay, FiPlus, FiChevronLeft, FiChevronRight, FiCircle } from 'react-icons/fi'
import { useRef } from 'react'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return isMobile
}

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
  { name: 'Honey Singh', img: 'https://i.ytimg.com/vi/NbyHNASFi6U/mqdefault.jpg' },
  { name: 'Lata Mangeshkar', img: 'https://i.ytimg.com/vi/TFr6G5zveS8/mqdefault.jpg' },
  { name: 'The Weeknd', img: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg' },
  { name: 'Dua Lipa', img: 'https://i.ytimg.com/vi/WHuBW3qKm9g/mqdefault.jpg' },
  { name: 'Arijit Singh', img: 'https://i.ytimg.com/vi/SxTYjptEzZs/mqdefault.jpg' },
  { name: 'Drake', img: 'https://i.ytimg.com/vi/uxpDa-c-4Mc/mqdefault.jpg' },
  { name: 'Seedhe Maut', img: 'https://i.ytimg.com/vi/dm2RHGYRtas/hqdefault.jpg' },
  { name: 'Taylor Swift', img: 'https://i.ytimg.com/vi/ic8j13piAhQ/mqdefault.jpg' },
  { name: 'Post Malone', img: 'https://i.ytimg.com/vi/SC4xMk98Pdc/mqdefault.jpg' },
]

/* ─── Section Header ─── */
function SectionHeader({ title, scrollRef, isMobile }) {
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
      <h2 style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: '#ffffff' }}>{title}</h2>
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
  const cardW = isMobile ? 125 : 200
  const cardH = isMobile ? 155 : 220
  const imgSize = isMobile ? 105 : 168
  const pad = isMobile ? 10 : 16

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
    className="vertical-card">
      <div style={{ position: 'relative', width: `${imgSize}px`, height: `${imgSize}px`, marginBottom: isMobile ? '8px' : '16px', background: 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)', borderRadius: isArtist ? '50%' : '4px' }}>
        <img
          src={song.thumbnail || song.img} alt={song.title || song.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: isArtist ? '50%' : '4px' }}
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
      <div style={{ width: '100%' }}>
        <p className="truncate" style={{ fontSize: isMobile ? '11px' : '14px', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
          {song.title || song.name}
        </p>
        <p className="truncate" style={{ fontSize: isMobile ? '10px' : '14px', color: isRecommended ? 'var(--accent-hover)' : '#b3b3b3' }}>
          {isArtist ? 'Artist' : (isRecommended ? song.genre || 'Electronic' : song.artist)}
        </p>
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

/* ═══ HOME PAGE ═══ */
export default function HomePage() {
  const navigate = useNavigate()
  const { playSong, userPlaylists, recentlyPlayed } = usePlayer()
  const [trending, setTrending] = useState([])
  const [madeForYou, setMadeForYou] = useState([])
  const [popularAlbums, setPopularAlbums] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [dailySongs, setDailySongs] = useState([])
  const [activePosterIndex, setActivePosterIndex] = useState(0)

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
            // Only use cache if it has version 4, is from today, and has valid data
            if (parsed.version === 4 && parsed.date === today && parsed.songs && parsed.songs.length >= 4) {
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

        // Fetch ONE song from each of these 4 artists
        const artists = [
          { name: 'Travis Scott', query: 'Travis Scott' },
          { name: 'Dua Lipa', query: 'Dua Lipa' },
          { name: 'Seedhe Maut', query: 'Seedhe Maut' },
          { name: 'Karan Aujla', query: 'Karan Aujla' }
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
            version: 4, // Version 4 for multi-artist format
            timestamp: Date.now()
          }))
        } else {
          console.warn(`[Daily Carousel] ⚠ Only got ${songs.length} songs, need 4`)
          // Fallback to trending
          const trending = await getTrending()
          if (trending && trending.length >= 4) {
            console.log('[Daily Carousel] ↻ Using trending fallback')
            setDailySongs(trending.slice(0, 4))
          }
        }
      } catch (e) {
        console.error('[Daily Carousel] ✗ Error:', e)
        // Try trending on error
        try {
          const trending = await getTrending()
          if (trending && trending.length >= 4) {
            setDailySongs(trending.slice(0, 4))
            console.log('[Daily Carousel] ↻ Error recovery: using trending')
          }
        } catch (err) {
          console.error('[Daily Carousel] ✗ All fallbacks failed:', err)
        }
      }
    }
    getDailySongs()
  }, [])

  // Track scroll position for poster dots
  useEffect(() => {
    const scrollContainer = postersScrollRef.current
    if (!scrollContainer || dailySongs.length <= 1) return

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft
      const itemWidth = scrollContainer.querySelector('.aesthetic-poster')?.offsetWidth || 0
      const gap = isMobile ? 12 : 20
      const totalWidth = itemWidth + gap
      const index = Math.round(scrollLeft / totalWidth)
      setActivePosterIndex(Math.min(Math.max(index, 0), dailySongs.length - 1))
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [dailySongs.length, isMobile])

  useEffect(() => {
    const load = async () => {
      try {
        const [trendData, mfyData, albumData, recomData] = await Promise.all([
          getTrending(),
          searchSongs('top hindi songs'),
          searchSongs('popular pop albums'),
          searchSongs('trending english songs')
        ])
        setTrending(trendData || [])
        setMadeForYou(mfyData || [])
        setPopularAlbums(albumData || [])
        setRecommendations(recomData || [])
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
    <div style={{ position: 'relative', padding: isMobile ? '12px 12px 120px' : '16px 32px 120px', overflow: 'hidden' }}>
      {/* ─── Ambient Aurora Background Effect ─── */}
      <div className="aurora-background" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}>
        {/* Aurora Orbs */}
        <div className="aurora-orb aurora-orb-1" style={{
          position: 'absolute',
          width: isMobile ? '300px' : '600px',
          height: isMobile ? '300px' : '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 210, 255, 0.15) 0%, rgba(0, 210, 255, 0.05) 40%, transparent 70%)',
          filter: 'blur(60px)',
          top: '10%',
          left: '20%',
          animation: 'aurora-float-1 20s ease-in-out infinite'
        }} />
        
        <div className="aurora-orb aurora-orb-2" style={{
          position: 'absolute',
          width: isMobile ? '250px' : '500px',
          height: isMobile ? '250px' : '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138, 43, 226, 0.12) 0%, rgba(138, 43, 226, 0.04) 40%, transparent 70%)',
          filter: 'blur(50px)',
          top: '50%',
          right: '15%',
          animation: 'aurora-float-2 25s ease-in-out infinite'
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
          animation: 'aurora-float-3 22s ease-in-out infinite'
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
          animation: 'aurora-float-4 18s ease-in-out infinite'
        }} />
      </div>
      
      {/* Content Container with relative positioning */}
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* ─── Daily Songs Carousel (Aesthetic & Scrollable) ─── */}
      {dailySongs.length > 0 && (
        <div style={{
          marginBottom: isMobile ? '20px' : '32px',
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
                  width: isMobile ? '85vw' : '480px',
                  height: isMobile ? '180px' : '280px',
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
                  padding: isMobile ? '12px' : '20px',
                  zIndex: 2
                }}>
                  <h3 style={{
                    fontSize: isMobile ? '14px' : '18px',
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
                      fontSize: isMobile ? '12px' : '14px',
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
        <div style={{ padding: isMobile ? '0 16px' : '0 20px', marginBottom: isMobile ? '10px' : '16px' }}>
          <SectionHeader title="Top Radios" scrollRef={recentRef} isMobile={isMobile} />
        </div>
        <div style={{ 
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: isMobile ? '16px 0' : '20px 0',
          boxShadow: '0 0 40px rgba(0, 210, 255, 0.08), 0 0 20px rgba(138, 43, 226, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.03)'
        }} className="ambient-box">
          <div className="h-scroll" style={{ paddingBottom: 0 }} ref={recentRef}>
            {recentTracks.map((song, i) => (
              <VerticalCard 
                key={i} 
                song={song} 
                isMobile={isMobile}
                onClick={() => handlePlaySong(song, recentTracks, i)} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2b. Popular Artists (Scroll Row) ─── */}
      <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
        <div style={{ padding: isMobile ? '0 16px' : '0 20px', marginBottom: isMobile ? '10px' : '16px' }}>
          <SectionHeader title="Popular Artists" scrollRef={artistsRef} isMobile={isMobile} />
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: isMobile ? '16px 0' : '20px 0', boxShadow: '0 0 40px rgba(0, 210, 255, 0.08), 0 0 20px rgba(138, 43, 226, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)' }} className="ambient-box">
          <div className="h-scroll" style={{ paddingBottom: 0 }} ref={artistsRef}>
            {TOP_ARTISTS.map((artist, i) => (
              <VerticalCard key={i} song={artist} isArtist isMobile={isMobile} onClick={() => handleArtistClick(artist.name)} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2c. Recently Listened (Scroll Row) ─── */}
      {recentlyPlayed && recentlyPlayed.length > 0 && (
        <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
          <div style={{ padding: isMobile ? '0 16px' : '0 20px', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Recently Listened" scrollRef={listenRef} isMobile={isMobile} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: isMobile ? '16px 0' : '20px 0', boxShadow: '0 0 40px rgba(0, 210, 255, 0.08), 0 0 20px rgba(138, 43, 226, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)' }} className="ambient-box">
            <div className="h-scroll" style={{ paddingBottom: 0 }} ref={listenRef}>
              {recentlyPlayed.slice(0, 10).map((song, i) => (
                <VerticalCard key={song.videoId || i} song={song} isMobile={isMobile} onClick={() => handlePlaySong(song, recentlyPlayed, i)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. Your Playlists (2-row horizontal scroll on mobile) ─── */}
      <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
        <div style={{ padding: isMobile ? '0 16px' : '0 20px', marginBottom: isMobile ? '10px' : '16px' }}>
          <SectionHeader title="Your Playlists" isMobile={isMobile} />
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: isMobile ? '16px 0' : '20px 0', boxShadow: '0 0 40px rgba(0, 210, 255, 0.08), 0 0 20px rgba(138, 43, 226, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)' }} className="ambient-box">
          <div className="playlists-grid" style={{ padding: isMobile ? '0 16px' : '0 20px' }}>
            {userPlaylists.slice(0, 10).map((playlist, i) => {
              const isLiked = playlist.name === 'Liked Songs'
              return (
                <div 
                  key={i} 
                  onClick={() => navigate(`/playlist/${encodeURIComponent(playlist.name)}`)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
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
          <div style={{ padding: isMobile ? '0 16px' : '0 20px', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="New Releases" scrollRef={newRef} isMobile={isMobile} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: isMobile ? '16px 0' : '20px 0', boxShadow: '0 0 40px rgba(0, 210, 255, 0.08), 0 0 20px rgba(138, 43, 226, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)' }} className="ambient-box">
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
          <div style={{ padding: isMobile ? '0 16px' : '0 20px', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Popular Albums" scrollRef={popularRef} isMobile={isMobile} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: isMobile ? '16px 0' : '20px 0', boxShadow: '0 0 40px rgba(0, 210, 255, 0.08), 0 0 20px rgba(138, 43, 226, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)' }} className="ambient-box">
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
          <div style={{ padding: isMobile ? '0 16px' : '0 20px', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Recommended For You" scrollRef={recomRef} isMobile={isMobile} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: isMobile ? '16px 0' : '20px 0', boxShadow: '0 0 40px rgba(0, 210, 255, 0.08), 0 0 20px rgba(138, 43, 226, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)' }} className="ambient-box">
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
          <div style={{ padding: isMobile ? '0 16px' : '0 20px', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Top English Rap" scrollRef={rapRef} isMobile={isMobile} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: isMobile ? '16px 0' : '20px 0', boxShadow: '0 0 40px rgba(0, 210, 255, 0.08), 0 0 20px rgba(138, 43, 226, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)' }} className="ambient-box">
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
          <div style={{ padding: isMobile ? '0 16px' : '0 20px', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Top Hollywood" scrollRef={hollywoodRef} isMobile={isMobile} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: isMobile ? '16px 0' : '20px 0', boxShadow: '0 0 40px rgba(0, 210, 255, 0.08), 0 0 20px rgba(138, 43, 226, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)' }} className="ambient-box">
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
          <div style={{ padding: isMobile ? '0 16px' : '0 20px', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Top Bollywood" scrollRef={bollywoodRef} isMobile={isMobile} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: isMobile ? '16px 0' : '20px 0', boxShadow: '0 0 40px rgba(0, 210, 255, 0.08), 0 0 20px rgba(138, 43, 226, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)' }} className="ambient-box">
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
        <div style={{ marginBottom: isMobile ? '20px' : '40px' }}>
          <div style={{ padding: isMobile ? '0 16px' : '0 20px', marginBottom: isMobile ? '10px' : '16px' }}>
            <SectionHeader title="Top Hindi Rap" scrollRef={hindiRapRef} isMobile={isMobile} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: isMobile ? '16px 0' : '20px 0', boxShadow: '0 0 40px rgba(0, 210, 255, 0.08), 0 0 20px rgba(138, 43, 226, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.03)' }} className="ambient-box">
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
          background: #2a2a2a !important;
          transform: scale(1.04) !important;
          box-shadow: 0 12px 24px rgba(0,0,0,0.3) !important;
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
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          max-height: 176px;
          overflow: hidden;
        }

        @media (max-width: 1400px) {
          .playlists-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
        }
        @media (max-width: 1200px) {
          .playlists-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
        }
        @media (max-width: 768px) {
          .recently-grid { grid-template-columns: repeat(2, 1fr); }
          .playlists-grid { 
            grid-template-columns: none; 
            grid-template-rows: repeat(2, 1fr); 
            grid-auto-flow: column; 
            grid-auto-columns: calc(65vw - 12px); 
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
          background: rgba(255, 255, 255, 0.12) !important;
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
      </div>
    </div>
  )
}
