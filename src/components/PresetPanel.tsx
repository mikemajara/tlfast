import { useEffect, useState } from 'react'
import { dispatchCommand, presetApplyRequest } from '../commandBus'
import type { PaletteState } from '../commands'
import { Preset, currentPresetStyles, usePresets } from '../presets'

const REQUEST_STATE_EVENT = 'tlfast:request-state'
const STATE_EVENT = 'tlfast:state'
const TOOL_OPTIONS = [['select', 'Select'], ['geo', 'Shape'], ['draw', 'Draw'], ['arrow', 'Arrow'], ['line', 'Line'], ['text', 'Text'], ['note', 'Note'], ['highlight', 'Highlight']] as const

export function PresetPanel() {
  const { presets, update } = usePresets()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [state, setState] = useState<PaletteState>({ selectedCount: 0, styles: {} })
  const [editing, setEditing] = useState<string | null>(null)
  const [toolId, setToolId] = useState('geo')
  const [anchor, setAnchor] = useState({ left: 16, top: 16 })

  useEffect(() => {
    const onState = (event: Event) => {
      const next = JSON.parse((event as CustomEvent<string>).detail) as PaletteState
      setState(next)
      if (!editing && next.toolId) setToolId(next.toolId)
    }
    document.addEventListener(STATE_EVENT, onState)
    return () => document.removeEventListener(STATE_EVENT, onState)
  }, [editing])
  useEffect(() => { if (open) document.dispatchEvent(new CustomEvent(REQUEST_STATE_EVENT)) }, [open])
  useEffect(() => {
    let toolbar: HTMLElement | null = null
    let resizeObserver: ResizeObserver | null = null
    const updateAnchor = () => {
      if (!toolbar) return
      const rect = toolbar.getBoundingClientRect()
      setAnchor({ left: rect.right + 12, top: rect.top + Math.max(0, (rect.height - 44) / 2) })
    }
    const attach = () => {
      toolbar = document.querySelector('[role="toolbar"][aria-label="Tools"]') as HTMLElement | null
      if (!toolbar) return
      updateAnchor()
      resizeObserver = new ResizeObserver(updateAnchor)
      resizeObserver.observe(toolbar)
      mutationObserver.disconnect()
    }
    const mutationObserver = new MutationObserver(attach)
    mutationObserver.observe(document.documentElement, { childList: true, subtree: true })
    attach()
    window.addEventListener('resize', updateAnchor)
    return () => { mutationObserver.disconnect(); resizeObserver?.disconnect(); window.removeEventListener('resize', updateAnchor) }
  }, [])

  const apply = (preset: Preset) => dispatchCommand(presetApplyRequest(preset))
  const selectTool = (nextToolId: string) => {
    setToolId(nextToolId)
    dispatchCommand({ id: 'tool.set', payload: { toolId: nextToolId } })
  }
  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed || state.toolId !== toolId) return
    const styles = currentPresetStyles(state.styles)
    if (editing) await update(presets.map((preset) => preset.id === editing ? { ...preset, name: trimmed, toolId, styles } : preset))
    else await update([...presets, { id: crypto.randomUUID(), name: trimmed, toolId, styles }])
    setName(''); setEditing(null); setToolId(state.toolId || 'geo')
  }
  const startEdit = (preset: Preset) => {
    setEditing(preset.id)
    setName(preset.name)
    setToolId(preset.toolId)
    apply(preset)
  }

  return <>
    {open && <div style={{ ...panelStyle, left: anchor.left, top: anchor.top }}>
      <div style={headerStyle}><strong>Custom tools</strong><button style={iconButtonStyle} onClick={() => setOpen(false)}>×</button></div>
      <div style={saveRowStyle}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder={editing ? 'Preset name' : 'New preset name'} style={inputStyle} />
      </div>
      <div style={saveRowStyle}><select value={toolId} onChange={(event) => selectTool(event.target.value)} style={inputStyle}>{TOOL_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><button disabled={state.toolId !== toolId} style={{ ...primaryButtonStyle, ...(state.toolId !== toolId ? disabledButtonStyle : {}) }} onClick={save}>{editing ? 'Update' : 'Save tool'}</button></div>
      <small style={hintStyle}>{editing ? 'Updates this tool with the current styles.' : 'Captures the selected tool and its current styles.'}</small>
      <div style={listStyle}>{presets.length === 0 ? <div style={emptyStyle}>No saved presets yet.</div> : presets.map((preset) => <PresetRow key={preset.id} preset={preset} onApply={apply} onEdit={startEdit} onDelete={() => update(presets.filter((item) => item.id !== preset.id))} />)}</div>
    </div>}
    <button style={{ ...triggerStyle, left: anchor.left, top: anchor.top }} onClick={() => setOpen((value) => !value)}>▦ Presets</button>
  </>
}

function PresetRow({ preset, onApply, onEdit, onDelete }: { preset: Preset; onApply: (preset: Preset) => void; onEdit: (preset: Preset) => void; onDelete: () => void }) {
  return <div style={presetRowStyle}><button style={presetNameStyle} onClick={() => onApply(preset)}><span style={{ ...swatchStyle, backgroundColor: preset.styles.color || '#888' }} />{preset.name}<small style={toolLabelStyle}>{preset.toolId}</small></button><span><button style={smallButtonStyle} onClick={() => onEdit(preset)}>Edit</button><button style={smallButtonStyle} onClick={onDelete}>Delete</button></span></div>
}

const panelStyle = { position: 'fixed', zIndex: 99998, transform: 'translateY(calc(-100% - 10px))', width: '320px', padding: '16px', backgroundColor: '#fff', border: '1px solid #d7d7d7', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,.16)', color: '#292929', fontFamily: 'inherit' } as const
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' } as const
const iconButtonStyle = { border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '22px', lineHeight: 1 } as const
const saveRowStyle = { display: 'flex', gap: '8px', marginTop: '8px' } as const
const inputStyle = { minWidth: 0, flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px' } as const
const primaryButtonStyle = { border: 'none', backgroundColor: '#333', color: '#fff', borderRadius: '6px', padding: '8px 10px', cursor: 'pointer' } as const
const disabledButtonStyle = { cursor: 'wait', opacity: 0.55 } as const
const hintStyle = { display: 'block', color: '#777', margin: '8px 0' } as const
const listStyle = { maxHeight: '240px', overflow: 'auto' } as const
const emptyStyle = { color: '#777', padding: '12px 0' } as const
const presetRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid #eee' } as const
const presetNameStyle = { display: 'flex', alignItems: 'center', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: 0, fontSize: '14px' } as const
const swatchStyle = { display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', marginRight: '7px', border: '1px solid rgba(0,0,0,.15)' } as const
const toolLabelStyle = { color: '#777', marginLeft: '6px' } as const
const smallButtonStyle = { border: 'none', backgroundColor: 'transparent', color: '#666', cursor: 'pointer', fontSize: '12px', padding: '3px' } as const
const triggerStyle = { position: 'fixed', zIndex: 99998, height: '44px', border: '1px solid #d7d7d7', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.12)', color: '#333', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, padding: '0 14px' } as const
