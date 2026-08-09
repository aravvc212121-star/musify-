/**
 * RHYM — Auth Page (Login / Signup)
 * Dark, minimal, boutique-feeling auth flow.
 * No backend wired — all handlers are placeholders.
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './AuthPage.css'

/* ─────────────────────────────────────────────
   SVG Logo (5-bar soundwave)
   ───────────────────────────────────────────── */
function RhymLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <rect x="10" y="33" width="10" height="34" rx="5" />
      <rect x="28" y="21" width="10" height="58" rx="5" />
      <rect x="45" y="5"  width="10" height="90" rx="5" />
      <rect x="62" y="21" width="10" height="58" rx="5" />
      <rect x="80" y="33" width="10" height="34" rx="5" />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   Meter Strip (decorative pulsing bars)
   ───────────────────────────────────────────── */
function MeterStrip({ count = 60, maxHeight = 28, className = '' }) {
  const bars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      height: 4 + Math.random() * (maxHeight - 4),
      duration: 1.8 + Math.random() * 2.4,
      delay: Math.random() * 3,
    }))
  }, [count, maxHeight])

  return (
    <div className={`auth-meter ${className}`}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className="auth-meter-bar"
          style={{
            height: `${bar.height}px`,
            '--dur': `${bar.duration}s`,
            '--delay': `${bar.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Social Icons (brand colors preserved)
   ───────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.24 16.7 4.89 10.55 8.7 10.3c1.25.07 2.12.72 2.88.76.96-.2 1.88-.89 2.93-.8 1.32.11 2.33.67 2.99 1.73-2.72 1.64-2.08 5.27.57 6.3-.49 1.27-1.12 2.53-2.02 3.99zM12.03 10.22c-.12-2.39 1.82-4.42 4.08-4.62.33 2.69-2.41 4.7-4.08 4.62z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
    </svg>
  )
}

/* ═════════════════════════════════════════════
   AuthPage Component
   ═════════════════════════════════════════════ */
export default function AuthPage() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const navigate = useNavigate()

  const isSignup = mode === 'signup'

  const handleChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }, [])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    // TODO: Connect auth backend
    console.log(`[Rhym Auth] ${isSignup ? 'Signup' : 'Sign in'}:`, formData)
    localStorage.setItem('rhym_auth_seen', '1')
    navigate('/')
  }, [formData, isSignup, navigate])

  const handleSocial = useCallback((provider) => {
    // TODO: Connect OAuth provider
    console.log(`[Rhym Auth] Social login: ${provider}`)
    localStorage.setItem('rhym_auth_seen', '1')
    navigate('/')
  }, [navigate])

  const handleGuest = useCallback(() => {
    // TODO: Handle guest flow
    console.log('[Rhym Auth] Continue as guest')
    localStorage.setItem('rhym_auth_seen', '1')
    navigate('/')
  }, [navigate])

  const switchMode = useCallback(() => {
    setMode(prev => prev === 'signin' ? 'signup' : 'signin')
  }, [])

  return (
    <div className="auth-page" role="main">
      {/* Noise overlay */}
      <div className="auth-noise" aria-hidden="true" />

      {/* ──── LEFT PANEL (Desktop Hero) ──── */}
      <div className="auth-left" aria-hidden="true">
        {/* Lockup */}
        <div className="auth-lockup">
          <div className="auth-logo-tile">
            <RhymLogo />
          </div>
          <span className="auth-lockup-text">Rhym</span>
        </div>

        {/* Hero */}
        <div className="auth-hero">
          <p className="auth-kicker">Every track, in time</p>
          <h1 className="auth-hero-title">Rhym</h1>
          <p className="auth-hero-sub">
            A listening experience stripped to its essence. No clutter,
            no noise — just you and the music.
          </p>
          <MeterStrip count={60} maxHeight={28} />
        </div>

        {/* Footer */}
        <div className="auth-left-footer">
          <span>© 2026 Rhym</span>
          <span>No skips, no noise</span>
        </div>
      </div>

      {/* ──── RIGHT PANEL (Auth Card) ──── */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Mobile header */}
          <div className="auth-mobile-header">
            <div className="auth-mobile-logo">
              <RhymLogo size={22} />
            </div>
            <span className="auth-mobile-wordmark">Rhym</span>
            <MeterStrip count={40} maxHeight={18} className="auth-mobile-meter" />
          </div>

          {/* Tabs */}
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <div
              className="auth-tab-indicator"
              data-active={mode}
              aria-hidden="true"
            />
            <button
              className="auth-tab"
              role="tab"
              id="tab-signin"
              data-active={String(mode === 'signin')}
              aria-selected={mode === 'signin'}
              aria-controls="panel-auth"
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <button
              className="auth-tab"
              role="tab"
              id="tab-signup"
              data-active={String(mode === 'signup')}
              aria-selected={mode === 'signup'}
              aria-controls="panel-auth"
              onClick={() => setMode('signup')}
            >
              Create account
            </button>
          </div>

          {/* Form */}
          <div role="tabpanel" id="panel-auth" aria-labelledby={isSignup ? 'tab-signup' : 'tab-signin'}>
            <h2 className="auth-form-heading">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="auth-form-sub">
              {isSignup
                ? 'Start your journey with Rhym today.'
                : 'Sign in to pick up right where you left off.'}
            </p>

            <form onSubmit={handleSubmit} autoComplete="on" noValidate>
              {/* Full Name — animated in/out */}
              <div className="auth-field-animated" data-visible={String(isSignup)}>
                <div>
                  <div className="auth-field">
                    <label htmlFor="auth-name" className="auth-label">Full name</label>
                    <input
                      id="auth-name"
                      className="auth-input"
                      type="text"
                      name="name"
                      placeholder="Your full name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      tabIndex={isSignup ? 0 : -1}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="auth-field">
                <label htmlFor="auth-email" className="auth-label">Email</label>
                <input
                  id="auth-email"
                  className="auth-input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="auth-field">
                <label htmlFor="auth-password" className="auth-label">Password</label>
                <input
                  id="auth-password"
                  className="auth-input"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Submit */}
              <button type="submit" className="auth-submit" id="auth-submit-btn">
                {isSignup ? 'Create account' : 'Sign in'}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider" aria-hidden="true">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">Or continue with</span>
              <div className="auth-divider-line" />
            </div>

            {/* Social Buttons */}
            <div className="auth-socials">
              <button
                className="auth-social-btn"
                id="auth-social-google"
                type="button"
                onClick={() => handleSocial('google')}
              >
                <GoogleIcon /> Continue with Google
              </button>
              <button
                className="auth-social-btn"
                id="auth-social-apple"
                type="button"
                onClick={() => handleSocial('apple')}
              >
                <AppleIcon /> Continue with Apple
              </button>
              <button
                className="auth-social-btn"
                id="auth-social-facebook"
                type="button"
                onClick={() => handleSocial('facebook')}
              >
                <FacebookIcon /> Continue with Facebook
              </button>
            </div>

            {/* Guest link */}
            <button
              className="auth-guest"
              id="auth-guest-link"
              type="button"
              onClick={handleGuest}
            >
              Continue as guest <span className="auth-guest-arrow">→</span>
            </button>

            {/* Footer toggle */}
            <div className="auth-footer-toggle">
              {isSignup ? (
                <>Already have an account?{' '}<button onClick={switchMode} type="button">Sign in</button></>
              ) : (
                <>Don&apos;t have an account?{' '}<button onClick={switchMode} type="button">Create one</button></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
