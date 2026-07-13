'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/eqt/i18n'
import { FilterInventory } from '@/types'
import { Plus, Trash2, AlertTriangle, X, Minus, Pencil, ChevronRight } from 'lucide-react'

interface Props {
  initialItems: FilterInventory[]
  isAdmin: boolean
}

function blank(): Partial<FilterInventory> {
  return {
    filter_type: '',
    sizing: '',
    current_stock: 0,
    low_stock_threshold: 4,
    notes: '',
  }
}

export default function FilterInventoryView({ initialItems, isAdmin }: Props) {
  const { t } = useI18n()
  const supabase = createClient()
  const [items, setItems] = useState<FilterInventory[]>(initialItems)
  const [editing, setEditing] = useState<FilterInventory | 'new' | null>(null)
  const [form, setForm] = useState<Partial<FilterInventory>>(blank())
  const [saving, setSaving] = useState(false)

  const lowStockCount = useMemo(
    () => items.filter((i) => i.current_stock <= i.low_stock_threshold).length,
    [items]
  )

  function startEdit(item: FilterInventory | 'new') {
    setEditing(item)
    setForm(item === 'new' ? blank() : { ...item })
  }

  async function handleSave() {
    if (!form.filter_type?.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      current_stock: form.current_stock ?? 0,
      low_stock_threshold: form.low_stock_threshold ?? 4,
      updated_at: new Date().toISOString(),
    }

    if (editing === 'new') {
      const { data, error } = await supabase
        .from('filter_inventory')
        .insert(payload)
        .select()
        .single()
      if (!error && data) setItems((prev) => [...prev, data as FilterInventory])
    } else if (editing) {
      const { data, error } = await supabase
        .from('filter_inventory')
        .update(payload)
        .eq('id', editing.id)
        .select()
        .single()
      if (!error && data) {
        setItems((prev) => prev.map((i) => (i.id === editing.id ? (data as FilterInventory) : i)))
      }
    }

    setSaving(false)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm(t('service.deleteWarning'))) return
    await supabase.from('filter_inventory').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    setEditing(null)
  }

  async function handleAdjust(item: FilterInventory, delta: number) {
    const newStock = Math.max(0, item.current_stock + delta)
    const { data, error } = await supabase
      .from('filter_inventory')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', item.id)
      .select()
      .single()
    if (!error && data) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? (data as FilterInventory) : i)))
    }
  }

  function stockLabel(item: FilterInventory) {
    if (item.current_stock <= 0) return { label: t('service.inventory.outOfStock'), color: 'bg-red-500/20 text-red-200 border-red-500/30' }
    if (item.current_stock <= item.low_stock_threshold) return { label: t('service.inventory.lowStock'), color: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30' }
    return { label: t('service.inventory.inStock'), color: 'bg-green-500/20 text-green-200 border-green-500/30' }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">{t('service.inventory.title')}</h2>
          {lowStockCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-xs font-medium text-yellow-200">
              <AlertTriangle className="w-3 h-3" />
              {t('service.inventory.lowStockSummary', { n: lowStockCount })}
            </div>
          )}
        </div>
        <button
          onClick={() => startEdit('new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('service.inventory.newItem')}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">{t('service.inventory.noItems')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => {
            const { label, color } = stockLabel(item)
            return (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm">{item.filter_type}</h3>
                    {item.sizing && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.sizing}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${color}`}>
                    {label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdjust(item, -1)}
                    disabled={item.current_stock <= 0}
                    className="w-8 h-8 rounded-lg border border-border hover:bg-accent disabled:opacity-30 flex items-center justify-center"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-foreground tabular-nums">{item.current_stock}</div>
                    <div className="text-[10px] text-muted-foreground">{t('service.columns.threshold')}: {item.low_stock_threshold}</div>
                  </div>
                  <button
                    onClick={() => handleAdjust(item, 1)}
                    className="w-8 h-8 rounded-lg border border-border hover:bg-accent flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {item.notes && (
                  <p className="text-xs text-muted-foreground italic line-clamp-2">{item.notes}</p>
                )}

                <button
                  onClick={() => startEdit(item)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-accent text-primary font-medium transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  {t('service.edit')}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h3 className="font-semibold">
                {editing === 'new' ? t('service.inventory.newItem') : t('service.edit')}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('service.inventory.filterType')} *</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  value={form.filter_type ?? ''}
                  onChange={(e) => setForm({ ...form, filter_type: e.target.value })}
                  placeholder="G4 Pre-Filter, F8 V-shape, HEPA H13…"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('service.inventory.sizing')}</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  value={form.sizing ?? ''}
                  onChange={(e) => setForm({ ...form, sizing: e.target.value })}
                  placeholder='24"*24"*2"'
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('service.inventory.currentStock')}</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    value={form.current_stock ?? 0}
                    onChange={(e) => setForm({ ...form, current_stock: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('service.inventory.lowStockThreshold')}</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    value={form.low_stock_threshold ?? 4}
                    onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('service.inventory.notes')}</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  value={form.notes ?? ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-2">
              {editing !== 'new' && isAdmin && (
                <button
                  onClick={() => handleDelete((editing as FilterInventory).id)}
                  className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-4 h-4" /> {t('service.delete')}
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg border border-border text-sm">{t('service.cancel')}</button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.filter_type?.trim()}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {saving ? t('service.saving') : t('service.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
