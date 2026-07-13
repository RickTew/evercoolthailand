'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/eqt/i18n'
import { Project, Stage } from '@/types'
import {
  parseCSV,
  mapRowsToProjects,
  MappedProjectRow,
} from '@/lib/eqt/csv-import'
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Copy as CopyIcon,
} from 'lucide-react'

interface Props {
  stages: Stage[]
  existingCodes: Set<string>
  onClose: () => void
  onImported: (newProjects: Project[]) => void
}

export default function ImportDialog({ stages, existingCodes, onClose, onImported }: Props) {
  const { t } = useI18n()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [filename, setFilename] = useState<string | null>(null)
  const [mapped, setMapped] = useState<MappedProjectRow[] | null>(null)
  const [headerErrors, setHeaderErrors] = useState<string[]>([])
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [importing, setImporting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  const handleFile = useCallback(
    async (file: File) => {
      setErrorMsg(null)
      setFilename(file.name)
      try {
        const text = await file.text()
        const rows = parseCSV(text)
        const result = mapRowsToProjects(rows, stages, existingCodes)
        setHeaderErrors(result.headerErrors)
        setMapped(result.mapped)
        // Pre-select all rows without errors
        setSelectedRows(
          new Set(
            result.mapped
              .filter((r) => r.errors.length === 0)
              .map((r) => r.rowIndex)
          )
        )
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : String(e))
      }
    },
    [stages, existingCodes]
  )

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.toLowerCase().endsWith('.csv')) handleFile(file)
  }

  const summary = useMemo(() => {
    if (!mapped) return null
    const total = mapped.length
    const withErrors = mapped.filter((r) => r.errors.length > 0).length
    const withWarnings = mapped.filter(
      (r) => r.warnings.length > 0 && r.errors.length === 0
    ).length
    const duplicates = mapped.filter(
      (r) => r.isDuplicateCode && r.errors.length === 0
    ).length
    return { total, withErrors, withWarnings, duplicates }
  }, [mapped])

  const toImport = useMemo(() => {
    if (!mapped) return []
    return mapped.filter((r) => {
      if (!selectedRows.has(r.rowIndex)) return false
      if (r.errors.length > 0) return false
      if (skipDuplicates && r.isDuplicateCode) return false
      return true
    })
  }, [mapped, selectedRows, skipDuplicates])

  function toggleRow(rowIndex: number) {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(rowIndex)) next.delete(rowIndex)
      else next.add(rowIndex)
      return next
    })
  }

  function toggleAll() {
    if (!mapped) return
    const eligible = mapped.filter((r) => r.errors.length === 0)
    if (selectedRows.size === eligible.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(eligible.map((r) => r.rowIndex)))
    }
  }

  async function handleImport() {
    if (!toImport.length) return
    setImporting(true)
    setErrorMsg(null)

    try {
      const payloads = toImport.map((r) => r.data)
      const { data, error } = await supabase
        .from('projects')
        .insert(payloads)
        .select('*, current_stage:stages(id,name,color,position)')

      if (error) {
        throw new Error(error.message)
      }
      onImported((data ?? []) as Project[])
      onClose()
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e))
      setImporting(false)
    }
  }

  function rowStatus(r: MappedProjectRow): {
    label: string
    cls: string
    icon: typeof CheckCircle2
  } {
    if (r.errors.length > 0)
      return { label: t('projects.importRowError'), cls: 'bg-red-500/15 text-red-300 border-red-500/30', icon: AlertCircle }
    if (r.isDuplicateCode)
      return { label: t('projects.importRowDup'), cls: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30', icon: CopyIcon }
    if (r.warnings.length > 0)
      return { label: t('projects.importRowWarn'), cls: 'bg-orange-500/15 text-orange-200 border-orange-500/30', icon: AlertTriangle }
    return { label: t('projects.importRowOK'), cls: 'bg-green-500/15 text-green-300 border-green-500/30', icon: CheckCircle2 }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">{t('projects.importTitle')}</h2>
            {filename && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {filename}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!mapped ? (
            <>
              <p className="text-sm text-muted-foreground">{t('projects.importHint')}</p>

              <div
                className={`flex flex-col items-center justify-center gap-3 py-12 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-foreground font-medium">{t('projects.importDropHere')}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  {t('projects.importChooseFile')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={onFilePicked}
                />
              </div>
            </>
          ) : (
            <>
              {/* Header errors */}
              {headerErrors.length > 0 && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 space-y-1">
                  {headerErrors.map((e, i) => (
                    <p key={i} className="text-sm text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {e}
                    </p>
                  ))}
                </div>
              )}

              {/* Summary */}
              {summary && (
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="px-3 py-1.5 rounded-full bg-muted text-foreground font-medium">
                    {t('projects.importRowsFound', { n: summary.total })}
                  </div>
                  {summary.withErrors > 0 && (
                    <div className="px-3 py-1.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
                      {t('projects.importValidationErrors', { n: summary.withErrors })}
                    </div>
                  )}
                  {summary.duplicates > 0 && (
                    <div className="px-3 py-1.5 rounded-full bg-yellow-500/15 text-yellow-200 border border-yellow-500/30">
                      {t('projects.importDuplicates', { n: summary.duplicates })}
                    </div>
                  )}
                  {summary.withWarnings > 0 && (
                    <div className="px-3 py-1.5 rounded-full bg-orange-500/15 text-orange-200 border border-orange-500/30">
                      {t('projects.importWarnings', { n: summary.withWarnings })}
                    </div>
                  )}
                </div>
              )}

              {/* Duplicate handling */}
              {summary && summary.duplicates > 0 && (
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded border-border"
                  />
                  {t('projects.importSkipDuplicates')}
                </label>
              )}

              {/* Preview table */}
              {mapped.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto max-h-[44vh] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-muted/60 border-b border-border">
                        <tr>
                          <th className="p-2 w-8">
                            <input
                              type="checkbox"
                              checked={mapped.filter((r) => r.errors.length === 0).length > 0 && selectedRows.size === mapped.filter((r) => r.errors.length === 0).length}
                              onChange={toggleAll}
                              className="rounded border-border"
                            />
                          </th>
                          <th className="text-left p-2 w-12">#</th>
                          <th className="text-left p-2 w-24">Status</th>
                          <th className="text-left p-2">Code</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Customer</th>
                          <th className="text-left p-2">Quarter</th>
                          <th className="text-left p-2">Person</th>
                          <th className="text-left p-2">Notes / Issues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mapped.map((r) => {
                          const { label, cls, icon: Icon } = rowStatus(r)
                          const isSelectable = r.errors.length === 0
                          const issues = [
                            ...r.errors.map((e) => `❌ ${e}`),
                            ...r.warnings.map((w) => `⚠ ${w}`),
                          ]
                          return (
                            <tr
                              key={r.rowIndex}
                              className={`border-b border-border last:border-0 ${
                                r.errors.length ? 'opacity-50' : ''
                              }`}
                            >
                              <td className="p-2">
                                <input
                                  type="checkbox"
                                  checked={selectedRows.has(r.rowIndex)}
                                  onChange={() => toggleRow(r.rowIndex)}
                                  disabled={!isSelectable}
                                  className="rounded border-border disabled:opacity-30"
                                />
                              </td>
                              <td className="p-2 text-muted-foreground">{r.rowIndex}</td>
                              <td className="p-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${cls}`}>
                                  <Icon className="w-3 h-3" />
                                  {label}
                                </span>
                              </td>
                              <td className="p-2 font-mono">{r.data.code || '-'}</td>
                              <td className="p-2">{r.data.name || '-'}</td>
                              <td className="p-2 text-muted-foreground">{r.data.customer ?? '-'}</td>
                              <td className="p-2 text-muted-foreground">{r.data.quarter ?? '-'}</td>
                              <td className="p-2 text-muted-foreground">{r.data.responsible_person ?? '-'}</td>
                              <td className="p-2 text-muted-foreground">
                                {issues.length > 0 ? (
                                  <div className="space-y-0.5">
                                    {issues.map((i, idx) => (
                                      <div key={idx} className="text-[10px]">{i}</div>
                                    ))}
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
          >
            {t('project.cancel')}
          </button>
          {mapped && (
            <button
              onClick={handleImport}
              disabled={importing || toImport.length === 0}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {importing
                ? t('projects.importImporting')
                : t('projects.importImportAll', { n: toImport.length })}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
