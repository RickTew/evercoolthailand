import { Project, ProjectStatus, Stage } from '@/types'

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

/**
 * Parse a CSV string into rows of strings.
 * Handles UTF-8 BOM, quoted fields, escaped quotes (""), CRLF + LF line endings.
 */
export function parseCSV(text: string): string[][] {
  // Strip BOM if present (Export adds one)
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const c = text[i]

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }

    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (c === '\r') {
      i++
      continue
    }
    if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }

    field += c
    i++
  }

  // Flush trailing row if no final newline
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  // Filter out truly empty rows (single empty cell from trailing newline)
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

// ─── Header normalization ────────────────────────────────────────────────────

/**
 * Map of normalized header text → canonical project field name.
 * Accepts the headers our Export produces, plus a few sensible aliases.
 */
const HEADER_ALIASES: Record<string, keyof ProjectImportRow> = {
  '#': 'index',
  'no': 'index',
  'no.': 'index',
  'number': 'index',

  'code': 'code',
  'project code': 'code',

  'name': 'name',
  'project name': 'name',
  'project': 'name',

  'customer': 'customer',
  'client': 'customer',

  'quarter': 'quarter',
  'qtr': 'quarter',

  'stage': 'stage',
  'pipeline stage': 'stage',

  'status': 'status',

  'tq number': 'tq_number',
  'tq': 'tq_number',
  'tq no': 'tq_number',
  'tq#': 'tq_number',

  'person': 'responsible_person',
  'responsible person': 'responsible_person',
  'responsible': 'responsible_person',
  'owner': 'responsible_person',
  'assignee': 'responsible_person',

  'info date': 'get_info_date',
  'info received date': 'get_info_date',
  'get info date': 'get_info_date',
  'received date': 'get_info_date',
  'received': 'get_info_date',

  'quotation sent': 'quotation_sent_date',
  'quotation sent date': 'quotation_sent_date',
  'quote sent': 'quotation_sent_date',

  'follow up': 'follow_up_date',
  'follow up date': 'follow_up_date',
  'followup': 'follow_up_date',

  'notes': 'notes',
  'remark': 'notes',
  'remarks': 'notes',
  'comments': 'notes',
}

function normalizeHeader(h: string): keyof ProjectImportRow | null {
  const norm = h.trim().toLowerCase().replace(/\s+/g, ' ')
  return HEADER_ALIASES[norm] ?? null
}

// ─── Field coercion ──────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, ProjectStatus> = {
  '01': '01', '02': '02', '03': '03', '04': '04',
  // English
  'received': '01',
  'in process': '02',
  'in-process': '02',
  'inprocess': '02',
  'in progress': '02',
  'win': '03',
  'won': '03',
  'fail': '04',
  'failed': '04',
  'lost': '04',
  // Thai
  'รับข้อมูล': '01',
  'กำลังดำเนินการ': '02',
  'ชนะ': '03',
  'ไม่ผ่าน': '04',
}

function coerceStatus(raw: string): ProjectStatus {
  const norm = raw.trim().toLowerCase()
  return STATUS_MAP[norm] ?? '01' // default to "Received"
}

/**
 * Coerce a date string to YYYY-MM-DD. Accepts:
 *   - "2026-03-30" (already ISO)
 *   - "30/3/2026", "30-3-2026", "30.3.2026" (DMY)
 *   - "3/30/2026" (MDY heuristic when first part > 12)
 *   - "30 Mar 2026" (Mmm name)
 * Returns null if unrecognizable.
 */
export function coerceDate(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null

  // Already ISO YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) {
    const [, y, m, d] = iso
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // DMY or MDY with /, -, .
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/)
  if (dmy) {
    let [, a, b, y] = dmy
    let day = parseInt(a, 10)
    let month = parseInt(b, 10)
    // If first part > 12, assume DMY; else also assume DMY since the source XLSX is DMY
    if (day > 12 && month <= 12) {
      // DMY confirmed
    } else if (day <= 12 && month > 12) {
      // Must be MDY
      ;[day, month] = [month, day]
    }
    // else default DMY
    const yyyy = y.length === 2 ? `20${y}` : y
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${yyyy}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  // "30 Mar 2026" or "Mar 30 2026"
  const months: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  }
  const mmm = s.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{2,4})/) || s.match(/([A-Za-z]{3,})\s+(\d{1,2})\s+(\d{2,4})/)
  if (mmm) {
    const isFirstDay = /^\d/.test(mmm[1])
    const day = parseInt(isFirstDay ? mmm[1] : mmm[2], 10)
    const monName = (isFirstDay ? mmm[2] : mmm[1]).toLowerCase().slice(0, 3)
    const year = mmm[3].length === 2 ? `20${mmm[3]}` : mmm[3]
    const month = months[monName]
    if (month) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  // Last resort: let Date parse
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0]
  }

  return null
}

