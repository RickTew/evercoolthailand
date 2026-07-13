'use client'

import { Project } from '@/types'
import { useI18n } from '@/lib/eqt/i18n'
import { TrendingUp, Target, Clock, XCircle, User } from 'lucide-react'

interface Props {
  projects: Project[]
  myProjects: Project[]
  displayName: string | null
}

export default function KPICards({ projects, myProjects, displayName }: Props) {
  const { t } = useI18n()

  const total = projects.length
  const wins = projects.filter((p) => p.status === '03').length
  const inProgress = projects.filter((p) => p.status === '01' || p.status === '02').length
  const failed = projects.filter((p) => p.status === '04').length
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0

  const myActive = myProjects.filter((p) => p.status === '01' || p.status === '02').length
  const myWins = myProjects.filter((p) => p.status === '03').length

  const cards = [
    {
      title: t('dashboard.totalProjects'),
      value: total,
      sub: t('dashboard.thisQuarter'),
      icon: Target,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      title: t('dashboard.winRate'),
      value: `${winRate}%`,
      sub: `${wins} ${t('dashboard.wins')}`,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    {
      title: t('dashboard.inProgress'),
      value: inProgress,
      sub: t('status.02'),
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
    },
    {
      title: t('dashboard.failed'),
      value: failed,
      sub: t('status.04'),
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Global KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ title, value, sub, icon: Icon, color, bg, border }) => (
          <div
            key={title}
            className={`bg-card border ${border} rounded-xl p-5 flex flex-col gap-3`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* My Projects card - only shown when displayName is set */}
      {displayName && (
        <div className="bg-card border border-purple-500/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <User className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{t('dashboard.myProjects')}</div>
              <div className="text-xs text-muted-foreground">{displayName}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{myProjects.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t('dashboard.kpiTotal')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{myActive}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t('dashboard.kpiActive')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{myWins}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t('dashboard.kpiWon')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
