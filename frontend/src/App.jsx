/**
 * MUSIFY — App Shell
 * Fixed 3-panel Desktop & Tablet Layout
 * Routes: Home, Search, Library, Artist, Charts
 */

import { lazy, Suspense, useState, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom'
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
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'))

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
      transform: visible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 4px, 0)',
      transition: 'opacity 200ms ease-out, transform 200ms ease-out',
      willChange: 'opacity, transform',
      minHeight: '100%'
    }}>
      {children}
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()

  // Redirect first-time visitors to /auth
  useEffect(() => {
    const hasSeenAuth = localStorage.getItem('rhym_auth_seen')
    if (!hasSeenAuth && location.pathname !== '/auth') {
      navigate('/auth', { replace: true })
    }
  }, [])

  // Auth page renders outside the app shell for full-screen takeover
  if (location.pathname === '/auth') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPage />
      </Suspense>
    )
  }

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



  useEffect(() => {
    let rafId = null
    const handleResize = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const w = window.innerWidth
        setIsMobile(w < 768)
        if (w >= 768 && w <= 1024) {
          setIsLeftSidebarCollapsed(true)
        }
      })
    }
    handleResize()
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      if (rafId) cancelAnimationFrame(rafId)
    }
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

        {/* Center Panel (Scrollable content area) */}
        <div className="center-panel" style={{ margin: isMobile ? '0' : '8px 0', borderRadius: isMobile ? '0' : '8px' }}>
          <TopBar isMobile={isMobile} />
          <PageWrapper key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage isMobile={isMobile} />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/artist/:id" element={<ArtistPage />} />
              <Route path="/charts/:id" element={<ChartsPage />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageWrapper>
        </div>

        {!isMobile && <RightSidebar />}
        <Player />
      </div>

      {/* Floating pill nav bar for mobile */}
      {isMobile && !isFullScreenPlayer && <MobileNav />}

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
