/**
 * MUSIFY — Music Router (JioSaavn Only)
 * ─────────────────────────────────────────────
 * All music operations routed through JioSaavn.
 * No YouTube dependency — fully deployable on any cloud platform.
 */

import {
  saavnSearch,
  saavnGetStreamUrl,
  saavnGetMetadata,
  saavnGetRecommendations,
  saavnTrending,
  saavnArtistTopSongs,
  saavnGetChart
} from './saavn.js';

// ─── Search ───

export async function searchMusic(query) {
  try {
    const results = await saavnSearch(query);
    return results;
  } catch (err) {
    console.error('[Router] Search error:', err.message);
    return [];
  }
}

// ─── Stream ───

export async function getStream(songId) {
  const url = await saavnGetStreamUrl(songId);
  if (url) {
    return { url, mime: 'audio/mp4', source: 'saavn' };
  }
  throw new Error('Stream extraction failed for song: ' + songId);
}

// ─── Metadata ───

export async function getMetadata(songId) {
  return await saavnGetMetadata(songId);
}

// ─── Recommendations ───

export async function getRecommendationsForSong(songId, artist, title, limit = 15) {
  // Primary: JioSaavn recommendation API
  let results = await saavnGetRecommendations(songId, limit);

  // If too few results, supplement with a search-based approach
  if (results.length < 5 && (artist || title)) {
    const query = artist ? `${artist} similar songs` : `${title} songs`;
    try {
      const searchResults = await saavnSearch(query, limit);
      const existingIds = new Set(results.map(r => r.id));
      const fillers = searchResults.filter(r => !existingIds.has(r.id) && r.id !== songId);
      results = [...results, ...fillers].slice(0, limit);
    } catch (_) { /* ignore */ }
  }

  return results;
}

// ─── Trending ───

export async function getTrendingSongs(limit = 25) {
  return await saavnTrending(limit);
}

// ─── Artist Songs ───

export async function getArtistSongs(artistName, limit = 30) {
  return await saavnArtistTopSongs(artistName, limit);
}

// ─── Charts ───

export async function getChartSongs(chartQuery, limit = 30) {
  return await saavnGetChart(chartQuery, limit);
}
