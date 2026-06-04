import CryptoJS from 'crypto-js';

// 5 second timeout helper
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

function decodeHtmlEntities(text) {
  if (!text) return text;
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

export async function saavnSearch(query, limit = 20) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodedQuery}&n=${limit}&_format=json`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map(song => ({
      id: song.id,
      title: decodeHtmlEntities(song.title || 'Unknown'),
      artist: decodeHtmlEntities(song.primary_artists || song.singers || 'Unknown'),
      album: decodeHtmlEntities(song.album || 'Unknown'),
      duration: formatDurationSaavn(song.duration),
      thumbnail: (song.image || '').replace('150x150', '500x500'),
      source: 'saavn'
    }));
  } catch (err) {
    console.error('[Saavn] Search Error:', err.message);
    throw err; // bubble up so router can catch it
  }
}

export async function saavnGetStreamUrl(songId) {
  try {
    const url = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${songId}&_format=json`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();
    
    if (!data[songId]) throw new Error('Song not found on Saavn');
    const song = data[songId];
    if (!song.encrypted_media_url) throw new Error('No encrypted media URL');

    const encryptedUrl = song.encrypted_media_url.trim();
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl) },
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    
    let streamUrl = decrypted.toString(CryptoJS.enc.Utf8);
    // Upgrade to 320kbps
    streamUrl = streamUrl.replace('_96.mp4', '_320.mp4').trim();
    
    // Sometimes URLs might be http instead of https
    if (streamUrl.startsWith('http://')) {
        streamUrl = streamUrl.replace('http://', 'https://');
    }
    
    return streamUrl;
  } catch (err) {
    console.error(`[Saavn] Stream Error for ${songId}:`, err.message);
    return null;
  }
}

export async function saavnGetMetadata(songId) {
  try {
    const url = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${songId}&_format=json`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();
    
    if (!data[songId]) throw new Error('Song not found on Saavn');
    const song = data[songId];

    return {
      id: song.id,
      title: decodeHtmlEntities(song.title || 'Unknown'),
      artist: decodeHtmlEntities(song.primary_artists || song.singers || 'Unknown'),
      album: decodeHtmlEntities(song.album || 'Unknown'),
      duration: formatDurationSaavn(song.duration),
      thumbnail: (song.image || '').replace('150x150', '500x500'),
      lyrics_snippet: song.has_lyrics === 'true' ? 'Lyrics available' : '',
      source: 'saavn'
    };
  } catch (err) {
    console.error(`[Saavn] Metadata Error for ${songId}:`, err.message);
    return null;
  }
}
