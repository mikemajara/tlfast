import type { Preset } from './presets'

export const RUN_COMMAND_EVENT = 'tlfast:run-command'
export const CAPTURE_PRESET_EVENT = 'tlfast:capture-preset'
export const PRESET_CAPTURED_EVENT = 'tlfast:preset-captured'
const PRESET_COMMAND_PREFIX = 'preset.apply.'

export interface CommandRequest {
  id: string
  payload?: unknown
}

export function dispatchCommand(request: CommandRequest) {
  document.dispatchEvent(new CustomEvent(RUN_COMMAND_EVENT, { detail: JSON.stringify(request) }))
}

export function captureCurrentPreset(name: string) {
  document.dispatchEvent(new CustomEvent(CAPTURE_PRESET_EVENT, { detail: JSON.stringify({ name }) }))
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
