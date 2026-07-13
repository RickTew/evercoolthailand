import { Project, ServiceRecord, ServiceVisit } from '@/types'

function formatDate() {
  return new Date().toISOString().split('T')[0]
}

const STATUS_LABELS: Record<string, string> = {
  '01': 'Received',
  '02': 'In Process',
  '03': 'Win',
  '04': 'Fail',
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function projectsToRows(projects: Project[]) {
  return projects.map((p, i) => [
    i + 1,
    p.code,
    p.name,
    p.customer ?? '',
    p.quarter ?? '',
    (p.current_stage as { name?: string } | null)?.name ?? '',
    STATUS_LABELS[p.status] ?? p.status,
    p.tq_number ?? '',
    p.responsible_person ?? '',
    p.get_info_date ?? '',
    p.quotation_sent_date ?? '',
    p.follow_up_date ?? '',
    p.notes ?? '',
  ])
}

const HEADERS = [
  '#', 'Code', 'Name', 'Customer', 'Quarter', 'Stage', 'Status',
  'TQ Number', 'Person', 'Info Date', 'Quotation Sent', 'Follow Up', 'Notes',
]

export function exportToCSV(projects: Project[]) {
  const rows = [HEADERS, ...projectsToRows(projects)]
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '')
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    )
    .join('\n')

  // UTF-8 BOM ensures Thai characters open correctly in Excel on Windows
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `EQ-Tracker-Export-${formatDate()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToPDF(projects: Project[]) {
  const date = formatDate()
  const rows = projectsToRows(projects)

  const headerHtml = HEADERS.map((h) => `<th>${escapeHtml(h)}</th>`).join('')
  const bodyHtml = rows
    .map(
      (row, i) =>
        `<tr class="${i % 2 !== 0 ? 'alt' : ''}">${row
          .map((cell) => `<td>${escapeHtml(String(cell ?? ''))}</td>`)
          .join('')}</tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>EQ Tracker: Quotation Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=block" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Sarabun', 'Noto Sans Thai', Arial, sans-serif;
      font-size: 8pt;
      color: #111;
      padding: 14mm;
    }
    h1 { font-size: 15pt; font-weight: 700; margin-bottom: 2pt; }
    .meta { font-size: 9pt; color: #555; margin-bottom: 12pt; }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      background: #1e3a8a;
      color: #fff;
      padding: 5pt 5pt;
      text-align: left;
      font-size: 7pt;
      font-weight: 700;
      white-space: nowrap;
    }
    tbody td {
      padding: 4pt 5pt;
      border-bottom: 1px solid #e5e7eb;
      font-size: 7.5pt;
      vertical-align: top;
    }
    tbody tr.alt td { background: #f8fafc; }
    tbody tr:last-child td { border-bottom: none; }
    @media print {
      body { padding: 0; }
      @page { size: A4 landscape; margin: 10mm; }
    }
  </style>
</head>
<body>
  <h1>EQ Tracker &mdash; Quotation Report</h1>
  <p class="meta">Export Date: ${date} &nbsp;&bull;&nbsp; ${projects.length} projects</p>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
  <script>
    // Wait for Sarabun font to load so Thai text renders correctly before printing
    document.fonts.ready.then(function() {
      setTimeout(function() { window.print(); }, 250);
    });
  </script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=1200,height=800')
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
  }
}

// ─── Service & Maintenance Monthly Report ──────────────────────────────────────

