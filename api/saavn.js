/**
 * RHYM — JioSaavn Backend Module
 * ─────────────────────────────────────────────
 * Complete JioSaavn integration:
 * - Search songs
 * - Stream URL decryption (DES → 320kbps CDN)
 * - Song metadata
 * - Trending / homepage content
 * - Recommendations (reco API + fallback)
 * - Artist top songs
 * - Charts / curated playlists
 *
 * All functions output a standardized song object with `videoId`
 * so the frontend doesn't need any changes.
 */

import CryptoJS from 'crypto-js';

const SAAVN_API = 'https://www.jiosaavn.com/api.php';
const DES_KEY = '38346591';

// ─── Helpers ───

async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  // Use an Indian IP to bypass JioSaavn's geo-blocking on international (Vercel) servers
  // which hides songs like "Die For You - The Weeknd"
  const defaultHeaders = {
    'X-Forwarded-For': '103.212.158.118', // Random Indian IP
    'True-Client-IP': '103.212.158.118',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  };

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    },
    signal: controller.signal
  };

  try {
    const response = await fetch(url, mergedOptions);
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function withRetry(fn, retries = 2, baseDelay = 300) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
    }
  }
}

function decodeHtmlEntities(text) {
  if (!text) return '';
  return text.replace(/&quot;/g, '"')
             .replace(/&amp;/g, '&')
             .replace(/&#039;/g, "'")
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>');
}

function formatDurationSaavn(secondsStr) {
  const seconds = parseInt(secondsStr, 10);
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getSaavnImage(raw) {
  let img = raw.image || '';
  // Some API versions return image as an array of objects
  if (typeof img === 'object' && Array.isArray(img)) {
    img = img[img.length - 1]?.link || img[0]?.link || '';
  }
  return img.replace(/150x150|50x50/g, '500x500');
}

// ─── Standard Song Formatter ───
// Converts a raw JioSaavn song object into the standardized format
// the frontend expects. Uses `videoId` as alias for `id` so
// PlayerContext, Player, FullScreenPlayer etc. work without changes.

function formatSaavnSong(raw) {
  if (!raw || !raw.id) return null;
  return {
    id: raw.id,
    videoId: raw.id,
    title: decodeHtmlEntities(raw.title || raw.song || 'Unknown'),
    artist: decodeHtmlEntities(
      raw.primary_artists || raw.singers || raw.subtitle || raw.music || 'Unknown'
    ),
    channelTitle: decodeHtmlEntities(raw.primary_artists || raw.singers || 'Unknown'),
    album: decodeHtmlEntities(raw.album || 'Unknown'),
    duration: formatDurationSaavn(raw.duration || '0'),
    thumbnail: getSaavnImage(raw),
    views: parseInt(raw.play_count || '0', 10),
    publishedAt: raw.release_date || raw.year || 'recently',
    source: 'saavn'
  };
}

// ─── Decrypt Stream URL ───

function decryptUrl(encryptedUrl) {
  const key = CryptoJS.enc.Utf8.parse(DES_KEY);
  const decrypted = CryptoJS.DES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl) },
    key,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );
  let url = decrypted.toString(CryptoJS.enc.Utf8);
  // Upgrade to 320kbps MP4
  url = url.replace('_96.mp4', '_320.mp4').trim();
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  return url;
}

// ─── Search ───

