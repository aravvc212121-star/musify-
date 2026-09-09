import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getArtistSongs } from '../utils/api.js'
import { usePlayer } from '../context/PlayerContext.jsx'
import { FiPlay, FiArrowLeft, FiMusic } from 'react-icons/fi'
import SongCard from '../components/ui/SongCard.jsx'
import { useIsMobile } from '../hooks/useIsMobile.js'

const KNOWN_ARTISTS = {
  'arijit singh': 'https://cdn-images.dzcdn.net/images/artist/ac5350cff290edd5b69fa584b8b1bd4f/500x500-000000-80-0-0.jpg',
  'honey singh': 'https://cdn-images.dzcdn.net/images/artist/64af370d73cfbc33006b8adcb2508bce/500x500-000000-80-0-0.jpg',
  'yo yo honey singh': 'https://cdn-images.dzcdn.net/images/artist/64af370d73cfbc33006b8adcb2508bce/500x500-000000-80-0-0.jpg',
  'diljit dosanjh': 'https://cdn-images.dzcdn.net/images/artist/79b85e695e0ca6529e56bf3b628e92bd/500x500-000000-80-0-0.jpg',
  'karan aujla': 'https://cdn-images.dzcdn.net/images/artist/a91a1d5ea91e85e4f0966569b50e8d6a/500x500-000000-80-0-0.jpg',
  'seedhe maut': 'https://cdn-images.dzcdn.net/images/artist/dbd4cd0d5c2e3f1000b742542d3d7a07/500x500-000000-80-0-0.jpg',
  'the weeknd': 'https://cdn-images.dzcdn.net/images/artist/581693b4724a7fcfa754455101e13a44/500x500-000000-80-0-0.jpg',
  'taylor swift': 'https://cdn-images.dzcdn.net/images/artist/e528e270424103b527f8a27ac625563b/500x500-000000-80-0-0.jpg',
  'drake': 'https://cdn-images.dzcdn.net/images/artist/70223888f501f4b843142e071abda364/500x500-000000-80-0-0.jpg',
  'dua lipa': 'https://cdn-images.dzcdn.net/images/artist/877872aaf75694f11d53c318700ab2b5/500x500-000000-80-0-0.jpg',
  'post malone': 'https://cdn-images.dzcdn.net/images/artist/a5a8cca44e7eab2db7d44e039bed2574/500x500-000000-80-0-0.jpg',
  'lata mangeshkar': 'https://cdn-images.dzcdn.net/images/artist/837d46f90f541736e07817f463317c80/500x500-000000-80-0-0.jpg',
}

