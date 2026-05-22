import { DeckSpec, LayoutIssue, Slide, SlideBlock } from '../dsl/schema'

const MAX_BLOCKS_PER_SLIDE = 8
const MAX_LIST_ITEMS = 15
const MAX_CHART_LABELS = 20
const MAX_TITLE_LENGTH = 80

// ── WCAG Contrast ──

const THEME_BG: Record<string, string> = {
  noir: '#08080f', warm: '#1c1410', crimson: '#1a0a0c', navy: '#0a1128', neon: '#0d0d0d',
  air: '#fafaf9', bold: '#ffffff', sage: '#f7faf5',
}

function _lum(hex: string): number | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return null
  const lin = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  return 0.2126 * lin(parseInt(m[1], 16)) + 0.7152 * lin(parseInt(m[2], 16)) + 0.0722 * lin(parseInt(m[3], 16))
}

function _cr(hex1: string, hex2: string): number {
  const l1 = _lum(hex1), l2 = _lum(hex2)
  if (l1 == null || l2 == null) return 21
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

// ── Validate Deck ──

export function validateDeck(spec: DeckSpec): LayoutIssue[] {
  const bg = THEME_BG[spec.meta.theme] || '#08080f'
  const issues: LayoutIssue[] = []

  for (let i = 0; i < spec.slides.length; i++) {
    issues.push(...validateSlide(spec.slides[i], i, bg))
  }

  // Deck-level structural checks
  const kinds = spec.slides.map(s => s.kind)

  // Check: deck has a title slide
  if (!kinds.includes('title')) {
    issues.push({ type: 'empty_content', severity: 'warning', message: 'Deck has no title slide — add a title slide as the first slide' })
  }

  // Check: long deck (>5 slides) has section dividers
  if (spec.slides.length > 5 && !kinds.includes('section')) {
    issues.push({ type: 'empty_content', severity: 'info', message: 'Long deck has no section dividers — consider adding section breaks for structure' })
  }

  // Check: deck has a closing slide (contact, title, or quote at the end)
  const lastKind = kinds[kinds.length - 1]
  if (!['title', 'contact', 'quote', 'section'].includes(lastKind)) {
    issues.push({ type: 'empty_content', severity: 'info', message: 'Deck has no closing slide — consider ending with a contact, thank-you, or quote slide' })
  }

  // Check: no more than 3 consecutive same-kind slides
  let run = 0, lastKind2 = ''
  for (const k of kinds) {
    if (k === lastKind2) {
      run++
      if (run >= 3) {
        issues.push({ type: 'overflow', severity: 'info', message: `${run + 1} consecutive "${k}" slides — consider varying slide types for engagement` })
      }
    } else { run = 0; lastKind2 = k }
  }

  return issues
}

// ── Validate Single Slide ──

export function validateSlide(slide: Slide, slideIndex: number, bg: string): LayoutIssue[] {
  const issues: LayoutIssue[] = []
  const label = slide.title || `Slide ${slideIndex + 1}`

  // Structural
  if (slide.blocks.length === 0) {
    issues.push({ type: 'empty_content', severity: 'warning', message: `"${label}" has no content blocks` })
  }
  if (slide.blocks.length > MAX_BLOCKS_PER_SLIDE) {
    issues.push({ type: 'overflow', severity: 'warning', message: `"${label}" has ${slide.blocks.length} blocks (max ${MAX_BLOCKS_PER_SLIDE})` })
  }
  if (slide.title && slide.title.length > MAX_TITLE_LENGTH) {
    issues.push({ type: 'text_truncation', severity: 'info', message: `Slide title is ${slide.title.length} chars — consider shortening to ${MAX_TITLE_LENGTH}` })
  }

  // Per-block
  slide.blocks.forEach((block, bi) => issues.push(...validateBlock(block, slideIndex, bi, bg)))

  // Spatial overlap
  const positioned = slide.blocks.filter(b => b.position)
  for (let i = 0; i < positioned.length; i++) {
    for (let j = i + 1; j < positioned.length; j++) {
      const a = positioned[i].position!, b = positioned[j].position!
      if (a.x < b.x + (b.width || 20) && a.x + (a.width || 20) > b.x &&
          a.y < b.y + (b.height || 20) && a.y + (a.height || 20) > b.y) {
        issues.push({ type: 'overlap', severity: 'warning', message: `Block ${i + 1} overlaps with block ${j + 1}` })
      }
    }
  }

  // Slide kind rules
  switch (slide.kind) {
    case 'title':
      if (slide.blocks.length > 3) {
        issues.push({ type: 'overflow', severity: 'info', message: `Title slide has ${slide.blocks.length} blocks — keep hero slides minimal (1-2 blocks)` })
      }
      break

    case 'comparison':
      const mid = Math.ceil(slide.blocks.length / 2)
      const left = slide.blocks.slice(0, mid)
      const right = slide.blocks.slice(mid)
      if (Math.abs(left.length - right.length) > 1) {
        issues.push({ type: 'overflow', severity: 'warning', message: `Comparison columns are unbalanced (${left.length} vs ${right.length} blocks) — balance content for visual alignment` })
      }
      break

    case 'image-full':
      if (!slide.blocks.some(b => b.type === 'image')) {
        issues.push({ type: 'missing_image', severity: 'error', message: `Image-full slide has no image block` })
      }
      break

    case 'dashboard':
      if (slide.blocks.filter(b => b.type === 'chart').length < 2) {
        issues.push({ type: 'missing_chart_data', severity: 'warning', message: `Dashboard slide should have at least 2 charts for side-by-side layout` })
      }
      break

    case 'team':
      if (!slide.blocks.some(b => b.type === 'image')) {
        issues.push({ type: 'missing_image', severity: 'info', message: `Team slide has no images — consider adding team member photos` })
      }
      break

    case 'logo-grid':
      if (!slide.blocks.some(b => b.type === 'image')) {
        issues.push({ type: 'missing_image', severity: 'error', message: `Logo-grid slide has no images` })
      }
      break

    case 'kpi':
      const vals = slide.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'xlarge')
      if (vals.length > 4) {
        issues.push({ type: 'overflow', severity: 'warning', message: `KPI slide has ${vals.length} stat cards — cards may overflow on narrow slides` })
      }
      vals.forEach((b, bi) => {
        if ((b as any).content.length > 7) {
          issues.push({ type: 'text_truncation', severity: 'warning', message: `KPI value "${(b as any).content}" too long — consider abbreviating`, blockIndex: bi })
        }
      })
      break
  }

  // Auto-detect KPI blocks on non-kpi slides
  if (slide.kind !== 'kpi') {
    const autoKPIs = slide.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'xlarge')
    if (autoKPIs.length >= 2) {
      issues.push({ type: 'overflow', severity: 'info', message: `Slide auto-detects as KPI grid (${autoKPIs.length} large values) — consider using the "kpi" slide kind for better layout` })
      autoKPIs.forEach((b, bi) => {
        if ((b as any).content.length > 7) {
          issues.push({ type: 'text_truncation', severity: 'info', message: `KPI-like value "${(b as any).content}" may overflow card`, blockIndex: bi })
        }
      })
    }
  }

  // Custom background check
  if (slide.background) {
    issues.push({ type: 'color_contrast', severity: 'info', message: `"${label}" has custom background — ensure text is readable against "${slide.background}"` })
  }

  return issues
}