function nonEmpty(s: string | undefined): string | null {
  if (!s) return null
  const t = s.trim()
  return t === '' || t === '—' || t === '-' ? null : t
}

// ─── Row mapping ──────────────────────────────────────────────────────────────

export interface ProjectImportRow {
  index?: string
  code?: string
  name?: string
  customer?: string
  quarter?: string
  stage?: string
  status?: string
  tq_number?: string
  responsible_person?: string
  get_info_date?: string
  quotation_sent_date?: string
  follow_up_date?: string
  notes?: string
}

export interface MappedProjectRow {
  rowIndex: number // CSV row (1-based, excluding header)
  raw: ProjectImportRow
  // Resolved values, ready for insert
  data: Partial<Project>
  // Validation
  errors: string[]
  warnings: string[]
  // True if existing project with same code found
  isDuplicateCode: boolean
}

/**
 * Map parsed CSV rows to project records, performing validation.
 *
 * @param rows - All parsed CSV rows including the header
 * @param stages - List of existing pipeline stages (for stage name → id lookup)
 * @param existingCodes - Set of codes already in the database (for duplicate detection)
 */
export function mapRowsToProjects(
  rows: string[][],
  stages: Stage[],
  existingCodes: Set<string>
): { mapped: MappedProjectRow[]; headerErrors: string[] } {
  const headerErrors: string[] = []
  if (rows.length < 2) {
    headerErrors.push('CSV must have a header row and at least one data row.')
    return { mapped: [], headerErrors }
  }

  const headerRow = rows[0]
  const headerMap: (keyof ProjectImportRow | null)[] = headerRow.map((h) => normalizeHeader(h))

  if (!headerMap.includes('code') && !headerMap.includes('name')) {
    headerErrors.push('CSV must include at least a "Code" or "Name" column.')
  }

  // Build stage name lookup (case-insensitive)
  const stageByName = new Map<string, Stage>()
  for (const s of stages) {
    stageByName.set(s.name.trim().toLowerCase(), s)
  }

  const mapped: MappedProjectRow[] = []
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    if (cells.every((c) => c.trim() === '')) continue // skip blank rows

    const raw: ProjectImportRow = {}
    headerMap.forEach((field, i) => {
      if (!field) return
      raw[field] = cells[i] ?? ''
    })

    const errors: string[] = []
    const warnings: string[] = []

    const code = nonEmpty(raw.code) ?? ''
    const name = nonEmpty(raw.name) ?? ''

    if (!code) errors.push('Missing Code')
    if (!name) errors.push('Missing Name')

    const data: Partial<Project> = {
      code,
      name,
      customer: nonEmpty(raw.customer),
      quarter: nonEmpty(raw.quarter),
      status: raw.status ? coerceStatus(raw.status) : '01',
      tq_number: nonEmpty(raw.tq_number),
      responsible_person: nonEmpty(raw.responsible_person),
      notes: nonEmpty(raw.notes),
    }

    // Dates
    const dateFields: Array<[keyof ProjectImportRow, keyof Project]> = [
      ['get_info_date', 'get_info_date'],
      ['quotation_sent_date', 'quotation_sent_date'],
      ['follow_up_date', 'follow_up_date'],
    ]
    for (const [srcKey, dstKey] of dateFields) {
      const rawVal = nonEmpty(raw[srcKey])
      if (rawVal) {
        const iso = coerceDate(rawVal)
        if (iso) (data as Record<string, unknown>)[dstKey] = iso
        else warnings.push(`Could not parse ${srcKey.replace(/_/g, ' ')}: "${rawVal}"`)
      }
    }

    // Stage
    const stageName = nonEmpty(raw.stage)
    if (stageName) {
      const stage = stageByName.get(stageName.toLowerCase())
      if (stage) data.current_stage_id = stage.id
      else warnings.push(`Unknown stage "${stageName}": left blank`)
    }

    // Duplicate code
    const isDuplicateCode = !!code && existingCodes.has(code)
    if (isDuplicateCode) warnings.push(`A project with code "${code}" already exists`)

    mapped.push({
      rowIndex: r,
      raw,
      data,
      errors,
      warnings,
      isDuplicateCode,
    })
  }

  return { mapped, headerErrors }
}
