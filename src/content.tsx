import { createRoot } from 'react-dom/client'
import { CommandPalette } from './components/CommandPalette'
import { PresetButton } from './components/PresetButton'

const APP_ID = 'tlfast-root'

function mount() {
  if (document.getElementById(APP_ID)) return

  const rootEl = document.createElement('div')
  rootEl.id = APP_ID
  document.body.appendChild(rootEl)

  const root = createRoot(rootEl)
  root.render(
    <>
      <CommandPalette />
      <PresetButton />
    </>
  )
}

if (document.body) {
  mount()
} else {
  document.addEventListener('DOMContentLoaded', mount, { once: true })
}
