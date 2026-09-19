import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff } from 'react-icons/fi'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.24 16.7 4.89 10.55 8.7 10.3c1.25.07 2.12.72 2.88.76.96-.2 1.88-.89 2.93-.8 1.32.11 2.33.67 2.99 1.73-2.72 1.64-2.08 5.27.57 6.3-.49 1.27-1.12 2.53-2.02 3.99zM12.03 10.22c-.12-2.39 1.82-4.42 4.08-4.62.33 2.69-2.41 4.7-4.08 4.62z"/>
    </svg>
  )
}

function RhymLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 512 512" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M160 400 L160 140 Q160 110 185 110 L280 110 Q340 110 340 170 Q340 230 280 230 L220 230"
        fill="none" stroke="#fff" strokeWidth="38" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="240" y1="230" x2="360" y2="400"
        stroke="#38b2ac" strokeWidth="38" strokeLinecap="round"/>
      <circle cx="370" cy="110" r="16" fill="#38b2ac"/>
    </svg>
  )
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signup') // 'signup' | 'login'
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ username: '', email: '', password: '' })

  const isSignup = mode === 'signup'

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: wire up sign up logic later
    console.log(`${isSignup ? 'Signup' : 'Login'} payload:`, formData)
    localStorage.setItem('rhym_auth_seen', '1')
    navigate('/')
  }

  const handleSocial = (provider) => {
    // TODO: wire up Google/Facebook/Apple auth
    console.log(`Social auth triggered for: ${provider}`)
    localStorage.setItem('rhym_auth_seen', '1')
    navigate('/')
  }

  const handleGuest = () => {
    // TODO: wire up guest login
    console.log('Continuing as guest')
    localStorage.setItem('rhym_auth_seen', '1')
    navigate('/')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      overflowY: 'auto',
      background: '#000000',
      color: '#fff',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 1. Logo */}
      <div style={{
        width: '64px',
        height: '64px',
        background: '#0a0a0a',
        border: '1px solid #1e1e1e',
        borderRadius: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        flexShrink: 0
      }}>
        <RhymLogo />
      </div>

      {/* 2. Heading */}
      <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#8a8a8a' }}>
          {isSignup ? 'Join Rhym and start listening together' : 'Sign in to pick up where you left off'}
        </p>
      </div>

      {/* 3. Form Fields */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isSignup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#8a8a8a' }}>Username</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="yourusername"
              style={{
                width: '100%',
                background: '#141414',
                border: '1px solid #262626',
                borderRadius: '10px',
                padding: '13px 14px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none'
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#8a8a8a' }}>Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            style={{
              width: '100%',
              background: '#141414',
              border: '1px solid #262626',
              borderRadius: '10px',
              padding: '13px 14px',
              color: '#fff',
              fontSize: '15px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#8a8a8a' }}>Password</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#141414',
                border: '1px solid #262626',
                borderRadius: '10px',
                padding: '13px 44px 13px 14px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: '#5a5a5a',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>

        {/* 4. Primary Action Button */}
        <button
          type="submit"
          style={{
            marginTop: '12px',
            width: '100%',
            background: '#38b2ac',
            color: '#000000',
            border: 'none',
            borderRadius: '24px',
            padding: '13px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>

      {/* 5. Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#232323' }} />
        <span style={{ fontSize: '12px', color: '#5a5a5a' }}>or continue with</span>
        <div style={{ flex: 1, height: '1px', background: '#232323' }} />
      </div>

      {/* 6. Social Auth Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={() => handleSocial('Google')}
          style={{
            width: '100%',
            background: '#141414',
            border: '1px solid #262626',
            borderRadius: '24px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <GoogleIcon /> Continue with Google
        </button>
        <button
          onClick={() => handleSocial('Facebook')}
          style={{
            width: '100%',
            background: '#141414',
            border: '1px solid #262626',
            borderRadius: '24px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <FacebookIcon /> Continue with Facebook
        </button>
        <button
          onClick={() => handleSocial('Apple')}
          style={{
            width: '100%',
            background: '#141414',
            border: '1px solid #262626',
            borderRadius: '24px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <AppleIcon /> Continue with Apple
        </button>

        <button
          onClick={handleGuest}
          style={{
            background: 'none',
            border: 'none',
            color: '#8a8a8a',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '12px',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          Continue as a guest <span style={{ fontSize: '15px' }}>→</span>
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {/* 7. Mode Toggle */}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <span style={{ fontSize: '13px', color: '#8a8a8a' }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
        </span>
        <button
          onClick={() => setMode(isSignup ? 'login' : 'signup')}
          style={{
            background: 'none',
            border: 'none',
            color: '#38b2ac',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            padding: 0
          }}
        >
          {isSignup ? 'Log in' : 'Sign up'}
        </button>
      </div>
    </div>
  )
}
