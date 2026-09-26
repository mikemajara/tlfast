import type { Preset } from '../presets'
import { presetApplyRequest } from '../commandBus'

export type CommandGroup = 'tools' | 'style' | 'text' | 'arrange' | 'view' | 'presets' | 'export'

export interface PaletteState {
  colorMode?: string
  instance?: {
    isFocusMode?: boolean
    isGridMode?: boolean
    isToolLocked?: boolean
  }
  pageName?: string
  presetToolId?: string
  sidebarOpen?: boolean
  toolId?: string
  selectedCount: number
  styles: Record<string, string | null>
}

export interface Command {
  disabled?: boolean
  group: CommandGroup
  id: string
  keywords?: string
  label: string
  payload?: unknown
  value?: string
}

const recentCommands = new Map<string, number>()

export function recordCommandUse(id: string) {
  recentCommands.set(id, Date.now())
}

export const GROUPS: Array<{ id: CommandGroup; label: string; description: string }> = [
  { id: 'tools', label: 'Tools', description: 'Draw, select, create, and edit' },
  { id: 'style', label: 'Style', description: 'Color, fill, line, size, and opacity' },
  { id: 'text', label: 'Text', description: 'Font and text alignment' },
  { id: 'arrange', label: 'Arrange', description: 'Align, distribute, stack, and lock' },
  { id: 'view', label: 'View & settings', description: 'Focus, theme, grid, sidebar, and tool lock' },
  { id: 'presets', label: 'Presets', description: 'Apply saved style combinations' },
  { id: 'export', label: 'File, page & export', description: 'Create, rename, and download' },
]

const COLORS = [
  ['black', 'Black'], ['grey', 'Grey'], ['light-violet', 'Light violet'], ['violet', 'Violet'],
  ['blue', 'Blue'], ['light-blue', 'Light blue'], ['yellow', 'Yellow'], ['orange', 'Orange'],
  ['green', 'Green'], ['light-green', 'Light green'], ['light-red', 'Light red'], ['red', 'Red'],
]

const STYLE_OPTIONS = [
  ['fill', 'Fill', [['none', 'None'], ['semi', 'Semi'], ['solid', 'Solid']]],
  ['dash', 'Line style', [['draw', 'Draw'], ['dashed', 'Dashed'], ['dotted', 'Dotted'], ['solid', 'Solid']]],
  ['size', 'Size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large'], ['xl', 'Extra large']]],
  ['opacity', 'Opacity', [['0.1', '10%'], ['0.25', '25%'], ['0.5', '50%'], ['0.75', '75%'], ['1', '100%']]],
] as const

function command(group: CommandGroup, id: string, label: string, options: Omit<Command, 'group' | 'id' | 'label'> = {}): Command {
  return { group, id, label, ...options }
}

function styleCommands(state: PaletteState): Command[] {
  const commands = COLORS.map(([id, label]) => command(
    'style', `style.color.${id}`, `Color: ${label}`,
    { keywords: `color ${label}`, value: state.styles.color === id ? '✓' : undefined }
  ))

  for (const [style, label, values] of STYLE_OPTIONS) {
    for (const [id, value] of values) {
      commands.push(command(
        'style', `style.${style}.${id}`, `${label}: ${value}`,
        { keywords: `${style} ${value}`, value: state.styles[style] === id ? '✓' : undefined }
      ))
    }
  }
  return commands
}

function textCommands(state: PaletteState): Command[] {
  const fonts = [['draw', 'Draw'], ['sans', 'Sans'], ['serif', 'Serif'], ['mono', 'Mono']]
  const horizontal = [['start', 'Left'], ['middle', 'Center'], ['end', 'Right']]
  const vertical = [['start', 'Top'], ['middle', 'Middle'], ['end', 'Bottom']]
  return [
    ...fonts.map(([id, label]) => command('text', `style.font.${id}`, `Font: ${label}`, { value: state.styles.font === id ? '✓' : undefined })),
    ...horizontal.map(([id, label]) => command('text', `style.horizontalAlign.${id}`, `Horizontal align: ${label}`, { value: state.styles.horizontalAlign === id ? '✓' : undefined })),
    ...vertical.map(([id, label]) => command('text', `style.verticalAlign.${id}`, `Vertical align: ${label}`, { value: state.styles.verticalAlign === id ? '✓' : undefined })),
  ]
}

