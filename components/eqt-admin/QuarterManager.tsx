'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProjectStatus } from '@/types'

interface QuarterStats {
  quarter: string
  total: number
  received: number    // 01
  inProgress: number  // 02
  won: number         // 03
  failed: number      // 04
  winRate: number
}

function computeStats(rows: { status: ProjectStatus; quarter: string | null }[]): QuarterStats[] {
  const map: Record<string, { received: number; inProgress: number; won: number; failed: number }> = {}

  for (const row of rows) {
    const q = row.quarter ?? 'Unknown'
    if (!map[q]) map[q] = { received: 0, inProgress: 0, won: 0, failed: 0 }
    if (row.status === '01') map[q].received++
    else if (row.status === '02') map[q].inProgress++
    else if (row.status === '03') map[q].won++
    else if (row.status === '04') map[q].failed++
  }

  return Object.entries(map)
    .map(([quarter, counts]) => {
      const total = counts.received + counts.inProgress + counts.won + counts.failed
      const decided = counts.won + counts.failed
      const winRate = decided > 0 ? Math.round((counts.won / decided) * 100) : 0
      return { quarter, total, winRate, ...counts }
    })
    .sort((a, b) => b.quarter.localeCompare(a.quarter))
}

function StatusPill({ count, label, colorClass }: { count: number; label: string; colorClass: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colorClass}`}>
        {count}
      </span>
      <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
    </div>
  )
}

function MiniBar({ won, inProgress, received, failed, total }: {
  won: number; inProgress: number; received: number; failed: number; total: number
}) {
  if (total === 0) return <div className="h-2 rounded-full bg-border w-full" />

  const pWon = (won / total) * 100
  const pInProgress = ((inProgress + received) / total) * 100
  const pFailed = (failed / total) * 100

  return (
    <div className="flex h-2 rounded-full overflow-hidden w-full bg-border gap-px">
      {pWon > 0 && (
        <div
          className="bg-green-500 h-full transition-all"
          style={{ width: `${pWon}%` }}
          title={`Won: ${won}`}
        />
      )}
      {pInProgress > 0 && (
        <div
          className="bg-yellow-500 h-full transition-all"
          style={{ width: `${pInProgress}%` }}
          title={`In progress / Received: ${inProgress + received}`}
        />
      )}
      {pFailed > 0 && (
        <div
          className="bg-red-500 h-full transition-all"
          style={{ width: `${pFailed}%` }}
          title={`Failed: ${failed}`}
        />
      )}
    </div>
  )
}

function QuarterCard({ stats }: { stats: QuarterStats }) {
  const winRateColor =
    stats.winRate >= 60
      ? 'text-green-400'
      : stats.winRate >= 30
      ? 'text-yellow-400'
      : stats.winRate > 0
      ? 'text-red-400'
      : 'text-muted-foreground'

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-0.5">Quarter</p>
          <h3 className="text-xl font-bold text-foreground">{stats.quarter}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-0.5">Win rate</p>
          <p className={`text-2xl font-bold tabular-nums ${winRateColor}`}>
            {stats.total === 0 ? '-' : `${stats.winRate}%`}
          </p>
        </div>
      </div>

      {/* Mini bar */}
      <MiniBar
        won={stats.won}
        inProgress={stats.inProgress}
        received={stats.received}
        failed={stats.failed}
        total={stats.total}
      />

      {/* Status pills */}
      <div className="flex items-end justify-between">
        <StatusPill count={stats.received}   label="Received"    colorClass="bg-blue-500/20 text-blue-400" />
        <StatusPill count={stats.inProgress} label="In Process"  colorClass="bg-yellow-500/20 text-yellow-400" />
        <StatusPill count={stats.won}        label="Won"         colorClass="bg-green-500/20 text-green-400" />
        <StatusPill count={stats.failed}     label="Failed"      colorClass="bg-red-500/20 text-red-400" />
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-foreground">
            {stats.total}
          </span>
          <span className="text-[10px] text-muted-foreground leading-none">Total</span>
        </div>
      </div>
    </div>
  )
}

export default function QuarterManager() {
  const supabase = createClient()
  const [quarters, setQuarters] = useState<QuarterStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('projects')
        .select('status, quarter')

      if (!data) { setLoading(false); return }
      setQuarters(computeStats(data as { status: ProjectStatus; quarter: string | null }[]))
      setLoading(false)
    }
    load()
  }, [])

  // Aggregate totals
  const totals = quarters.reduce(
    (acc, q) => ({
      total:      acc.total      + q.total,
      received:   acc.received   + q.received,
      inProgress: acc.inProgress + q.inProgress,
      won:        acc.won        + q.won,
      failed:     acc.failed     + q.failed,
    }),
    { total: 0, received: 0, inProgress: 0, won: 0, failed: 0 }
  )
  const overallDecided = totals.won + totals.failed
  const overallWinRate = overallDecided > 0 ? Math.round((totals.won / overallDecided) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Aggregate banner */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">All Quarters</p>
            <p className="text-3xl font-bold text-foreground tabular-nums">{totals.total} <span className="text-base font-normal text-muted-foreground">projects</span></p>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Overall win rate</p>
              <p className="text-2xl font-bold text-green-400 tabular-nums">
                {overallDecided > 0 ? `${overallWinRate}%` : '-'}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{totals.received} received</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{totals.inProgress} in progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{totals.won} won</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{totals.failed} failed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall bar */}
        <div className="mt-4">
          <MiniBar
            won={totals.won}
            inProgress={totals.inProgress}
            received={totals.received}
            failed={totals.failed}
            total={totals.total}
          />
        </div>
      </div>

      {/* Quarter cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 h-40 animate-pulse" />
          ))}
        </div>
      ) : quarters.length === 0 ? (
        <div className="bg-card border border-border rounded-xl px-5 py-10 text-center text-sm text-muted-foreground">
          No quarter data found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quarters.map((q) => (
            <QuarterCard key={q.quarter} stats={q} />
          ))}
        </div>
      )}
    </div>
  )
}
