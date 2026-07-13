'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, ReferenceLine,
} from 'recharts'
import { Project, Stage } from '@/types'
import { useI18n } from '@/lib/eqt/i18n'

const STATUS_COLORS_MAP: Record<string, string> = {
  '01': '#3498DB',
  '02': '#F39C12',
  '03': '#2ECC71',
  '04': '#E74C3C',
}

interface Props {
  projects: Project[]
  stages: Stage[]
}

const CHART_COLORS = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C']

export default function DashboardCharts({ projects, stages }: Props) {
  const { t } = useI18n()

  // Projects by month
  const byMonth = useMemo(() => {
    const map: Record<string, number> = {}
    projects.forEach((p) => {
      if (p.get_info_date) {
        const key = p.get_info_date.slice(0, 7) // YYYY-MM
        map[key] = (map[key] ?? 0) + 1
      }
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: month.slice(5), // MM
        count,
      }))
  }, [projects])

  // Workload by person
  const byPerson = useMemo(() => {
    const map: Record<string, number> = {}
    projects.forEach((p) => {
      const key = p.responsible_person ?? 'Unknown'
      map[key] = (map[key] ?? 0) + 1
    })
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }))
  }, [projects])

  // Status breakdown
  const statusData = useMemo(() => {
    const map: Record<string, number> = {}
    projects.forEach((p) => {
      map[p.status] = (map[p.status] ?? 0) + 1
    })
    const labels: Record<string, string> = {
      '01': t('status.01'),
      '02': t('status.02'),
      '03': t('status.03'),
      '04': t('status.04'),
    }
    return Object.entries(map).map(([status, value]) => ({
      name: labels[status] ?? status,
      value,
      color: STATUS_COLORS_MAP[status] ?? '#888',
    }))
  }, [projects, t])

  // Avg turnaround: days from get_info_date to quotation_sent_date
  const turnaround = useMemo(() => {
    const map: Record<string, number[]> = {}
    projects.forEach((p) => {
      if (p.get_info_date && p.quotation_sent_date) {
        const days =
          (new Date(p.quotation_sent_date).getTime() - new Date(p.get_info_date).getTime()) /
          86400000
        if (days >= 0 && days < 365) {
          const key = p.responsible_person ?? 'Unknown'
          if (!map[key]) map[key] = []
          map[key].push(days)
        }
      }
    })
    return Object.entries(map).map(([name, days]) => ({
      name,
      avg: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
    }))
  }, [projects])

  // Win rate by quarter
  const winByQuarter = useMemo(() => {
    const map: Record<string, { won: number; decided: number }> = {}
    projects.forEach((p) => {
      if (!p.quarter) return
      if (!map[p.quarter]) map[p.quarter] = { won: 0, decided: 0 }
      if (p.status === '03') {
        map[p.quarter].won += 1
        map[p.quarter].decided += 1
      } else if (p.status === '04') {
        map[p.quarter].decided += 1
      }
    })

    // Sort quarters chronologically. Format examples: "Q3/2024", "Q4/2024", "2025", "2026"
    const parseQuarter = (q: string): number => {
      const fullYear = q.match(/^(\d{4})$/)
      if (fullYear) return parseInt(fullYear[1]) * 10 // treat bare year as Q1-ish
      const qy = q.match(/Q(\d)\/(\d{4})/)
      if (qy) return parseInt(qy[2]) * 10 + parseInt(qy[1])
      return 0
    }

    return Object.entries(map)
      .sort(([a], [b]) => parseQuarter(a) - parseQuarter(b))
      .map(([quarter, { won, decided }]) => ({
        quarter,
        winRate: decided > 0 ? Math.round((won / decided) * 100) : 0,
      }))
  }, [projects])

  const tooltipStyle = {
    backgroundColor: '#1e2a3a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#e2e8f0',
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Projects by month */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('dashboard.projectsByMonth')}</h3>
        {byMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {byMonth.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">{t('common.noData')}</div>
        )}
      </div>

      {/* Workload by person */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('dashboard.workloadByPerson')}</h3>
        {byPerson.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byPerson} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {byPerson.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">{t('common.noData')}</div>
        )}
      </div>

      {/* Status donut */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('dashboard.statusBreakdown')}</h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                paddingAngle={3}
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">{t('common.noData')}</div>
        )}
      </div>

      {/* Avg turnaround */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('dashboard.avgTurnaround')}</h3>
        {turnaround.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={turnaround} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="avg" fill="#9B59B6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">{t('common.noData')}</div>
        )}
      </div>

      {/* Win rate by quarter */}
      <div className="bg-card border border-border rounded-xl p-5 xl:col-span-2">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('dashboard.winRateByQuarter')}</h3>
        {winByQuarter.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={winByQuarter} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <XAxis dataKey="quarter" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                formatter={(value) => [`${value}%`, 'Win Rate']}
              />
              <ReferenceLine y={50} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
              <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                {winByQuarter.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.winRate >= 50 ? '#2ECC71' : entry.winRate >= 20 ? '#F39C12' : '#E74C3C'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">{t('common.noData')}</div>
        )}
      </div>
    </div>
  )
}
