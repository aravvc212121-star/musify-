/**
 * RHYM v2.0 — HomeRow
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Uses horizontal song items (64px tall) instead of grid cards
 * - On mobile: vertical list. On desktop: 2-column grid of items
 * - Skeleton uses CSS pulse
 * - No backdrop-filter blur, no box-shadow on scroll
 * - overscroll-behavior: contain
 */

import { memo } from 'react'
import SongCard from './SongCard.jsx'

const HomeRow = memo(({
  title,
  items = [],
  loading = false,
  isArtist = false,
  isChart = false,
}) => {
  if (!loading && items.length === 0) return null

  const displayItems = loading
    ? Array.from({ length: 6 }).map((_, i) => ({ videoId: `skeleton-${i}` }))
    : items

  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ padding: '0 4px', marginBottom: 12 }}>
        <h2 className="section-heading" style={{ margin: 0 }}>{title}</h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {displayItems.map((_, i) => (
            <div key={i} className="skeleton-pulse" style={{ height: 64, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {displayItems.map((item, i) => (
            <SongCard
              key={item.videoId || i}
              song={item}
              songs={items}
              index={i}
              isArtist={isArtist}
              isChart={isChart}
            />
          ))}
        </div>
      )}
    </section>
  )
})

export default HomeRow
