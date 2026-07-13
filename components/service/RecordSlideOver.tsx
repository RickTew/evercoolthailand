'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/eqt/i18n'
import { ServiceRecord, ServiceVisit, EquipmentFilter, ServiceRecordEquipment } from '@/types'
import { calculateDueDate, calculateNextDue, formatDate, visitsForRecord } from './helpers'
import { X, Trash2, CheckCircle2, Plus, ChevronDown, Link2, Unlink } from 'lucide-react'

interface Props {
  record: ServiceRecord | 'new' | null
  visits: ServiceVisit[]
  equipment: EquipmentFilter[]
  links: ServiceRecordEquipment[]
  onClose: () => void
  onRecordSaved: (rec: ServiceRecord) => void
  onRecordDeleted: (id: string) => void
  onVisitAdded: (visit: ServiceVisit, updatedRecord: ServiceRecord) => void
  onVisitDeleted: (visitId: string) => void
  onLinkAdded: (link: ServiceRecordEquipment) => void
  onLinkRemoved: (recordId: string, equipmentId: string) => void
  isAdmin: boolean
}

function blankRecord(): Partial<ServiceRecord> {
  return {
    project_name: '',
    location: '',
    department: '',
    po_number: '',
    unit_count: null,
    visits_per_year: null,
    first_visit_date: null,
    due_date: null,
    visit_schedule: '',
    contractor_qt_number: '',
    report_status: '',
    invoice_end_user: '',
    invoice_contractor: '',
    notes: '',
  }
}

