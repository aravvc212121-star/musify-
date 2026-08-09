/**
 * MUSIFY v2.0 — SearchOverlay
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Removed all backdrop-filter blur from cards and result items
 * - Skeleton loader uses CSS pulse (no shimmer sweep)
 * - Result items: 64px tall horizontal song items
 * - Browse categories: no blur, no box-shadow on scroll
 * - touch-action: manipulation on buttons
 * - overscroll-behavior: contain on scroll areas
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../../context/PlayerContext.jsx'
import { searchSongs } from '../../utils/api.js'
import Fuse from 'fuse.js'

const BROWSE_CATEGORIES = [
  { name: 'Podcasts', color: '#E13300' },
  { name: 'Made For You', color: '#1E3264' },
  { name: 'New Releases', color: '#E8115B' },
  { name: 'Hip-Hop', color: '#BC5900' },
  { name: 'Pop', color: '#148A08' },
  { name: 'Latin', color: '#E1118C' },
  { name: 'Charts', color: '#8D67AB' },
  { name: 'Rock', color: '#E91429' },
  { name: 'Dance', color: '#D84000' },
  { name: 'Indie', color: '#E91429' },
  { name: 'K-Pop', color: '#148A08' },
  { name: 'Chill', color: '#D84000' },
  { name: 'Workout', color: '#777777' },
  { name: 'Party', color: '#AF2896' },
  { name: 'Bollywood', color: '#BC5900' },
  { name: 'Anime', color: '#E4115B' },
  { name: 'Jazz', color: '#777777' },
  { name: 'Trending', color: '#E13300' },
]

export default function SearchOverlay() {
  const navigate = useNavigate()
  const { isSearchOpen, setIsSearchOpen, playSong, masterPlaylistData } = usePlayer()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isSearchOpen && inputRef.current) inputRef.current.focus()
  }, [isSearchOpen])

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([])
      return
    }

    // Instant local fuzzy results
    const fuse = new Fuse(masterPlaylistData, {
      keys: ['title', 'artist'],
      threshold: 0.4,
      distance: 100,
      includeScore: true
    })
    const localResults = fuse.search(query.trim()).map(r => r.item)
    if (localResults.length > 0) {
      setResults(localResults.slice(0, 15))
    }

    // Then fetch API results
    const delay = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchSongs(query)
        const combined = [...localResults]
        data.forEach(s => {
          if (!combined.find(c => c.videoId === s.videoId)) {
            combined.push(s)
          }
        })
        setResults(combined.slice(0, 15))
      } catch (err) { console.error(err) }
      setLoading(false)
    }, 200)
    return () => clearTimeout(delay)
  }, [query, masterPlaylistData])

  const handleClose = () => {
    setIsSearchOpen(false)
    setQuery('')
    setResults([])
  }

  const handleCategorySearch = (name) => {
    setIsSearchOpen(false)
    navigate('/search', { state: { query: `${name} top songs` } })
  }

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', flexDirection: 'column',
            background: 'rgba(10, 10, 15, 0.97)',
          }}
        >
          {/* Search Bar */}
          <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
            }}>
              <FiSearch size={18} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="search"
                value={query}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                inputMode="search"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) {
                    setIsSearchOpen(false)
                    navigate('/search', { state: { query } })
                  }
                }}
                placeholder="Search songs, artists..."
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  fontSize: 16, fontWeight: 600, color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                  <FiX size={18} />
                </button>
              )}
            </div>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              Cancel
            </button>
          </div>

          {/* Content */}
          <div className="hide-scrollbar scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 120px' }}>
            {query.length < 1 ? (
              /* Browse Categories - 3 columns grid */
              <div>
                <p className="section-heading" style={{ padding: '8px 4px' }}>Browse All</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {BROWSE_CATEGORIES.map((cat) => (
                    <div
                      key={cat.name}
                      onClick={() => handleCategorySearch(cat.name)}
                      style={{
                        height: 70, borderRadius: 10, padding: '10px 12px',
                        background: `linear-gradient(135deg, ${cat.color}cc, ${cat.color}66)`,
                        cursor: 'pointer', display: 'flex', alignItems: 'flex-end',
                        transition: 'transform 80ms',
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Search Results */
              <div>
                <p className="section-heading" style={{ padding: '8px 4px' }}>Top Matches</p>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="skeleton-pulse" style={{ height: 64, borderRadius: 12 }} />
                    ))}
                  </div>
                ) : results.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {results.map((song) => (
                      <div
                        key={song.videoId}
                        onClick={() => { 
                          const songData = { 
                            videoId: song.videoId, 
                            title: song.title || 'Unknown', 
                            artist: song.artist || song.channelTitle || 'Unknown',
                            thumbnail: song.albumArt || song.thumbnail || ''
                          }
                          const saved = JSON.parse(localStorage.getItem('rhym_recent_searches') || '[]')
                          let updated = [songData, ...saved.filter(s => s.videoId !== song.videoId)]
                          localStorage.setItem('rhym_recent_searches', JSON.stringify(updated.slice(0, 10)))
                          playSong(song); 
                          handleClose() 
                        }}
                        className="song-item"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          height: 64, padding: '0 12px', borderRadius: 12,
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <img src={song.thumbnail} alt="" width={40} height={40} loading="lazy" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</p>
                          <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist}</p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{song.duration}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600 }}>No results found</div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
