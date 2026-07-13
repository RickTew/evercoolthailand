'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/eqt/i18n'
import { EquipmentFilter } from '@/types'
import { X, Trash2 } from 'lucide-react'

interface Props {
  equipment: EquipmentFilter | 'new' | null
  knownLocations: string[]
  onClose: () => void
  onSaved: (eq: EquipmentFilter) => void
  onDeleted: (id: string) => void
  isAdmin: boolean
}

function blankEquipment(): Partial<EquipmentFilter> {
  return {
    location: '',
    unit_name: '',
    model: '',
    model_number: '',
    model_cdu_number: '',
    pre_filter_sizing: '',
    pre_filter_qty: null,
    mid_filter_type: '',
    mid_filter_sizing: '',
    mid_filter_qty: null,
    hepa_sizing: '',
    hepa_qty: null,
    unit_set_count: 1,
  }
}

export default function EquipmentSlideOver({
  equipment,
  knownLocations,
  onClose,
  onSaved,
  onDeleted,
  isAdmin,
}: Props) {
  const { t } = useI18n()
  const supabase = createClient()
  const isNew = equipment === 'new'
  const existing = equipment !== 'new' && equipment !== null ? equipment : null

  const [form, setForm] = useState<Partial<EquipmentFilter>>(
    isNew ? blankEquipment() : { ...existing! }
  )
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (field: keyof EquipmentFilter, value: string | number | null) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSave() {
    if (!form.location?.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      location: form.location?.trim(),
      unit_name: form.unit_name?.trim() || null,
    }

    if (isNew) {
      const { data, error } = await supabase
        .from('equipment_filters')
        .insert(payload)
        .select()
        .single()
      setSaving(false)
      if (!error && data) onSaved(data as EquipmentFilter)
    } else {
      const { data, error } = await supabase
        .from('equipment_filters')
        .update(payload)
        .eq('id', existing!.id)
        .select()
        .single()
      setSaving(false)
      if (!error && data) onSaved(data as EquipmentFilter)
    }
  }

  async function handleDelete() {
    if (!existing) return
    await supabase.from('equipment_filters').delete().eq('id', existing.id)
    onDeleted(existing.id)
  }

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40'
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-card border-l border-border flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">
            {isNew ? t('service.newEquipment') : t('service.equipment.detail')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className={labelCls}>{t('service.equipment.fields.location')} *</label>
            <input
              className={inputCls}
              value={form.location ?? ''}
              onChange={(e) => set('location', e.target.value)}
              list="locations-datalist"
            />
            <datalist id="locations-datalist">
              {knownLocations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('service.equipment.fields.unitName')}</label>
              <input className={inputCls} value={form.unit_name ?? ''} onChange={(e) => set('unit_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{t('service.equipment.fields.model')}</label>
              <input className={inputCls} value={form.model ?? ''} onChange={(e) => set('model', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('service.equipment.fields.modelNumber')}</label>
              <input className={inputCls} value={form.model_number ?? ''} onChange={(e) => set('model_number', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{t('service.equipment.fields.cduNumber')}</label>
              <input className={inputCls} value={form.model_cdu_number ?? ''} onChange={(e) => set('model_cdu_number', e.target.value)} />
            </div>
          </div>

          {/* Pre-Filter */}
          <fieldset className="rounded-lg border border-border p-3 space-y-3">
            <legend className="px-1 text-xs font-semibold text-muted-foreground">{t('service.equipment.preFilter')}</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('service.equipment.fields.preFilterSizing')}</label>
                <input className={inputCls} value={form.pre_filter_sizing ?? ''} onChange={(e) => set('pre_filter_sizing', e.target.value)} placeholder='24"*24"*2"' />
              </div>
              <div>
                <label className={labelCls}>{t('service.equipment.fields.preFilterQty')}</label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.pre_filter_qty ?? ''}
                  onChange={(e) => set('pre_filter_qty', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>
          </fieldset>

          {/* Mid-Filter */}
          <fieldset className="rounded-lg border border-border p-3 space-y-3">
            <legend className="px-1 text-xs font-semibold text-muted-foreground">{t('service.equipment.midFilter')}</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('service.equipment.fields.midFilterType')}</label>
                <input className={inputCls} value={form.mid_filter_type ?? ''} onChange={(e) => set('mid_filter_type', e.target.value)} placeholder="V-shape, BAG, Panel" />
              </div>
              <div>
                <label className={labelCls}>{t('service.equipment.fields.midFilterSizing')}</label>
                <input className={inputCls} value={form.mid_filter_sizing ?? ''} onChange={(e) => set('mid_filter_sizing', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>{t('service.equipment.fields.midFilterQty')}</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={form.mid_filter_qty ?? ''}
                onChange={(e) => set('mid_filter_qty', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </fieldset>

          {/* HEPA */}
          <fieldset className="rounded-lg border border-border p-3 space-y-3">
            <legend className="px-1 text-xs font-semibold text-muted-foreground">{t('service.equipment.hepa')}</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('service.equipment.fields.hepaSizing')}</label>
                <input className={inputCls} value={form.hepa_sizing ?? ''} onChange={(e) => set('hepa_sizing', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>{t('service.equipment.fields.hepaQty')}</label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.hepa_qty ?? ''}
                  onChange={(e) => set('hepa_qty', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>
          </fieldset>

          <div>
            <label className={labelCls}>{t('service.equipment.fields.unitSetCount')}</label>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={form.unit_set_count ?? ''}
              onChange={(e) => set('unit_set_count', e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          {existing && isAdmin ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">{t('service.confirmDeleteEquipment')}</span>
                <button onClick={handleDelete} className="px-2.5 py-1 rounded bg-destructive text-destructive-foreground text-xs hover:bg-destructive/80">{t('service.delete')}</button>
                <button onClick={() => setConfirmDelete(false)} className="px-2.5 py-1 rounded border border-border text-xs">{t('service.cancel')}</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80">
                <Trash2 className="w-4 h-4" />
                {t('service.delete')}
              </button>
            )
          ) : (
            <div />
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent">
              {t('service.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.location?.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? t('service.saving') : t('service.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
