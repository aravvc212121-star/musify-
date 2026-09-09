import { useState, useEffect } from 'react'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  useEffect(() => {
    let rafId = null
    const handleResize = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        setIsMobile(window.innerWidth < 768)
      })
    }
    
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])
  
  return isMobile
}
