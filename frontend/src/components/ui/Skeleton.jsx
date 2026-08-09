/**
 * RHYM v2.0 — Skeleton
 * ─────────────────────────────────────────────
 * CHANGES:
 * - Uses CSS keyframe pulse instead of shimmer sweep
 * - rgba(255,255,255,0.05) → rgba(255,255,255,0.1)
 * - 64px tall horizontal skeleton to match new song items
 */

export function SongCardSkeleton() {
  return (
    <div className="skeleton-pulse" style={{ height: 64, borderRadius: 12 }} />
  )
}
