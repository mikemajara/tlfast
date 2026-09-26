export type GeoShape =
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'star'
  | 'rhombus'
  | 'rhombus-2'
  | 'oval'
  | 'trapezoid'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'x-box'
  | 'check-box'
  | 'cloud'
  | 'heart'

export type PresetShape = GeoShape | 'draw' | 'arrow' | 'line' | 'text' | 'note' | 'highlight'

type Color = 'black' | 'grey' | 'light-violet' | 'violet' | 'blue' | 'light-blue' | 'yellow' | 'orange' | 'green' | 'light-green' | 'light-red' | 'red'
type Arrowhead = 'none' | 'arrow' | 'triangle' | 'dot' | 'pipe' | 'diamond' | 'inverted' | 'bar' | 'square'

export interface PresetCatalogEntry {
  id: string
  name: string
  description?: string
  iconSvg?: string
  shape?: PresetShape
  styles: {
    color?: Color
    labelColor?: Color
    fill?: 'none' | 'semi' | 'solid'
    dash?: 'draw' | 'dashed' | 'dotted' | 'solid'
    size?: 's' | 'm' | 'l' | 'xl'
    opacity?: '0.1' | '0.25' | '0.5' | '0.75' | '1'
    font?: 'draw' | 'sans' | 'serif' | 'mono'
    horizontalAlign?: 'start' | 'middle' | 'end'
    verticalAlign?: 'start' | 'middle' | 'end'
    textAlign?: 'start' | 'middle' | 'end'
    arrowKind?: 'arc' | 'elbow'
    arrowheadStart?: Arrowhead
    arrowheadEnd?: Arrowhead
  }
}

export const GEO_SHAPES: ReadonlySet<PresetShape> = new Set<GeoShape>([
  'rectangle', 'ellipse', 'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon',
  'star', 'rhombus', 'rhombus-2', 'oval', 'trapezoid', 'arrow-right', 'arrow-left',
  'arrow-up', 'arrow-down', 'x-box', 'check-box', 'cloud', 'heart',
])

export const presetCatalog = [
  {
    id: 'default-look',
    name: 'Default look',
    description: 'Semi fill, solid line, sans font',
    styles: {
      labelColor: 'black',
      color: 'black',
      fill: 'semi',
      dash: 'solid',
      size: 'm',
      font: 'sans',
      horizontalAlign: 'middle',
      verticalAlign: 'middle',
      opacity: '1',
    },
  },
  {
    id: 'directional-arrow',
    name: 'Directional arrow',
    description: 'Arrow for showing direction',
    shape: 'arrow',
    styles: {
      arrowKind: 'arc',
      labelColor: 'black',
      color: 'black',
      fill: 'none',
      dash: 'solid',
      size: 'm',
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      font: 'sans',
      opacity: '1',
    },
  },
  {
    id: 'annotation-arrow',
    name: 'Annotation arrow',
    description: 'Dashed arrow with a circle head',
    shape: 'arrow',
    styles: {
      arrowKind: 'arc',
      labelColor: 'black',
      color: 'black',
      fill: 'none',
      dash: 'dashed',
      size: 'm',
      arrowheadStart: 'none',
      arrowheadEnd: 'dot',
      font: 'sans',
      opacity: '1',
    },
  },
] satisfies PresetCatalogEntry[]
