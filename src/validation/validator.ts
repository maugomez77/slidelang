import { DeckSpec, LayoutIssue, Slide, SlideBlock } from '../dsl/schema'

const MAX_BLOCKS_PER_SLIDE = 8
const MAX_LIST_ITEMS = 15
const MAX_CHART_LABELS = 20

export function validateDeck(spec: DeckSpec): LayoutIssue[] {
  return spec.slides.flatMap((slide, i) => validateSlide(slide, i))
}

export function validateSlide(slide: Slide, slideIndex: number): LayoutIssue[] {
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
    const blockIssues = validateBlock(block, slideIndex, bi)
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

function validateBlock(block: SlideBlock, slideIndex: number, blockIndex: number): LayoutIssue[] {
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
