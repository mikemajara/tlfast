import type { Preset } from './presets'

export const RUN_COMMAND_EVENT = 'tlfast:run-command'
const PRESET_COMMAND_PREFIX = 'preset.apply.'

export interface CommandRequest {
  id: string
  payload?: unknown
}

export function dispatchCommand(request: CommandRequest) {
  document.dispatchEvent(new CustomEvent(RUN_COMMAND_EVENT, { detail: JSON.stringify(request) }))
}

export function presetApplyRequest(preset: Pick<Preset, 'id' | 'toolId' | 'styles'>): CommandRequest {
  return {
    id: `${PRESET_COMMAND_PREFIX}${preset.id}`,
    payload: { toolId: preset.toolId, styles: preset.styles },
  }
}

export function isPresetApplyCommand(id: string) {
  return id.startsWith(PRESET_COMMAND_PREFIX)
}
