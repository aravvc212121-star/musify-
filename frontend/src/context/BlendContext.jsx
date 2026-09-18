import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { usePlayer } from './PlayerContext.jsx'
import toast from 'react-hot-toast'

const BlendContext = createContext(null)

export function useBlend() {
  const context = useContext(BlendContext)
  if (!context) throw new Error('useBlend must be used within a BlendProvider')
  return context
}

export function BlendProvider({ children }) {
  const { currentSong, isPlaying, playSong, togglePlay, seekTo, clearPlayer } = usePlayer()
  const [socket, setSocket] = useState(null)
  const [room, setRoom] = useState(null)
  const [isBlendModalOpen, setIsBlendModalOpen] = useState(false)
  const [showCodePopup, setShowCodePopup] = useState(false)
  const [blendError, setBlendError] = useState(null)
  const [roomHistory, setRoomHistory] = useState([])
  const prevMembersRef = useRef([])
  
  // ─── Chat State ───
  const [chatMessages, setChatMessages] = useState([])
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const isChatOpenRef = useRef(false)
  useEffect(() => { isChatOpenRef.current = isChatOpen }, [isChatOpen])
  
  const applyingRemoteEventRef = useRef(false)
  const currentSongRef = useRef(currentSong)
  const isPlayingRef = useRef(isPlaying)
  const roomRef = useRef(room)
  
  const playSongRef = useRef(playSong)
  const togglePlayRef = useRef(togglePlay)
  const seekToRef = useRef(seekTo)
  
  useEffect(() => { currentSongRef.current = currentSong }, [currentSong])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { roomRef.current = room }, [room])
  useEffect(() => { playSongRef.current = playSong }, [playSong])
  useEffect(() => { togglePlayRef.current = togglePlay }, [togglePlay])
  useEffect(() => { seekToRef.current = seekTo }, [seekTo])

  useEffect(() => {
    // If VITE_API_URL is not set, dynamically point to port 3001 on the current hostname (works for localhost and LAN IPs)
    const backendUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`
    const newSocket = io(backendUrl)
    setSocket(newSocket)

    newSocket.on('room-updated', (updatedRoom) => {
      setRoom(prev => {
        if (!prev) return null
        
        // Check for new members
        if (updatedRoom.members.length > prevMembersRef.current.length) {
          const newMembers = updatedRoom.members.filter(m => !prevMembersRef.current.find(pm => pm.id === m.id))
          newMembers.forEach(m => {
            if (m.id !== newSocket.id) {
              toast.custom((t) => (
                <div style={{ background: '#1a1a1d', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #22d3ee)' }} />
                  <span style={{ color: '#fff', fontSize: 13 }}>{m.name} joined the room</span>
                </div>
              ), { duration: 3000 })
              // Auto-post join system message to chat
              setChatMessages(prev => [...prev, {
                id: `sys-join-${m.id}-${Date.now()}`,
                type: 'system',
                message: `${m.name} joined the room`,
                timestamp: Date.now(),
              }])
            }
          })
        }

        // Check for members who left
        if (updatedRoom.members.length < prevMembersRef.current.length) {
          const leftMembers = prevMembersRef.current.filter(pm => !updatedRoom.members.find(m => m.id === pm.id))
          leftMembers.forEach(m => {
            setChatMessages(prev => [...prev, {
              id: `sys-leave-${m.id}-${Date.now()}`,
              type: 'system',
              message: `${m.name} left the room`,
              timestamp: Date.now(),
            }])
          })
        }

        prevMembersRef.current = updatedRoom.members
        
        return { ...prev, members: updatedRoom.members }
      })
    })

    // ─── Chat message listener ───
    newSocket.on('chat-message', (msg) => {
      setChatMessages(prev => {
        // Deduplicate by id
        if (prev.find(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      // Increment unread if chat is closed and message is from someone else
      if (!isChatOpenRef.current && msg.senderId !== newSocket.id) {
        setUnreadChatCount(prev => prev + 1)
      }
    })

    newSocket.on('room-destroyed', ({ reason }) => {
      toast(reason || 'Room has been closed', {
        icon: '👋',
        style: {
          background: '#1a1a1d',
          color: '#fff',
          border: '1px solid #ef4444'
        }
      })
      setRoom(null)
      setRoomHistory([])
      setChatMessages([])
      setUnreadChatCount(0)
      setIsChatOpen(false)
      clearPlayer()
    })

    newSocket.on('player-event', ({ type, data, timestamp, senderId }) => {
      applyingRemoteEventRef.current = true
      
      try {
        if (type === 'track-change') {
          if (!currentSongRef.current || currentSongRef.current.videoId !== data.track.videoId) {
            playSongRef.current(data.track, null, 0, false, false)
            setRoomHistory(prev => [data.track, ...prev].slice(0, 20))
            // Auto-post track-change system message from remote user
            const senderMember = roomRef.current?.members?.find(m => m.id === senderId)
            const senderName = senderMember?.name || 'Someone'
            setChatMessages(prev => [...prev, {
              id: `sys-track-remote-${data.track.videoId}-${Date.now()}`,
              type: 'track-change',
              changedBy: senderName,
              message: data.track.title || 'Unknown track',
              timestamp: Date.now(),
            }])
          }
        } else if (type === 'play') {
          const latency = (Date.now() - timestamp) / 1000
          const targetPos = (data.position || 0) + latency
          if (!isPlayingRef.current) togglePlayRef.current()
          if (window.__rhymAudio && Math.abs(window.__rhymAudio.currentTime - targetPos) > 1) {
            window.__rhymAudio.currentTime = targetPos
          }
        } else if (type === 'pause') {
          if (isPlayingRef.current) togglePlayRef.current()
          if (window.__rhymAudio && data.position !== undefined) {
            window.__rhymAudio.currentTime = data.position
          }
        } else if (type === 'seek') {
          if (window.__rhymAudio && data.position !== undefined) {
            window.__rhymAudio.currentTime = data.position
          }
        }
      } catch (err) {
        console.error('Error applying remote blend event', err)
      }

      setTimeout(() => {
        applyingRemoteEventRef.current = false
      }, 500)
    })

    newSocket.on('heartbeat', ({ position, isPlaying, timestamp }) => {
      if (applyingRemoteEventRef.current || !window.__rhymAudio) return
      
      const latency = (Date.now() - timestamp) / 1000
      const targetPos = position + latency
      
      if (isPlayingRef.current && isPlaying) {
        const drift = Math.abs(window.__rhymAudio.currentTime - targetPos)
        if (drift > 1.5) {
          applyingRemoteEventRef.current = true
          window.__rhymAudio.currentTime = targetPos
          setTimeout(() => { applyingRemoteEventRef.current = false }, 500)
        }
      }
    })

    return () => newSocket.disconnect()
  }, [])

  const lastTrackId = useRef(currentSong?.videoId)
  const lastIsPlaying = useRef(isPlaying)
  
  useEffect(() => {
    if (!roomRef.current || !socket || applyingRemoteEventRef.current) {
      lastTrackId.current = currentSong?.videoId
      lastIsPlaying.current = isPlaying
      return
    }

    const roomId = roomRef.current.roomId

    if (currentSong?.videoId && currentSong.videoId !== lastTrackId.current) {
      socket.emit('player-event', {
        roomId,
        type: 'track-change',
        data: { track: currentSong, isPlaying }
      })
      lastTrackId.current = currentSong.videoId
      setRoomHistory(prev => {
        if (prev[0]?.videoId === currentSong.videoId) return prev
        return [currentSong, ...prev].slice(0, 20)
      })
      // Auto-post track-change system message to chat (local user changed it)
      const myName = roomRef.current.members.find(m => m.id === socket.id)?.name || 'You'
      setChatMessages(prev => [...prev, {
        id: `sys-track-${currentSong.videoId}-${Date.now()}`,
        type: 'track-change',
        changedBy: myName,
        message: currentSong.title || 'Unknown track',
        timestamp: Date.now(),
      }])
    }
    
    if (isPlaying !== lastIsPlaying.current) {
      socket.emit('player-event', {
        roomId,
        type: isPlaying ? 'play' : 'pause',
        data: { position: window.__rhymAudio ? window.__rhymAudio.currentTime : 0 }
      })
      lastIsPlaying.current = isPlaying
    }

  }, [currentSong, isPlaying, socket])
  
  useEffect(() => {
    const audio = window.__rhymAudio
    if (!audio) return
    
    const handleSeeked = () => {
      if (!roomRef.current || !socket || applyingRemoteEventRef.current) return
      socket.emit('player-event', {
        roomId: roomRef.current.roomId,
        type: 'seek',
        data: { position: audio.currentTime }
      })
    }
    
    audio.addEventListener('seeked', handleSeeked)
    return () => audio.removeEventListener('seeked', handleSeeked)
  }, [socket])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!roomRef.current || !socket || !isPlayingRef.current) return
      if (applyingRemoteEventRef.current) return
      
      socket.emit('heartbeat', {
        roomId: roomRef.current.roomId,
        position: window.__rhymAudio ? window.__rhymAudio.currentTime : 0,
        isPlaying: true
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [socket])

  const createRoom = useCallback((username) => {
    if (!socket) {
      console.error('[Blend] No socket!')
      return
    }
    setBlendError(null)
    console.log('[Blend] Emitting create-room with username:', username)
    socket.emit('create-room', (res) => {
      console.log('[Blend] create-room response:', res)
      if (res.success) {
        socket.emit('join-room', { roomId: res.roomId, username }, (joinRes) => {
          console.log('[Blend] join-room response:', joinRes)
          if (joinRes.success) {
            setRoom({ roomId: res.roomId, members: joinRes.room.members })
            prevMembersRef.current = joinRes.room.members
            setRoomHistory([])
            clearPlayer()
            setIsBlendModalOpen(false)
            setShowCodePopup(true)
          } else {
            setBlendError(joinRes.error || 'Failed to join created room')
          }
        })
      } else {
        setBlendError(res.error || 'Failed to create room')
      }
    })
  }, [socket, clearPlayer])

  const joinRoom = useCallback((code, username) => {
    if (!socket || !code) {
      console.error('[Blend] No socket or code!')
      return
    }
    setBlendError(null)
    console.log('[Blend] Emitting join-room:', code, username)
    socket.emit('join-room', { roomId: code, username }, (res) => {
      console.log('[Blend] join-room response:', res)
      if (res.success) {
        setRoom({ roomId: code, members: res.room.members })
        prevMembersRef.current = res.room.members
        setRoomHistory([])
        clearPlayer()
        setIsBlendModalOpen(false)
      } else {
        setBlendError(res.error || 'Failed to join room')
      }
    })
  }, [socket])

  const leaveRoom = useCallback(() => {
    if (!socket || !roomRef.current) return
    socket.emit('leave-room', roomRef.current.roomId)
    setRoom(null)
    setChatMessages([])
    setUnreadChatCount(0)
    setIsChatOpen(false)
    toast('Left Blend session')
  }, [socket])

  const sendChatMessage = useCallback((message) => {
    if (!socket || !roomRef.current) return
    const trimmed = (message || '').trim()
    if (!trimmed) return
    const me = roomRef.current.members.find(m => m.id === socket.id)
    socket.emit('chat-message', {
      roomId: roomRef.current.roomId,
      message: trimmed,
      senderName: me?.name || 'User',
    })
  }, [socket])

  const openChat = useCallback(() => {
    setIsChatOpen(true)
    setUnreadChatCount(0)
  }, [])

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
  }, [])

  return (
    <BlendContext.Provider value={{
      room,
      socket,
      createRoom,
      joinRoom,
      leaveRoom,
      isBlendModalOpen,
      setIsBlendModalOpen,
      showCodePopup,
      setShowCodePopup,
      blendError,
      setBlendError,
      roomHistory,
      chatMessages,
      unreadChatCount,
      isChatOpen,
      openChat,
      closeChat,
      sendChatMessage,
    }}>
      {children}
    </BlendContext.Provider>
  )
}
