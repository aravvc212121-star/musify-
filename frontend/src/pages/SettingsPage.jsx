/**
 * RHYM — Settings Screen
 * ─────────────────────────────────────────────
 * Dark theme settings with grouped sections,
 * toggle switches, and profile card.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiCreditCard,
  FiShield,
  FiVolume2,
  FiWifi,
  FiSliders,
  FiRepeat,
  FiDownload,
  FiTrash2,
  FiBell,
  FiMoon,
  FiGlobe,
  FiHelpCircle,
  FiInfo,
  FiLogOut,
} from 'react-icons/fi'
import { useIsMobile } from '../hooks/useIsMobile.js'

/* ─── Toggle Switch Component ─── */
function ToggleSwitch({ isOn, onToggle }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(!isOn) }}
      style={{
        width: '38px',
        height: '22px',
        borderRadius: '11px',
        background: isOn ? '#38b2ac' : '#3a3a3a',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.25s ease',
        flexShrink: 0,
        padding: 0,
      }}
      aria-checked={isOn}
      role="switch"
    >
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#ffffff',
        position: 'absolute',
        top: '2px',
        left: isOn ? '18px' : '2px',
        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </button>
  )
}

/* ─── Setting Row Component ─── */
function SettingRow({ icon: Icon, label, value, hasChevron, toggle, isOn, onToggle, isLast, onClick }) {
  return (
    <>
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '12px 16px',
          minHeight: '48px',
          cursor: onClick || toggle ? 'pointer' : 'default',
          transition: 'background 0.15s ease',
        }}
        onPointerEnter={e => { if (onClick || toggle) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
        onPointerLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        {/* Icon */}
        <Icon size={19} color="#a7a7a7" style={{ flexShrink: 0 }} />

        {/* Label */}
        <span style={{
          flex: 1,
          fontSize: '15px',
          fontWeight: 500,
          color: '#ffffff',
          letterSpacing: '-0.1px',
        }}>
          {label}
        </span>

        {/* Right side: value text, toggle, or chevron */}
        {value && (
          <span style={{
            fontSize: '14px',
            color: '#6b6b6b',
            fontWeight: 400,
            marginRight: hasChevron ? '4px' : '0',
          }}>
            {value}
          </span>
        )}
        {toggle && <ToggleSwitch isOn={isOn} onToggle={onToggle} />}
        {hasChevron && <FiChevronRight size={18} color="#4a4a4a" style={{ flexShrink: 0 }} />}
      </div>
      {!isLast && (
        <div style={{
          height: '1px',
          background: '#232323',
          margin: '0 16px',
        }} />
      )}
    </>
  )
}

