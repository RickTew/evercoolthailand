'use client'

import { useState, useMemo } from 'react'
import { useI18n } from '@/lib/eqt/i18n'
import {
  ServiceRecord,
  EquipmentFilter,
  ServiceVisit,
  ServiceRecordEquipment,
  FilterInventory,
} from '@/types'
import {
  Plus,
  Search,
  Wrench,
  Database,
  Boxes,
  CalendarDays,
  List,
  FileDown,
  AlertTriangle,
  Clock,
  CheckCircle,
  CalendarClock,
  ChevronRight,
  Building2,
  Pencil,
} from 'lucide-react'
import RecordSlideOver from './RecordSlideOver'
import EquipmentSlideOver from './EquipmentSlideOver'
import CalendarView from './CalendarView'
import FilterInventoryView from './FilterInventoryView'
import {
  DueStatus,
  getDueStatus,
  daysUntilDue,
  getCountdownLabel,
  formatDate,
  lastVisitDate,
  STATUS_ORDER,
  applyQuickFilter,
} from './helpers'
import { exportServiceReport } from '@/lib/eqt/export'

interface Props {
  initialRecords: ServiceRecord[]
  initialEquipment: EquipmentFilter[]
  initialVisits: ServiceVisit[]
  initialLinks: ServiceRecordEquipment[]
  initialInventory: FilterInventory[]
  isAdmin: boolean
  displayName: string | null
}

type Tab = 'records' | 'equipment' | 'inventory'
type RecordsView = 'list' | 'calendar'
type QuickFilter = 'all' | 'mine' | 'overdue' | 'this-month' | 'next-30'

// ─── Status badge w/ smart countdown ───────────────────────────────────────────