export async function saavnSearch(query, limit = 20) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${SAAVN_API}?__call=search.getResults&q=${encodedQuery}&n=${limit}&_format=json&_marker=0`;
    const response = await withRetry(() => fetchWithTimeout(url));
    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results
      .map(formatSaavnSong)
      .filter(Boolean);
  } catch (err) {
    console.error('[Saavn] Search Error:', err.message);
    throw err;
  }
}

// ─── Internal: Find song in API response ───
// The song.getDetails API keys the response by song ID, but the key
// format can vary. This helper tries multiple strategies.

function findSongInResponse(data, songId) {
  // Strategy 1: Exact key match
  if (data[songId] && typeof data[songId] === 'object') return data[songId];

  // Strategy 2: Search all values for an object with encrypted_media_url
  const values = Object.values(data);
  const found = values.find(v => v && typeof v === 'object' && (v.encrypted_media_url || v.id));
  if (found) return found;

  return null;
}

// ─── Stream URL ───

export async function saavnGetStreamUrl(songId) {
  try {
    const url = `${SAAVN_API}?__call=song.getDetails&pids=${songId}&_format=json`;
    const response = await withRetry(() => fetchWithTimeout(url));
    const data = await response.json();

    const song = findSongInResponse(data, songId);
    if (!song || !song.encrypted_media_url) {
      throw new Error('Song not found on Saavn');
    }

    const baseUrl = decryptUrl(song.encrypted_media_url.trim());

    // Try qualities from highest to lowest with HEAD validation
    const qualities = ['_320.mp4', '_160.mp4', '_96.mp4'];
    for (const quality of qualities) {
      const qualityUrl = baseUrl.replace(/_\d+\.mp4/, quality);
      try {
        const headRes = await fetchWithTimeout(qualityUrl, { method: 'HEAD' }, 3000);
        if (headRes.ok || headRes.status === 206) {
          console.log(`[Saavn] Stream URL resolved for ${songId} (${quality})`);
          return qualityUrl;
        }
      } catch (_) { /* try next quality */ }
    }

    // If all HEAD checks fail, return 320kbps URL anyway (CDN might accept GET but reject HEAD)
    console.warn(`[Saavn] HEAD checks failed for ${songId}, returning 320kbps URL`);
    return baseUrl.replace(/_\d+\.mp4/, '_320.mp4');
  } catch (err) {
    console.error(`[Saavn] Stream Error for ${songId}:`, err.message);
    return null;
  }
}

// ─── Metadata ───

export async function saavnGetMetadata(songId) {
  try {
    const url = `${SAAVN_API}?__call=song.getDetails&pids=${songId}&_format=json`;
    const response = await withRetry(() => fetchWithTimeout(url));
    const data = await response.json();

    const song = findSongInResponse(data, songId);
    if (!song) throw new Error('Song not found on Saavn');
    return formatSaavnSong(song);
  } catch (err) {
    console.error(`[Saavn] Metadata Error for ${songId}:`, err.message);
    return null;
  }
}

// ─── Playlist Details ───

export async function saavnGetPlaylist(listId, limit = 30) {
  try {
    const url = `${SAAVN_API}?__call=playlist.getDetails&listid=${listId}&n=${limit}&_format=json`;
    const response = await withRetry(() => fetchWithTimeout(url));
    const data = await response.json();

    const songs = data.songs || data.list || [];
    if (!Array.isArray(songs)) return [];

    return songs
      .map(formatSaavnSong)
      .filter(Boolean)
      .slice(0, limit);
  } catch (err) {
    console.error('[Saavn] Playlist Error:', err.message);
    return [];
  }
}

// ─── Trending / Top Songs ───

export async function saavnTrending(limit = 25) {
  // Attempt 1: JioSaavn homepage data (has curated trending modules)
  try {
    const url = `${SAAVN_API}?__call=content.getHomepageData&_format=json&_marker=0&ctx=web6dot0`;
    const response = await fetchWithTimeout(url, {}, 10000);
    const data = await response.json();

    let songs = [];

    // Extract from 'new_trending' module
    const trending = data.new_trending || data.trending || [];
    if (Array.isArray(trending)) {
      for (const item of trending) {
        if (item.type === 'song' && item.id) {
          const formatted = formatSaavnSong(item);
          if (formatted) songs.push(formatted);
        }
      }
    }

    // Also try 'top_playlists' or 'charts' for more songs
    const charts = data.charts || [];
    if (Array.isArray(charts) && songs.length < limit) {
      for (const chart of charts.slice(0, 2)) {
        if (chart.listid || chart.id) {
          try {
            const playlistSongs = await saavnGetPlaylist(
              chart.listid || chart.id,
              limit - songs.length
            );
            songs.push(...playlistSongs);
          } catch (_) { /* ignore */ }
          if (songs.length >= limit) break;
        }
      }
    }

    if (songs.length >= 5) {
      console.log(`[Saavn] Got ${songs.length} trending songs from homepage API`);
      return songs.slice(0, limit);
    }
  } catch (err) {
    console.warn('[Saavn] Homepage trending failed:', err.message);
  }

  // Fallback: Search-based trending
  console.log('[Saavn] Using search-based trending fallback');
  return await saavnSearch('latest trending songs 2025', limit);
}

// ─── Recommendations ───

export async function saavnGetRecommendations(songId, limit = 15) {
  // Attempt 1: Official JioSaavn recommendation API
  try {
    const url = `${SAAVN_API}?__call=reco.getreco&pid=${songId}&_format=json&_marker=0&ctx=web6dot0`;
    const response = await fetchWithTimeout(url, {}, 6000);
    const data = await response.json();

    let songs = [];

    if (Array.isArray(data)) {
      songs = data;
    } else if (data && typeof data === 'object') {
      // API sometimes returns { "0": song, "1": song, ... }
      songs = Object.values(data).filter(v => v && typeof v === 'object' && v.id);
    }

    if (songs.length > 0) {
      const formatted = songs.map(formatSaavnSong).filter(Boolean);
      if (formatted.length >= 3) {
        console.log(`[Saavn] Got ${formatted.length} recommendations via reco API`);
        return formatted.slice(0, limit);
      }
    }
  } catch (err) {
    console.warn('[Saavn] Reco API failed:', err.message);
  }

  // Attempt 2: Get song's artist and search for more by them
  try {
    const meta = await saavnGetMetadata(songId);
    if (meta && meta.artist && meta.artist !== 'Unknown') {
      console.log(`[Saavn] Using artist-based recommendations: ${meta.artist}`);
      const results = await saavnSearch(`${meta.artist} songs`, limit + 5);
      // Filter out the current song itself
      return results.filter(s => s.id !== songId).slice(0, limit);
    }
  } catch (err) {
    console.warn('[Saavn] Fallback artist reco failed:', err.message);
  }

  // Attempt 3: Generic popular songs
  try {
    return await saavnSearch('popular songs 2025', limit);
  } catch (_) {}

  return [];
}

// ─── Artist Top Songs ───

export async function saavnArtistTopSongs(artistName, limit = 30) {
  try {
    const results = await saavnSearch(`${artistName} songs`, limit);
    return results;
  } catch (err) {
    console.error('[Saavn] Artist search failed:', err.message);
    return [];
  }
}

// ─── Charts ───

export async function saavnGetChart(chartQuery, limit = 30) {
  try {
    const results = await saavnSearch(chartQuery, limit);
    return results;
  } catch (err) {
    console.error('[Saavn] Chart search failed:', err.message);
    return [];
  }
}