const SERVICE_REPORT_STYLES = `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Sarabun', 'Noto Sans Thai', Arial, sans-serif;
    font-size: 10pt;
    color: #1f2937;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { padding: 14mm; }

  /* ── Letterhead ── */
  .letterhead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 14pt;
    border-bottom: 3px solid #1e3a8a;
    margin-bottom: 18pt;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12pt;
  }
  .logo {
    width: 44pt;
    height: 44pt;
    background: #1e3a8a;
    color: #fff;
    border-radius: 8pt;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: -1pt;
  }
  .brand-text .name { font-size: 14pt; font-weight: 700; color: #111827; line-height: 1.1; }
  .brand-text .tag { font-size: 8.5pt; color: #6b7280; margin-top: 2pt; letter-spacing: 0.4pt; text-transform: uppercase; }
  .doc-info { text-align: right; }
  .doc-info .label { font-size: 7.5pt; color: #6b7280; letter-spacing: 0.6pt; text-transform: uppercase; }
  .doc-info .value { font-size: 11pt; font-weight: 700; color: #111827; margin-top: 1pt; }
  .doc-info .period { font-size: 14pt; font-weight: 700; color: #1e3a8a; margin-top: 6pt; }

  /* ── KPI strip ── */
  .kpi-strip {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8pt;
    margin-bottom: 20pt;
  }
  .kpi {
    border: 1px solid #e5e7eb;
    border-radius: 8pt;
    padding: 10pt 12pt;
  }
  .kpi.completed { border-color: #10b98155; background: #f0fdf4; }
  .kpi.upcoming { border-color: #eab30855; background: #fefce8; }
  .kpi.overdue { border-color: #ef444455; background: #fef2f2; }
  .kpi .kpi-label { font-size: 8pt; color: #6b7280; letter-spacing: 0.4pt; text-transform: uppercase; }
  .kpi .kpi-value { font-size: 22pt; font-weight: 700; line-height: 1; margin-top: 4pt; }
  .kpi.completed .kpi-value { color: #047857; }
  .kpi.upcoming .kpi-value { color: #a16207; }
  .kpi.overdue .kpi-value { color: #b91c1c; }

  /* ── Sections ── */
  section { margin-bottom: 20pt; page-break-inside: auto; }
  .section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-bottom: 6pt;
    margin-bottom: 8pt;
    border-bottom: 1.5pt solid #1e3a8a;
  }
  .section-header h2 { font-size: 12pt; font-weight: 700; color: #1e3a8a; }
  .section-header .count {
    background: #1e3a8a;
    color: #fff;
    border-radius: 999px;
    padding: 1.5pt 9pt;
    font-size: 8pt;
    font-weight: 700;
  }

  /* ── Table ── */
  table { width: 100%; border-collapse: collapse; }
  thead th {
    background: #f3f4f6;
    color: #374151;
    padding: 6pt 8pt;
    text-align: left;
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.3pt;
    text-transform: uppercase;
    border-bottom: 1pt solid #d1d5db;
  }
  tbody td {
    padding: 5pt 8pt;
    border-bottom: 0.5pt solid #e5e7eb;
    font-size: 8.5pt;
    vertical-align: top;
    color: #1f2937;
  }
  tbody tr:nth-child(even) td { background: #fafafa; }
  tbody tr:last-child td { border-bottom: none; }
  td.mono { font-family: 'SF Mono', 'Monaco', 'Menlo', monospace; font-size: 7.5pt; color: #4b5563; }
  td.center { text-align: center; }

  .badge {
    display: inline-block;
    padding: 1pt 7pt;
    border-radius: 999px;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 0.3pt;
  }
  .badge-overdue { background: #fee2e2; color: #991b1b; }
  .badge-soon { background: #fef3c7; color: #92400e; }
  .badge-ok { background: #d1fae5; color: #065f46; }

  .empty {
    padding: 14pt;
    text-align: center;
    color: #9ca3af;
    font-style: italic;
    font-size: 9pt;
    background: #fafafa;
    border: 1px dashed #d1d5db;
    border-radius: 6pt;
  }

  footer {
    margin-top: 26pt;
    padding-top: 10pt;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #9ca3af;
  }

  /* Action toolbar (only visible on screen, hidden when printing) */
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: #1e3a8a;
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  .toolbar .title {
    font-size: 14px;
    font-weight: 600;
  }
  .toolbar .actions {
    display: flex;
    gap: 8px;
  }
  .toolbar button {
    background: #fff;
    color: #1e3a8a;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;
  }
  .toolbar button:hover { background: #f3f4f6; }
  .toolbar button.secondary {
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  .toolbar button.secondary:hover { background: rgba(255, 255, 255, 0.1); }

  /* Hint banner under the toolbar */
  .hint {
    background: #eff6ff;
    color: #1e3a8a;
    padding: 8px 20px;
    font-size: 12px;
    border-bottom: 1px solid #dbeafe;
    text-align: center;
  }

  @media print {
    .toolbar, .hint { display: none !important; }
    .page { padding: 0; }
    @page { size: A4; margin: 12mm; }
    section { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
`

