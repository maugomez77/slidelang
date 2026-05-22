import { DeckSpec, LayoutIssue, Slide, SlideBlock } from '../dsl/schema'

const MAX_BLOCKS_PER_SLIDE = 8
const MAX_LIST_ITEMS = 15
const MAX_CHART_LABELS = 20

// ── WCAG Contrast Ratio (AA = 4.5:1 normal, 3:1 large) ──

const THEME_BG: Record<string, string> = {
  noir: '#08080f', warm: '#1c1410', crimson: '#1a0a0c', navy: '#0a1128', neon: '#0d0d0d',
  air: '#fafaf9', bold: '#ffffff', sage: '#f7faf5',
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return null
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

function relativeLuminance(r: number, g: number, b: number): number {
  const linearize = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1), rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 21
  const l1 = relativeLuminance(...rgb1), l2 = relativeLuminance(...rgb2)
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function validateDeck(spec: DeckSpec): LayoutIssue[] {
  const bg = THEME_BG[spec.meta.theme] || '#08080f'
  return spec.slides.flatMap((slide, i) => validateSlide(slide, i, bg))
}

export function validateSlide(slide: Slide, slideIndex: number, bg: string): LayoutIssue[] {
  const issues: LayoutIssue[] = []

  if (slide.blocks.length === 0) {
    issues.push({
      type: 'empty_content',
      severity: 'warning',
      message: `Slide "${slide.title || slideIndex + 1}" has no content blocks`,
    })
  }

  if (slide.blocks.length > MAX_BLOCKS_PER_SLIDE) {
    issues.push({
      type: 'overflow',
      severity: 'warning',
      message: `Slide "${slide.title || slideIndex + 1}" has ${slide.blocks.length} blocks (max ${MAX_BLOCKS_PER_SLIDE})`,
    })
  }

  slide.blocks.forEach((block, bi) => {
    const blockIssues = validateBlock(block, slideIndex, bi, bg)
    issues.push(...blockIssues)
  })

  const positioned = slide.blocks.filter(b => b.position)
  for (let i = 0; i < positioned.length; i++) {
    for (let j = i + 1; j < positioned.length; j++) {
      const a = positioned[i].position!
      const b = positioned[j].position!
      if (a.x < b.x + (b.width || 20) && a.x + (a.width || 20) > b.x &&
          a.y < b.y + (b.height || 20) && a.y + (a.height || 20) > b.y) {
        issues.push({
          type: 'overlap',
          severity: 'warning',
          message: `Block ${i + 1} overlaps with block ${j + 1}`,
        })
      }
    }
  }

  // Check KPI slides for content overflow risk
  if (slide.kind === 'kpi') {
    const vals = slide.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'xlarge')
    if (vals.length > 4) {
      issues.push({
        type: 'overflow',
        severity: 'warning',
        message: `KPI slide has ${vals.length} stat cards — cards may overflow or wrap on narrow slides`,
      })
    }
    vals.forEach((b, bi) => {
      if ((b as any).content.length > 7) {
        issues.push({
          type: 'text_truncation',
          severity: 'warning',
          message: `KPI value "${(b as any).content}" is too long for card width — consider abbreviating`,
          blockIndex: bi,
        })
      }
    })
  }

  if (slide.background && slide.blocks.some(b => b.type === 'text')) {
    issues.push({
      type: 'color_contrast',
      severity: 'info',
      message: `Slide "${slide.title || slideIndex + 1}" has custom background — ensure text is readable`,
      blockIndex: 0,
    })
  }

  return issues
}

