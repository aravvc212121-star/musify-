/**
 * RHYM v2.0 — ChartsPage
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Uses 64px horizontal song items
 * - Removed playlist references
 * - No backdrop-filter blur
 * - Simplified layout
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getChart } from '../utils/api.js'
import SongCard from '../components/ui/SongCard.jsx'

export default function ChartsPage() {
  const { id } = useParams()
  const [chart, setChart] = useState(null)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getChart(id)
        setChart(data.chart)
        setSongs(data.songs || [])
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    load()
  }, [id])

  return (
    <div style={{ padding: '24px 16px 120px', maxWidth: 800, margin: '0 auto' }}>
      {/* Chart Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 4 }}>
          {chart?.name || id}
        </h1>
        {chart?.description && (
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
            {chart.description}
          </p>
        )}
      </div>

      {/* Songs */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="skeleton-pulse" style={{ height: 64, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {songs.map((song, i) => (
            <SongCard key={song.videoId} song={song} songs={songs} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
