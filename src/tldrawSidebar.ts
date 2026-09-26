const SIDEBAR_SELECTOR = '[data-testid="tla-sidebar"]'
const TOGGLE_SELECTOR = '[data-testid="tla-sidebar-toggle"]'
const MOBILE_TOGGLE_SELECTOR = '[data-testid="tla-sidebar-toggle-mobile"]'

export interface SidebarRoot {
  querySelector(selector: string): { click(): void; getAttribute(name: string): string | null } | null
}

export function isSidebarOpen(root: SidebarRoot = document) {
  const sidebar = root.querySelector(SIDEBAR_SELECTOR)
  return sidebar ? sidebar.getAttribute('data-visible') === 'true' : undefined
}

export function toggleSidebar(
  root: SidebarRoot = document,
  dispatchShortcut: () => void = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: '\\',
      code: 'Backslash',
      ctrlKey: true,
      metaKey: true,
      bubbles: true,
    }))
  },
) {
  const toggle = root.querySelector(TOGGLE_SELECTOR) ?? root.querySelector(MOBILE_TOGGLE_SELECTOR)
  if (toggle) {
    toggle.click()
    return
  }
  // tldraw hides the button in focus mode; Cmd/Ctrl+\ still toggles and exits focus mode.
  dispatchShortcut()
}
