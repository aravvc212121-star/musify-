import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { FiSearch, FiX, FiUser, FiSettings, FiLogOut, FiArrowLeft, FiArrowRight, FiCheck, FiSidebar } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'
import Fuse from 'fuse.js'

export default function TopBar({ isMobile = false, onMenuToggle }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { id: playlistId } = useParams()
  const { 
    searchQuery, setSearchQuery, 
    navHistory, setNavHistory,
    navIndex, setNavIndex,
    masterPlaylistData, playSong,
    userPlaylists,
    isLeftSidebarCollapsed, setIsLeftSidebarCollapsed
  } = usePlayer()

  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [results, setResults] = useState({ songs: [], playlists: [], artists: [] })
  
  const searchInputRef = useRef(null)
  const barRef = useRef(null)

  // Navigation History logic
  useEffect(() => {
    // Only push if it's a new path (not back/forward)
    if (navHistory[navIndex] !== pathname) {
      const newHistory = navHistory.slice(0, navIndex + 1)
      newHistory.push(pathname)
      setNavHistory(newHistory)
      setNavIndex(newHistory.length - 1)
    }
  }, [pathname])

  const goBack = () => {
    if (navIndex > 0) {
      const targetIdx = navIndex - 1
      setNavIndex(targetIdx)
      navigate(navHistory[targetIdx])
    }
  }

  const goForward = () => {
    if (navIndex < navHistory.length - 1) {
      const targetIdx = navIndex + 1
      setNavIndex(targetIdx)
      navigate(navHistory[targetIdx])
    }
  }

  // Auto-focus search input on Search page
  useEffect(() => {
    if (pathname === '/search') {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [pathname])

  // Search logic with 200ms debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim()
        
        // 1. Local Filter with Fuse.js (fuzzy matching)
        const songFuse = new Fuse(masterPlaylistData, {
          keys: ['title', 'artist'],
          threshold: 0.4,
          distance: 100
        })
        const localSongs = songFuse.search(q).map(r => r.item).slice(0, 5)

        const playlistFuse = new Fuse(userPlaylists, {
          keys: ['name'],
          threshold: 0.4,
          distance: 100
        })
        const localPlaylists = playlistFuse.search(q).map(r => r.item).slice(0, 3)

        const allArtists = Array.from(new Set(masterPlaylistData.map(s => s.artist)))
        const artistFuse = new Fuse(allArtists.map(a => ({ name: a })), {
          keys: ['name'],
          threshold: 0.4,
          distance: 100
        })
        const localArtists = artistFuse.search(q).map(r => r.item.name).slice(0, 3)

        setResults({ songs: localSongs, playlists: localPlaylists, artists: localArtists })
        setShowSearchDropdown(true)

        // 2. API Fetch (for global YouTube results)
        try {
          const { searchSongs } = await import('../../utils/api.js')
          const apiSongs = await searchSongs(searchQuery)
          
          // Merge API songs with local songs, unique by videoId
          const combinedSongs = [...localSongs]
          apiSongs.forEach(apiS => {
            if (!combinedSongs.find(s => s.videoId === apiS.videoId)) {
              combinedSongs.push(apiS)
            }
          })
          
          setResults(prev => ({ ...prev, songs: combinedSongs.slice(0, 8) }))
        } catch (err) {
          console.error('API search failed', err)
        }

      } else {
        setShowSearchDropdown(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery, masterPlaylistData, userPlaylists])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!barRef.current?.contains(e.target)) {
        setShowSearchDropdown(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSearchDropdown(false)
        searchInputRef.current?.blur()
      }
      
      // Auto-focus logic: If typing letters/numbers and not in an input
      if (
        pathname !== '/search' && 
        /^[a-zA-Z0-9]$/.test(e.key) && 
        !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) &&
        !e.ctrlKey && !e.metaKey && !e.altKey
      ) {
        navigate('/search')
        // The pathname check will trigger the focus useEffect in the next render
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pathname, navigate])

  const handleSongClick = (song) => {
    playSong(song, results.songs, results.songs.indexOf(song))
    setShowSearchDropdown(false)
  }

  const handlePlaylistClick = (name) => {
    navigate(`/playlist/${encodeURIComponent(name)}`)
    setShowSearchDropdown(false)
  }

  const handleArtistClick = (artist) => {
    navigate(`/artist/${encodeURIComponent(artist)}`)
    setShowSearchDropdown(false)
  }

  // Page Title logic
  const getPageTitle = () => {
    if (pathname === '/') return ''
    if (pathname === '/search') return 'search' // input will show
    if (pathname === '/library') return 'Your Library'
    if (pathname.startsWith('/playlist/')) return decodeURIComponent(pathname.split('/').pop())
    if (pathname.startsWith('/artist/')) return decodeURIComponent(pathname.split('/').pop())
    return ''
  }

  const pageTitle = getPageTitle()
  const isSearchPage = pathname === '/search'

  return (
    <div ref={barRef} className="top-bar-sticky" style={{
      position: 'sticky', top: '0', zIndex: 1000,
      height: isMobile ? '64px' : '80px', 
      width: isMobile ? '100%' : 'calc(100% - 64px)',
      margin: isMobile ? '0 0 12px' : '0 32px 24px',
      border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0 12px' : '0 24px',
      paddingTop: isMobile ? '12px' : '16px',
      borderRadius: isMobile ? '0' : '12px',
      background: 'transparent'
    }}>
      
      {/* Left — Hamburger (mobile) or Nav arrows (desktop) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isMobile ? (
          <button onClick={onMenuToggle} style={{
            background: 'rgba(32, 32, 32, 0.3)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.05)',
            color: '#fff',
            width: '40px', height: '40px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            <FiSidebar size={22} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)} style={{
              background: 'rgba(32, 32, 32, 0.3)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: '#fff',
              width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }} className="hover-white" title="Toggle Sidebar">
              <FiSidebar size={22} />
            </button>
            <div style={{ 
              display: 'flex', 
              background: 'rgba(32, 32, 32, 0.3)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              borderRadius: '24px', 
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.05)',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <button onClick={goBack} disabled={navIndex === 0} 
                style={{ width: '44px', height: '40px', background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: navIndex === 0 ? 'not-allowed' : 'pointer', opacity: navIndex === 0 ? 0.4 : 1 }}
                className="nav-arrow-btn">
                <FiArrowLeft size={24} />
              </button>
              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />
              <button onClick={goForward} disabled={navIndex === navHistory.length - 1}
                style={{ width: '44px', height: '40px', background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: navIndex === navHistory.length - 1 ? 'not-allowed' : 'pointer', opacity: navIndex === navHistory.length - 1 ? 0.4 : 1 }}
                className="nav-arrow-btn">
                <FiArrowRight size={24} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Center Title (only when no search bar, desktop only) */}
      {!isMobile && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          {(!isSearchPage && pathname !== '/') && (
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>
              {pageTitle}
            </span>
          )}
        </div>
      )}

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', flex: isMobile ? 1 : 'none', marginLeft: isMobile ? '8px' : '0', minWidth: 0 }}>
        
        {/* Search Bar */}
        {(isSearchPage || pathname === '/') && (
          <div style={{ 
            position: 'relative', 
            width: isMobile ? '100%' : '440px',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(32, 32, 32, 0.3)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderRadius: '24px',
            padding: '0 12px',
            height: isMobile ? '38px' : '42px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
            minWidth: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }} className="search-bar-container">
            <FiSearch style={{ color: '#fff', fontSize: '18px', marginLeft: '4px', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              inputMode="search"
              placeholder="What do you want to play?"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (pathname === '/' && e.target.value) navigate('/search')
              }}
              onClick={() => { if (pathname === '/') navigate('/search') }}
              style={{
                flex: 1, height: '100%', background: 'transparent', border: 'none',
                padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none',
                minWidth: 0
              }}
              className="search-input-premium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{
                background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
              }}>
                <FiX size={16} />
              </button>
            )}
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
            <button title="Browse" onClick={() => {
              setSearchQuery('')
              if (pathname !== '/search') navigate('/search')
            }} style={{ 
              background: 'transparent', border: 'none', color: '#b3b3b3', cursor: 'pointer', 
              padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }} className="hover-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        )}

        {/* Mobile page title (when not on search/home) */}
        {isMobile && !isSearchPage && pathname !== '/' && (
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
            {pageTitle}
          </span>
        )}
      </div>

      <style>{`
        .search-bar-container:focus-within { 
          border: 1px solid rgba(255, 255, 255, 0.15) !important; 
          background: rgba(32, 32, 32, 0.4) !important;
        }
        .search-bar-container:hover { 
          background: rgba(32, 32, 32, 0.4) !important; 
        }
        .hover-white:hover { color: #fff !important; }
        .search-input-premium::placeholder { color: #757575; }
        
        /* Hide browser default clear button */
        .search-input-premium::-webkit-search-cancel-button {
          -webkit-appearance: none;
          appearance: none;
          display: none;
        }
        .search-input-premium::-ms-clear {
          display: none;
          width: 0;
          height: 0;
        }
        
        .topbar-dropdown {
          position: absolute; background: #282828; border-radius: 12px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.5); z-index: 1001;
          animation: dropdownScaleIn 0.2s ease forwards;
        }
        .dropdown-item { height: 40px; display: flex; alignItems: center; padding: 0 16px; font-size: 13px; color: #fff; cursor: pointer; transition: background 0.2s; }
        .dropdown-item:hover { background: #333; }
        .nav-arrow-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05) !important; }
        .recent-search-item:hover { background: rgba(255,255,255,0.08) !important; }
        @keyframes dropdownScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
