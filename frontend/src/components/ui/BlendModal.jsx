import React, { useState, useEffect } from 'react'
import { useBlend } from '../../context/BlendContext.jsx'
import BottomSheet from './BottomSheet.jsx'

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#1a1a1d',
  border: '1px solid #2e2e32',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#ffffff',
  fontSize: 14,
  outline: 'none',
}

export default function BlendModal() {
  const { isBlendModalOpen, setIsBlendModalOpen, createRoom, joinRoom, blendError, setBlendError } = useBlend()
  const [joinCode, setJoinCode] = useState('')
  const [activeTab, setActiveTab] = useState('create')
  const [username, setUsername] = useState(() => localStorage.getItem('blend-username') || '')

  // Handle deep link / query param prefill
  useEffect(() => {
    if (isBlendModalOpen) {
      const params = new URLSearchParams(window.location.search)
      const codeParam = params.get('code')
      if (codeParam) {
        setJoinCode(codeParam)
        setActiveTab('join')
      }
    }
  }, [isBlendModalOpen])

  const handleUsernameChange = (e) => {
    const val = e.target.value.slice(0, 20)
    setUsername(val)
    localStorage.setItem('blend-username', val)
    if (blendError) setBlendError(null)
  }

  const handleJoinChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    setJoinCode(val)
    if (blendError) setBlendError(null)
  }

  const trimmedName = username.trim()
  const canProceed = trimmedName.length > 0

  const handleCreate = () => {
    if (!canProceed) return
    if (blendError) setBlendError(null)
    createRoom(trimmedName)
  }

  const handleJoinSubmit = () => {
    if (!canProceed || !joinCode) return
    if (blendError) setBlendError(null)
    joinRoom(joinCode, trimmedName)
  }

  const sheetStyle = {
    background: '#0d0d0f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 0
  }

  return (
    <BottomSheet isOpen={isBlendModalOpen} onClose={() => setIsBlendModalOpen(false)} sheetStyle={sheetStyle}>
      <div style={{ padding: '4px 20px 28px' }}>

        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 4, background: '#3a3a3d', margin: '10px auto 18px' }} />

        {/* HEADER ROW */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#22d3ee',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0d0d0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div>
            <h2 style={{ color: '#ffffff', fontSize: 15, fontWeight: 500, margin: 0 }}>Blend rooms</h2>
            <p style={{ color: '#8a8a8f', fontSize: 12, margin: 0 }}>Listen together, live</p>
          </div>
        </div>

        {/* USERNAME BOX */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: '#8a8a8f', fontSize: 12, fontWeight: 500, marginBottom: 7, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Your name
          </label>
          <input
            type="text"
            placeholder="e.g. Alex"
            value={username}
            onChange={handleUsernameChange}
            maxLength={20}
            style={{
              ...inputStyle,
              border: canProceed ? '1px solid #22d3ee' : '1px solid #2e2e32',
              transition: 'border-color 0.2s'
            }}
          />
        </div>

        {/* ERROR */}
        {blendError && (
          <div style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
            {blendError}
          </div>
        )}

        {/* SEGMENTED TAB CONTROL */}
        <div style={{ display: 'flex', background: '#1a1a1d', borderRadius: 10, padding: 3, marginBottom: 18 }}>
          <div
            onClick={() => { setActiveTab('create'); if (blendError) setBlendError(null); }}
            style={{
              flex: 1, textAlign: 'center', padding: 8, borderRadius: 8, cursor: 'pointer',
              background: activeTab === 'create' ? '#2a2a2e' : 'transparent',
              color: activeTab === 'create' ? '#ffffff' : '#8a8a8f',
              fontSize: 13, transition: 'background 0.2s, color 0.2s'
            }}
          >
            Create
          </div>
          <div
            onClick={() => { setActiveTab('join'); if (blendError) setBlendError(null); }}
            style={{
              flex: 1, textAlign: 'center', padding: 8, borderRadius: 8, cursor: 'pointer',
              background: activeTab === 'join' ? '#2a2a2e' : 'transparent',
              color: activeTab === 'join' ? '#ffffff' : '#8a8a8f',
              fontSize: 13, transition: 'background 0.2s, color 0.2s'
            }}
          >
            Join
          </div>
        </div>

        {/* CREATE PANEL */}
        {activeTab === 'create' && (
          <div>
            <h3 style={{ color: '#ffffff', fontSize: 14, fontWeight: 500, margin: '0 0 4px 0' }}>Start a room</h3>
            <p style={{ color: '#8a8a8f', fontSize: 12, lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Up to 2 friends can join and control playback with you.
            </p>

            {/* Avatar row */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: '#22d3ee',
                border: '2px solid #0d0d0f', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', fontSize: 11, fontWeight: 600, zIndex: 3, boxSizing: 'border-box'
              }}>
                {trimmedName ? trimmedName[0].toUpperCase() : '?'}
              </div>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2a2a2e', border: '2px dashed #4a4a4e', marginLeft: -8, zIndex: 2, boxSizing: 'border-box' }} />
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2a2a2e', border: '2px dashed #4a4a4e', marginLeft: -8, zIndex: 1, boxSizing: 'border-box' }} />
            </div>

            <button
              onClick={handleCreate}
              disabled={!canProceed}
              style={{
                width: '100%',
                background: canProceed ? '#22d3ee' : '#2a2a2e',
                color: canProceed ? '#0d0d0f' : '#5a5a5f',
                border: 'none', borderRadius: 12, padding: 13,
                fontSize: 14, fontWeight: 600,
                cursor: canProceed ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              Create room
            </button>
          </div>
        )}

        {/* JOIN PANEL */}
        {activeTab === 'join' && (
          <div>
            <h3 style={{ color: '#ffffff', fontSize: 14, fontWeight: 500, margin: '0 0 4px 0' }}>Join a room</h3>
            <p style={{ color: '#8a8a8f', fontSize: 12, lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Enter the code your friend shared.
            </p>

            <input
              type="text"
              inputMode="numeric"
              placeholder="042817"
              value={joinCode}
              onChange={handleJoinChange}
              onKeyDown={e => e.key === 'Enter' && handleJoinSubmit()}
              maxLength={6}
              style={{ ...inputStyle, marginBottom: 14, letterSpacing: joinCode ? '2px' : 'normal' }}
            />

            <button
              onClick={handleJoinSubmit}
              disabled={!canProceed || joinCode.length < 6}
              style={{
                width: '100%',
                background: (canProceed && joinCode.length === 6) ? '#22d3ee' : '#2a2a2e',
                color: (canProceed && joinCode.length === 6) ? '#0d0d0f' : '#5a5a5f',
                border: 'none', borderRadius: 12, padding: 13,
                fontSize: 14, fontWeight: 600,
                cursor: (canProceed && joinCode.length === 6) ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              Join room
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
