'use client'

import { useState, useMemo } from 'react'
import { useI18n } from '@/lib/eqt/i18n'
import { ServiceRecord, ServiceVisit } from '@/types'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

interface Props {
  records: ServiceRecord[]
  visits: ServiceVisit[]
  onRecordClick: (record: ServiceRecord) => void
}

export default function CalendarView({ records, visits, onRecordClick }: Props) {
  const { t, locale } = useI18n()
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const monthLabel = currentMonth.toLocaleDateString(
    locale === 'th' ? 'th-TH' : 'en-US',
    { month: 'long', year: 'numeric' }
  )

  // Build days grid (6 weeks × 7 days = 42 cells)
  const days = useMemo(() => {
    const first = new Date(currentMonth)
    const startWeekday = first.getDay() // 0 = Sun
    const startDate = new Date(first)
    startDate.setDate(1 - startWeekday)

    const cells: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      cells.push(d)
    }
    return cells
  }, [currentMonth])

  // Map of YYYY-MM-DD → records due on that date
  const dueByDate = useMemo(() => {
    const map = new Map<string, ServiceRecord[]>()
    for (const r of records) {
      if (!r.due_date) continue
      const key = r.due_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    return map
  }, [records])

  // Map of YYYY-MM-DD → visits completed on that date
  const visitsByDate = useMemo(() => {
    const map = new Map<string, ServiceVisit[]>()
    for (const v of visits) {
      if (!map.has(v.completed_date)) map.set(v.completed_date, [])
      map.get(v.completed_date)!.push(v)
    }
    return map
  }, [visits])

  function dateKey(d: Date) {
    return d.toISOString().split('T')[0]
  }

  function isToday(d: Date) {
    const today = new Date()
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    )
  }

  function isCurrentMonth(d: Date) {
    return d.getMonth() === currentMonth.getMonth()
  }

  function navigate(delta: number) {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1))
  }

  function goToday() {
    const d = new Date()
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  const weekdayLabels = useMemo(() => {
    const sample = new Date(2024, 0, 7) // Jan 7 2024 = Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sample)
      d.setDate(sample.getDate() + i)
      return d.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { weekday: 'short' })
    })
  }, [locale])

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-border hover:bg-accent">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToday} className="px-3 py-2 rounded-lg border border-border hover:bg-accent text-sm font-medium">
            {locale === 'th' ? 'วันนี้' : 'Today'}
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-lg border border-border hover:bg-accent">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1">
        {weekdayLabels.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-muted-foreground py-2">
            {label}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const key = dateKey(d)
          const due = dueByDate.get(key) ?? []
          const completed = visitsByDate.get(key) ?? []
          const inMonth = isCurrentMonth(d)
          const today = isToday(d)
          const hasOverdue = due.some(() => {
            const dueD = new Date(key)
            dueD.setHours(0, 0, 0, 0)
            const tn = new Date()
            tn.setHours(0, 0, 0, 0)
            return dueD.getTime() < tn.getTime()
          })

          return (
            <div
              key={i}
              className={`min-h-[86px] sm:min-h-[110px] rounded-lg border p-1.5 transition-colors ${
                inMonth ? 'bg-card border-border' : 'bg-muted/20 border-border/50'
              } ${today ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${inMonth ? 'text-foreground' : 'text-muted-foreground'} ${today ? 'text-primary' : ''}`}>
                  {d.getDate()}
                </span>
                {completed.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-green-500">
                    <CheckCircle2 className="w-3 h-3" />
                    {completed.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {due.slice(0, 3).map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => onRecordClick(rec)}
                    className={`w-full text-left text-[10px] px-1 py-0.5 rounded truncate transition-colors ${
                      hasOverdue
                        ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30'
                    }`}
                    title={`${rec.project_name} · ${rec.location ?? ''}`}
                  >
                    {rec.project_name}
                  </button>
                ))}
                {due.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1">+{due.length - 3}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
