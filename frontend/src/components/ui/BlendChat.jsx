import React, { useState, useRef, useEffect } from 'react'
import { useBlend } from '../../context/BlendContext.jsx'
import { FiSmile, FiSend } from 'react-icons/fi'

const QUICK_EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '💯', '🎶', '❤️', '😎', '🎉']

function formatTime(ts) {
  const d = new Date(ts)
  const h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export default function BlendChat() {
  const {
    room, socket, chatMessages, closeChat, sendChatMessage
  } = useBlend()

  const [input, setInput] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const messagesEndRef = useRef(null)
  const listRef = useRef(null)
  const isNearBottomRef = useRef(true)

  const myId = socket?.id

  // Track if user is near bottom
  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const threshold = 80
    isNearBottomRef.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < threshold
  }

  // Auto-scroll on new messages (only if near bottom)
  useEffect(() => {
    if (isNearBottomRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    sendChatMessage(trimmed)
    setInput('')
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!room) return null

  const members = room.members || []
  const memberNames = members.map(m => m.id === myId ? 'You' : m.name).join(' and ')

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundImage: 'url(/assets/chat-doodle-bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#0b0b0b',
    }}>
      {/* ─── Header ─── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        borderBottom: 'none',
        padding: 'calc(env(safe-area-inset-top, 8px) + 12px) 16px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Left: avatars + room info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Single unified avatar */}
          <div style={{
            width: '34px', height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00d2ff, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,210,255,0.3)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>

          <div style={{
            background: 'rgba(10,10,12,0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
            padding: '6px 16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center'
          }}>
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Blend Room</div>
            <div style={{ color: '#a5a5aa', fontSize: '11px', marginTop: '1px' }}>
              {memberNames}
            </div>
          </div>
        </div>

        {/* Right: close */}
        <button
          onClick={closeChat}
          style={{
            background: 'rgba(10,10,12,0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            color: '#fff',
            width: '42px', height: '42px',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ─── Message List with doodle background ─── */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: 'transparent',
        }}
      >
        {/* Messages container — grows naturally with content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 14px',
          paddingBottom: '8px',
        }}>
          {chatMessages.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', flex: 1, gap: '8px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a3a3e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              <span style={{ color: '#6a6a6e', fontSize: '13px' }}>No messages yet</span>
              <span style={{ color: '#4a4a4e', fontSize: '11px' }}>Say something to your blend room</span>
            </div>
          )}

          {chatMessages.map((msg) => {
            // System message
            if (msg.type === 'system') {
              return (
                <div key={msg.id} style={{
                  display: 'flex', justifyContent: 'center', margin: '10px 0',
                }}>
                  <div style={{
                    width: '240px',
                    background: 'transparent',
                    border: 'none',
                    backdropFilter: 'none',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    color: '#a5a5aa',
                    fontSize: '11px',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    lineHeight: 1.4,
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  }}>
                    {msg.message}
                  </div>
                </div>
              )
            }

            // Track-change message
            if (msg.type === 'track-change') {
              return (
                <div key={msg.id} style={{
                  display: 'flex', justifyContent: 'center', margin: '10px 0',
                }}>
                  <div style={{
                    width: '240px',
                    background: 'transparent',
                    border: 'none',
                    backdropFilter: 'none',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    color: '#a5a5aa',
                    fontSize: '11px',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    lineHeight: 1.4,
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" flexShrink={0}>
                        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      <span>{msg.changedBy || 'Someone'} · Now playing</span>
                    </div>
                    <div style={{ color: '#e8e8ea', fontWeight: 500 }}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              )
            }

            // Regular chat message
            const isMe = msg.senderId === myId
            return (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: '6px',
                margin: '4px 0',
              }}>
                {/* Avatar (other users only) */}
                {!isMe && (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: '#3a3a3e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '12px', fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {(msg.senderName || 'U')[0].toUpperCase()}
                  </div>
                )}

                <div style={{ maxWidth: '72%' }}>
                  {/* Sender name (other users only) */}
                  {!isMe && (
                    <div style={{ color: '#8a8a8e', fontSize: '10px', marginBottom: '2px', marginLeft: '4px' }}>
                      {msg.senderName}
                    </div>
                  )}
                  {/* Bubble */}
                  <div style={{
                    background: isMe
                      ? '#00d2ff'
                      : '#eefaff',
                    backdropFilter: 'none',
                    border: 'none',
                    borderRadius: isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    padding: '8px 12px',
                    color: '#000000',
                    fontSize: '13px',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}>
                    {msg.message}
                  </div>
                  {/* Timestamp */}
                  <div style={{
                    color: '#8a8a8e',
                    fontSize: '10px',
                    marginTop: '3px',
                    textAlign: isMe ? 'right' : 'left',
                    marginLeft: isMe ? 0 : '4px',
                    marginRight: isMe ? '4px' : 0,
                  }}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── Input Bar ─── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        background: 'transparent',
        borderTop: 'none',
        padding: '8px 12px calc(env(safe-area-inset-bottom, 8px) + 8px)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {showEmojis && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 4px)',
            left: '12px',
            background: '#222226',
            borderRadius: '16px',
            padding: '10px 12px',
            display: 'flex',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  setInput(prev => prev + emoji)
                  setShowEmojis(false)
                }}
                style={{
                  background: 'none', border: 'none', fontSize: '22px',
                  cursor: 'pointer', padding: 0, transition: 'transform 0.1s'
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.8)' }}
                onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Combined Input Bar */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: '#222226',
          borderRadius: '24px',
          position: 'relative',
        }}>
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 0 0 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: showEmojis ? '#00d2ff' : '#8a8a8e', transition: 'color 0.2s', flexShrink: 0
            }}
          >
            <FiSmile size={24} />
          </button>

          <textarea
            rows={1}
            name="blend-chat-message-field"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the room"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            data-lpignore="true"
            data-1p-ignore="true"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '16px 20px 16px 12px',
              color: '#fff',
              fontSize: '15px',
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'none',
              overflow: 'hidden',
              lineHeight: '20px',
            }}
          />
        </div>
        <button
          onClick={handleSend}
          style={{
            width: '48px', height: '48px',
            borderRadius: '50%',
            background: '#00d2ff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.15s',
            padding: 0,
          }}
          onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.9)' }}
          onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <FiSend size={20} color="#000000" style={{ marginLeft: '-2px', marginTop: '2px' }} />
        </button>
      </div>
    </div>
  )
}