function fmtDate(d: string | null | undefined): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function exportServiceReport(records: ServiceRecord[], visits: ServiceVisit[]) {
  const generated = new Date()
  const generatedStr = generated.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    generated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const monthLabel = generated.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const reportNumber = `SM-${generated.getFullYear()}${String(generated.getMonth() + 1).padStart(2, '0')}`

  const inMonth = (d: string) => {
    const t = new Date(d)
    return t.getFullYear() === generated.getFullYear() && t.getMonth() === generated.getMonth()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const completedThisMonth = visits.filter((v) => inMonth(v.completed_date))
  const upcomingThisMonth = records.filter((r) => r.due_date && inMonth(r.due_date))
  const overdue = records
    .filter((r) => {
      if (!r.due_date) return false
      const due = new Date(r.due_date)
      due.setHours(0, 0, 0, 0)
      return due.getTime() < today.getTime()
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())

  const recordsById = new Map(records.map((r) => [r.id, r]))

  const completedTable = completedThisMonth.length === 0
    ? `<div class="empty">No service visits completed this month</div>`
    : `<table>
        <thead><tr>
          <th style="width: 14%">Date</th>
          <th style="width: 28%">Project</th>
          <th style="width: 18%">Location</th>
          <th style="width: 18%">Performed By</th>
          <th>Remarks</th>
        </tr></thead>
        <tbody>${completedThisMonth
          .map((v) => {
            const r = recordsById.get(v.service_record_id)
            return `<tr>
              <td class="mono">${escapeHtml(fmtDate(v.completed_date))}</td>
              <td><strong>${escapeHtml(r?.project_name ?? '-')}</strong></td>
              <td>${escapeHtml(r?.location ?? '-')}</td>
              <td>${escapeHtml(v.performed_by ?? '-')}</td>
              <td>${escapeHtml(v.remarks ?? '-')}</td>
            </tr>`
          })
          .join('')}</tbody>
       </table>`

  const upcomingTable = upcomingThisMonth.length === 0
    ? `<div class="empty">Nothing scheduled for this month</div>`
    : `<table>
        <thead><tr>
          <th style="width: 12%">Due</th>
          <th style="width: 30%">Project</th>
          <th style="width: 18%">Location</th>
          <th style="width: 12%">Department</th>
          <th style="width: 10%">Freq.</th>
          <th>QT Number</th>
        </tr></thead>
        <tbody>${upcomingThisMonth
          .map((r) => `<tr>
            <td class="mono"><strong>${escapeHtml(fmtDate(r.due_date))}</strong></td>
            <td><strong>${escapeHtml(r.project_name)}</strong></td>
            <td>${escapeHtml(r.location ?? '-')}</td>
            <td>${escapeHtml(r.department ?? '-')}</td>
            <td class="center">${r.visits_per_year ? `${r.visits_per_year}x/yr` : '-'}</td>
            <td class="mono">${escapeHtml(r.contractor_qt_number ?? '-')}</td>
          </tr>`)
          .join('')}</tbody>
       </table>`

  const overdueTable = overdue.length === 0
    ? `<div class="empty">All service is up to date, nothing overdue.</div>`
    : `<table>
        <thead><tr>
          <th style="width: 13%">Status</th>
          <th style="width: 30%">Project</th>
          <th style="width: 18%">Location</th>
          <th style="width: 12%">Department</th>
          <th style="width: 13%">Due Date</th>
          <th>QT Number</th>
        </tr></thead>
        <tbody>${overdue
          .map((r) => {
            const due = new Date(r.due_date!)
            due.setHours(0, 0, 0, 0)
            const days = Math.floor((today.getTime() - due.getTime()) / 86400000)
            return `<tr>
              <td><span class="badge badge-overdue">${days} day${days === 1 ? '' : 's'} late</span></td>
              <td><strong>${escapeHtml(r.project_name)}</strong></td>
              <td>${escapeHtml(r.location ?? '-')}</td>
              <td>${escapeHtml(r.department ?? '-')}</td>
              <td class="mono">${escapeHtml(fmtDate(r.due_date))}</td>
              <td class="mono">${escapeHtml(r.contractor_qt_number ?? '-')}</td>
            </tr>`
          })
          .join('')}</tbody>
       </table>`

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>Service &amp; Maintenance Report: ${monthLabel}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=block" rel="stylesheet">
  <style>${SERVICE_REPORT_STYLES}</style>
</head>
<body>
  <div class="toolbar">
    <span class="title">EQ Tracker: Monthly Report</span>
    <div class="actions">
      <button class="secondary" onclick="window.close()">Close</button>
      <button onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>
  <div class="hint">Review the report below, then click <strong>Print / Save as PDF</strong> to export.</div>
  <div class="page">
    <header class="letterhead">
      <div class="brand">
        <div class="logo">EQ</div>
        <div class="brand-text">
          <div class="name">EQ Tracker</div>
          <div class="tag">Service &amp; Maintenance</div>
        </div>
      </div>
      <div class="doc-info">
        <div class="label">Monthly Report</div>
        <div class="value">${reportNumber}</div>
        <div class="period">${monthLabel}</div>
      </div>
    </header>

    <div class="kpi-strip">
      <div class="kpi completed">
        <div class="kpi-label">Completed this month</div>
        <div class="kpi-value">${completedThisMonth.length}</div>
      </div>
      <div class="kpi upcoming">
        <div class="kpi-label">Upcoming this month</div>
        <div class="kpi-value">${upcomingThisMonth.length}</div>
      </div>
      <div class="kpi overdue">
        <div class="kpi-label">Overdue</div>
        <div class="kpi-value">${overdue.length}</div>
      </div>
    </div>

    <section>
      <div class="section-header">
        <h2>✓ Completed Visits</h2>
        <span class="count">${completedThisMonth.length}</span>
      </div>
      ${completedTable}
    </section>

    <section>
      <div class="section-header">
        <h2>📅 Upcoming This Month</h2>
        <span class="count">${upcomingThisMonth.length}</span>
      </div>
      ${upcomingTable}
    </section>

    <section>
      <div class="section-header">
        <h2>⚠ Overdue</h2>
        <span class="count">${overdue.length}</span>
      </div>
      ${overdueTable}
    </section>

    <footer>
      <span>EQ Tracker · Service &amp; Maintenance Monthly Report</span>
      <span>Generated ${escapeHtml(generatedStr)}</span>
    </footer>
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=1000,height=800')
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
  }
}
