'use client'

import { Stage } from '@/types'
import { useI18n } from '@/lib/eqt/i18n'
import { DashboardFilters as Filters } from './DashboardClient'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: '01', labelKey: 'status.01', color: 'border-blue-500 bg-blue-500/20 text-blue-400' },
  { value: '02', labelKey: 'status.02', color: 'border-yellow-500 bg-yellow-500/20 text-yellow-400' },
  { value: '03', labelKey: 'status.03', color: 'border-green-500 bg-green-500/20 text-green-400' },
  { value: '04', labelKey: 'status.04', color: 'border-red-500 bg-red-500/20 text-red-400' },
]

interface Props {
  filters: Filters
  setFilters: (f: Filters) => void
  quarters: string[]
  persons: string[]
  stages: Stage[]
}

export default function DashboardFilters({ filters, setFilters, quarters, persons, stages }: Props) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)

  const hasActive = filters.quarter || filters.status.length > 0 || filters.person || filters.stage || filters.dateFrom || filters.dateTo

  function toggleStatus(val: string) {
    const current = filters.status
    setFilters({
      ...filters,
      status: current.includes(val) ? current.filter((s) => s !== val) : [...current, val],
    })
  }

  const selectClass = 'w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header row - always visible */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{t('dashboard.filters')}</span>
          {hasActive && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Active</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasActive && (
            <button
              onClick={() => setFilters({ quarter: '', status: [], person: '', stage: '', dateFrom: '', dateTo: '' })}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
          >
            {expanded ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Status chips - always visible as quick filters */}
      <div className="flex flex-wrap gap-2 px-4 pb-3">
        {STATUS_OPTIONS.map(({ value, labelKey, color }) => {
          const active = filters.status.includes(value)
          return (
            <button
              key={value}
              onClick={() => toggleStatus(value)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                active ? color : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {t(labelKey)}
            </button>
          )
        })}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 pb-4 border-t border-border pt-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('dashboard.quarter')}</label>
            <select
              value={filters.quarter}
              onChange={(e) => setFilters({ ...filters, quarter: e.target.value })}
              className={selectClass}
            >
              <option value="">{t('dashboard.allQuarters')}</option>
              {quarters.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('dashboard.person')}</label>
            <select
              value={filters.person}
              onChange={(e) => setFilters({ ...filters, person: e.target.value })}
              className={selectClass}
            >
              <option value="">{t('dashboard.allPersons')}</option>
              {persons.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('dashboard.stage')}</label>
            <select
              value={filters.stage}
              onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
              className={selectClass}
            >
              <option value="">{t('dashboard.allStages')}</option>
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('dashboard.dateFrom')}</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className={selectClass}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('dashboard.dateTo')}</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className={selectClass}
            />
          </div>
        </div>
      )}
    </div>
  )
}
