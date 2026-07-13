'use client'

import { useState, useEffect } from 'react'
import { Project, Stage, StageLog, ProjectStatus } from '@/types'
import { useI18n } from '@/lib/eqt/i18n'
import { createClient } from '@/lib/supabase/client'
import StatusBadge from './StatusBadge'
import { X, Edit, Trash2, Check, ChevronRight, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  project: Project
  stages: Stage[]
  isAdmin: boolean
  displayName: string | null
  onClose: () => void
  onEdit: (p: Project) => void
  onDeleted: (id: string) => void
  onUpdated: (p: Project) => void
}

export default function ProjectSlideOver({ project, stages, isAdmin, displayName, onClose, onEdit, onDeleted, onUpdated }: Props) {
  const { t } = useI18n()
  const supabase = createClient()
  const [logs, setLogs] = useState<StageLog[]>([])
  const [markingStage, setMarkingStage] = useState<string | null>(null)
  const [stageDate, setStageDate] = useState('')
  const [stageRemark, setStageRemark] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tqCopied, setTqCopied] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<ProjectStatus>(project.status)
  const [statusChanging, setStatusChanging] = useState(false)

  // A user can edit/advance their own projects; admins can edit everything
  const isOwner = displayName ? project.responsible_person === displayName : false
  const canEdit = isAdmin || isOwner
  const canDelete = isAdmin

  async function handleStatusChange(newStatus: ProjectStatus) {
    if (newStatus === currentStatus || !canEdit) return
    setStatusChanging(true)
    try {
      const { data: updated } = await supabase
        .from('projects')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', project.id)
        .select('*, current_stage:stages(id,name,color,position)')
        .single()
      if (updated) {
        setCurrentStatus(newStatus)
        onUpdated(updated as Project)
        toast.success(`Status → ${newStatus}`)
      }
    } catch {
      toast.error('Failed to update status')
    } finally {
      setStatusChanging(false)
    }
  }

  async function copyTQ() {
    if (!project.tq_number) return
    await navigator.clipboard.writeText(project.tq_number)
    setTqCopied(true)
    toast.success(`Copied: ${project.tq_number}`)
    setTimeout(() => setTqCopied(false), 2000)
  }

  useEffect(() => {
    loadLogs()
  }, [project.id])

  async function loadLogs() {
    const { data } = await supabase
      .from('stage_logs')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true })
    setLogs(data ?? [])
  }

  const completedStageIds = new Set(logs.map((l) => l.stage_id))

  async function handleMarkStage(stage: Stage) {
    if (!stageDate) {
      toast.error('Please enter a completed date')
      return
    }
    setSaving(true)
    try {
      await supabase.from('stage_logs').insert({
        project_id: project.id,
        stage_id: stage.id,
        stage_name: stage.name,
        completed_date: stageDate,
        remark: stageRemark || null,
      })

      // Update current_stage_id on project
      const { data: updated } = await supabase
        .from('projects')
        .update({ current_stage_id: stage.id, updated_at: new Date().toISOString() })
        .eq('id', project.id)
        .select('*, current_stage:stages(id,name,color,position)')
        .single()

      if (updated) onUpdated(updated as Project)
      toast.success('Stage marked complete')
      setMarkingStage(null)
      setStageDate('')
      setStageRemark('')
      loadLogs()
    } catch {
      toast.error('Error saving stage')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (error) { toast.error('Error deleting project'); return }
    toast.success('Project deleted')
    onDeleted(project.id)
  }

  const labelClass = 'text-xs font-medium text-muted-foreground uppercase tracking-wide'
  const valueClass = 'text-sm text-foreground mt-0.5'

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-lg bg-background border-l border-border flex flex-col h-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-primary font-mono">{project.code}</span>
              <StatusBadge status={currentStatus} size="md" />
            </div>
            <p className="text-sm text-foreground mt-0.5 max-w-[280px]">{project.name}</p>
            {/* Quick status change */}
            {canEdit && (
              <div className="flex items-center gap-1.5 mt-2">
                {([
                  { s: '01' as ProjectStatus, active: 'bg-blue-500/20 text-blue-400 border-blue-500', inactive: 'border-blue-500/30 text-blue-400/50 hover:border-blue-500/60' },
                  { s: '02' as ProjectStatus, active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500', inactive: 'border-yellow-500/30 text-yellow-400/50 hover:border-yellow-500/60' },
                  { s: '03' as ProjectStatus, active: 'bg-green-500/20 text-green-400 border-green-500', inactive: 'border-green-500/30 text-green-400/50 hover:border-green-500/60' },
                  { s: '04' as ProjectStatus, active: 'bg-red-500/20 text-red-400 border-red-500', inactive: 'border-red-500/30 text-red-400/50 hover:border-red-500/60' },
                ]).map(({ s, active, inactive }) => (
                  <button
                    key={s}
                    disabled={statusChanging}
                    onClick={() => handleStatusChange(s)}
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-all disabled:opacity-50 ${
                      currentStatus === s ? active : inactive
                    }`}
                  >
                    {t(`status.${s}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => onEdit(project)}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title={t('project.edit')}
              >
                <Edit className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                title={t('project.delete')}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Info section */}
          <div className="px-6 py-5 grid grid-cols-2 gap-4 border-b border-border">
            {[
              [t('project.fields.number'), project.number],
              [t('project.fields.customer'), project.customer],
              [t('project.fields.quarter'), project.quarter],
              [t('project.fields.person'), project.responsible_person],
              [t('project.fields.infoDate'), project.get_info_date],
              [t('project.fields.quotationSentDate'), project.quotation_sent_date],
              [t('project.fields.followUpDate'), project.follow_up_date],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className={labelClass}>{label as string}</p>
                <p className={valueClass}>{(value as string) || '-'}</p>
              </div>
            ))}

            {/* TQ Number with copy button */}
            <div>
              <p className={labelClass}>{t('project.fields.tqNumber')}</p>
              {project.tq_number ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-foreground font-mono">{project.tq_number}</p>
                  <button
                    onClick={copyTQ}
                    className="p-1 rounded hover:bg-accent transition-colors"
                    title="Copy TQ number"
                  >
                    {tqCopied
                      ? <Check className="w-3.5 h-3.5 text-green-400" />
                      : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
              ) : (
                <p className={valueClass}>-</p>
              )}
            </div>

            {project.notes && (
              <div className="col-span-2">
                <p className={labelClass}>{t('project.fields.notes')}</p>
                <p className={valueClass + ' whitespace-pre-wrap'}>{project.notes}</p>
              </div>
            )}
          </div>

          {/* Pipeline progress */}
          <div className="px-6 py-5 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground mb-4">{t('project.pipeline')}</h3>
            <div className="space-y-3">
              {stages.map((stage, idx) => {
                const log = logs.find((l) => l.stage_id === stage.id)
                const done = !!log
                const isMarking = markingStage === stage.id

                return (
                  <div key={stage.id} className="relative">
                    {/* Connector */}
                    {idx < stages.length - 1 && (
                      <div className="absolute left-4 top-9 bottom-0 w-px bg-border" />
                    )}

                    <div
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        done
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-border hover:border-primary/30 hover:bg-accent/30 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (!done) {
                          setMarkingStage(isMarking ? null : stage.id)
                          setStageDate(new Date().toISOString().split('T')[0])
                        }
                      }}
                    >
                      {/* Step circle */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          done
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                        style={done ? {} : { borderColor: stage.color, border: `2px solid ${stage.color}40` }}
                      >
                        {done ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{stage.name}</span>
                          {!done && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        {log && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {log.completed_date}
                            {log.remark && ` - ${log.remark}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mark complete form */}
                    {isMarking && !done && (
                      <div className="mt-2 ml-11 p-3 bg-card border border-border rounded-lg space-y-2">
                        <input
                          type="date"
                          value={stageDate}
                          onChange={(e) => setStageDate(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <input
                          type="text"
                          placeholder={t('project.remark')}
                          value={stageRemark}
                          onChange={(e) => setStageRemark(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-md bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkStage(stage)}
                            disabled={saving}
                            className="flex-1 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 disabled:opacity-60"
                          >
                            {t('project.markComplete')}
                          </button>
                          <button
                            onClick={() => setMarkingStage(null)}
                            className="px-3 py-1.5 border border-border text-xs rounded-md hover:bg-accent"
                          >
                            {t('project.cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stage timeline */}
          <div className="px-6 py-5">
            <h3 className="font-semibold text-sm text-foreground mb-4">{t('project.stageTimeline')}</h3>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div className="relative">
                {logs.map((log, idx) => {
                  const next = logs[idx + 1]
                  let daysBetween: number | null = null
                  if (next && log.completed_date && next.completed_date) {
                    const a = new Date(log.completed_date).getTime()
                    const b = new Date(next.completed_date).getTime()
                    daysBetween = Math.round((b - a) / 86400000)
                  }
                  // Find matching stage for color
                  const stage = stages.find((s) => s.id === log.stage_id)
                  const color = stage?.color ?? '#6366f1'

                  return (
                    <div key={log.id} className="flex gap-4">
                      {/* Left: dot + connector */}
                      <div className="flex flex-col items-center">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: color, boxShadow: `0 0 0 2px var(--background), 0 0 0 4px ${color}60` }}
                        />
                        {idx < logs.length - 1 && (
                          <div className="flex-1 flex flex-col items-center py-1">
                            <div className="w-px flex-1 bg-border" />
                            {daysBetween !== null && (
                              <span className="text-[10px] text-muted-foreground my-0.5 whitespace-nowrap">
                                {daysBetween === 0 ? t('project.sameDay') : `${daysBetween}d`}
                              </span>
                            )}
                            <div className="w-px flex-1 bg-border" />
                          </div>
                        )}
                      </div>

                      {/* Right: content */}
                      <div className={`pb-4 ${idx === logs.length - 1 ? '' : ''}`}>
                        <div
                          className="text-sm font-semibold"
                          style={{ color }}
                        >
                          {log.stage_name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {log.completed_date}
                        </div>
                        {log.remark && (
                          <div className="text-xs text-foreground/70 mt-1 italic">
                            &ldquo;{log.remark}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="font-bold text-foreground mb-2">{t('project.confirmDelete')}</h3>
            <p className="text-sm text-muted-foreground mb-5">{t('project.deleteWarning')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-accent"
              >
                {t('project.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-destructive text-white rounded-lg text-sm font-semibold hover:bg-destructive/90"
              >
                {t('project.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
