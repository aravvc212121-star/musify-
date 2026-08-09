/**
 * RHYM v2.0 — Sidebar (Desktop only)
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Removed history/recents section
 * - Removed playlist references
 * - 3 nav items: Home, Search, Liked
 * - No backdrop-filter blur
 * - Simplified — only shown on desktop via App layout
 */

import { NavLink, useLocation } from 'react-router-dom'
import { FiHome, FiSearch, FiHeart } from 'react-icons/fi'
import { usePlayer } from '../../context/PlayerContext.jsx'

export default function Sidebar() {
  const location = useLocation()
  const { setIsSearchOpen } = usePlayer()

  return (
    <aside style={{
      width: 72, height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: 32, gap: 24,
      background: 'rgba(255,255,255,0.02)',
      borderRight: 'none',
    }}>
      <NavItem to="/" icon={<FiHome size={20} />} isActive={location.pathname === '/'} />
      <NavItem icon={<FiSearch size={20} />} onClick={() => setIsSearchOpen(true)} />
      <NavItem to="/library" icon={<FiHeart size={20} />} isActive={location.pathname === '/library'} />
    </aside>
  )
}

function NavItem({ to, icon, isActive, onClick }) {
  const style = {
    width: 44, height: 44, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
    background: isActive ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
    border: `1px solid ${isActive ? 'rgba(0, 210, 255, 0.15)' : 'transparent'}`,
    cursor: 'pointer', transition: 'all 0.15s',
  }

  if (onClick) {
    return <button onClick={onClick} style={{ ...style, borderStyle: 'solid' }}>{icon}</button>
  }

  return (
    <NavLink to={to} style={style}>
      {icon}
    </NavLink>
  )
}
