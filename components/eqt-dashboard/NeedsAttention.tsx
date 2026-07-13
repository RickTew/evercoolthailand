'use client'

import { Project } from '@/types'
import { useI18n } from '@/lib/eqt/i18n'
import StatusBadge from '@/components/projects/StatusBadge'
import { AlertCircle } from 'lucide-react'

interface Props {
  projects: Project[]
  isAdmin: boolean
}

export default function NeedsAttention({ projects, isAdmin }: Props) {
  const { t } = useI18n()
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-foreground">
          {isAdmin ? t('dashboard.needsAttention') : t('dashboard.myFollowUps')}
        </h3>
        {projects.length > 0 && (
          <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
            {projects.length}
          </span>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-sm text-muted-foreground">{t('dashboard.allCaughtUp')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const isOverdue = p.follow_up_date && p.follow_up_date < today
            const isDueToday = p.follow_up_date === today
            return (
              <div
                key={p.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isOverdue
                    ? 'border-red-500/30 bg-red-500/5'
                    : isDueToday
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-primary font-semibold">{p.code}</div>
                    <div className="text-sm font-medium text-foreground truncate mt-0.5">{p.name}</div>
                    {p.responsible_person && (
                      <div className="text-xs text-muted-foreground mt-0.5">{p.responsible_person}</div>
                    )}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {p.follow_up_date ? (
                  <div className={`text-xs mt-2 font-medium ${
                    isOverdue ? 'text-red-400' : isDueToday ? 'text-yellow-400' : 'text-muted-foreground'
                  }`}>
                    {isOverdue ? `⚠ ${t('dashboard.overdue')}: ` : isDueToday ? `📅 ${t('dashboard.dueToday')}: ` : '📅 '}
                    {p.follow_up_date}
                  </div>
                ) : (
                  <div className="text-xs mt-2 text-muted-foreground">{t('dashboard.noFollowUpDate')}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