function CountdownBadge({ dueDate, t }: { dueDate: string | null; t: ReturnType<typeof useI18n>['t'] }) {
  const status = getDueStatus(dueDate)
  const label = getCountdownLabel(dueDate)
  const text = t(label.key, label.params)

  const configs: Record<DueStatus, { icon: typeof AlertTriangle; cls: string }> = {
    overdue: { icon: AlertTriangle, cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
    'due-soon': { icon: Clock, cls: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30' },
    ok: { icon: CheckCircle, cls: 'bg-green-500/15 text-green-300 border-green-500/30' },
    'no-date': { icon: CalendarClock, cls: 'bg-muted text-muted-foreground border-border' },
  }
  const { icon: Icon, cls } = configs[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${cls}`}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      {text}
    </span>
  )
}

// ─── Service record CARD (mobile/tablet) ──────────────────────────────────────

function RecordCard({
  record,
  visits,
  onClick,
  t,
}: {
  record: ServiceRecord
  visits: ServiceVisit[]
  onClick: () => void
  t: ReturnType<typeof useI18n>['t']
}) {
  const last = lastVisitDate(visits, record.id)
  const status = getDueStatus(record.due_date)
  const cardCls =
    status === 'overdue'
      ? 'border-red-500/40'
      : status === 'due-soon'
      ? 'border-yellow-500/40'
      : 'border-border'
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border ${cardCls} bg-card p-4 hover:bg-accent/30 active:scale-[0.99] transition-all`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{record.project_name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {[record.location, record.department].filter(Boolean).join(' · ') || '-'}
          </p>
        </div>
        <CountdownBadge dueDate={record.due_date} t={t} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground">{t('service.columns.frequency')}</div>
          <div className="text-foreground font-medium">
            {record.visits_per_year ? t(`service.visitFrequency.${record.visits_per_year}`) : '-'}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">{t('service.columns.units')}</div>
          <div className="text-foreground font-medium">{record.unit_count ?? '-'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">{t('service.columns.lastVisit')}</div>
          <div className="text-foreground font-medium">{formatDate(last)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">{t('service.columns.dueDate')}</div>
          <div className="text-foreground font-medium">{formatDate(record.due_date)}</div>
        </div>
      </div>

      {(record.po_number || record.contractor_qt_number) && (
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2 text-[10px] text-muted-foreground font-mono">
          {record.po_number && <span>PO: {record.po_number}</span>}
          {record.contractor_qt_number && <span>QT: {record.contractor_qt_number}</span>}
        </div>
      )}

      <div className="mt-3 flex items-center justify-end text-xs text-primary">
        <span>{t('service.detail')}</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </button>
  )
}

// ─── Equipment CARD ────────────────────────────────────────────────────────────

function EquipmentCard({
  equipment,
  onClick,
  t,
}: {
  equipment: EquipmentFilter
  onClick: () => void
  t: ReturnType<typeof useI18n>['t']
}) {
  const formatFilter = (size: string | null, qty: number | null, prefix?: string) => {
    if (!size || size === '-') return '-'
    return `${prefix ? prefix + ' ' : ''}${size}${qty ? ` × ${qty}` : ''}`
  }
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card p-4 hover:bg-accent/30 active:scale-[0.99] transition-all space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{equipment.unit_name ?? '-'}</h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{equipment.model ?? '-'}</p>
        </div>
        {equipment.unit_set_count != null && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
            {equipment.unit_set_count} {equipment.unit_set_count === 1 ? 'set' : 'sets'}
          </span>
        )}
      </div>

      <div className="space-y-1 text-xs">
        {equipment.model_number && (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">{t('service.equipment.modelNumber')}</span>
            <span className="font-mono text-foreground truncate">{equipment.model_number}</span>
          </div>
        )}
        {equipment.model_cdu_number && (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">{t('service.equipment.cduNumber')}</span>
            <span className="font-mono text-foreground truncate text-right">{equipment.model_cdu_number}</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('service.equipment.preFilter')}</span>
          <span className="text-foreground font-mono">{formatFilter(equipment.pre_filter_sizing, equipment.pre_filter_qty)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('service.equipment.midFilter')}</span>
          <span className="text-foreground font-mono">{formatFilter(equipment.mid_filter_sizing, equipment.mid_filter_qty, equipment.mid_filter_type ?? undefined)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('service.equipment.hepa')}</span>
          <span className="text-foreground font-mono">{formatFilter(equipment.hepa_sizing, equipment.hepa_qty)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end pt-2 border-t border-border text-xs text-primary">
        <Pencil className="w-3 h-3 mr-1" />
        <span>{t('service.equipment.detail')}</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </button>
  )
}

// ─── Equipment grouped by location ────────────────────────────────────────────

function EquipmentGrid({
  equipment,
  onItemClick,
  t,
}: {
  equipment: EquipmentFilter[]
  onItemClick: (eq: EquipmentFilter) => void
  t: ReturnType<typeof useI18n>['t']
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, EquipmentFilter[]>()
    for (const item of equipment) {
      const loc = item.location ?? 'Unknown'
      if (!map.has(loc)) map.set(loc, [])
      map.get(loc)!.push(item)
    }
    return map
  }, [equipment])

  return (
    <div className="space-y-8">
      {[...grouped.entries()].map(([location, items]) => (
        <section key={location} className="rounded-2xl border border-border bg-muted/20 overflow-hidden">
          {/* Location header - strong visual anchor at top of each group */}
          <header className="flex items-center justify-between gap-3 px-4 py-3 bg-primary/10 border-b border-primary/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-base truncate">{location}</h3>
            </div>
            <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
              {items.length} {items.length === 1 ? 'unit' : 'units'}
            </span>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {items.map((eq) => (
              <EquipmentCard key={eq.id} equipment={eq} onClick={() => onItemClick(eq)} t={t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ServiceClient({
  initialRecords,
  initialEquipment,
  initialVisits,
  initialLinks,
  initialInventory,
  isAdmin,
  displayName,
}: Props) {
  const { t } = useI18n()

  // Top-level tab
  const [tab, setTab] = useState<Tab>('records')
  // Records sub-view (list / calendar)
  const [recordsView, setRecordsView] = useState<RecordsView>('list')

  // Data state (all client-side after hydration)
  const [records, setRecords] = useState<ServiceRecord[]>(initialRecords)
  const [equipment, setEquipment] = useState<EquipmentFilter[]>(initialEquipment)
  const [visits, setVisits] = useState<ServiceVisit[]>(initialVisits)
  const [links, setLinks] = useState<ServiceRecordEquipment[]>(initialLinks)

  // Slide-over state
  const [recordSlideOver, setRecordSlideOver] = useState<ServiceRecord | 'new' | null>(null)
  const [equipmentSlideOver, setEquipmentSlideOver] = useState<EquipmentFilter | 'new' | null>(null)

  // Records filtering / search
  const [search, setSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')

  const knownLocations = useMemo(
    () => Array.from(new Set(equipment.map((e) => e.location))).sort(),
    [equipment]
  )

  // Filtered + sorted records
  const filteredRecords = useMemo(() => {
    let list = applyQuickFilter(records, quickFilter, displayName)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.project_name.toLowerCase().includes(q) ||
          (r.location ?? '').toLowerCase().includes(q) ||
          (r.department ?? '').toLowerCase().includes(q) ||
          (r.po_number ?? '').toLowerCase().includes(q) ||
          (r.contractor_qt_number ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [records, quickFilter, search, displayName])

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const sa = STATUS_ORDER[getDueStatus(a.due_date)]
      const sb = STATUS_ORDER[getDueStatus(b.due_date)]
      if (sa !== sb) return sa - sb
      // Within same status, sort by due date asc (earliest first)
      const da = a.due_date ? new Date(a.due_date).getTime() : Infinity
      const db = b.due_date ? new Date(b.due_date).getTime() : Infinity
      return da - db
    })
  }, [filteredRecords])

  // KPIs
  const kpi = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return {
      total: records.length,
      overdue: records.filter((r) => getDueStatus(r.due_date) === 'overdue').length,
      dueThisMonth: records.filter((r) => {
        if (!r.due_date) return false
        const d = new Date(r.due_date)
        return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
      }).length,
      completedYTD: visits.filter((v) => new Date(v.completed_date).getFullYear() === today.getFullYear()).length,
    }
  }, [records, visits])

  // Quick-filter counts
  const filterCounts = useMemo(() => {
    return {
      all: records.length,
      mine: applyQuickFilter(records, 'mine', displayName).length,
      overdue: applyQuickFilter(records, 'overdue', displayName).length,
      'this-month': applyQuickFilter(records, 'this-month', displayName).length,
      'next-30': applyQuickFilter(records, 'next-30', displayName).length,
    }
  }, [records, displayName])

  // Handlers
  function handleRecordSaved(rec: ServiceRecord) {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === rec.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = rec
        return next
      }
      return [rec, ...prev]
    })
    setRecordSlideOver(rec)
  }

  function handleRecordDeleted(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setRecordSlideOver(null)
  }

  function handleVisitAdded(visit: ServiceVisit, updatedRecord: ServiceRecord) {
    setVisits((prev) => [visit, ...prev])
    setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)))
    setRecordSlideOver(updatedRecord)
  }

  function handleVisitDeleted(visitId: string) {
    setVisits((prev) => prev.filter((v) => v.id !== visitId))
  }

  function handleLinkAdded(link: ServiceRecordEquipment) {
    setLinks((prev) => [...prev, link])
  }

  function handleLinkRemoved(recordId: string, equipmentId: string) {
    setLinks((prev) => prev.filter((l) => !(l.service_record_id === recordId && l.equipment_filter_id === equipmentId)))
  }

  function handleEquipmentSaved(eq: EquipmentFilter) {
    setEquipment((prev) => {
      const idx = prev.findIndex((e) => e.id === eq.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = eq
        return next
      }
      return [...prev, eq].sort((a, b) => a.location.localeCompare(b.location))
    })
    setEquipmentSlideOver(null)
  }

  function handleEquipmentDeleted(id: string) {
    setEquipment((prev) => prev.filter((e) => e.id !== id))
    setEquipmentSlideOver(null)
  }

  // ─── Render ──

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('service.title')}</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportServiceReport(records, visits)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
          >
            <FileDown className="w-4 h-4" />
            {t('service.report.monthly')}
          </button>
          {tab === 'records' && (
            <button
              onClick={() => setRecordSlideOver('new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('service.newRecord')}
            </button>
          )}
          {tab === 'equipment' && (
            <button
              onClick={() => setEquipmentSlideOver('new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('service.newEquipment')}
            </button>
          )}
        </div>
      </div>

      {/* KPIs (only on records tab) */}
      {tab === 'records' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{t('service.kpi.total')}</div>
            <div className="text-2xl font-bold text-foreground tabular-nums mt-1">{kpi.total}</div>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <div className="text-xs text-red-300">{t('service.kpi.overdue')}</div>
            <div className="text-2xl font-bold text-red-300 tabular-nums mt-1">{kpi.overdue}</div>
          </div>
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
            <div className="text-xs text-yellow-200">{t('service.kpi.dueThisMonth')}</div>
            <div className="text-2xl font-bold text-yellow-200 tabular-nums mt-1">{kpi.dueThisMonth}</div>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
            <div className="text-xs text-green-300">{t('service.kpi.completedYTD')}</div>
            <div className="text-2xl font-bold text-green-300 tabular-nums mt-1">{kpi.completedYTD}</div>
          </div>
        </div>
      )}

      {/* Top-level tabs - 3-col grid so each tab always fits, regardless of viewport */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg">
        {([
          { key: 'records', icon: Wrench, label: t('service.tabs.records') },
          { key: 'equipment', icon: Database, label: t('service.tabs.equipment') },
          { key: 'inventory', icon: Boxes, label: t('service.tabs.inventory') },
        ] as const).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center justify-center gap-2 px-2 py-2 rounded-md text-sm font-medium transition-colors min-w-0 ${
              tab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Records tab ── */}
      {tab === 'records' && (
        <>
          {/* List/Calendar view toggle */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setRecordsView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  recordsView === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                {t('service.view.list')}
              </button>
              <button
                onClick={() => setRecordsView('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  recordsView === 'calendar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                {t('service.view.calendar')}
              </button>
            </div>

            {recordsView === 'list' && (
              <div className="relative flex-1 max-w-sm min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder={t('service.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}
          </div>

          {recordsView === 'calendar' ? (
            <CalendarView records={records} visits={visits} onRecordClick={(r) => setRecordSlideOver(r)} />
          ) : (
            <>
              {/* Quick filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">{t('service.quickFilters.title')}:</span>
                {([
                  { key: 'all', label: t('service.quickFilters.all') },
                  ...(displayName ? [{ key: 'mine' as const, label: t('service.quickFilters.mine') }] : []),
                  { key: 'overdue', label: t('service.quickFilters.overdue') },
                  { key: 'this-month', label: t('service.quickFilters.thisMonth') },
                  { key: 'next-30', label: t('service.quickFilters.next30') },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setQuickFilter(key as QuickFilter)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      quickFilter === key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {label}
                    <span className="tabular-nums opacity-70">{filterCounts[key]}</span>
                  </button>
                ))}
              </div>

              {/* Empty state or list */}
              {sortedRecords.length === 0 ? (
                <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
                  {t('service.noRecords')}
                </div>
              ) : (
                <>
                  {/* Mobile/tablet: cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:hidden gap-3">
                    {sortedRecords.map((r) => (
                      <RecordCard
                        key={r.id}
                        record={r}
                        visits={visits}
                        onClick={() => setRecordSlideOver(r)}
                        t={t}
                      />
                    ))}
                  </div>

                  {/* Desktop (xl+): full table */}
                  <div className="hidden xl:block bg-card border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {['number', 'projectName', 'location', 'department', 'poNumber', 'units', 'frequency', 'lastVisit', 'dueDate', 'qtNumber'].map((c) => (
                            <th key={c} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                              {t(`service.columns.${c}`)}
                            </th>
                          ))}
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRecords.map((record, i) => {
                          const last = lastVisitDate(visits, record.id)
                          const status = getDueStatus(record.due_date)
                          const rowCls =
                            status === 'overdue'
                              ? 'bg-red-500/5'
                              : status === 'due-soon'
                              ? 'bg-yellow-500/5'
                              : i % 2 === 1
                              ? 'bg-muted/10'
                              : ''
                          return (
                            <tr
                              key={record.id}
                              onClick={() => setRecordSlideOver(record)}
                              className={`border-b border-border last:border-0 hover:bg-accent/30 transition-colors cursor-pointer ${rowCls}`}
                            >
                              <td className="px-4 py-3 text-muted-foreground">{record.record_number ?? '-'}</td>
                              <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{record.project_name}</td>
                              <td className="px-4 py-3 text-muted-foreground">{record.location ?? '-'}</td>
                              <td className="px-4 py-3 text-muted-foreground">{record.department ?? '-'}</td>
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{record.po_number ?? '-'}</td>
                              <td className="px-4 py-3 text-center">{record.unit_count ?? '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                {record.visits_per_year ? t(`service.visitFrequency.${record.visits_per_year}`) : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(last)}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <CountdownBadge dueDate={record.due_date} t={t} />
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{record.contractor_qt_number ?? '-'}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                <ChevronRight className="w-4 h-4" />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── Equipment tab ── */}
      {tab === 'equipment' && (
        equipment.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
            {t('service.noEquipment')}
          </div>
        ) : (
          <EquipmentGrid equipment={equipment} onItemClick={(e) => setEquipmentSlideOver(e)} t={t} />
        )
      )}

      {/* ── Inventory tab ── */}
      {tab === 'inventory' && (
        <FilterInventoryView initialItems={initialInventory} isAdmin={isAdmin} />
      )}

      {/* Slide-overs */}
      {recordSlideOver !== null && (
        <RecordSlideOver
          record={recordSlideOver}
          visits={visits}
          equipment={equipment}
          links={links}
          onClose={() => setRecordSlideOver(null)}
          onRecordSaved={handleRecordSaved}
          onRecordDeleted={handleRecordDeleted}
          onVisitAdded={handleVisitAdded}
          onVisitDeleted={handleVisitDeleted}
          onLinkAdded={handleLinkAdded}
          onLinkRemoved={handleLinkRemoved}
          isAdmin={isAdmin}
        />
      )}

      {equipmentSlideOver !== null && (
        <EquipmentSlideOver
          equipment={equipmentSlideOver}
          knownLocations={knownLocations}
          onClose={() => setEquipmentSlideOver(null)}
          onSaved={handleEquipmentSaved}
          onDeleted={handleEquipmentDeleted}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
