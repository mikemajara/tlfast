import { useCallback, useEffect, useState } from 'react'
import { GEO_SHAPES, presetCatalog, type PresetCatalogEntry } from './presetCatalog.ts'

export type PresetStyles = Record<string, string>
export interface Preset {
  id: string
  name: string
  description?: string
  iconSvg?: string
  toolId?: string
  styles: PresetStyles
}

export const BUILT_IN_PRESETS: Preset[] = presetCatalog.map((entry: PresetCatalogEntry) => {
  const styles: PresetStyles = { ...entry.styles }
  const toolId = entry.shape
    ? GEO_SHAPES.has(entry.shape)
      ? 'geo'
      : entry.shape
    : undefined
  if (entry.shape && GEO_SHAPES.has(entry.shape)) styles.geo = entry.shape

  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    iconSvg: entry.iconSvg,
    toolId,
    styles,
  }
})

const STORAGE_KEY = 'tlfast-presets'
const UPDATED_EVENT = 'tlfast:presets-updated'

async function loadPresets(): Promise<Preset[]> {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
}

async function savePresets(presets: Preset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  document.dispatchEvent(new CustomEvent(UPDATED_EVENT, { detail: presets }))
}

export function usePresets() {
  const [customPresets, setCustomPresets] = useState<Preset[]>([])

  useEffect(() => {
    loadPresets().then(setCustomPresets).catch(() => setCustomPresets([]))
    const onUpdate = (event: Event) => setCustomPresets((event as CustomEvent<Preset[]>).detail)
    document.addEventListener(UPDATED_EVENT, onUpdate)
    return () => document.removeEventListener(UPDATED_EVENT, onUpdate)
  }, [])

  const save = useCallback(async (preset: Preset) => {
    const next = [...customPresets, preset]
    setCustomPresets(next)
    await savePresets(next)
  }, [customPresets])

  return { presets: [...BUILT_IN_PRESETS, ...customPresets], save }
}

export function currentPresetStyles(styles: Record<string, string | null>): PresetStyles {
  return Object.fromEntries(Object.entries(styles).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
}
