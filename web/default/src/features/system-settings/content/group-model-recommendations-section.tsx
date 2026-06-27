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
import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'
import { searchModels } from '@/features/models/api'
import { getGroups } from '@/features/users/api'

type GroupModelRecommendations = Record<string, string[]>

type GroupModelRecommendationsSectionProps = {
  data: string
}

const MAX_MODELS_PER_GROUP = 12

function parseRecommendations(raw: string): GroupModelRecommendations {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw) as GroupModelRecommendations
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    return Object.fromEntries(
      Object.entries(parsed).map(([group, models]) => [
        group,
        Array.isArray(models)
          ? models.filter((model) => typeof model === 'string' && model.trim())
          : [],
      ])
    )
  } catch {
    return {}
  }
}

export function GroupModelRecommendationsSection(
  props: GroupModelRecommendationsSectionProps
) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [groups, setGroups] = useState<string[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [recommendations, setRecommendations] = useState<GroupModelRecommendations>(
    () => parseRecommendations(props.data)
  )
  const [modelInput, setModelInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setRecommendations(parseRecommendations(props.data))
  }, [props.data])

  useEffect(() => {
    void getGroups().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setGroups(res.data)
        if (!selectedGroup && res.data.length > 0) {
          setSelectedGroup(res.data[0])
        }
      }
    })
  }, [selectedGroup])

  const selectedModels = useMemo(
    () => recommendations[selectedGroup] ?? [],
    [recommendations, selectedGroup]
  )

  const configuredGroups = useMemo(
    () => Object.keys(recommendations).filter((group) => recommendations[group]?.length),
    [recommendations]
  )

  useEffect(() => {
    const keyword = modelInput.trim()
    if (keyword.length < 2) {
      setSuggestions([])
      return
    }

    const timer = window.setTimeout(() => {
      void searchModels({ keyword, page_size: 8 }).then((res) => {
        if (!res.success || !res.data?.items) {
          setSuggestions([])
          return
        }
        setSuggestions(
          res.data.items
            .map((item) => item.model_name)
            .filter((name): name is string => Boolean(name))
        )
      })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [modelInput])

  const updateGroupModels = (group: string, models: string[]) => {
    setRecommendations((prev) => {
      const next = { ...prev }
      if (models.length === 0) {
        delete next[group]
      } else {
        next[group] = models
      }
      return next
    })
  }

  const handleAddModel = (modelName?: string) => {
    const value = (modelName ?? modelInput).trim()
    if (!selectedGroup || !value) return
    if (selectedModels.includes(value)) {
      toast.error(t('Model already added'))
      return
    }
    if (selectedModels.length >= MAX_MODELS_PER_GROUP) {
      toast.error(t('Too many recommended models for this group'))
      return
    }
    updateGroupModels(selectedGroup, [...selectedModels, value])
    setModelInput('')
    setSuggestions([])
  }

  const handleRemoveModel = (modelName: string) => {
    updateGroupModels(
      selectedGroup,
      selectedModels.filter((item) => item !== modelName)
    )
  }

  const handleMoveModel = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= selectedModels.length) return
    const next = [...selectedModels]
    const [item] = next.splice(index, 1)
    next.splice(targetIndex, 0, item)
    updateGroupModels(selectedGroup, next)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const normalized = Object.fromEntries(
        Object.entries(recommendations)
          .map(([group, models]) => [group.trim(), models.map((item) => item.trim()).filter(Boolean)])
          .filter(([group, models]) => group && models.length > 0)
      )
      await updateOption.mutateAsync({
        key: 'group_model_recommendation.models',
        value: JSON.stringify(normalized),
      })
      toast.success(t('Saved successfully'))
    } catch (_error) {
      // handled globally
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SettingsSection title={t('Group Model Recommendations')}>
      <p className='text-muted-foreground text-sm'>
        {t(
          'Configure curated model lists shown on the dashboard for each user group.'
        )}
      </p>
      <div className='flex justify-end'>
        <Button onClick={handleSave} disabled={isSaving} className='gap-2'>
          <Save className='size-4' />
          {t('Save')}
        </Button>
      </div>
      <div className='grid gap-4'>
        <div className='grid gap-2 sm:max-w-sm'>
          <label className='text-sm font-medium'>{t('User group')}</label>
          <Select
            items={groups.map((group) => ({ value: group, label: group }))}
            onValueChange={setSelectedGroup}
            value={selectedGroup}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder={t('Select a group')} />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className='grid gap-2'>
          <label className='text-sm font-medium'>{t('Add recommended model')}</label>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Input
              value={modelInput}
              onChange={(event) => setModelInput(event.target.value)}
              placeholder={t('Search model name...')}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleAddModel()
                }
              }}
            />
            <Button
              type='button'
              variant='outline'
              className='gap-2'
              onClick={() => handleAddModel()}
              disabled={!modelInput.trim()}
            >
              <Plus className='size-4' />
              {t('Add')}
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {suggestions.map((modelName) => (
                <Button
                  key={modelName}
                  type='button'
                  size='sm'
                  variant='secondary'
                  onClick={() => handleAddModel(modelName)}
                >
                  {modelName}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className='grid gap-2'>
          <div className='flex items-center justify-between gap-2'>
            <h4 className='text-sm font-medium'>
              {t('Recommended models for {{group}}', { group: selectedGroup || '-' })}
            </h4>
            <span className='text-muted-foreground text-xs'>
              {selectedModels.length}/{MAX_MODELS_PER_GROUP}
            </span>
          </div>
          {selectedModels.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              {t('No recommended models configured for this group')}
            </p>
          ) : (
            <div className='divide-border rounded-lg border'>
              {selectedModels.map((modelName, index) => (
                <div
                  key={modelName}
                  className='flex items-center justify-between gap-2 px-3 py-2'
                >
                  <span className='truncate text-sm font-medium'>{modelName}</span>
                  <div className='flex items-center gap-1'>
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      className='size-8'
                      onClick={() => handleMoveModel(index, -1)}
                      disabled={index === 0}
                      aria-label={t('Move up')}
                    >
                      <ArrowUp className='size-4' />
                    </Button>
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      className='size-8'
                      onClick={() => handleMoveModel(index, 1)}
                      disabled={index === selectedModels.length - 1}
                      aria-label={t('Move down')}
                    >
                      <ArrowDown className='size-4' />
                    </Button>
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      className='size-8'
                      onClick={() => handleRemoveModel(modelName)}
                      aria-label={t('Remove')}
                    >
                      <Trash2 className='size-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {configuredGroups.length > 0 && (
          <p className='text-muted-foreground text-xs'>
            {t('Configured groups: {{groups}}', {
              groups: configuredGroups.join(', '),
            })}
          </p>
        )}
      </div>
    </SettingsSection>
  )
}