export default function ArtistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playSong } = usePlayer()
  const isMobile = useIsMobile()

  const [artist, setArtist] = useState(null)
  const [artistImage, setArtistImage] = useState('')
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const cleanId = (id || '').trim().toLowerCase()
      if (KNOWN_ARTISTS[cleanId]) {
        setArtistImage(KNOWN_ARTISTS[cleanId])
      } else {
        // Dynamic search Deezer for artist portrait
        fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(id)}`)
          .then(r => r.json())
          .then(d => {
            const item = d.data?.[0]
            if (item?.picture_big) {
              setArtistImage(item.picture_big.replace('250x250', '500x500'))
            }
          })
          .catch(() => {})
      }

      try {
        const data = await getArtistSongs(id)
        setArtist(data.artist)
        setSongs(data.songs || [])
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const color = useMemo(() => {
    let hash = 0
    for (let i = 0; i < (id || '').length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
    return `hsl(${Math.abs(hash % 360)}, 50%, 30%)`
  }, [id])

  const posterSrc = artistImage || KNOWN_ARTISTS[(id || '').toLowerCase()] || artist?.image || songs[0]?.thumbnail

  return (
    <div style={{ 
      paddingBottom: 100, 
      animation: 'fadeIn 0.3s ease',
      background: '#121212',
      minHeight: '100%'
    }}>
      {/* ─── Hero Poster Banner (Full-bleed poster with name overlay) ─── */}
      <div className="artist-poster-hero" style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '320px' : '380px',
        overflow: 'hidden',
        background: '#181818',
      }}>
        {/* Poster Image */}
        {posterSrc ? (
          <img 
            src={posterSrc} 
            alt={artist?.name || id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 20%',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, ${color}, #121212)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '80px', opacity: 0.3 }}>🎵</span>
          </div>
        )}

        {/* Ambient & Gradient Overlay blending directly into #121212 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 40%, rgba(18,18,18,0.7) 75%, #121212 100%)',
          pointerEvents: 'none',
        }} />

        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: '16px', left: '16px',
            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
            width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', transition: 'background 0.2s ease',
            zIndex: 10,
          }}
          className="hover-bg-card"
        >
          <FiArrowLeft size={20} />
        </button>

        {/* Artist Name & Info Directly on Poster */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: isMobile ? '16px' : '32px',
          right: isMobile ? '16px' : '32px',
          zIndex: 5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3d91ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#fff', letterSpacing: '0.5px' }}>Verified Artist</span>
          </div>
          <h1 style={{ 
            fontSize: isMobile ? '34px' : '58px', 
            fontWeight: 900, 
            margin: '0 0 4px 0', 
            color: '#fff', 
            lineHeight: 1.1,
            textShadow: '0 2px 10px rgba(0,0,0,0.7)'
          }}>
            {artist?.name || id}
          </h1>
          <p style={{ fontSize: isMobile ? '12px' : '14px', color: 'rgba(255,255,255,0.75)', margin: 0, fontWeight: 500 }}>
            {songs.length > 0 ? (songs.length * 123450).toLocaleString() : '1,240,000'} monthly listeners
          </p>
        </div>
      </div>

      {/* ─── Controls Row ─── */}
      <div style={{ padding: isMobile ? '12px 16px' : '16px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => songs.length > 0 && playSong(songs[0], songs, 0)}
          style={{
            width: isMobile ? '48px' : '56px',
            height: isMobile ? '48px' : '56px',
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
            cursor: songs.length > 0 ? 'pointer' : 'not-allowed', color: '#fff',
            opacity: songs.length > 0 ? 1 : 0.5,
            transition: 'transform 0.1s ease, background 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 210, 255, 0.3)'
          }}
          className="play-btn-big"
        >
          <FiPlay size={isMobile ? 20 : 24} style={{ fill: 'currentcolor', marginLeft: '4px' }} />
        </button>
        
        <button style={{ 
          background: 'rgba(255,255,255,0.1)', 
          border: '1px solid rgba(255,255,255,0.2)', 
          borderRadius: '20px', 
          padding: '6px 18px', 
          color: '#fff', 
          fontSize: '12px', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '1px',
          cursor: 'pointer'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#fff'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
        >
          Follow
        </button>
      </div>

      {/* ─── Songs Container ─── */}
      <div className="song-list-container">
        <h2 style={{ color: '#fff', fontSize: isMobile ? '20px' : '24px', fontWeight: 800, marginBottom: '16px' }}>Popular</h2>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-pulse" style={{ height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#b3b3b3' }}>
            <FiMusic size={64} style={{ marginBottom: '24px', opacity: 0.3 }} />
            <h2 style={{ color: '#fff', fontSize: '24px', margin: '0 0 8px 0' }}>No songs found</h2>
            <p style={{ fontSize: '14px' }}>We couldn't find any tracks for this artist right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {songs.map((song, i) => (
              <SongCard key={song.videoId || i} song={song} songs={songs} index={i} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .play-btn-big:hover { transform: scale(1.08); }
        .play-btn-big:active { transform: scale(0.95); }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        .skeleton-pulse {
          background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
          background-size: 200% 100%;
          animation: pulse-bg 1.5s infinite;
        }
        
        @keyframes pulse-bg {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .hover-bg-card:hover {
          background: rgba(255,255,255,0.2) !important;
        }

        .song-list-container {
          padding: 0 32px;
        }

        @media (max-width: 768px) {
          .song-list-container {
            padding: 0 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