export default function RecordSlideOver({
  record,
  visits,
  equipment,
  links,
  onClose,
  onRecordSaved,
  onRecordDeleted,
  onVisitAdded,
  onVisitDeleted,
  onLinkAdded,
  onLinkRemoved,
  isAdmin,
}: Props) {
  const { t } = useI18n()
  const supabase = createClient()
  const isNew = record === 'new'
  const existing = record !== 'new' && record !== null ? record : null

  const [form, setForm] = useState<Partial<ServiceRecord>>(
    isNew ? blankRecord() : { ...existing! }
  )
  const [saving, setSaving] = useState(false)
  const [confirmDeleteRec, setConfirmDeleteRec] = useState(false)

  // Mark Complete state
  const [showMarkComplete, setShowMarkComplete] = useState(false)
  const [completeDate, setCompleteDate] = useState(new Date().toISOString().split('T')[0])
  const [completePerformedBy, setCompletePerformedBy] = useState('')
  const [completeRemarks, setCompleteRemarks] = useState('')
  const [completing, setCompleting] = useState(false)

  // Equipment link state
  const [showLinkPicker, setShowLinkPicker] = useState(false)
  const [linkLocationFilter, setLinkLocationFilter] = useState('')

  const recordVisits = useMemo(
    () => existing ? visitsForRecord(visits, existing.id) : [],
    [visits, existing]
  )
  const linkedEquipmentIds = useMemo(
    () => existing
      ? new Set(links.filter((l) => l.service_record_id === existing.id).map((l) => l.equipment_filter_id))
      : new Set<string>(),
    [links, existing]
  )
  const linkedEquipment = useMemo(
    () => equipment.filter((e) => linkedEquipmentIds.has(e.id)),
    [equipment, linkedEquipmentIds]
  )
  const availableEquipment = useMemo(
    () => equipment.filter((e) => !linkedEquipmentIds.has(e.id)),
    [equipment, linkedEquipmentIds]
  )
  const filteredAvailable = useMemo(() => {
    if (!linkLocationFilter) return availableEquipment
    return availableEquipment.filter((e) => e.location === linkLocationFilter)
  }, [availableEquipment, linkLocationFilter])
  const equipmentLocations = useMemo(
    () => Array.from(new Set(equipment.map((e) => e.location))).sort(),
    [equipment]
  )

  const set = (field: keyof ServiceRecord, value: string | number | null) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  async function handleSaveRecord() {
    if (!form.project_name?.trim()) return
    setSaving(true)

    let dueDate = form.due_date ?? null
    if (form.first_visit_date && form.visits_per_year && !form.due_date) {
      dueDate = calculateDueDate(form.first_visit_date, form.visits_per_year)
    }
    const payload = { ...form, due_date: dueDate }

    if (isNew) {
      const { data, error } = await supabase
        .from('service_records')
        .insert(payload)
        .select()
        .single()
      setSaving(false)
      if (!error && data) onRecordSaved(data as ServiceRecord)
    } else {
      const { data, error } = await supabase
        .from('service_records')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', existing!.id)
        .select()
        .single()
      setSaving(false)
      if (!error && data) onRecordSaved(data as ServiceRecord)
    }
  }

  async function handleDeleteRecord() {
    if (!existing) return
    await supabase.from('service_records').delete().eq('id', existing.id)
    onRecordDeleted(existing.id)
  }

  async function handleMarkComplete() {
    if (!existing || !completeDate) return
    setCompleting(true)

    // 1. Insert visit
    const { data: visitData, error: visitErr } = await supabase
      .from('service_visits')
      .insert({
        service_record_id: existing.id,
        completed_date: completeDate,
        performed_by: completePerformedBy.trim() || null,
        remarks: completeRemarks.trim() || null,
      })
      .select()
      .single()

    if (visitErr || !visitData) {
      setCompleting(false)
      return
    }

    // 2. Auto-schedule next due date based on frequency
    const nextDue = calculateNextDue(completeDate, existing.visits_per_year)
    let updatedRecord = existing
    if (nextDue) {
      const { data: recData } = await supabase
        .from('service_records')
        .update({ due_date: nextDue, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (recData) updatedRecord = recData as ServiceRecord
    }

    setCompleting(false)
    setShowMarkComplete(false)
    setCompleteDate(new Date().toISOString().split('T')[0])
    setCompletePerformedBy('')
    setCompleteRemarks('')
    onVisitAdded(visitData as ServiceVisit, updatedRecord)
  }

  async function handleDeleteVisit(visitId: string) {
    if (!confirm(t('service.confirmDeleteVisit'))) return
    await supabase.from('service_visits').delete().eq('id', visitId)
    onVisitDeleted(visitId)
  }

  async function handleLinkEquipment(equipmentId: string) {
    if (!existing) return
    const { data, error } = await supabase
      .from('service_record_equipment')
      .insert({ service_record_id: existing.id, equipment_filter_id: equipmentId })
      .select()
      .single()
    if (!error && data) onLinkAdded(data as ServiceRecordEquipment)
  }

  async function handleUnlinkEquipment(equipmentId: string) {
    if (!existing) return
    await supabase
      .from('service_record_equipment')
      .delete()
      .eq('service_record_id', existing.id)
      .eq('equipment_filter_id', equipmentId)
    onLinkRemoved(existing.id, equipmentId)
  }

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40'
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-card border-l border-border flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">
            {isNew ? t('service.newRecord') : t('service.detail')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* CORE FIELDS */}
          <section className="space-y-4">
            <div>
              <label className={labelCls}>{t('service.fields.projectName')} *</label>
              <input
                className={inputCls}
                value={form.project_name ?? ''}
                onChange={(e) => set('project_name', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('service.fields.location')}</label>
                <input className={inputCls} value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>{t('service.fields.department')}</label>
                <input className={inputCls} value={form.department ?? ''} onChange={(e) => set('department', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('service.fields.poNumber')}</label>
                <input className={inputCls} value={form.po_number ?? ''} onChange={(e) => set('po_number', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>{t('service.fields.unitCount')}</label>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={form.unit_count ?? ''}
                  onChange={(e) => set('unit_count', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('service.fields.visitsPerYear')}</label>
                <select
                  className={inputCls}
                  value={form.visits_per_year ?? ''}
                  onChange={(e) => set('visits_per_year', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">-</option>
                  <option value="1">{t('service.visitFrequency.1')} (360d)</option>
                  <option value="2">{t('service.visitFrequency.2')} (180d)</option>
                  <option value="3">{t('service.visitFrequency.3')} (120d)</option>
                  <option value="4">{t('service.visitFrequency.4')} (90d)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>{t('service.fields.contractorQtNumber')}</label>
                <input className={inputCls} value={form.contractor_qt_number ?? ''} onChange={(e) => set('contractor_qt_number', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('service.fields.firstVisitDate')}</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.first_visit_date ?? ''}
                  onChange={(e) => set('first_visit_date', e.target.value || null)}
                />
              </div>
              <div>
                <label className={labelCls}>{t('service.fields.dueDate')}</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.due_date ?? ''}
                  onChange={(e) => set('due_date', e.target.value || null)}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">{t('service.scheduleNote')}</p>

            <div>
              <label className={labelCls}>{t('service.fields.visitSchedule')}</label>
              <input className={inputCls} value={form.visit_schedule ?? ''} onChange={(e) => set('visit_schedule', e.target.value)} placeholder="3,6,9,12 months after 1st visit" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('service.fields.reportStatus')}</label>
                <input className={inputCls} value={form.report_status ?? ''} onChange={(e) => set('report_status', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>{t('service.fields.invoiceEndUser')}</label>
                <input className={inputCls} value={form.invoice_end_user ?? ''} onChange={(e) => set('invoice_end_user', e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>{t('service.fields.invoiceContractor')}</label>
              <input className={inputCls} value={form.invoice_contractor ?? ''} onChange={(e) => set('invoice_contractor', e.target.value)} />
            </div>

            <div>
              <label className={labelCls}>{t('service.fields.notes')}</label>
              <textarea rows={3} className={inputCls} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </section>

          {/* MARK COMPLETE + VISIT HISTORY (only for existing records) */}
          {existing && (
            <section className="space-y-3 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">{t('service.visits.title')}</h3>
                {!showMarkComplete && (
                  <button
                    onClick={() => setShowMarkComplete(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('service.visits.markComplete')}
                  </button>
                )}
              </div>

              {showMarkComplete && (
                <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t('service.visits.completedDate')} *</label>
                      <input
                        type="date"
                        className={inputCls}
                        value={completeDate}
                        onChange={(e) => setCompleteDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>{t('service.visits.performedBy')}</label>
                      <input
                        className={inputCls}
                        value={completePerformedBy}
                        onChange={(e) => setCompletePerformedBy(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{t('service.visits.remarks')}</label>
                    <textarea rows={2} className={inputCls} value={completeRemarks} onChange={(e) => setCompleteRemarks(e.target.value)} />
                  </div>
                  <p className="text-xs text-muted-foreground italic">{t('service.visits.autoScheduledNote')}</p>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowMarkComplete(false)} className="px-3 py-1.5 rounded-lg border border-border text-sm">{t('service.cancel')}</button>
                    <button onClick={handleMarkComplete} disabled={completing || !completeDate} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                      {completing ? t('service.saving') : t('service.visits.saveVisit')}
                    </button>
                  </div>
                </div>
              )}

              {recordVisits.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-1">{t('service.visits.noVisits')}</p>
              ) : (
                <div className="space-y-2">
                  {recordVisits.map((v) => (
                    <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{formatDate(v.completed_date)}</span>
                          <button onClick={() => handleDeleteVisit(v.id)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {v.performed_by && (
                          <p className="text-xs text-muted-foreground mt-0.5">{v.performed_by}</p>
                        )}
                        {v.remarks && (
                          <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{v.remarks}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* LINKED EQUIPMENT (only for existing records) */}
          {existing && (
            <section className="space-y-3 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">{t('service.linkedEquipment.title')}</h3>
                {!showLinkPicker && availableEquipment.length > 0 && (
                  <button
                    onClick={() => setShowLinkPicker(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('service.linkedEquipment.addEquipment')}
                  </button>
                )}
              </div>

              {linkedEquipment.length === 0 && !showLinkPicker ? (
                <p className="text-xs text-muted-foreground italic px-1">{t('service.linkedEquipment.noLinked')}</p>
              ) : (
                <div className="space-y-1.5">
                  {linkedEquipment.map((eq) => (
                    <div key={eq.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">{eq.unit_name ?? '-'}</p>
                          <p className="text-xs text-muted-foreground truncate">{eq.location} · {eq.model ?? '-'}</p>
                        </div>
                      </div>
                      <button onClick={() => handleUnlinkEquipment(eq.id)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive">
                        <Unlink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showLinkPicker && (
                <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                  <select
                    className={inputCls}
                    value={linkLocationFilter}
                    onChange={(e) => setLinkLocationFilter(e.target.value)}
                  >
                    <option value="">{t('service.linkedEquipment.selectLocation')}</option>
                    {equipmentLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {filteredAvailable.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2">-</p>
                    ) : (
                      filteredAvailable.map((eq) => (
                        <button
                          key={eq.id}
                          onClick={() => handleLinkEquipment(eq.id)}
                          className="w-full text-left p-2 rounded hover:bg-accent text-xs flex items-center gap-2"
                        >
                          <Plus className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium text-foreground">{eq.unit_name ?? '-'}</span>
                          <span className="text-muted-foreground">· {eq.location}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <button onClick={() => setShowLinkPicker(false)} className="w-full px-3 py-1.5 rounded-lg border border-border text-xs">
                    {t('service.close')}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          {existing && isAdmin ? (
            confirmDeleteRec ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">{t('service.confirmDelete')}</span>
                <button onClick={handleDeleteRecord} className="px-2.5 py-1 rounded bg-destructive text-destructive-foreground text-xs hover:bg-destructive/80">{t('service.delete')}</button>
                <button onClick={() => setConfirmDeleteRec(false)} className="px-2.5 py-1 rounded border border-border text-xs">{t('service.cancel')}</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDeleteRec(true)} className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80">
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
              onClick={handleSaveRecord}
              disabled={saving || !form.project_name?.trim()}
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
