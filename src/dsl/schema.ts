export type SlideKind = 'title' | 'section' | 'content' | 'two-column' | 'image-full' | 'quote' | 'comparison' | 'chart' | 'math' | 'blank'

export type ThemePreset = 'default' | 'dark' | 'minimal' | 'gradient' | 'corporate'

export type TextStyle = {
  bold?: boolean
  italic?: boolean
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  color?: string
  align?: 'left' | 'center' | 'right'
}

export type TextBlock = {
  type: 'text'
  content: string
  style?: TextStyle
}

export type ListBlock = {
  type: 'bullets' | 'numbered'
  items: string[]
  style?: TextStyle
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area'

export type ChartBlock = {
  type: 'chart'
  chartType: ChartType
  title?: string
  labels: string[]
  datasets: {
    label: string
    values: number[]
    color?: string
  }[]
}

export type MathBlock = {
  type: 'math'
  expression: string
  inline?: boolean
}

export type ImageSource = {
  url: string
  alt?: string
  caption?: string
  width?: string
  height?: string
}

export type ImageBlock = {
  type: 'image'
  source: ImageSource
  fit?: 'contain' | 'cover' | 'fill'
}

export type SlideBlock = TextBlock | ListBlock | ChartBlock | MathBlock | ImageBlock

export type LayoutIssue = {
  type: 'overflow' | 'overlap' | 'missing_chart_data' | 'missing_image' | 'empty_content' | 'text_truncation' | 'color_contrast'
  severity: 'error' | 'warning' | 'info'
  message: string
  blockIndex?: number
}

export type Slide = {
  kind: SlideKind
  title?: string
  subtitle?: string
  blocks: SlideBlock[]
  background?: string
  notes?: string
  layoutIssues?: LayoutIssue[]
}

export type DeckMeta = {
  title: string
  author?: string
  date?: string
  theme: ThemePreset
  description?: string
}

export type DeckSpec = {
  meta: DeckMeta
  slides: Slide[]
}
