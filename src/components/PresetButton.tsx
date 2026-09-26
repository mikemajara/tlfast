import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { dispatchCommand, presetApplyRequest } from '../commandBus'
import { usePresets } from '../presets'

export function PresetButton() {
  const [toolbarSlot, setToolbarSlot] = useState<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ right: 0, bottom: 0 })
  const { presets } = usePresets()
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let currentSlot: HTMLElement | null = null

    const mountInToolbar = () => {
      const toolbar = document.querySelector('[data-testid="tools.select"]')?.closest('[role="toolbar"]')
      if (!toolbar) {
        if (currentSlot && !currentSlot.isConnected) {
          currentSlot = null
          setToolbarSlot(null)
        }
        return
      }

      const existingSlot = toolbar.querySelector<HTMLElement>(':scope > [data-tlfast-presets-slot]')
      if (existingSlot) {
        if (currentSlot !== existingSlot) {
          currentSlot = existingSlot
          setToolbarSlot(existingSlot)
        }
        return
      }

      const slot = document.createElement('div')
      slot.dataset.tlfastPresetsSlot = ''
      Object.assign(slot.style, slotStyle)

      const moreButton = toolbar.querySelector('[data-testid="tools.more"]')
      const moreContainer = moreButton
        ? Array.from(toolbar.children).find((child) => child.contains(moreButton))
        : null
      toolbar.insertBefore(slot, moreContainer ?? null)
      currentSlot = slot
      setToolbarSlot(slot)
    }

    mountInToolbar()
    const observer = new MutationObserver(mountInToolbar)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      currentSlot?.remove()
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [open])

  useLayoutEffect(() => {
    if (!open) return

    const positionMenu = () => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setMenuPosition({
        right: Math.max(8, window.innerWidth - rect.right),
        bottom: Math.max(8, window.innerHeight - rect.top + 8),
      })
    }

    positionMenu()
    window.addEventListener('resize', positionMenu)
    window.addEventListener('scroll', positionMenu, true)
    const resizeObserver = new ResizeObserver(positionMenu)
    if (containerRef.current) resizeObserver.observe(containerRef.current)

    return () => {
      window.removeEventListener('resize', positionMenu)
      window.removeEventListener('scroll', positionMenu, true)
      resizeObserver.disconnect()
    }
  }, [open])

  if (!toolbarSlot) return null

  return (
    <>
      {createPortal(
        <div ref={containerRef} style={containerStyle}>
          <button
            type="button"
            className="tlfast-preset-button"
            aria-label="Presets"
            aria-expanded={open}
            title="Presets"
            style={buttonStyle}
            onClick={() => setOpen((isOpen) => !isOpen)}
          >
            <span className="tlfast-preset-button__surface" style={buttonSurfaceStyle}>
              <SparkleIcon />
            </span>
          </button>
          <style>{buttonHoverStyles}</style>
        </div>,
        toolbarSlot
      )}
      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Presets"
          style={{ ...menuStyle, right: menuPosition.right, bottom: menuPosition.bottom }}
        >
          <div style={menuTitleStyle}>Presets</div>
          {presets.map((preset) => (
            <button
              key={preset.id}
              role="menuitem"
              style={menuItemStyle}
              onClick={() => {
                dispatchCommand(presetApplyRequest(preset))
                setOpen(false)
              }}
            >
              {preset.iconSvg && (
                <img
                  src={`data:image/svg+xml,${encodeURIComponent(preset.iconSvg)}`}
                  alt=""
                  width="24"
                  height="24"
                  style={presetIconStyle}
                />
              )}
              <span style={menuItemTextStyle}>
                <span>{preset.name}</span>
                {preset.description && <small style={descriptionStyle}>{preset.description}</small>}
              </span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    </svg>
  )
}

const containerStyle = {
  position: 'relative',
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const

const buttonStyle = {
  width: '48px',
  height: '48px',
  display: 'grid',
  placeItems: 'center',
  border: 'none',
  borderRadius: '0',
  background: 'transparent',
  color: 'var(--color-text-1, #222)',
  cursor: 'pointer',
  padding: '4px',
} as const

const buttonSurfaceStyle = {
  width: '40px',
  height: '40px',
  display: 'grid',
  placeItems: 'center',
  borderRadius: '10px',
  transition: 'background-color 80ms ease',
} as const

const buttonHoverStyles = `
  .tlfast-preset-button:hover .tlfast-preset-button__surface,
  .tlfast-preset-button[aria-expanded="true"] .tlfast-preset-button__surface {
    background: var(--color-muted-2, rgba(0, 0, 0, 0.06));
  }
`

const menuStyle = {
  position: 'fixed',
  zIndex: 99999,
  width: 'max-content',
  maxWidth: '260px',
  padding: '4px',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: '10px',
  background: '#fff',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
  fontFamily: 'system-ui, -apple-system, sans-serif',
} as const

const slotStyle = {
  width: '48px',
  height: '48px',
  flex: '0 0 48px',
} as const

const menuTitleStyle = {
  padding: '7px 10px 6px',
  color: '#777',
  fontSize: '12px',
  fontWeight: 600,
} as const

const menuItemStyle = {
  width: '100%',
  padding: '7px 8px',
  border: 'none',
  borderRadius: '6px',
  background: 'transparent',
  color: '#222',
  cursor: 'pointer',
  fontSize: '13px',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
} as const

const presetIconStyle = {
  flex: '0 0 auto',
  objectFit: 'contain',
} as const

const menuItemTextStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1px',
} as const

const descriptionStyle = {
  color: '#777',
  fontSize: '11px',
  fontWeight: 400,
  whiteSpace: 'nowrap',
} as const
