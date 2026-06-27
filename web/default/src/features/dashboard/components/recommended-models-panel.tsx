/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowUpRight, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { Button } from '@/components/ui/button'
import { loadConfig, saveConfig } from '@/features/playground/lib/storage'
import { getRecommendedModels } from '../api'
import type { RecommendedModel } from '../types'

type RecommendedModelsPanelProps = {
  className?: string
}

function RecommendedModelCard(props: { model: RecommendedModel }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { copyToClipboard } = useCopyToClipboard()
  const icon = getLobeIcon(props.model.icon || props.model.vendor_name || 'Bot', 20)

  const openPlayground = () => {
    const current = loadConfig()
    saveConfig({ ...current, model: props.model.model_name })
    void navigate({ to: '/playground' })
  }

  return (
    <div className='bg-card flex h-full flex-col rounded-xl border p-4 shadow-xs'>
      <div className='flex items-start gap-3'>
        <div className='bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg border'>
          {icon}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0'>
              <h4 className='truncate text-sm font-semibold'>
                {props.model.model_name}
              </h4>
              {props.model.vendor_name && (
                <p className='text-muted-foreground truncate text-xs'>
                  {props.model.vendor_name}
                </p>
              )}
            </div>
            <Button
              type='button'
              size='icon'
              variant='ghost'
              className='size-8 shrink-0'
              onClick={() => copyToClipboard(props.model.model_name)}
              aria-label={t('Copy model name')}
            >
              <Copy className='size-4' />
            </Button>
          </div>
          {props.model.description && (
            <p className='text-muted-foreground mt-2 line-clamp-2 text-sm'>
              {props.model.description}
            </p>
          )}
        </div>
      </div>
      <div className='mt-4 flex items-center gap-2'>
        <Button
          type='button'
          size='sm'
          className='gap-1.5'
          onClick={openPlayground}
        >
          {t('Try in Playground')}
          <ArrowUpRight className='size-4' />
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          render={<Link to='/pricing/$modelId' params={{ modelId: props.model.model_name }} />}
        >
          {t('View details')}
        </Button>
      </div>
    </div>
  )
}

export function RecommendedModelsPanel(props: RecommendedModelsPanelProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'recommended-models'],
    queryFn: async () => {
      const result = await getRecommendedModels()
      return result.success ? (result.data ?? []) : []
    },
    staleTime: 60 * 1000,
  })

  if (isLoading || !data || data.length === 0) {
    return null
  }

  return (
    <section className={cn('grid gap-3', props.className)}>
      <div>
        <h3 className='text-base font-semibold'>
          {t('Recommended models for your group')}
        </h3>
        <p className='text-muted-foreground text-sm'>
          {t('Curated models selected for your current user group.')}
        </p>
      </div>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
        {data.map((model) => (
          <RecommendedModelCard key={model.model_name} model={model} />
        ))}
      </div>
    </section>
  )
}
