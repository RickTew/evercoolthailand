'use client'

import { useState } from 'react'
import { Project, Stage, ProjectStatus } from '@/types'
import { useI18n } from '@/lib/eqt/i18n'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface Props {
  project: Project | null
  stages: Stage[]
  onClose: () => void
  onSaved: (p: Project) => void
}

const STATUS_OPTIONS: { value: ProjectStatus; labelKey: string }[] = [
  { value: '01', labelKey: 'status.01' },
  { value: '02', labelKey: 'status.02' },
  { value: '03', labelKey: 'status.03' },
  { value: '04', labelKey: 'status.04' },
]

function currentQuarter() {
  const now = new Date()
  return `Q${Math.ceil((now.getMonth() + 1) / 3)}/${now.getFullYear()}`
}

export default function ProjectForm({ project, stages, onClose, onSaved }: Props) {
  const { t } = useI18n()
  const supabase = createClient()
  const isEdit = !!project

  const [form, setForm] = useState({
    number: project?.number ?? '',
    code: project?.code ?? '',
    name: project?.name ?? '',
    customer: project?.customer ?? '',
    quarter: project?.quarter ?? currentQuarter(),
    responsible_person: project?.responsible_person ?? '',
    get_info_date: project?.get_info_date ?? '',
    tq_number: project?.tq_number ?? '',
    quotation_sent_date: project?.quotation_sent_date ?? '',
    follow_up_date: project?.follow_up_date ?? '',
    status: (project?.status ?? '01') as ProjectStatus,
    notes: project?.notes ?? '',
    current_stage_id: project?.current_stage_id ?? '',
  })
  const [saving, setSaving] = useState(false)

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.name) {
      toast.error('Code and name are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        number: form.number || null,
        code: form.code,
        name: form.name,
        customer: form.customer || null,
        quarter: form.quarter || null,
        responsible_person: form.responsible_person || null,
        get_info_date: form.get_info_date || null,
        tq_number: form.tq_number || null,
        quotation_sent_date: form.quotation_sent_date || null,
        follow_up_date: form.follow_up_date || null,
        status: form.status,
        notes: form.notes || null,
        current_stage_id: form.current_stage_id || null,
        updated_at: new Date().toISOString(),
      }

      if (isEdit) {
        const { data, error } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', project!.id)
          .select('*, current_stage:stages(id,name,color,position)')
          .single()
        if (error) throw error
        toast.success('Project updated')
        onSaved(data as Project)
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert(payload)
          .select('*, current_stage:stages(id,name,color,position)')
          .single()
        if (error) throw error
        toast.success('Project created')
        onSaved(data as Project)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving project'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background border border-border rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {isEdit ? t('project.edit') : t('projects.newProject')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('project.fields.number')}</label>
              <input className={inputClass} value={form.number} onChange={(e) => set('number', e.target.value)} placeholder="1, 14b, 17REV2" />
            </div>
            <div>
              <label className={labelClass}>{t('project.fields.code')} *</label>
              <input className={inputClass} value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="EQ033" required />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>{t('project.fields.name')} *</label>
              <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>{t('project.fields.customer')}</label>
              <input className={inputClass} value={form.customer} onChange={(e) => set('customer', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{t('project.fields.quarter')}</label>
              <input className={inputClass} value={form.quarter} onChange={(e) => set('quarter', e.target.value)} placeholder="Q3/2024" />
            </div>
            <div>
              <label className={labelClass}>{t('project.fields.person')}</label>
              <input className={inputClass} value={form.responsible_person} onChange={(e) => set('responsible_person', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{t('project.fields.status')}</label>
              <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value as ProjectStatus)}>
                {STATUS_OPTIONS.map(({ value, labelKey }) => (
                  <option key={value} value={value}>{t(labelKey)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('project.fields.infoDate')}</label>
              <input type="date" className={inputClass} value={form.get_info_date} onChange={(e) => set('get_info_date', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{t('project.fields.tqNumber')}</label>
              <input className={inputClass} value={form.tq_number} onChange={(e) => set('tq_number', e.target.value)} placeholder="TQ522-08-24" />
            </div>
            <div>
              <label className={labelClass}>{t('project.fields.quotationSentDate')}</label>
              <input type="date" className={inputClass} value={form.quotation_sent_date} onChange={(e) => set('quotation_sent_date', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{t('project.fields.followUpDate')}</label>
              <input type="date" className={inputClass} value={form.follow_up_date} onChange={(e) => set('follow_up_date', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{t('projects.columns.stage')}</label>
              <select className={inputClass} value={form.current_stage_id} onChange={(e) => set('current_stage_id', e.target.value)}>
                <option value="">- {t('dashboard.allStages')} -</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>{t('project.fields.notes')}</label>
              <textarea
                className={inputClass}
                rows={3}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
          >
            {t('project.cancel')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? t('common.loading') : t('project.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