export function getCommands(state: PaletteState, presets: Preset[] = []): Command[] {
  const needsSelection = state.selectedCount === 0
  const needsMultiple = state.selectedCount < 2

  return [
    command('tools', 'tool.select', 'Select', { keywords: 'pointer cursor' }),
    command('tools', 'tool.hand', 'Hand', { keywords: 'pan move canvas' }),
    command('tools', 'tool.draw', 'Draw'),
    command('tools', 'tool.eraser', 'Eraser'),
    command('tools', 'tool.arrow', 'Arrow'),
    command('tools', 'tool.text', 'Text'),
    command('tools', 'tool.note', 'Note'),
    command('tools', 'tool.media', 'Media', { keywords: 'image video upload' }),
    command('tools', 'tool.rectangle', 'Rectangle'),
    command('tools', 'tool.ellipse', 'Ellipse'),
    command('tools', 'tool.triangle', 'Triangle'),
    command('tools', 'tool.diamond', 'Diamond'),
    command('tools', 'tool.line', 'Line'),
    command('tools', 'tool.highlight', 'Highlight'),

    ...styleCommands(state),
    ...textCommands(state),

    command('arrange', 'action.group', 'Group', { disabled: needsSelection }),
    command('arrange', 'action.ungroup', 'Ungroup', { disabled: needsSelection }),
    command('arrange', 'action.toggle-lock', 'Toggle locked', { disabled: needsSelection }),
    command('arrange', 'arrange.align.left', 'Align: Left', { disabled: needsMultiple }),
    command('arrange', 'arrange.align.center-horizontal', 'Align: Center horizontally', { disabled: needsMultiple }),
    command('arrange', 'arrange.align.right', 'Align: Right', { disabled: needsMultiple }),
    command('arrange', 'arrange.align.top', 'Align: Top', { disabled: needsMultiple }),
    command('arrange', 'arrange.align.center-vertical', 'Align: Center vertically', { disabled: needsMultiple }),
    command('arrange', 'arrange.align.bottom', 'Align: Bottom', { disabled: needsMultiple }),
    command('arrange', 'arrange.distribute.horizontal', 'Distribute: Horizontally', { disabled: state.selectedCount < 3 }),
    command('arrange', 'arrange.distribute.vertical', 'Distribute: Vertically', { disabled: state.selectedCount < 3 }),
    command('arrange', 'arrange.bring-front', 'Bring to front', { disabled: needsSelection }),
    command('arrange', 'arrange.bring-forward', 'Bring forward', { disabled: needsSelection }),
    command('arrange', 'arrange.send-backward', 'Send backward', { disabled: needsSelection }),
    command('arrange', 'arrange.send-back', 'Send to back', { disabled: needsSelection }),

    command('view', 'setting.focus-mode', 'Focus mode', { value: state.instance?.isFocusMode ? 'On ✓' : 'Off' }),
    command('view', 'setting.tool-lock', 'Tool lock', { value: state.instance?.isToolLocked ? 'On ✓' : 'Off' }),
    command('view', 'setting.grid', 'Show grid', { value: state.instance?.isGridMode ? 'On ✓' : 'Off' }),
    command('view', 'setting.theme', 'Toggle theme', { value: state.colorMode === 'dark' ? 'Dark ✓' : 'Light' }),
    command('view', 'view.toggle-sidebar', 'Toggle sidebar', {
      keywords: 'files panel navigator menu',
      value: state.sidebarOpen == null ? undefined : state.sidebarOpen ? 'Open ✓' : 'Closed',
    }),
    command('view', 'view.zoom-in', 'Zoom in'),
    command('view', 'view.zoom-out', 'Zoom out'),
    command('view', 'view.zoom-fit', 'Zoom to fit'),
    command('view', 'view.zoom-selection', 'Zoom to selection', { disabled: needsSelection }),

    ...presets.map((preset) => {
      const request = presetApplyRequest(preset)
      return command('presets', request.id, `Preset: ${preset.name}`, { keywords: `preset ${preset.name}`, payload: request.payload })
    }),

    command('export', 'file.new', 'New file', { keywords: 'create document canvas' }),
    command('export', 'page.new', 'New page', { keywords: 'create add' }),
    command('export', 'page.rename', `Rename page${state.pageName ? `: ${state.pageName}` : ''}`),
    command('export', 'export.png', 'Download PNG'),
    command('export', 'export.svg', 'Download SVG'),
    command('export', 'export.json', 'Download tldraw snapshot'),
  ]
}

export function fuzzySearch(commands: Command[], query: string): Command[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return commands

  return commands
    .map((command) => ({ command, score: scoreCommand(command, terms) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || (recentCommands.get(b.command.id) ?? 0) - (recentCommands.get(a.command.id) ?? 0) || a.command.label.localeCompare(b.command.label))
    .map((result) => result.command)
}

function scoreCommand(command: Command, terms: string[]) {
  const label = command.label.toLowerCase()
  const keywords = (command.keywords ?? '').toLowerCase()
  const id = command.id.toLowerCase()
  const words = label.split(/[^a-z0-9]+/).filter(Boolean)
  let score = 0

  for (const term of terms) {
    if (label === term) score += 1_000
    else if (words.includes(term)) score += 850
    else if (words.some((word) => word.startsWith(term))) score += 700
    else if (label.includes(term)) score += 550
    else if (keywords.split(/\s+/).some((word) => word.startsWith(term))) score += 350
    else if (id.includes(term)) score += 200
    else return 0
  }

  return score
}
