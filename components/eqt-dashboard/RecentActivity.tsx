'use client'

import { Project, STATUS_COLORS } from '@/types'
import { useI18n } from '@/lib/eqt/i18n'
import StatusBadge from '@/components/projects/StatusBadge'

interface Props {
  projects: Project[]
}

export default function RecentActivity({ projects }: Props) {
  const { t } = useI18n()

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-full">
      <h3 className="text-sm font-semibold text-foreground mb-4">{t('dashboard.recentActivity')}</h3>
      <div className="space-y-3">
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
        )}
        {projects.map((p) => (
          <div key={p.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {p.code} - {p.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {p.responsible_person ?? '-'}
              </div>
            </div>
            <StatusBadge status={p.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
