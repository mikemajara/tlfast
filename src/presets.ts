import { useCallback, useEffect, useState } from 'react'

export type PresetStyles = Record<string, string>
export interface Preset { id: string; name: string; toolId: string; styles: PresetStyles }

const STORAGE_KEY = 'tlfast-presets'
const UPDATED_EVENT = 'tlfast:presets-updated'

function getStorage() {
  return (globalThis as any).chrome?.storage?.sync
}

async function loadPresets(): Promise<Preset[]> {
  const storage = getStorage()
  if (storage) {
    const result = await storage.get(STORAGE_KEY)
    return result[STORAGE_KEY] ?? []
  }
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
}

async function savePresets(presets: Preset[]) {
  const storage = getStorage()
  if (storage) await storage.set({ [STORAGE_KEY]: presets })
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  document.dispatchEvent(new CustomEvent(UPDATED_EVENT, { detail: presets }))
}

export function usePresets() {
  const [presets, setPresets] = useState<Preset[]>([])

  useEffect(() => {
    loadPresets().then(setPresets).catch(() => setPresets([]))
    const onUpdate = (event: Event) => setPresets((event as CustomEvent<Preset[]>).detail)
    document.addEventListener(UPDATED_EVENT, onUpdate)
    return () => document.removeEventListener(UPDATED_EVENT, onUpdate)
  }, [])

  const update = useCallback(async (next: Preset[]) => {
    setPresets(next)
    await savePresets(next)
  }, [])

  return { presets, update }
}

export function currentPresetStyles(styles: Record<string, string | null>): PresetStyles {
  return Object.fromEntries(Object.entries(styles).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
}
