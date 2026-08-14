/**
 * MUSIFY — useSearch Hook
 * ─────────────────────────────────────────────
 * Centralized fuzzy search logic shared by SearchOverlay, TopBar, and SearchPage.
 *
 * Features:
 * - Weighted Fuse.js: title (2.0) > artist (1.0) > album (0.5)
 * - Artist detection: if query closely matches an artist name AND 3+ top results
 *   share that artist, returns grouped "Songs by [Artist]" results
 * - Debounced API fetch (200ms) merged with local results
 * - Playlist + artist-name matching for sidebar results
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import Fuse from 'fuse.js'
import { searchSongs } from '../utils/api.js'

// ─── Fuse.js Configuration ───

const SONG_FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 2.0 },
    { name: 'artist', weight: 1.0 },
    { name: 'album', weight: 0.5 }
  ],
  threshold: 0.45,
  distance: 200,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 1
}

const PLAYLIST_FUSE_OPTIONS = {
  keys: ['name'],
  threshold: 0.4,
  distance: 100
}

const ARTIST_FUSE_OPTIONS = {
  keys: ['name'],
  threshold: 0.35,
  distance: 150,
  includeScore: true
}

// ─── Artist Detection ───
// Decides whether the user's query is targeting an artist name.
// Criteria: the query fuzzy-matches a known artist, AND 3+ of the
// top results belong to that artist.

function detectArtistMatch(query, fuseResults, allArtistNames) {
  if (!query || query.length < 2 || fuseResults.length < 2) return null

  // Build a small Fuse index of unique artist names
  const artistEntries = allArtistNames.map(name => ({ name }))
  const artistFuse = new Fuse(artistEntries, ARTIST_FUSE_OPTIONS)
  const artistMatches = artistFuse.search(query)

  if (artistMatches.length === 0) return null

  const bestArtistMatch = artistMatches[0]
  // The query must be a close match to the artist name (score < 0.35 = good match)
  if (bestArtistMatch.score > 0.35) return null

  const matchedArtistName = bestArtistMatch.item.name

  // Count how many of the top results belong to this artist
  const topResults = fuseResults.slice(0, 8)
  const artistSongsInTop = topResults.filter(r => {
    const songArtist = (r.item?.artist || '').toLowerCase()
    const matched = matchedArtistName.toLowerCase()
    return songArtist.includes(matched) || matched.includes(songArtist)
  })

  // Need at least 3 matches in top results, OR the query is almost entirely the artist name
  if (artistSongsInTop.length >= 3 || bestArtistMatch.score < 0.15) {
    return matchedArtistName
  }

  return null
}

// ─── Collect all songs by a matched artist from the full dataset ───

function collectArtistSongs(artistName, allSongs) {
  const lowerArtist = artistName.toLowerCase()
  return allSongs.filter(song => {
    const songArtist = (song.artist || '').toLowerCase()
    return songArtist.includes(lowerArtist) || lowerArtist.includes(songArtist)
  })
}

// ─── The Hook ───

export function useSearch(query, masterPlaylistData, userPlaylists = []) {
  const [results, setResults] = useState({
    isArtistMatch: false,
    matchedArtist: null,
    artistSongs: [],
    songs: [],
    playlists: [],
    artists: [],
    loading: false
  })

  const abortRef = useRef(0) // monotonic counter to discard stale fetches

  // Memoize the list of unique artist names from master data
  const allArtistNames = useMemo(() => {
    return Array.from(new Set(
      masterPlaylistData
        .map(s => s.artist)
        .filter(Boolean)
    ))
  }, [masterPlaylistData])

  useEffect(() => {
    const trimmed = (query || '').trim()

    if (trimmed.length < 1) {
      setResults({
        isArtistMatch: false,
        matchedArtist: null,
        artistSongs: [],
        songs: [],
        playlists: [],
        artists: [],
        loading: false
      })
      return
    }

    // ─── Instant local fuzzy results ───
    const songFuse = new Fuse(masterPlaylistData, SONG_FUSE_OPTIONS)
    const localFuseResults = songFuse.search(trimmed)
    const localSongs = localFuseResults.map(r => r.item)

    // Playlist matches
    const playlistFuse = new Fuse(userPlaylists, PLAYLIST_FUSE_OPTIONS)
    const localPlaylists = playlistFuse.search(trimmed).map(r => r.item).slice(0, 3)

    // Artist name matches (for sidebar "Artists" section)
    const artistFuse = new Fuse(allArtistNames.map(a => ({ name: a })), ARTIST_FUSE_OPTIONS)
    const localArtists = artistFuse.search(trimmed).map(r => r.item.name).slice(0, 5)

    // Artist detection on local data
    const detectedArtist = detectArtistMatch(trimmed, localFuseResults, allArtistNames)

    if (detectedArtist) {
      const artistSongs = collectArtistSongs(detectedArtist, masterPlaylistData)
      setResults({
        isArtistMatch: true,
        matchedArtist: detectedArtist,
        artistSongs: artistSongs.length > 0 ? artistSongs : localSongs.slice(0, 15),
        songs: localSongs.slice(0, 15),
        playlists: localPlaylists,
        artists: localArtists,
        loading: true
      })
    } else {
      setResults({
        isArtistMatch: false,
        matchedArtist: null,
        artistSongs: [],
        songs: localSongs.slice(0, 15),
        playlists: localPlaylists,
        artists: localArtists,
        loading: localSongs.length === 0 // show loading if no local results
      })
    }

    // ─── Debounced API fetch ───
    const requestId = ++abortRef.current

    const timer = setTimeout(async () => {
      try {
        const apiSongs = await searchSongs(trimmed)

        // If a newer query has started, discard these results
        if (abortRef.current !== requestId) return

        // Merge: local first, then API (deduped by videoId)
        const seenIds = new Set(localSongs.map(s => s.videoId))
        const uniqueApiSongs = apiSongs.filter(s => !seenIds.has(s.videoId))
        const combined = [...localSongs, ...uniqueApiSongs]

        // Re-run artist detection on the larger combined set
        // Also collect all artist names from API results
        const apiArtistNames = Array.from(new Set(
          apiSongs.map(s => s.artist).filter(Boolean)
        ))
        const allNames = Array.from(new Set([...allArtistNames, ...apiArtistNames]))

        // Re-run Fuse on combined for proper ranking
        const combinedFuse = new Fuse(combined, SONG_FUSE_OPTIONS)
        const combinedFuseResults = combinedFuse.search(trimmed)
        const rankedCombined = combinedFuseResults.map(r => r.item)

        // Use combined list if fuse ranking yields results, else fall back to insertion-order combined
        const finalSongs = rankedCombined.length > 0 ? rankedCombined : combined

        const reDetectedArtist = detectArtistMatch(trimmed, combinedFuseResults, allNames)

        if (reDetectedArtist) {
          const artistSongs = collectArtistSongs(reDetectedArtist, combined)
          setResults(prev => ({
            ...prev,
            isArtistMatch: true,
            matchedArtist: reDetectedArtist,
            artistSongs: artistSongs.length > 0 ? artistSongs : finalSongs.slice(0, 20),
            songs: finalSongs.slice(0, 20),
            loading: false
          }))
        } else {
          setResults(prev => ({
            ...prev,
            isArtistMatch: false,
            matchedArtist: null,
            artistSongs: [],
            songs: finalSongs.slice(0, 20),
            loading: false
          }))
        }
      } catch (err) {
        console.error('[useSearch] API error:', err)
        if (abortRef.current === requestId) {
          setResults(prev => ({ ...prev, loading: false }))
        }
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, masterPlaylistData, userPlaylists, allArtistNames])

  return results
}