function validateBlock(block: SlideBlock, slideIndex: number, blockIndex: number, bg: string): LayoutIssue[] {
  const issues: LayoutIssue[] = []

  if (block.position) {
    const p = block.position
    const maxDim = p.unit === 'px' ? 1200 : 100
    if (p.x < 0 || p.y < 0) {
      issues.push({ type: 'out_of_bounds', severity: 'warning', message: 'Block position has negative coordinates', blockIndex })
    }
    if (p.width && (p.x + p.width > maxDim)) {
      issues.push({ type: 'out_of_bounds', severity: 'warning', message: 'Block extends beyond slide edge horizontally', blockIndex })
    }
  }

  switch (block.type) {
    case 'text':
      if (!block.content.trim()) {
        issues.push({ type: 'empty_content', severity: 'warning', message: 'Text block is empty', blockIndex })
      } else if (block.content.length > 500) {
        issues.push({ type: 'text_truncation', severity: 'warning', message: 'Text block exceeds 500 chars, may overflow slide', blockIndex })
      }
      // WCAG contrast check
      if (block.style?.color && bg) {
        const cr = contrastRatio(block.style.color, bg)
        const isLarge = block.style.size === 'xlarge' || block.style.size === 'large'
        const threshold = isLarge ? 3.0 : 4.5
        if (cr < threshold) {
          issues.push({
            type: 'color_contrast',
            severity: cr < 2.5 ? 'error' : 'warning',
            message: `Text color #${block.style.color.replace('#','')} has low contrast (${cr.toFixed(1)}:1) against background — need ${threshold}:1`,
            blockIndex,
          })
        }
      }
      break

    case 'bullets':
    case 'numbered':
      if (block.items.length === 0) {
        issues.push({ type: 'empty_content', severity: 'warning', message: 'List has no items', blockIndex })
      } else if (block.items.length > MAX_LIST_ITEMS) {
        issues.push({ type: 'overflow', severity: 'warning', message: `List has ${block.items.length} items (max ${MAX_LIST_ITEMS})`, blockIndex })
      }
      block.items.forEach((item, ii) => {
        if (item.length > 200) {
          issues.push({ type: 'text_truncation', severity: 'info', message: `List item ${ii + 1} is very long`, blockIndex })
        }
      })
      break

    case 'chart':
      if (block.labels.length === 0 || block.datasets.some(d => d.values.length === 0)) {
        issues.push({ type: 'missing_chart_data', severity: 'error', message: 'Chart is missing data', blockIndex })
      }
      if (block.labels.length > MAX_CHART_LABELS) {
        issues.push({ type: 'overflow', severity: 'warning', message: `Chart has ${block.labels.length} labels (max ${MAX_CHART_LABELS})`, blockIndex })
      }
      break

    case 'math':
      if (!block.expression.trim()) {
        issues.push({ type: 'empty_content', severity: 'warning', message: 'Math expression is empty', blockIndex })
      }
      break

    case 'image':
      if (!block.source.url) {
        issues.push({ type: 'missing_image', severity: 'error', message: 'Image has no URL', blockIndex })
      }
      if (block.source.url && !block.source.url.startsWith('http') && !block.source.url.startsWith('data:')) {
        issues.push({ type: 'missing_image', severity: 'warning', message: 'Image URL may not be accessible', blockIndex })
      }
      break
  }

  return issues
}

export function repairDeck(spec: DeckSpec): { spec: DeckSpec; repairs: string[] } {
  const repairs: string[] = []
  const repaired: DeckSpec = { meta: { ...spec.meta }, slides: spec.slides.map(s => ({ ...s, blocks: [...s.blocks] })) }

  repaired.slides.forEach((slide, si) => {
    slide.blocks = slide.blocks.filter((b, i) => {
      if (b.type === 'text' && !b.content.trim()) {
        repairs.push(`Slide ${si + 1}: Removed empty text block`)
        return false
      }
      if ((b.type === 'bullets' || b.type === 'numbered') && b.items.length === 0) {
        repairs.push(`Slide ${si + 1}: Removed empty ${b.type} list`)
        return false
      }
      return true
    })

    if (slide.blocks.length === 0) {
      slide.blocks.push({
        type: 'text',
        content: `(Slide content placeholder — was empty)`,
        style: { italic: true, color: '#999' },
      })
      repairs.push(`Slide ${si + 1}: Added placeholder content for empty slide`)
    }

    slide.blocks.forEach((b) => {
      if (b.type === 'chart' && b.labels.length === 0) {
        b.labels = ['No Data']
        b.datasets = [{ label: 'Values', values: [0] }]
        repairs.push(`Slide ${si + 1}: Fixed chart with missing data`)
      }
    })
  })

  return { spec: repaired, repairs }
}
