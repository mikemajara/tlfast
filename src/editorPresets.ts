export interface PresetPayload {
  toolId?: unknown
  styles?: unknown
}

const SHAPE_TOOL_IDS = new Set(['geo', 'draw', 'arrow', 'line', 'text', 'note', 'highlight'])

export function resolvePresetToolId(editor: any) {
  const currentToolId = editor.getCurrentToolId()
  const selectedIds = editor.getSelectedShapeIds()
  if (selectedIds.length === 0) return currentToolId

  const selectedTypes = selectedIds.map((id: string) => editor.getShape(id)?.type)
  const selectedType = selectedTypes[0]
  return selectedType && SHAPE_TOOL_IDS.has(selectedType) && selectedTypes.every((type: unknown) => type === selectedType)
    ? selectedType
    : currentToolId
}

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

export function applyPreset(editor: any, payload: PresetPayload | undefined) {
  if (typeof payload?.toolId !== 'string' || !payload.toolId) return []

  const toolId = payload.toolId
  const styles = payload.styles && typeof payload.styles === 'object'
    ? Object.entries(payload.styles)
    : []
  const skippedStyles: string[] = []

  editor.setCurrentTool(toolId)

  for (const [styleId, value] of styles) {
    if (typeof value !== 'string') {
      skippedStyles.push(styleId)
      continue
    }
    if (styleId === 'opacity') {
      const opacity = Number(value)
      if (Number.isFinite(opacity)) editor.setOpacityForNextShapes(opacity)
      else skippedStyles.push(styleId)
      continue
    }

    const style = getStyle(editor, styleId)
    if (style) editor.setStyleForNextShapes(style, value)
    else skippedStyles.push(styleId)
  }

  // Keep an unavailable style from leaving the editor on a fallback tool.
  editor.setCurrentTool(toolId)
  return skippedStyles
}
