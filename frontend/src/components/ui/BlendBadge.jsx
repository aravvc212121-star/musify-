import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBlend } from '../../context/BlendContext.jsx'

export default function BlendBadge() {
  const { room, setIsBlendModalOpen, leaveRoom } = useBlend()

  if (!room) return null

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9000] flex items-center gap-3 bg-[#0d0d0f]/80 backdrop-blur-md px-3 py-2 rounded-full"
      >
        <div 
          onClick={() => setIsBlendModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
            color: '#0d0d0f',
            fontSize: 11,
            fontWeight: 500,
            padding: '4px 10px',
            borderRadius: 20,
            cursor: 'pointer'
          }}
        >
          Blended · {room.members?.length || 1}/3
        </div>
        
        <button 
          onClick={leaveRoom}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6a6a6e',
            fontSize: 11,
            cursor: 'pointer'
          }}
        >
          Leave
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