// ── Validate Single Block ──

function validateBlock(block: SlideBlock, slideIndex: number, blockIndex: number, bg: string): LayoutIssue[] {
  const issues: LayoutIssue[] = []

  if (block.position) {
    const p = block.position
    const maxDim = p.unit === 'px' ? 1200 : 100
    if (p.x < 0 || p.y < 0) issues.push({ type: 'out_of_bounds', severity: 'warning', message: 'Block has negative coordinates', blockIndex })
    if (p.width && (p.x + p.width > maxDim)) issues.push({ type: 'out_of_bounds', severity: 'warning', message: 'Block extends beyond slide edge', blockIndex })
  }

  switch (block.type) {
    case 'text':
      if (!block.content.trim()) {
        issues.push({ type: 'empty_content', severity: 'warning', message: 'Text block is empty', blockIndex })
      } else if (block.content.length > 500) {
        issues.push({ type: 'text_truncation', severity: 'warning', message: `Text exceeds 500 chars — may overflow (${block.content.length} chars)`, blockIndex })
      }
      if (block.style?.color && bg) {
        const ratio = _cr(block.style.color, bg)
        const isLarge = block.style.size === 'xlarge' || block.style.size === 'large'
        const threshold = isLarge ? 3.0 : 4.5
        if (ratio < threshold) {
          issues.push({
            type: 'color_contrast',
            severity: ratio < 2.5 ? 'error' : 'warning',
            message: `Text color #${block.style.color.replace('#', '')} has low contrast (${ratio.toFixed(1)}:1) — need ${threshold}:1`,
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
        if (item.length > 200) issues.push({ type: 'text_truncation', severity: 'info', message: `List item ${ii + 1} is very long (${item.length} chars)`, blockIndex })
      })
      break

    case 'chart':
      if (block.labels.length === 0 || block.datasets.some(d => d.values.length === 0)) {
        issues.push({ type: 'missing_chart_data', severity: 'error', message: 'Chart has no data', blockIndex })
      }
      if (block.labels.length > MAX_CHART_LABELS) {
        issues.push({ type: 'overflow', severity: 'warning', message: `Chart has ${block.labels.length} labels (max ${MAX_CHART_LABELS})`, blockIndex })
      }
      // New: check all-zero datasets
      block.datasets.forEach((ds, di) => {
        if (ds.values.every(v => v === 0)) {
          issues.push({ type: 'missing_chart_data', severity: 'warning', message: `Dataset "${ds.label}" is all zeros — chart will render empty`, blockIndex })
        }
        if (ds.values.length !== block.labels.length) {
          issues.push({ type: 'missing_chart_data', severity: 'warning', message: `Dataset "${ds.label}" has ${ds.values.length} values but ${block.labels.length} labels — mismatch`, blockIndex })
        }
      })
      break

    case 'math':
      if (!block.expression.trim()) issues.push({ type: 'empty_content', severity: 'warning', message: 'Math expression is empty', blockIndex })
      break

    case 'image':
      if (!block.source.url) {
        issues.push({ type: 'missing_image', severity: 'error', message: 'Image has no URL', blockIndex })
      }
      if (!block.source.alt) {
        issues.push({ type: 'missing_image', severity: 'info', message: 'Image has no alt text — recommended for accessibility', blockIndex })
      }
      if (block.source.url && !block.source.url.startsWith('http') && !block.source.url.startsWith('data:')) {
        issues.push({ type: 'missing_image', severity: 'warning', message: 'Image URL may not be accessible (not http/data scheme)', blockIndex })
      }
      break
  }

  return issues
}

// ── Repair ──

export function repairDeck(spec: DeckSpec): { spec: DeckSpec; repairs: string[] } {
  const repairs: string[] = []
  const bg = THEME_BG[spec.meta.theme] || '#08080f'
  const repaired: DeckSpec = {
    meta: { ...spec.meta },
    slides: spec.slides.map(s => ({
      ...s,
      blocks: [...s.blocks].map(b => ({ ...b, style: b.type === 'text' ? { ...(b as any).style } : undefined }))
    })),
  }

  repaired.slides.forEach((slide, si) => {
    // Remove empty blocks
    slide.blocks = slide.blocks.filter((b) => {
      if (b.type === 'text' && !(b as any).content?.trim()) {
        repairs.push(`Slide ${si + 1}: Removed empty text block`)
        return false
      }
      if ((b.type === 'bullets' || b.type === 'numbered') && (b as any).items?.length === 0) {
        repairs.push(`Slide ${si + 1}: Removed empty list`)
        return false
      }
      return true
    })

    // Add placeholder if empty
    if (slide.blocks.length === 0) {
      (slide.blocks as any).push({ type: 'text', content: '(Placeholder — was empty)', style: { italic: true } })
      repairs.push(`Slide ${si + 1}: Added placeholder for empty slide`)
    }

    // Fix chart missing data
    slide.blocks.forEach((b: any) => {
      if (b.type === 'chart' && b.labels.length === 0) {
        b.labels = ['No Data']; b.datasets = [{ label: 'Values', values: [0] }]
        repairs.push(`Slide ${si + 1}: Fixed chart with missing data`)
      }

      // Fix: low-contrast text → reset to undefined (let compiler auto-fix)
      if (b.type === 'text' && b.style?.color && bg) {
        const ratio = _cr(b.style.color, bg)
        if (ratio < 2.5) {
          delete b.style.color
          repairs.push(`Slide ${si + 1}: Removed unreadable text color (${ratio.toFixed(1)}:1 contrast)`)
        }
      }

      // Fix: add alt text placeholder to images
      if (b.type === 'image' && !b.source?.alt) {
        b.source.alt = b.source?.caption || ''
        if (!b.source.alt) repairs.push(`Slide ${si + 1}: Image is missing alt text — consider adding description`)
      }

      // Fix: balance comparison columns
    })

    // Balance comparison slides
    if (slide.kind === 'comparison') {
      const mid = Math.ceil(slide.blocks.length / 2)
      const left = slide.blocks.slice(0, mid)
      const right = slide.blocks.slice(mid)
      if (right.length < left.length) {
        (right as any).push({ type: 'text', content: '' })
        repairs.push(`Slide ${si + 1}: Balanced comparison columns (added placeholder to right)`)
      }
    }
  })

  return { spec: repaired, repairs }
}
