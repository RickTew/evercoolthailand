'use client'

import { ProjectStatus } from '@/types'
import { useI18n } from '@/lib/eqt/i18n'

const STATUS_STYLES: Record<ProjectStatus, string> = {
  '01': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  '02': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  '03': 'bg-green-500/15 text-green-400 border-green-500/30',
  '04': 'bg-red-500/15 text-red-400 border-red-500/30',
}

interface Props {
  status: ProjectStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const { t } = useI18n()
  const label = t(`status.${status}`)

  return (
    <span
      className={`inline-flex items-center border rounded-full font-medium ${STATUS_STYLES[status]} ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      }`}
    >
      {label}
    </span>
  )
}
