/**
 * MUSIFY — App Shell
 * Fixed 3-panel Desktop & Tablet Layout
 * Routes: Home, Search, Library, Artist, Charts
 */

import { lazy, Suspense, useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Player from './components/layout/Player.jsx'
import LeftSidebar from './components/layout/LeftSidebar.jsx'
import RightSidebar from './components/layout/RightSidebar.jsx'
import TopBar from './components/layout/TopBar.jsx'
import MobileNav from './components/layout/MobileNav.jsx'

import HomePage from './pages/HomePage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'

const ArtistPage = lazy(() => import('./pages/ArtistPage.jsx'))
const ChartsPage = lazy(() => import('./pages/ChartsPage.jsx'))
const PlaylistPage = lazy(() => import('./pages/PlaylistPage.jsx'))

/* ─── Loading Spinner ─── */
function PageLoader() {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw', height: '100vh',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#000',
      zIndex: 10000,
      cursor: 'wait'
    }}>
      <div className="premium-spinner" />
      <div style={{ 
        marginTop: '24px',
        color: '#fff', 
        fontSize: '12px', 
        fontWeight: 800, 
        letterSpacing: '4px',
        textTransform: 'uppercase',
        opacity: 0.8,
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        Rhym
      </div>
    </div>
  )
}

/* ─── Page Transition Wrapper ─── */
function PageWrapper({ children }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => { cancelAnimationFrame(raf); setVisible(false) }
  }, [])

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      minHeight: '100%'
    }}>
      {children}
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <Suspense fallback={<PageLoader />}>
      <AppShell location={location} />
    </Suspense>
  )
}

import { usePlayer } from './context/PlayerContext.jsx'

import GlobalModals from './components/ui/GlobalModals.jsx'
import FullScreenPlayer from './components/layout/FullScreenPlayer.jsx'

function AppShell({ location }) {
  const { isRightSidebarOpen, isFullScreenPlayer, isLeftSidebarCollapsed, setIsLeftSidebarCollapsed, currentSong } = usePlayer()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  // Minimum swipe distance (in px) to trigger close
  const minSwipeDistance = 50

  const handleTouchStart = (e) => {
    setTouchEnd(0) // Reset
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    
    // Close sidebar on left swipe
    if (isLeftSwipe) {
      setIsMobileSidebarOpen(false)
    }
  }

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.classList.add('mobile-sidebar-open')
    } else {
      document.body.classList.remove('mobile-sidebar-open')
    }
    return () => document.body.classList.remove('mobile-sidebar-open')
  }, [isMobileSidebarOpen])

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      setIsMobile(w < 768)
      if (w >= 768 && w <= 1024) {
        setIsLeftSidebarCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div id="app-container" style={{
      '--right-w': isRightSidebarOpen ? '280px' : '40px',
      '--left-w': isLeftSidebarCollapsed ? '56px' : '220px',
      '--bottom-nav-h': '0px',
      transition: 'grid-template-columns 0.35s cubic-bezier(0.4,0,0.2,1)',
      display: isFullScreenPlayer ? 'block' : 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'var(--left-w) 1fr var(--right-w)',
      gridTemplateRows: isMobile ? '1fr' : `1fr var(--bottom-bar-h)`
    }}>
      <div 
        id="app-main-content"
        style={isFullScreenPlayer ? {
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 1,
          transformOrigin: 'center center'
        } : {
          display: 'contents'
        }}
      >
        {!isMobile && <LeftSidebar />}

        {/* Mobile Sidebar Drawer */}
        {isMobile && (
          <>
            <div
              className={`mobile-sidebar-backdrop ${isMobileSidebarOpen ? 'open' : ''}`}
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div 
              className={`mobile-sidebar-drawer ${isMobileSidebarOpen ? 'open' : ''}`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <LeftSidebar isMobile onClose={() => setIsMobileSidebarOpen(false)} />
            </div>
          </>
        )}

        {/* Center Panel (Scrollable content area) */}
        <div className="center-panel" style={{ margin: isMobile ? '0' : '8px 0', borderRadius: isMobile ? '0' : '8px' }}>
          <TopBar isMobile={isMobile} onMenuToggle={() => setIsMobileSidebarOpen(v => !v)} />
          <PageWrapper key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage isMobile={isMobile} />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/artist/:id" element={<ArtistPage />} />
              <Route path="/charts/:id" element={<ChartsPage />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageWrapper>
        </div>

        {!isMobile && <RightSidebar />}
        <Player />
      </div>

      <FullScreenPlayer />
      <GlobalModals />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1); } }
        
        .premium-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(0, 210, 255, 0.1);
          border-top: 3px solid var(--accent);
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          position: relative;
        }
        .premium-spinner::after {
          content: '';
          position: absolute;
          top: -3px; left: -3px; right: -3px; bottom: -3px;
          border: 3px solid transparent;
          border-left: 3px solid var(--accent-hover);
          border-radius: 50%;
          animation: spin 1.5s linear infinite reverse;
          opacity: 0.5;
        }

        #app-container {
          background: #000;
          color: #fff;
        }
      `}</style>
    </div>
  )
}
