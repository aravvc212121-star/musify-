/**
 * MUSIFY — Bottom Navigation
 * 4 tabs: Home, Search, Library, Menu (sidebar toggle)
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { FiHome, FiSearch, FiBook, FiMenu } from 'react-icons/fi'

const TABS = [
  { path: '/', label: 'Home', Icon: FiHome },
  { path: '/search', label: 'Search', Icon: FiSearch },
  { path: '/library', label: 'Library', Icon: FiBook },
]

export default function MobileNav({ onMenuToggle }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'calc(64px + var(--safe-bottom, 0px))',
      paddingBottom: 'var(--safe-bottom, 0px)',
      background: 'rgba(18, 18, 18, 0.8)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 1000,
    }}>
      {TABS.map(({ path, label, Icon }) => {
        const active = pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, background: 'none', border: 'none', padding: '12px',
              flex: 1,
              cursor: 'pointer', touchAction: 'manipulation',
              color: active ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div style={{
              transform: active ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'transform 0.3s ease'
            }}>
              <Icon size={24} style={{ 
                strokeWidth: active ? 2.5 : 2,
                filter: active ? 'drop-shadow(0 0 8px rgba(0, 210, 255, 0.5))' : 'none'
              }} />
            </div>
            <span style={{ 
              fontSize: 10, 
              fontWeight: active ? 700 : 500,
              opacity: active ? 1 : 0.7,
              letterSpacing: '0.02em'
            }}>
              {label}
            </span>
          </button>
        )
      })}

      {/* Menu / Sidebar Toggle */}
      <button
        onClick={onMenuToggle}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 4, background: 'none', border: 'none', padding: '12px',
          flex: 1,
          cursor: 'pointer', touchAction: 'manipulation',
          color: 'var(--text-secondary)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <FiMenu size={24} style={{ strokeWidth: 2 }} />
        <span style={{ 
          fontSize: 10, 
          fontWeight: 500,
          opacity: 0.7,
          letterSpacing: '0.02em'
        }}>
          Menu
        </span>
      </button>
    </nav>
  )
}
