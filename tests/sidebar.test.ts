import assert from 'node:assert/strict'
import test from 'node:test'
import { isSidebarOpen, toggleSidebar, type SidebarRoot } from '../src/tldrawSidebar.ts'

function root(elements: Record<string, { click?: () => void; attributes?: Record<string, string> }>): SidebarRoot {
  return {
    querySelector(selector) {
      const element = elements[selector]
      if (!element) return null
      return {
        click: element.click ?? (() => {}),
        getAttribute: (name) => element.attributes?.[name] ?? null,
      }
    },
  }
}

test('sidebar open state comes from tldraw’s data-visible flag', () => {
  assert.equal(isSidebarOpen(root({})), undefined)
  assert.equal(isSidebarOpen(root({ '[data-testid="tla-sidebar"]': { attributes: { 'data-visible': 'true' } } })), true)
  assert.equal(isSidebarOpen(root({ '[data-testid="tla-sidebar"]': { attributes: { 'data-visible': 'false' } } })), false)
})

test('toggle clicks the desktop sidebar button when it is present', () => {
  const clicks: string[] = []
  toggleSidebar(root({
    '[data-testid="tla-sidebar-toggle"]': { click: () => clicks.push('desktop') },
    '[data-testid="tla-sidebar-toggle-mobile"]': { click: () => clicks.push('mobile') },
  }), () => clicks.push('shortcut'))

  assert.deepEqual(clicks, ['desktop'])
})

test('toggle falls back to the sidebar shortcut when the button is hidden', () => {
  let shortcut = 0
  toggleSidebar(root({}), () => { shortcut += 1 })

  assert.equal(shortcut, 1)
})
