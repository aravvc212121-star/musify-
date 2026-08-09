/**
 * RHYM — Share Song Utility
 * ─────────────────────────────────────────────
 * Uses Web Share API (native share dialog) with
 * clipboard fallback. Works across Android, iOS, and Web.
 *
 * Usage: shareSong(song) → Promise<{ success, method }>
 */

import toast from 'react-hot-toast'

// ─── App domain (set to your production URL when deployed) ───
const APP_DOMAIN = null // e.g. 'https://myapp.com'

/**
 * Build the share URL for a song.
 * Priority: app deep link → YouTube fallback
 */
function getSongUrl(song) {
  if (APP_DOMAIN && song.videoId) {
    return `${APP_DOMAIN}/song/${song.videoId}`
  }
  // Fallback to YouTube
  return `https://youtube.com/watch?v=${song.videoId}`
}

/**
 * Build the share text for a song.
 */
function getShareText(song) {
  const artist = song.artist || song.channelTitle || 'Unknown Artist'
  const title = song.title || 'Unknown Song'
  return `🎵 Listen to ${title} by ${artist} on Rhym`
}

/**
 * Check if the Web Share API is available.
 */
export function canNativeShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

/**
 * Copy text to clipboard with fallback for older browsers.
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // Fallback: textarea trick
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  } catch {
    return false
  }
}

/**
 * Share a song using the native share dialog.
 * Falls back to copy-to-clipboard if native share isn't available.
 *
 * @param {Object} song - Song object with videoId, title, artist, thumbnail
 * @returns {Promise<{ success: boolean, method: 'native' | 'clipboard' | 'failed' }>}
 */
export async function shareSong(song) {
  if (!song) return { success: false, method: 'failed' }

  const url = getSongUrl(song)
  const text = getShareText(song)
  const fullText = `${text}\n${url}`

  // ─── Try native share (Android Intent / iOS UIActivityViewController / Web Share API) ───
  if (canNativeShare()) {
    try {
      await navigator.share({
        title: song.title || 'Rhym',
        text: text,
        url: url,
      })
      return { success: true, method: 'native' }
    } catch (err) {
      // User cancelled the share dialog — not an error
      if (err.name === 'AbortError') {
        return { success: false, method: 'native' }
      }
      // Fall through to clipboard
      console.warn('[Share] Native share failed, falling back to clipboard:', err.message)
    }
  }

  // ─── Fallback: copy to clipboard ───
  const copied = await copyToClipboard(fullText)
  if (copied) {
    toast.success('Link copied to clipboard!', { duration: 2000 })
    return { success: true, method: 'clipboard' }
  }

  toast.error('Unable to share. Please copy the link manually.', { duration: 3000 })
  return { success: false, method: 'failed' }
}

/**
 * Copy just the song link to clipboard (for "Copy Link" button).
 */
export async function copySongLink(song) {
  if (!song) return false
  const url = getSongUrl(song)
  const copied = await copyToClipboard(url)
  if (copied) {
    toast.success('Link copied!', { duration: 2000 })
  } else {
    toast.error('Failed to copy link', { duration: 2000 })
  }
  return copied
}