/* ─── Section Group Component ─── */
function SettingsSection({ label, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Section label */}
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#6b6b6b',
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        padding: '0 4px',
        marginBottom: '8px',
      }}>
        {label}
      </div>
      {/* Card */}
      <div style={{
        background: '#141414',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

/* ═══ SETTINGS PAGE ═══ */
export default function SettingsPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [dataSaver, setDataSaver] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rhym_data_saver') || 'false') } catch { return false }
  })
  const [isScrolled, setIsScrolled] = useState(false)

  // Persist data saver toggle
  useEffect(() => {
    localStorage.setItem('rhym_data_saver', JSON.stringify(dataSaver))
  }, [dataSaver])

  // Fade out header when scrolled down (like home tab)
  useEffect(() => {
    const panel = document.querySelector('.center-panel')
    if (!panel) return
    let rafId = null
    const THRESHOLD = 20
    const onScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        setIsScrolled(panel.scrollTop > THRESHOLD)
      })
    }
    panel.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      panel.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // Paint panel black
  useEffect(() => {
    const panel = document.querySelector('.center-panel')
    if (!panel) return
    const prev = panel.style.background
    panel.style.background = ''
    return () => { panel.style.background = prev }
  }, [])

  // Cache size estimation
  const [cacheSize, setCacheSize] = useState('0 MB')
  useEffect(() => {
    try {
      let total = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        const val = localStorage.getItem(key)
        if (val) total += val.length * 2 // UTF-16
      }
      const mb = (total / (1024 * 1024)).toFixed(1)
      setCacheSize(`${mb} MB`)
    } catch {
      setCacheSize('—')
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('rhym_auth_seen')
    navigate('/auth', { replace: true })
  }

  return (
    <div style={{
      background: 'transparent',
      minHeight: '100dvh',
      color: '#ffffff',
      animation: 'fadeIn 0.3s ease',
    }}>
      {/* ─── Top Header ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px 0px',
        position: 'sticky',
        top: 0,
        background: 'transparent',
        zIndex: 100,
        opacity: isScrolled ? 0 : 1,
        pointerEvents: isScrolled ? 'none' : 'auto',
        transition: 'opacity 0.25s ease',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Go back"
        >
          <FiChevronLeft size={22} />
        </button>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 700,
          margin: 0,
          letterSpacing: '-0.3px',
        }}>
          Settings
        </h1>
      </div>

      {/* ─── Content ─── */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: isMobile ? '20px' : '4px',
      }}>
        {/* ─── Profile Card ─── */}
        <div
          onClick={() => navigate('/auth')}
          style={{
            background: '#141414',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            marginBottom: '24px',
            transition: 'background 0.15s ease',
          }}
          onPointerEnter={e => { e.currentTarget.style.background = '#1a1a1a' }}
          onPointerLeave={e => { e.currentTarget.style.background = '#141414' }}
        >
          {/* Avatar */}
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '2px solid #2a2a2a',
          }}>
            <FiUser size={22} color="#a7a7a7" />
          </div>

          {/* Name + Subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.3,
            }}>
              Rhym User
            </div>
            <div style={{
              fontSize: '13px',
              color: '#6b6b6b',
              marginTop: '2px',
              fontWeight: 400,
            }}>
              View profile • Free Plan
            </div>
          </div>

          {/* Chevron */}
          <FiChevronRight size={20} color="#4a4a4a" style={{ flexShrink: 0 }} />
        </div>

        {/* ─── ACCOUNT ─── */}
        <SettingsSection label="Account">
          <SettingRow icon={FiUser} label="Account details" hasChevron onClick={() => navigate('/auth')} />
          <SettingRow icon={FiCreditCard} label="Subscription & billing" hasChevron onClick={() => {}} />
          <SettingRow icon={FiShield} label="Privacy & security" hasChevron isLast onClick={() => {}} />
        </SettingsSection>

        {/* ─── PLAYBACK ─── */}
        <SettingsSection label="Playback">
          <SettingRow icon={FiVolume2} label="Audio quality" value="High" hasChevron onClick={() => {}} />
          <SettingRow icon={FiWifi} label="Data saver on mobile" toggle isOn={dataSaver} onToggle={setDataSaver} />
          <SettingRow icon={FiSliders} label="Equalizer" hasChevron onClick={() => {}} />
          <SettingRow icon={FiRepeat} label="Crossfade" value="Off" hasChevron isLast onClick={() => {}} />
        </SettingsSection>

        {/* ─── STORAGE ─── */}
        <SettingsSection label="Storage">
          <SettingRow icon={FiDownload} label="Downloads" value="1.2 GB" hasChevron onClick={() => {}} />
          <SettingRow icon={FiTrash2} label="Clear cache" value={cacheSize} hasChevron isLast onClick={() => {
            try {
              // Only clear non-essential cache keys
              const keysToKeep = ['rhym_auth_seen', 'savedSongs', 'savedArtists', 'rhym_last_played', 'rhym_playlists', 'rhym_data_saver']
              const allKeys = []
              for (let i = 0; i < localStorage.length; i++) allKeys.push(localStorage.key(i))
              allKeys.forEach(k => { if (!keysToKeep.includes(k)) localStorage.removeItem(k) })
              setCacheSize('0.0 MB')
            } catch {}
          }} />
        </SettingsSection>

        {/* ─── PREFERENCES ─── */}
        <SettingsSection label="Preferences">
          <SettingRow icon={FiBell} label="Notifications" hasChevron onClick={() => {}} />
          <SettingRow icon={FiMoon} label="Appearance" value="Dark" hasChevron onClick={() => {}} />
          <SettingRow icon={FiGlobe} label="Language" value="English" hasChevron isLast onClick={() => {}} />
        </SettingsSection>

        {/* ─── SUPPORT ─── */}
        <SettingsSection label="Support">
          <SettingRow icon={FiHelpCircle} label="Help & support" hasChevron onClick={() => {}} />
          <SettingRow icon={FiInfo} label="About" value="v2.0.1" hasChevron isLast onClick={() => {}} />
        </SettingsSection>

        {/* ─── LOG OUT ─── */}
        <div
          onClick={handleLogout}
          style={{
            background: '#141414',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginTop: '8px',
            transition: 'background 0.15s ease',
          }}
          onPointerEnter={e => { e.currentTarget.style.background = '#1c1010' }}
          onPointerLeave={e => { e.currentTarget.style.background = '#141414' }}
        >
          <span style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#f04a4a',
            letterSpacing: '0.1px',
          }}>
            Log out
          </span>
        </div>

        {/* App version footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          paddingBottom: '0px',
        }}>
          <span style={{
            fontSize: '11px',
            color: '#3a3a3a',
            fontWeight: 500,
          }}>
            Rhym v2.0.1
          </span>
        </div>
      </div>
    </div>
  )
}
