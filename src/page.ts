import { applyPreset } from './editorPresets'

const RUN_COMMAND_EVENT = 'tlfast:run-command'
const PRESET_COMMAND_PREFIX = 'preset.apply.'
const REQUEST_STATE_EVENT = 'tlfast:request-state'
const STATE_EVENT = 'tlfast:state'
const MAX_EDITOR_RETRIES = 50

function getStyle(editor: any, id: string) {
  try {
    for (const [style] of editor.getSharedStyles()) {
      if (style.id === `tldraw:${id}`) return style
    }
  } catch {
    // The editor has not finished registering styles yet.
  }
  return null
}

function setStyle(editor: any, styleId: string, value: string) {
  let style = getStyle(editor, styleId)
  // The select tool exposes no styles until a shape tool is active. Fall back
  // to geo so style commands still prepare the next shape.
  if (!style && editor.getSelectedShapeIds().length === 0) {
    editor.setCurrentTool('geo')
    style = getStyle(editor, styleId)
  }
  if (!style) throw new Error(`Style is unavailable for the current tool: ${styleId}`)
  const selectedIds = editor.getSelectedShapeIds()
  if (selectedIds.length > 0) editor.setStyleForSelectedShapes(style, value)
  else editor.setStyleForNextShapes(style, value)
}

function setGeoTool(editor: any, shape: string) {
  editor.setCurrentTool('geo')
  setStyle(editor, 'geo', shape)
}

