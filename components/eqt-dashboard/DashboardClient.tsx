'use client'

import { useMemo, useState } from 'react'
import { Project, Stage } from '@/types'
import { useI18n } from '@/lib/eqt/i18n'
import KPICards from './KPICards'
import DashboardCharts from './DashboardCharts'
import NeedsAttention from './NeedsAttention'
import DashboardFilters from './DashboardFilters'

interface Props {
  initialProjects: Project[]
  stages: Stage[]
  isAdmin: boolean
  displayName: string | null
}

export interface DashboardFilters {
  quarter: string
  status: string[]
  person: string
  stage: string
  dateFrom: string
  dateTo: string
}

export default function DashboardClient({ initialProjects, stages, isAdmin, displayName }: Props) {
  const { t } = useI18n()
  const [filters, setFilters] = useState<DashboardFilters>({
    quarter: '',
    status: [],
    person: '',
    stage: '',
    dateFrom: '',
    dateTo: '',
  })

  const quarters = useMemo(
    () => [...new Set(initialProjects.map((p) => p.quarter).filter(Boolean))].sort().reverse() as string[],
    [initialProjects]
  )
  const persons = useMemo(
    () => [...new Set(initialProjects.map((p) => p.responsible_person).filter(Boolean))].sort() as string[],
    [initialProjects]
  )

  const filtered = useMemo(() => {
    return initialProjects.filter((p) => {
      if (filters.quarter && p.quarter !== filters.quarter) return false
      if (filters.status.length > 0 && !filters.status.includes(p.status)) return false
      if (filters.person && p.responsible_person !== filters.person) return false
      if (filters.stage && p.current_stage_id !== filters.stage) return false
      if (filters.dateFrom && p.get_info_date && p.get_info_date < filters.dateFrom) return false
      if (filters.dateTo && p.get_info_date && p.get_info_date > filters.dateTo) return false
      return true
    })
  }, [initialProjects, filters])

  // My projects = projects assigned to the current user by display_name
  const myProjects = useMemo(
    () => displayName
      ? initialProjects.filter((p) => p.responsible_person === displayName)
      : [],
    [initialProjects, displayName]
  )

  // Needs attention: status 02 with follow_up_date today or earlier, or no follow-up set
  const needsAttention = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return initialProjects.filter((p) => {
      if (p.status !== '01' && p.status !== '02') return false
      if (displayName && p.responsible_person !== displayName && !isAdmin) return false
      if (p.follow_up_date && p.follow_up_date <= today) return true
      if (!p.follow_up_date && p.status === '02') return true
      return false
    }).slice(0, 10)
  }, [initialProjects, displayName, isAdmin])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>

      <DashboardFilters
        filters={filters}
        setFilters={setFilters}
        quarters={quarters}
        persons={persons}
        stages={stages}
      />

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          <KPICards projects={filtered} myProjects={myProjects} displayName={displayName} />
          <DashboardCharts projects={filtered} stages={stages} />
        </div>

        {/* Needs Attention sidebar */}
        <div className="xl:w-80 xl:flex-shrink-0">
          <NeedsAttention projects={needsAttention} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  )
}
