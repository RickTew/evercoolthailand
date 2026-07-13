'use client'

import { useState } from 'react'
import { Stage } from '@/types'
import { useI18n } from '@/lib/eqt/i18n'
import StageManager from './StageManager'
import QuarterManager from './QuarterManager'

interface Props {
  initialStages: Stage[]
}

export default function PipelineClient({ initialStages }: Props) {
  const { t } = useI18n()
  const [stages, setStages] = useState(initialStages)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('admin.title')}</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t('admin.stages')}</h2>
        <StageManager stages={stages} onStagesChange={setStages} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t('admin.quarters')}</h2>
        <QuarterManager />
      </section>
    </div>
  )
}