function selectedIds(editor: any) {
  return editor.getSelectedShapeIds()
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function exportFile(editor: any, format: 'png' | 'svg' | 'json') {
  const pageName = editor.getCurrentPage()?.name || 'tldraw'
  const safeName = pageName.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'tldraw'
  if (format === 'json') {
    download(new Blob([JSON.stringify(editor.getSnapshot(), null, 2)], { type: 'application/json' }), `${safeName}.tldr.json`)
    return
  }

  const ids = editor.getSelectedShapeIds()
  const image = await editor.toImage(ids.length > 0 ? ids : editor.getCurrentPageShapeIds(), { format })
  download(image.blob, `${safeName}.${format}`)
}

async function executeCommand(editor: any, id: string, payload?: any) {
  if (id.startsWith(PRESET_COMMAND_PREFIX)) {
    const skippedStyles = applyPreset(editor, payload)
    if (skippedStyles.length > 0) console.warn('[tlfast] skipped unavailable preset styles:', skippedStyles)
    return
  }
  if (id === 'tool.set' && typeof payload?.toolId === 'string') return editor.setCurrentTool(payload.toolId)
  if (id.startsWith('style.opacity.')) {
    const opacity = Number(id.slice('style.opacity.'.length))
    if (editor.getSelectedShapeIds().length > 0) return editor.setOpacityForSelectedShapes(opacity)
    return editor.setOpacityForNextShapes(opacity)
  }
  if (id.startsWith('style.')) {
    const [, styleId, ...valueParts] = id.split('.')
    return setStyle(editor, styleId, valueParts.join('.'))
  }
  if (id.startsWith('arrange.align.')) return editor.alignShapes(selectedIds(editor), id.slice('arrange.align.'.length))
  if (id.startsWith('arrange.distribute.')) return editor.distributeShapes(selectedIds(editor), id.slice('arrange.distribute.'.length))

  switch (id) {
    case 'tool.select': return editor.setCurrentTool('select')
    case 'tool.hand': return editor.setCurrentTool('hand')
    case 'tool.draw': return editor.setCurrentTool('draw')
    case 'tool.eraser': return editor.setCurrentTool('eraser')
    case 'tool.arrow': return editor.setCurrentTool('arrow')
    case 'tool.text': return editor.setCurrentTool('text')
    case 'tool.note': return editor.setCurrentTool('note')
    case 'tool.media': return editor.setCurrentTool('asset')
    case 'tool.rectangle': return setGeoTool(editor, 'rectangle')
    case 'tool.ellipse': return setGeoTool(editor, 'ellipse')
    case 'tool.triangle': return setGeoTool(editor, 'triangle')
    case 'tool.diamond': return setGeoTool(editor, 'diamond')
    case 'tool.line': return editor.setCurrentTool('line')
    case 'tool.highlight': return editor.setCurrentTool('highlight')
    case 'action.group': return editor.groupShapes(selectedIds(editor))
    case 'action.ungroup': return editor.ungroupShapes(selectedIds(editor))
    case 'action.toggle-lock': return editor.toggleLock(selectedIds(editor))
    case 'arrange.bring-front': return editor.bringToFront(selectedIds(editor))
    case 'arrange.bring-forward': return editor.bringForward(selectedIds(editor))
    case 'arrange.send-backward': return editor.sendBackward(selectedIds(editor))
    case 'arrange.send-back': return editor.sendToBack(selectedIds(editor))
    case 'setting.focus-mode': return editor.updateInstanceState({ isFocusMode: !editor.getInstanceState().isFocusMode })
    case 'setting.tool-lock': return editor.updateInstanceState({ isToolLocked: !editor.getInstanceState().isToolLocked })
    case 'setting.grid': return editor.updateInstanceState({ isGridMode: !editor.getInstanceState().isGridMode })
    case 'setting.theme': return editor.setColorMode(editor.getColorMode() === 'dark' ? 'light' : 'dark')
    case 'view.zoom-in': return editor.zoomIn()
    case 'view.zoom-out': return editor.zoomOut()
    case 'view.zoom-fit': return editor.zoomToFit()
    case 'view.zoom-selection': return editor.zoomToSelection()
    case 'page.rename': {
      const page = editor.getCurrentPage()
      const name = window.prompt('Rename page', page?.name || '')
      if (name?.trim()) return editor.renamePage(page.id, name.trim())
      return
    }
    case 'export.png': return exportFile(editor, 'png')
    case 'export.svg': return exportFile(editor, 'svg')
    case 'export.json': return exportFile(editor, 'json')
    default: throw new Error(`Unknown command: ${id}`)
  }
}

function sendState(editor: any) {
  const styles: Record<string, string | null> = {}
  try {
    for (const [style, value] of editor.getSharedStyles()) {
      styles[style.id.replace('tldraw:', '')] = value.type === 'shared' ? value.value : null
    }
  } catch {
    // State requests can arrive before the editor initializes.
  }
  try {
    const opacity = editor.getSharedOpacity()
    styles.opacity = opacity.type === 'shared' ? String(opacity.value) : null
  } catch {
    // Opacity may not be available while the editor is initializing.
  }
  const instance = editor.getInstanceState()
  const state = {
    colorMode: editor.getColorMode(),
    instance: {
      isFocusMode: instance.isFocusMode,
      isGridMode: instance.isGridMode,
      isToolLocked: instance.isToolLocked,
    },
    pageName: editor.getCurrentPage()?.name,
    selectedCount: editor.getSelectedShapeIds().length,
    styles,
    toolId: editor.getCurrentToolId(),
  }
  document.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: JSON.stringify(state) }))
}

function withEditor(callback: (editor: any) => void, retries = MAX_EDITOR_RETRIES) {
  const editor = (window as any).editor
  if (editor) return callback(editor)
  if (retries > 0) window.setTimeout(() => withEditor(callback, retries - 1), 100)
  else console.warn('[tlfast] tldraw editor was not available')
}

document.addEventListener(REQUEST_STATE_EVENT, () => withEditor(sendState))

document.addEventListener(RUN_COMMAND_EVENT, (event) => {
  try {
    const { id, payload } = JSON.parse((event as CustomEvent<string>).detail)
    if (typeof id !== 'string') return
    withEditor((editor) => {
      Promise.resolve(executeCommand(editor, id, payload))
        .catch((error) => console.error('[tlfast] command failed:', id, error))
        .finally(() => sendState(editor))
    })
  } catch (error) {
    console.error('[tlfast] invalid command request', error)
  }
})
