/**
 * RHYM v2.0 — API Utils
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Added getStreamUrl() for /api/stream endpoint
 * - Removed playlist-related functions
 * - Kept: searchSongs, getTrending, getArtistSongs, getChart, getRecommendations
 * - Kept: enrichSongMetadata (iTunes artwork), generateGradientUrl
 * - Client-side search cache (Map)
 */

import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

const searchCache = new Map()
const artworkCache = new Map()

export function getStreamUrl(videoId) {
  return `${API_BASE}/stream?id=${videoId}`
}

export async function searchSongs(query) {
  if (!query || query.trim().length < 1) return []

  const cacheKey = query.trim().toLowerCase()
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey)

  try {
    const { data } = await api.get('/search', { params: { q: query } })
    const results = data.results || []
    searchCache.set(cacheKey, results)
    return results
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

export async function fetchArtistProfile(query) {
  if (!query || query.trim().length < 1) return null;
  try {
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=1`);
    if (!itunesRes.ok) return null;
    const itunesData = await itunesRes.json();
    if (!itunesData.results || itunesData.results.length === 0) return null;
    
    const artist = itunesData.results[0];
    const genre = artist.primaryGenreName;

    let bio = 'Musician / Band';
    try {
        const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exchars=250&explaintext=1&titles=${encodeURIComponent(artist.artistName)}&origin=*`);
        if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            const pages = wikiData.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId !== '-1' && pages[pageId].extract) {
                bio = pages[pageId].extract;
            }
        }
    } catch (e) {
        console.warn('Wikipedia bio fetch failed', e);
    }

    return {
        name: artist.artistName,
        genre: genre,
        bio: bio
    };
  } catch (err) {
    console.warn('fetchArtistProfile error', err);
    return null;
  }
}

export async function getTrending() {
  try {
    const { data } = await api.get('/trending')
    return data.results || []
  } catch (error) {
    console.error('Trending error:', error)
    return []
  }
}

export async function getArtistSongs(artistId) {
  try {
    const { data } = await api.get(`/artist/${encodeURIComponent(artistId)}/songs`)
    return data
  } catch (error) {
    console.error('Artist songs error:', error)
    throw error
  }
}

export async function getChart(chartId) {
  try {
    const { data } = await api.get(`/charts/${encodeURIComponent(chartId)}`)
    return data
  } catch (error) {
    console.error('Chart error:', error)
    throw error
  }
}

export async function getRecommendations(videoId, artist, title) {
  try {
    const { data } = await api.get('/recommendations', {
      params: { videoId, artist, title }
    })
    return data.results || []
  } catch (error) {
    console.error('Recommendations error:', error)
    return []
  }
}

export async function getLyrics(videoId, artist, title) {
  try {
    const clean = (str) => {
      if (!str) return ''
      return str
        .replace(/\(Official.*?\)|\[Official.*?\]|Official Video|Lyric Video|Audio|Full Video|HD|4K|Video/gi, '')
        .replace(/\(Lyrics\)|\[Lyrics\]|Lyrics/gi, '')
        .replace(/\(Remix\)|\[Remix\]|Remix/gi, '')
        .replace(/\(feat\..*?\)|\[feat\..*?\]|ft\..*?|feat\./gi, '')
        .replace(/\(.*?\)|\[.*?\]/g, '')
        .replace(/\s\s+/g, ' ')
        .trim()
    }

    let cleanTitle = clean(title)
    let cleanArtist = (artist || '').replace(/ - Topic/gi, '').trim()
    
    // ─── Special Indian Music Handling ───
    const labels = ['T-Series', 'Zee Music', 'Sony Music', 'YRF', 'Aditya Music', 'Tips', 'Eros Now', 'Speed Records', 'Desi Music Factory']
    const isLabel = labels.some(l => cleanArtist.toLowerCase().includes(l.toLowerCase()))
    
    if (isLabel && cleanTitle.includes('-')) {
      const parts = cleanTitle.split('-')
      cleanTitle = parts[0].trim()
    }

    const tryFetch = async (a, t) => {
      if (!t) return null
      try {
        const res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(a)}&track_name=${encodeURIComponent(t)}`)
        if (res.ok) {
          const d = await res.json()
          return d // Return the full object (contains syncedLyrics, plainLyrics)
        }
      } catch(e){}
      return null
    }

    let result = await tryFetch(cleanArtist, cleanTitle)
    if (!result && isLabel) result = await tryFetch('', cleanTitle)

    if (!result) {
      try {
        const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`)
        if (searchRes.ok) {
          const searchData = await searchRes.json()
          if (searchData.length > 0) return searchData[0]
        }
      } catch(e){}
    }

    return result || null
  } catch (error) {
    console.warn('[Frontend Lyrics] All sources failed:', error)
    return null
  }
}

export async function enrichSongMetadata(song) {
  if (!song || !song.title) return song

  const cacheKey = `${song.title}-${song.artist}`.toLowerCase()
  if (artworkCache.has(cacheKey)) return artworkCache.get(cacheKey)

  try {
    const cleanTitle = song.title
      .replace(/\(Official.*?\)|\[Official.*?\]|Official Video|Lyric Video|Audio|Full Video|HD|4K|Video/gi, '')
      .replace(/\(Lyrics\)|\[Lyrics\]|Lyrics/gi, '')
      .replace(/\(feat\..*?\)|\[feat\..*?\]|ft\..*?|feat\./gi, '')
      .replace(/\(.*?\)|\[.*?\]/g, '')
      .replace(/\s\s+/g, ' ')
      .trim()

    const query = encodeURIComponent(`${cleanTitle} ${song.artist || ''}`)
    const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`)
    const data = await response.json()

    if (data.results && data.results[0]) {
      const result = data.results[0]
      const albumArt = result.artworkUrl100?.replace('100x100bb', '600x600bb')

      const enriched = {
        ...song,
        albumArt: albumArt,
        albumName: result.collectionName,
        isEnriched: true
      }

      artworkCache.set(cacheKey, enriched)
      return enriched
    }
  } catch (error) {
    console.warn('[iTunes] Enrichment failed:', error)
  }

  const fallback = {
    ...song,
    albumArt: song.thumbnail || generateGradientUrl(song.title),
    isEnriched: true
  }
  artworkCache.set(cacheKey, fallback)
  return fallback
}

export function generateGradientUrl(text) {
  const str = text || 'Music'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const h1 = Math.abs(hash % 360)
  const h2 = (h1 + 60) % 360

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${h1},70%,45%)"/>
        <stop offset="100%" style="stop-color:hsl(${h2},70%,25%)"/>
      </linearGradient>
    </defs>
    <rect width="320" height="180" fill="url(#g)"/>
    <text x="160" y="100" text-anchor="middle" fill="rgba(255,255,255,0.15)" font-size="80" font-family="sans-serif" font-weight="900">${str.charAt(0).toUpperCase()}</text>
  </svg>`

  return `data:image/svg+xml;base64,${btoa(svg)}`
}
