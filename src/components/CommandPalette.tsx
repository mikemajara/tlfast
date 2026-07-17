import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { dispatchCommand } from '../commandBus'
import { Command, CommandGroup, GROUPS, PaletteState, fuzzySearch, getCommands, recordCommandUse } from '../commands'
import { usePresets } from '../presets'

const REQUEST_STATE_EVENT = 'tlfast:request-state'
const STATE_EVENT = 'tlfast:state'

const EMPTY_STATE: PaletteState = { selectedCount: 0, styles: {} }

function getVisibleCommands(commands: Command[], group: CommandGroup | null, query: string) {
  if (query.trim()) return fuzzySearch(commands, query)
  return group ? commands.filter((command) => command.group === group) : []
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [group, setGroup] = useState<CommandGroup | null>(null)
  const [paletteState, setPaletteState] = useState<PaletteState>(EMPTY_STATE)
  const { presets } = usePresets()
  const inputRef = useRef<HTMLInputElement>(null)
  const commands = useMemo(() => getCommands(paletteState, presets), [paletteState, presets])
  const visibleCommands = useMemo(() => getVisibleCommands(commands, group, query), [commands, group, query])

  const requestState = useCallback(() => {
    document.dispatchEvent(new CustomEvent(REQUEST_STATE_EVENT))
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setGroup(null)
    setSelected(0)
  }, [])

  const runCommand = useCallback((command: Command) => {
    recordCommandUse(command.id)
    dispatchCommand({ id: command.id, payload: command.payload })
    close()
  }, [close])

  const openGroup = useCallback((nextGroup: CommandGroup) => {
    setGroup(nextGroup)
    setQuery('')
    setSelected(0)
  }, [])

  const selectCommand = useCallback((command: Command) => {
    if (!command.disabled) runCommand(command)
  }, [runCommand])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      if (!e.repeat) {
        setOpen((wasOpen) => {
          if (!wasOpen) requestState()
          return !wasOpen
        })
      }
      return
    }
    if (!open) return

    if (e.key === 'Escape') {
      e.preventDefault()
      if (query) setQuery('')
      else if (group) setGroup(null)
      else close()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const itemCount = query.trim() || group ? visibleCommands.length : GROUPS.length
      setSelected((index) => Math.min(index + 1, Math.max(0, itemCount - 1)))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((index) => Math.max(index - 1, 0))
      return
    }
    if (e.key === 'ArrowLeft' && !query && group) {
      e.preventDefault()
      setGroup(null)
      setSelected(0)
      return
    }
    if (e.key === 'Enter' || (e.key === 'ArrowRight' && !query && !group)) {
      e.preventDefault()
      if (!query && !group) {
        const nextGroup = GROUPS[selected]
        if (nextGroup) openGroup(nextGroup.id)
      } else {
        const command = visibleCommands[selected]
        if (command) selectCommand(command)
      }
    }
  }, [close, group, open, openGroup, query, requestState, selectCommand, selected, visibleCommands])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [handleKeyDown])

  useEffect(() => {
    const onState = (event: Event) => {
      try {
        setPaletteState(JSON.parse((event as CustomEvent<string>).detail))
      } catch {
        console.warn('[tlfast] could not read editor state')
      }
    }
    document.addEventListener(STATE_EVENT, onState)
    return () => document.removeEventListener(STATE_EVENT, onState)
  }, [])

  useEffect(() => {
    if (!open) return
    requestState()
    const interval = window.setInterval(requestState, 300)
    return () => window.clearInterval(interval)
  }, [open, requestState])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => setSelected(0), [query, group])

  if (!open) return null

  const showingCommands = query.trim() || group
  const activeGroup = GROUPS.find((item) => item.id === group)
  const items = showingCommands ? visibleCommands : GROUPS

  return (
    <div style={overlayStyle} onClick={close}>
      <div style={paletteStyle} onClick={(event) => event.stopPropagation()}>
        <div style={searchRowStyle}>
          {group && <button style={backButtonStyle} onClick={() => setGroup(null)} aria-label="Back">‹</button>}
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={activeGroup ? `Search ${activeGroup.label.toLowerCase()}…` : 'Search commands…'}
            style={inputStyle}
          />
          {activeGroup && <span style={breadcrumbStyle}>{activeGroup.label}</span>}
        </div>
        <div style={listStyle}>
          {items.length === 0 && <div style={emptyStyle}>No commands found</div>}
          {showingCommands
            ? visibleCommands.map((command, index) => <CommandRow key={command.id} command={command} selected={index === selected} onClick={selectCommand} />)
            : GROUPS.map((item, index) => <GroupRow key={item.id} label={item.label} description={item.description} selected={index === selected} onClick={() => openGroup(item.id)} />)}
        </div>
        <div style={footerStyle}>{showingCommands ? '↵ Run  ·  ← Back' : '↵ Open  ·  Type to search everything'}</div>
      </div>
    </div>
  )
}

function GroupRow({ label, description, selected, onClick }: { label: string; description: string; selected: boolean; onClick: () => void }) {
  return <button style={{ ...rowStyle, ...(selected ? selectedRowStyle : {}) }} onClick={onClick}>
    <span><strong>{label}</strong><small style={descriptionStyle}>{description}</small></span><span style={chevronStyle}>›</span>
  </button>
}

function CommandRow({ command, selected, onClick }: { command: Command; selected: boolean; onClick: (command: Command) => void }) {
  return <button disabled={command.disabled} style={{ ...rowStyle, ...(selected && !command.disabled ? selectedRowStyle : {}), ...(command.disabled ? disabledRowStyle : {}) }} onClick={() => onClick(command)}>
    <span>{command.label}</span><span style={valueStyle}>{command.disabled ? 'Select shapes first' : command.value}</span>
  </button>
}

const overlayStyle = { position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '120px', backgroundColor: 'rgba(0,0,0,0.3)' } as const
const paletteStyle = { width: '620px', maxWidth: '90vw', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' } as const
const searchRowStyle = { display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee' } as const
const inputStyle = { width: '100%', padding: '16px 12px', border: 'none', outline: 'none', fontSize: '16px', boxSizing: 'border-box' } as const
const backButtonStyle = { border: 'none', background: 'transparent', fontSize: '28px', padding: '8px 4px 8px 16px', cursor: 'pointer', color: '#555' } as const
const breadcrumbStyle = { whiteSpace: 'nowrap', color: '#777', fontSize: '13px', paddingRight: '16px' } as const
const listStyle = { maxHeight: '420px', overflow: 'auto', padding: '6px' } as const
const rowStyle = { width: '100%', border: 'none', borderRadius: '8px', backgroundColor: 'transparent', padding: '12px 14px', cursor: 'pointer', display: 'flex', textAlign: 'left', justifyContent: 'space-between', alignItems: 'center', color: '#292929', fontSize: '14px' } as const
const selectedRowStyle = { backgroundColor: '#f0f0f0' } as const
const disabledRowStyle = { color: '#aaa', cursor: 'not-allowed' } as const
const descriptionStyle = { display: 'block', color: '#777', fontSize: '12px', marginTop: '3px', fontWeight: 'normal' } as const
const chevronStyle = { color: '#777', fontSize: '22px' } as const
const valueStyle = { color: '#777', fontSize: '12px', marginLeft: '16px', whiteSpace: 'nowrap' } as const
const emptyStyle = { padding: '20px', color: '#999', textAlign: 'center' } as const
const footerStyle = { color: '#888', fontSize: '12px', padding: '10px 16px', borderTop: '1px solid #eee' } as const
