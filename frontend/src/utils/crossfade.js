/**
 * RHYM — Crossfade Utility
 * ─────────────────────────────────────────────
 * Implements an independent dual-player crossfade system 
 * with an ease-in-out cosine curve.
 * 
 * Approach:
 * - playerA (fade out) = cloned audio element holding the old song
 * - playerB (fade in) = main app audio element holding the new song
 */

class CrossfadeManager {
  constructor() {
    this.fadePlayer = null // Secondary player (playerA fading out)
    this.mainPlayer = null // Main player (playerB fading in)
    this.isCrossfading = false
    this.crossfadeDuration = 6 // seconds
    this.crossfadeEnabled = true
    this.crossfadeInterval = null
  }

  init(mainAudioElement) {
    this.mainPlayer = mainAudioElement
    if (typeof window !== 'undefined' && !this.fadePlayer) {
      this.fadePlayer = new Audio()
      this.fadePlayer.preload = 'auto'
    }
  }

  setDuration(seconds) {
    this.crossfadeDuration = seconds
  }

  setEnabled(enabled) {
    this.crossfadeEnabled = enabled
  }

  /**
   * Cosine ease-in-out calculation
   * @param {number} t - Progress (0 to 1)
   */
  getEasedVolume(t) {
    return 0.5 * (1 - Math.cos(Math.PI * t))
  }

  /**
   * Start crossfade: Clones the current playback into fadePlayer (playerA),
   * allowing the main app to load the next song into mainPlayer (playerB).
   * 
   * @param {number} targetVolume - Final volume (0 to 1)
   * @param {Function} triggerNext - Callback to trigger the app's playNext()
   */
  startCrossfade(targetVolume, triggerNext) {
    if (!this.mainPlayer || !this.fadePlayer || !this.mainPlayer.src) return
    if (this.isCrossfading) return

    this.isCrossfading = true

    // 1. Setup playerA (fadePlayer) with current song
    this.fadePlayer.src = this.mainPlayer.src
    this.fadePlayer.currentTime = this.mainPlayer.currentTime
    this.fadePlayer.volume = this.mainPlayer.volume
    
    // Play the fade player
    this.fadePlayer.play().catch(e => console.warn('Crossfade A blocked:', e))

    // 2. Trigger the app's native next-song logic with a slight delay to prevent double audio glitch
    // This loads the new song into mainPlayer (playerB)
    setTimeout(() => {
      triggerNext()
      // 3. Ensure playerB starts at volume 0 immediately after triggering
      this.mainPlayer.volume = 0
    }, 50)

    const durationMs = this.crossfadeDuration * 1000
    const startTime = Date.now()

    if (this.crossfadeInterval) clearInterval(this.crossfadeInterval)

    this.crossfadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      let t = elapsed / durationMs

      if (t >= 1) {
        t = 1
        this.finishCrossfade(targetVolume)
      } else {
        const easedT = this.getEasedVolume(t)
        // Fade out A (fadePlayer), Fade in B (mainPlayer)
        this.fadePlayer.volume = Math.max(0, targetVolume * (1 - easedT))
        
        // Only fade in B if it has loaded and started playing
        if (this.mainPlayer.currentTime > 0) {
          this.mainPlayer.volume = Math.min(targetVolume, targetVolume * easedT)
        } else {
          this.mainPlayer.volume = 0
        }
      }
    }, 50)
  }

  /**
   * Finish the crossfade
   */
  finishCrossfade(targetVolume) {
    if (this.crossfadeInterval) clearInterval(this.crossfadeInterval)
    this.isCrossfading = false

    this.fadePlayer.pause()
    this.fadePlayer.removeAttribute('src')
    this.fadePlayer.load()

    if (this.mainPlayer) {
      this.mainPlayer.volume = targetVolume
    }
  }

  /**
   * Cancel ongoing crossfade immediately (e.g. if user skips manually)
   */
  cancelCrossfade(targetVolume) {
    if (this.crossfadeInterval) clearInterval(this.crossfadeInterval)
    this.isCrossfading = false
    
    if (this.fadePlayer) {
      this.fadePlayer.pause()
      this.fadePlayer.removeAttribute('src')
      this.fadePlayer.load()
    }
    if (this.mainPlayer) {
      this.mainPlayer.volume = targetVolume
    }
  }

  /**
   * Start fade out only (no next song)
   */
  startFadeOut(targetVolume) {
    if (!this.mainPlayer || !this.mainPlayer.src) return
    if (this.isCrossfading) return

    this.isCrossfading = true

    const durationMs = this.crossfadeDuration * 1000
    const startTime = Date.now()

    if (this.crossfadeInterval) clearInterval(this.crossfadeInterval)

    this.crossfadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      let t = elapsed / durationMs

      if (t >= 1) {
        t = 1
        if (this.crossfadeInterval) clearInterval(this.crossfadeInterval)
        this.isCrossfading = false
        this.mainPlayer.pause()
        this.mainPlayer.volume = targetVolume // restore for next play
      } else {
        const easedT = this.getEasedVolume(t)
        this.mainPlayer.volume = Math.max(0, targetVolume * (1 - easedT))
      }
    }, 50)
  }

  /**
   * Check if crossfade should trigger based on remaining time
   */
  checkCrossfade(currentTime, duration, targetVolume, hasNextSong, triggerNext) {
    if (!this.crossfadeEnabled || this.isCrossfading || duration <= 0) return

    const remainingTime = duration - currentTime
    
    // If we are exactly at the crossfade boundary
    if (remainingTime <= this.crossfadeDuration && remainingTime > 0.5) {
      if (hasNextSong) {
        this.startCrossfade(targetVolume, triggerNext)
      } else {
        this.startFadeOut(targetVolume)
      }
    }
  }
}

export const crossfadeManager = new CrossfadeManager()
