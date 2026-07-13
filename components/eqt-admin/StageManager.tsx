'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Stage } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/eqt/i18n'
import { GripVertical, Trash2, Plus, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  stages: Stage[]
  onStagesChange: (s: Stage[]) => void
}

export default function StageManager({ stages, onStagesChange }: Props) {
  const { t } = useI18n()
  const supabase = createClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3498DB')

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const reordered = Array.from(stages)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)
    const updated = reordered.map((s, i) => ({ ...s, position: i + 1 }))
    onStagesChange(updated)

    // Batch update positions
    await Promise.all(
      updated.map((s) => supabase.from('stages').update({ position: s.position }).eq('id', s.id))
    )
    toast.success('Order saved')
  }

  async function handleSaveEdit(id: string) {
    const { data, error } = await supabase
      .from('stages')
      .update({ name: editName, color: editColor })
      .eq('id', id)
      .select()
      .single()
    if (error) { toast.error('Error updating stage'); return }
    onStagesChange(stages.map((s) => (s.id === id ? (data as Stage) : s)))
    setEditingId(null)
    toast.success('Stage updated')
  }

  async function handleDelete(id: string) {
    // Check if any project is in this stage
    const { count } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('current_stage_id', id)

    if ((count ?? 0) > 0) {
      toast.error(`${count} project(s) are in this stage. Move them first.`)
      return
    }

    const { error } = await supabase.from('stages').delete().eq('id', id)
    if (error) { toast.error('Error deleting stage'); return }
    onStagesChange(stages.filter((s) => s.id !== id))
    toast.success('Stage deleted')
  }

  async function handleAddStage() {
    if (!newName.trim()) { toast.error('Enter a stage name'); return }
    const position = stages.length + 1
    const { data, error } = await supabase
      .from('stages')
      .insert({ name: newName, color: newColor, position })
      .select()
      .single()
    if (error) { toast.error('Error creating stage'); return }
    onStagesChange([...stages, data as Stage])
    setNewName('')
    setNewColor('#3498DB')
    setAddingNew(false)
    toast.success('Stage added')
  }

  const inputClass = 'px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden max-w-xl">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground">{t('admin.stages')}</h2>
        <button
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('admin.addStage')}
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="stages">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-border">
              {stages.map((stage, index) => (
                <Draggable key={stage.id} draggableId={stage.id} index={index}>
                  {(prov, snap) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      className={`flex items-center gap-3 px-4 py-3 ${snap.isDragging ? 'bg-accent shadow-lg' : 'hover:bg-accent/30'} transition-colors`}
                    >
                      <div {...prov.dragHandleProps} className="text-muted-foreground cursor-grab">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />

                      {editingId === stage.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            className={inputClass + ' flex-1'}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                          />
                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border border-border"
                          />
                          <button onClick={() => handleSaveEdit(stage.id)} className="p-1 text-green-400 hover:text-green-300">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className="flex-1 text-sm font-medium text-foreground cursor-pointer"
                            onDoubleClick={() => { setEditingId(stage.id); setEditName(stage.name); setEditColor(stage.color) }}
                          >
                            {stage.name}
                          </span>
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          <button
                            onClick={() => { setEditingId(stage.id); setEditName(stage.name); setEditColor(stage.color) }}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(stage.id)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add new stage form */}
      {addingNew && (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-accent/20">
          <input
            className={inputClass + ' flex-1'}
            placeholder={t('admin.stageName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
            autoFocus
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-border"
          />
          <button onClick={handleAddStage} className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90">
            {t('project.save')}
          </button>
          <button onClick={() => setAddingNew(false)} className="px-3 py-1.5 border border-border text-sm rounded-lg hover:bg-accent">
            {t('project.cancel')}
          </button>
        </div>
      )}

      <div className="px-5 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground">Drag rows to reorder · Double-click to edit name</p>
      </div>
    </div>
  )
}
