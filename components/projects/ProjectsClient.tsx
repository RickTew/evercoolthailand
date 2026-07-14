'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Project, Stage, ProjectStatus } from '@/types'
import { useI18n } from '@/lib/eqt/i18n'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from './StatusBadge'
import ProjectSlideOver from './ProjectSlideOver'
import ProjectForm from './ProjectForm'
import { exportToCSV, exportToPDF } from '@/lib/eqt/export'
import ImportDialog from './ImportDialog'
import { Search, Plus, Download, Upload, ChevronUp, ChevronDown, Copy, Check, User, Users, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'

const PAGE_SIZE = 25

type SortKey = 'code' | 'name' | 'customer' | 'status' | 'responsible_person' | 'get_info_date' | 'quarter' | 'follow_up_date'

interface Props {
  initialProjects: Project[]
  stages: Stage[]
  isAdmin: boolean
  displayName: string | null
  // Prefill for the search box (?q= in the URL), so the CRM's project chips can
  // deep-link straight to a project code.
  initialSearch?: string
}

export default function ProjectsClient({ initialProjects, stages, isAdmin, displayName, initialSearch }: Props) {
  const { t } = useI18n()
  const supabase = createClient()
  const [projects, setProjects] = useState(initialProjects)
  const [search, setSearch] = useState(initialSearch ?? '')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('')
  // A deep link must always find its project, so it starts with the
  // "my projects" filter off.
  const [myProjectsOnly, setMyProjectsOnly] = useState(!!displayName && !isAdmin && !initialSearch)
  const [sortKey, setSortKey] = useState<SortKey>('code')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(0)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Export dropdown
  const [showExport, setShowExport] = useState(false)
  // Import dialog
  const [showImport, setShowImport] = useState(false)
  const existingCodes = useMemo(
    () => new Set(projects.map((p) => p.code).filter(Boolean)),
    [projects]
  )
  const exportRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false)
    }
    if (showExport) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showExport])

  // Quick stage advance
  const [advancingId, setAdvancingId] = useState<string | null>(null)
  const [advanceDate, setAdvanceDate] = useState('')
  const [advanceRemark, setAdvanceRemark] = useState('')
  const [advanceSaving, setAdvanceSaving] = useState(false)

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<ProjectStatus | ''>('')
  const [bulkUpdating, setBulkUpdating] = useState(false)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
    setPage(0)
  }

  async function copyTQ(tq: string, id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await navigator.clipboard.writeText(tq)
    setCopiedId(id)
    toast.success(`Copied: ${tq}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function getNextStage(project: Project): Stage | null {
    if (!stages.length) return null
    const currentPos = project.current_stage ? (project.current_stage as Stage).position : -1
    const remaining = stages
      .filter((s) => s.position > currentPos)
      .sort((a, b) => a.position - b.position)
    return remaining[0] ?? null
  }

  function toggleAdvance(project: Project, e: React.MouseEvent) {
    e.stopPropagation()
    if (advancingId === project.id) {
      setAdvancingId(null)
    } else {
      setAdvancingId(project.id)
      setAdvanceDate(new Date().toISOString().split('T')[0])
      setAdvanceRemark('')
    }
  }

  async function handleQuickAdvance(project: Project, e: React.MouseEvent) {
    e.stopPropagation()
    const nextStage = getNextStage(project)
    if (!nextStage || !advanceDate) return
    setAdvanceSaving(true)
    try {
      await supabase.from('stage_logs').insert({
        project_id: project.id,
        stage_id: nextStage.id,
        stage_name: nextStage.name,
        completed_date: advanceDate,
        remark: advanceRemark || null,
      })
      const { data: updated } = await supabase
        .from('projects')
        .update({ current_stage_id: nextStage.id, updated_at: new Date().toISOString() })
        .eq('id', project.id)
        .select('*, current_stage:stages(id,name,color,position)')
        .single()
      if (updated) {
        setProjects((prev) => prev.map((p) => p.id === project.id ? updated as Project : p))
        if (selectedProject?.id === project.id) setSelectedProject(updated as Project)
      }
      toast.success(`Advanced to: ${nextStage.name}`)
      setAdvancingId(null)
    } catch {
      toast.error('Error advancing stage')
    } finally {
      setAdvanceSaving(false)
    }
  }

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (paged.every((p) => selectedIds.has(p.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paged.map((p) => p.id)))
    }
  }

  async function handleBulkStatusUpdate() {
    if (!bulkStatus || selectedIds.size === 0) return
    setBulkUpdating(true)
    const ids = [...selectedIds]
    const { error } = await supabase
      .from('projects')
      .update({ status: bulkStatus, updated_at: new Date().toISOString() })
      .in('id', ids)
    if (error) { toast.error('Bulk update failed'); setBulkUpdating(false); return }
    setProjects((prev) => prev.map((p) => selectedIds.has(p.id) ? { ...p, status: bulkStatus as ProjectStatus } : p))
    toast.success(`Updated ${ids.length} project${ids.length !== 1 ? 's' : ''} to status ${bulkStatus}`)
    setSelectedIds(new Set())
    setBulkStatus('')
    setBulkUpdating(false)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return projects
      .filter((p) => {
        if (myProjectsOnly && displayName && p.responsible_person !== displayName) return false
        if (statusFilter && p.status !== statusFilter) return false
        if (!q) return true
        return (
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.customer ?? '').toLowerCase().includes(q) ||
          (p.tq_number ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const av = (a[sortKey] ?? '') as string
        const bv = (b[sortKey] ?? '') as string
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      })
  }, [projects, search, statusFilter, myProjectsOnly, displayName, sortKey, sortAsc])

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const allPageSelected = paged.length > 0 && paged.every((p) => selectedIds.has(p.id))
  const today = new Date().toISOString().split('T')[0]

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-30" />
    return sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  function handleProjectSaved(p: Project) {
    setProjects((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id)
      if (idx >= 0) {
        const updated = [...prev]; updated[idx] = p; return updated
      }
      return [p, ...prev]
    })
    setShowForm(false)
    setEditProject(null)
  }

  function handleProjectDeleted(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setSelectedProject(null)
  }

  const colClass = 'px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none'
  const colClassStatic = 'px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide select-none'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">{t('projects.title')}</h1>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-medium hover:bg-accent transition-colors"
            >
              <Upload className="w-4 h-4" />
              {t('projects.import')}
            </button>
          )}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExport((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-medium hover:bg-accent transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('projects.export')}
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg z-20">
                <button
                  onClick={() => { exportToCSV(filtered); setShowExport(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors rounded-t-lg"
                >
                  {t('projects.exportCSV')}
                </button>
                <button
                  onClick={() => { exportToPDF(filtered); setShowExport(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors rounded-b-lg"
                >
                  {t('projects.exportPDF')}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => { setEditProject(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('projects.newProject')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('projects.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
          />
        </div>

        {displayName && (
          <button
            onClick={() => { setMyProjectsOnly(!myProjectsOnly); setPage(0) }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              myProjectsOnly
                ? 'border-purple-500 bg-purple-500/20 text-purple-400 font-semibold'
                : 'border-border text-muted-foreground hover:border-purple-500/50'
            }`}
          >
            {myProjectsOnly ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            {myProjectsOnly ? t('projects.myProjects') : t('projects.allProjects')}
          </button>
        )}

        {(['', '01', '02', '03', '04'] as const).map((s) => {
          const styles: Record<string, string> = {
            '': 'border-border',
            '01': 'border-blue-500/40 text-blue-400',
            '02': 'border-yellow-500/40 text-yellow-400',
            '03': 'border-green-500/40 text-green-400',
            '04': 'border-red-500/40 text-red-400',
          }
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0) }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${styles[s]} ${
                statusFilter === s ? 'opacity-100 font-semibold' : 'opacity-50 hover:opacity-100'
              }`}
            >
              {s === '' ? t('dashboard.allStatuses') : t(`status.${s}`)}
            </button>
          )
        })}

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} {t('projects.title').toLowerCase()}
        </span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl scroll-x-fade">
        <div className="scroll-x-table">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-border accent-primary cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
                <th className={colClass} onClick={() => handleSort('code')}>
                  <span className="flex items-center gap-1">{t('projects.columns.code')} <SortIcon col="code" /></span>
                </th>
                <th className={colClass} onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-1">{t('projects.columns.name')} <SortIcon col="name" /></span>
                </th>
                <th className={colClass} onClick={() => handleSort('customer')}>
                  <span className="flex items-center gap-1">{t('projects.columns.customer')} <SortIcon col="customer" /></span>
                </th>
                <th className={colClass} onClick={() => handleSort('quarter')}>
                  <span className="flex items-center gap-1">{t('projects.columns.quarter')} <SortIcon col="quarter" /></span>
                </th>
                <th className={colClassStatic}>{t('projects.columns.stage')}</th>
                <th className={colClass} onClick={() => handleSort('status')}>
                  <span className="flex items-center gap-1">{t('projects.columns.status')} <SortIcon col="status" /></span>
                </th>
                <th className={colClass} onClick={() => handleSort('responsible_person')}>
                  <span className="flex items-center gap-1">{t('projects.columns.person')} <SortIcon col="responsible_person" /></span>
                </th>
                <th className={colClass} onClick={() => handleSort('follow_up_date')}>
                  <span className="flex items-center gap-1">{t('projects.columns.followUp')} <SortIcon col="follow_up_date" /></span>
                </th>
                <th className={colClassStatic}>{t('projects.columns.tqNumber')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    {t('projects.noProjects')}
                  </td>
                </tr>
              )}
              {paged.map((project) => {
                const nextStage = getNextStage(project)
                const isAdvancing = advancingId === project.id
                const isOwner = displayName ? project.responsible_person === displayName : false
                const canAdvance = isAdmin || isOwner

                return (
                  <React.Fragment key={project.id}>
                    <tr
                      onClick={() => { setAdvancingId(null); setSelectedProject(project) }}
                      className={`cursor-pointer transition-colors ${
                        selectedIds.has(project.id) ? 'bg-primary/5' :
                        (project.status === '01' || project.status === '02') && project.follow_up_date && project.follow_up_date < today ? 'bg-red-500/5 hover:bg-red-500/10' :
                        (project.status === '01' || project.status === '02') && project.follow_up_date === today ? 'bg-yellow-500/5 hover:bg-yellow-500/10' :
                        'hover:bg-accent/30'
                      }`}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(project.id)}
                          onChange={() => {}}
                          onClick={(e) => toggleSelect(project.id, e)}
                          className="rounded border-border accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-primary font-semibold">{project.code}</td>
                      <td className="px-3 py-3 max-w-[200px]">
                        <div className="font-medium text-foreground truncate">{project.name}</div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground truncate max-w-[120px]">{project.customer ?? '-'}</td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">{project.quarter ?? '-'}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 group/stage">
                          {project.current_stage ? (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: (project.current_stage as Stage).color + '25',
                                color: (project.current_stage as Stage).color,
                              }}
                            >
                              {(project.current_stage as Stage).name}
                            </span>
                          ) : <span className="text-muted-foreground text-xs">-</span>}

                          {canAdvance && nextStage && (
                            <button
                              onClick={(e) => toggleAdvance(project, e)}
                              title={`Advance to: ${nextStage.name}`}
                              className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md transition-all border opacity-0 group-hover/stage:opacity-100 ${
                                isAdvancing
                                  ? 'opacity-100 bg-primary/20 border-primary/40 text-primary'
                                  : 'bg-accent border-border text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={project.status} /></td>
                      <td className="px-3 py-3">
                        {project.responsible_person ? (
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-semibold"
                            title={project.responsible_person}
                          >
                            {project.responsible_person[0]}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">-</span>}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {project.follow_up_date ? (
                          <span className={
                            project.follow_up_date < today && (project.status === '01' || project.status === '02')
                              ? 'text-red-400 font-medium'
                              : project.follow_up_date === today && (project.status === '01' || project.status === '02')
                              ? 'text-yellow-400 font-medium'
                              : 'text-muted-foreground'
                          }>
                            {project.follow_up_date < today && (project.status === '01' || project.status === '02') ? '⚠ ' : ''}
                            {project.follow_up_date}
                          </span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-3 py-3">
                        {project.tq_number ? (
                          <div className="flex items-center gap-1 group/tq">
                            <span className="text-muted-foreground text-xs font-mono">{project.tq_number}</span>
                            <button
                              onClick={(e) => copyTQ(project.tq_number!, project.id, e)}
                              className="opacity-0 group-hover/tq:opacity-100 p-0.5 rounded hover:bg-accent transition-all"
                              title="Copy TQ number"
                            >
                              {copiedId === project.id
                                ? <Check className="w-3 h-3 text-green-400" />
                                : <Copy className="w-3 h-3 text-muted-foreground" />}
                            </button>
                          </div>
                        ) : <span className="text-muted-foreground text-xs">-</span>}
                      </td>
                    </tr>

                    {/* Inline quick-advance panel */}
                    {isAdvancing && nextStage && (
                      <tr className="bg-primary/5">
                        <td colSpan={10} className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {t('projects.advance')} <span className="font-semibold text-foreground">{project.code}</span> →{' '}
                              <span className="text-primary font-semibold">{nextStage.name}</span>
                            </span>
                            <input
                              type="date"
                              value={advanceDate}
                              onChange={(e) => setAdvanceDate(e.target.value)}
                              className="px-2 py-1 text-xs rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <input
                              type="text"
                              placeholder={t('projects.advanceRemark')}
                              value={advanceRemark}
                              onChange={(e) => setAdvanceRemark(e.target.value)}
                              className="px-2 py-1 text-xs rounded-md bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-48"
                            />
                            <button
                              onClick={(e) => handleQuickAdvance(project, e)}
                              disabled={advanceSaving || !advanceDate}
                              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                            >
                              {advanceSaving ? t('projects.saving') : t('common.confirm')}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setAdvancingId(null) }}
                              className="p-1 rounded hover:bg-accent transition-colors"
                            >
                              <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}
            </span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1 text-xs rounded-lg border border-border disabled:opacity-40 hover:bg-accent transition-colors">←</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`px-3 py-1 text-xs rounded-lg border transition-colors ${i === page ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages - 1} onClick={() => setPage(page + 1)} className="px-3 py-1 text-xs rounded-lg border border-border disabled:opacity-40 hover:bg-accent transition-colors">→</button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-card border border-border rounded-2xl shadow-2xl">
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            {selectedIds.size} {t('projects.selected')}
          </span>
          <div className="w-px h-5 bg-border" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{t('projects.setStatus')}</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as ProjectStatus | '')}
            className="px-2 py-1.5 text-xs rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Choose…</option>
            <option value="01">01 - {t('status.01')}</option>
            <option value="02">02 - {t('status.02')}</option>
            <option value="03">03 - {t('status.03')}</option>
            <option value="04">04 - {t('status.04')}</option>
          </select>
          <button
            onClick={handleBulkStatusUpdate}
            disabled={!bulkStatus || bulkUpdating}
            className="px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {bulkUpdating ? t('projects.updating') : t('projects.apply')}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="p-1 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Slide-over */}
      {selectedProject && (
        <ProjectSlideOver
          project={selectedProject}
          stages={stages}
          isAdmin={isAdmin}
          displayName={displayName}
          onClose={() => setSelectedProject(null)}
          onEdit={(p) => { setSelectedProject(null); setEditProject(p); setShowForm(true) }}
          onDeleted={handleProjectDeleted}
          onUpdated={(p) => { setSelectedProject(p); handleProjectSaved(p) }}
        />
      )}

      {/* Form */}
      {showForm && (
        <ProjectForm
          project={editProject}
          stages={stages}
          onClose={() => { setShowForm(false); setEditProject(null) }}
          onSaved={handleProjectSaved}
        />
      )}

      {/* Import dialog */}
      {showImport && (
        <ImportDialog
          stages={stages}
          existingCodes={existingCodes}
          onClose={() => setShowImport(false)}
          onImported={(newProjects) => {
            setProjects((prev) => [...newProjects, ...prev])
            toast.success(t('projects.importSuccess', { n: newProjects.length }))
          }}
        />
      )}
    </div>
  )
}
