import play from 'play-dl'
import youtubedl from 'youtube-dl-exec'

// Stealth Identity Mimicry
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0'
]

export function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// Retry Helper
export async function withRetry(fn, retries = 2, baseDelay = 200) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries) throw err
      await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)))
    }
  }
}

// Play-DL Initialization
export async function initPlayDl() {
  try {
    console.log('✅ play-dl search engine initialized')
  } catch (err) {
    console.error('⚠️ play-dl init error:', err.message)
  }
}

// Duration Helpers
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function parseDurationText(text) {
  if (!text) return 0
  const parts = text.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

// Search Helper (play-dl)
export async function performSearch(query, limit = 20) {
  try {
    const musicQuery = query.toLowerCase().includes('song') || query.toLowerCase().includes('music')
      ? query
      : `${query} song`

    const videos = await withRetry(() => play.search(musicQuery, { 
      limit: limit + 10,
      source: { youtube: 'video' }
    }), 3, 300)

    const formattedResults = videos
      .filter(v => {
        const title = (v.title || '').toLowerCase()
        if (v.durationInSec < 60) return false

        const blacklist = [
          'lyrics', 'lyric', 'karaoke', 'sing along', '4k', '8k', '1080p', '720p', 
          'hd video', 'full video', 'unplugged', 'acoustic', 'cover', 'remake', 
          'tribute', 'piano version', 'guitar version', 'instrumental', 'reaction', 
          'react', 'review', 'explained', 'behind the scenes', 'making of', 'bts', 
          'interview', 'teaser', 'trailer', 'lofi', 'reverbed', 'reverb', 'slowed'
        ]
        if (blacklist.some(word => title.includes(word))) return false
        return true
      })
      .map(v => {
        const title = (v.title || '').toLowerCase()
        const channelName = (v.channel?.name || '').toLowerCase()
        let score = 0

        if (channelName.includes('topic') || channelName.includes('vevo')) score = 10
        else if (title.includes('official') || title.includes('audio')) score = 8
        else score = 1

        return { ...v, _score: score }
      })
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score
        return b.views - a.views
      })
      .slice(0, limit)
      .map(v => ({
        videoId: v.id,
        id: v.id, // For normalization
        title: v.title || 'Unknown',
        artist: v.channel?.name || 'Unknown',
        channelTitle: v.channel?.name || 'Unknown',
        album: 'Unknown',
        thumbnail: v.thumbnails[0]?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
        duration: v.durationRaw || '0:00',
        views: v.views || 0,
        publishedAt: v.uploadedAt || 'recently',
        source: 'youtube'
      }))

    return formattedResults
  } catch (err) {
    console.error('Search error:', err.message)
    return []
  }
}

// Stream URL Extractor (yt-dlp fallback)
export async function getStreamUrl(videoId) {
  console.log(`[Stream] Extracting ${videoId} using yt-dlp...`)
  try {
    const info = await withRetry(() => youtubedl(`https://www.youtube.com/watch?v=${videoId}`, { 
      dumpJson: true, 
      noWarnings: true, 
      noCheckCertificates: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      referer: 'https://www.youtube.com/',
      format: 'bestaudio/best',
      userAgent: getRandomUA()
    }), 2, 500)
    
    if (info && info.url) {
      console.log(`[Stream] ${videoId} extracted via yt-dlp`)
      const mimeMap = {
        'webm': 'audio/webm',
        'm4a': 'audio/mp4',
        'mp3': 'audio/mpeg',
        'opus': 'audio/ogg'
      }
      const mime = mimeMap[info.ext] || 'audio/webm'
      const size = info.filesize || info.filesize_approx || 0
      
      return { 
        url: info.url, 
        mime, 
        size, 
        client: 'YTDLP' 
      }
    }
  } catch (err) {
    console.error(`[Stream] yt-dlp failed for ${videoId}:`, err.message)
  }

  throw new Error('Streaming extraction failed. YouTube might be blocking requests.')
}

// Related Videos
export async function getRelatedVideos(videoId, limit = 15) {
  try {
    const info = await withRetry(() => play.video_info(`https://www.youtube.com/watch?v=${videoId}`), 2, 300)
    const related = info.related_videos || []

    if (related.length > 0) {
      return related.slice(0, limit).map(v => ({
        videoId: v.id,
        id: v.id,
        title: v.title || 'Unknown',
        artist: v.channel?.name || 'Unknown',
        channelTitle: v.channel?.name || 'Unknown',
        thumbnail: v.thumbnails[0]?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
        duration: v.durationRaw || '0:00',
        views: v.views || 0,
        publishedAt: v.uploadedAt || 'recently',
        source: 'youtube'
      }))
    }
  } catch (err) {
    console.warn('Related videos error:', err.message)
  }
  return []
}

// YouTube Metadata Function
export async function getYoutubeMetadata(videoId) {
    try {
        const info = await withRetry(() => play.video_info(`https://www.youtube.com/watch?v=${videoId}`), 2, 300)
        return {
            id: videoId,
            title: info.video_details.title || 'Unknown',
            artist: info.video_details.channel?.name || 'Unknown',
            album: 'Unknown',
            duration: info.video_details.durationRaw || '0:00',
            thumbnail: info.video_details.thumbnails[0]?.url || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            source: 'youtube'
        }
    } catch (err) {
        console.error('YouTube Metadata error:', err.message)
        return null;
    }
}
