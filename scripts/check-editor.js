// Paste this into browser console on tldraw.com to inspect the editor API
// and discover available style constants

const checkEditor = () => {
  if (typeof window === 'undefined') {
    console.log('Run this in browser console on tldraw.com')
    return
  }

  const editor = window.editor
  if (!editor) {
    console.log('❌ window.editor NOT found')
    console.log('Window keys matching editor:',
      Object.keys(window).filter(k => k.toLowerCase().includes('editor')))
    return
  }

  console.log('✅ window.editor found')

  // Check basic methods
  const methods = [
    'setCurrentTool', 'getSelectedShapeIds', 'undo', 'redo',
    'updateInstanceState', 'setStyleForNextShapes', 'setStyleForSelectedShapes',
    'getSharedStyles', 'createShape', 'updateShape', 'deleteShapes',
    'duplicateShapes', 'groupShapes', 'ungroupShapes'
  ]
  console.log('\n--- Editor Methods ---')
  methods.forEach(m => {
    console.log(editor[m] ? `✅ ${m}` : `❌ ${m}`)
  })

  // Try to find style constants on window or editor
  console.log('\n--- Style Constants ---')
  const styleKeys = Object.keys(window).filter(k =>
    k.includes('Style') && !k.includes('React')
  )
  console.log('Window style keys:', styleKeys)

  // Check editor for style-related properties
  const editorStyleKeys = Object.keys(editor).filter(k =>
    k.toLowerCase().includes('style') || k.toLowerCase().includes('geo')
  )
  console.log('Editor style/geo keys:', editorStyleKeys)

  // Try to get shared styles to see what style objects exist
  try {
    const sharedStyles = editor.getSharedStyles()
    console.log('\n--- Shared Styles ---')
    console.log(sharedStyles)

    // If it's a map, iterate
    if (sharedStyles && typeof sharedStyles.forEach === 'function') {
      sharedStyles.forEach((value, key) => {
        console.log(`Style: ${key.id || key} = ${value}`)
      })
    }
  } catch (e) {
    console.log('getSharedStyles() failed:', e.message)
  }

  // Check for tldraw global
  console.log('\n--- Tldraw Global ---')
  console.log('window.tldraw:', window.tldraw || 'not found')

  // Check for style constants on any global
  const allStyleObjects = []
  for (const key of Object.keys(window)) {
    const obj = window[key]
    if (obj && typeof obj === 'object' && obj.id && obj.type && obj.type === 'style') {
      allStyleObjects.push({ key, style: obj })
    }
  }
  console.log('Found style objects on window:', allStyleObjects.map(s => s.key))

  // Try to find GeoShapeGeoStyle specifically
  if (window.GeoShapeGeoStyle) {
    console.log('✅ GeoShapeGeoStyle found on window:', window.GeoShapeGeoStyle)
  }
  if (window.DefaultColorStyle) {
    console.log('✅ DefaultColorStyle found on window:', window.DefaultColorStyle)
  }

  // Check editor.store for schema
  if (editor.store && editor.store.schema) {
    console.log('\n--- Store Schema ---')
    console.log('Schema keys:', Object.keys(editor.store.schema || {}))
  }
}

checkEditor()
