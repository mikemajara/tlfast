export interface PresetPayload {
  toolId?: unknown
  styles?: unknown
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
