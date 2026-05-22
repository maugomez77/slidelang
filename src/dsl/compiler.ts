import { DeckSpec, Slide, SlideBlock, Position, DeckMeta } from './schema'

// ── Professional Theme Definitions ──

type ThemeDef = {
  id: string
  name: string
  fontHeading: string
  fontBody: string
  colors: Record<string, string>
  css: string
}

const THEMES: ThemeDef[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    fontHeading: 'Playfair Display',
    fontBody: 'Inter',
    colors: { bg: '#0a0a1a', surface: '#141428', accent: '#6366f1', accent2: '#a78bfa', text: '#e2e8f0', textMuted: '#94a3b8', heading: '#f8fafc', border: '#1e1e3a', success: '#22c55e', danger: '#ef4444', warning: '#f59e0b', chartGrid: '#1e1e3a' },
    css: '--bg:#0a0a1a;--surface:#141428;--accent:#6366f1;--accent2:#a78bfa;--text:#e2e8f0;--textMuted:#94a3b8;--heading:#f8fafc;--border:#1e1e3a;--success:#22c55e;--danger:#ef4444;--warning:#f59e0b;--chartGrid:#1e1e3a',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    fontHeading: 'DM Serif Display',
    fontBody: 'Inter',
    colors: { bg: '#f8fafc', surface: '#ffffff', accent: '#0ea5e9', accent2: '#06b6d4', text: '#334155', textMuted: '#94a3b8', heading: '#0f172a', border: '#e2e8f0', success: '#10b981', danger: '#ef4444', warning: '#f59e0b', chartGrid: '#e2e8f0' },
    css: '--bg:#f8fafc;--surface:#ffffff;--accent:#0ea5e9;--accent2:#06b6d4;--text:#334155;--textMuted:#94a3b8;--heading:#0f172a;--border:#e2e8f0;--success:#10b981;--danger:#ef4444;--warning:#f59e0b;--chartGrid:#e2e8f0',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    fontHeading: 'Lora',
    fontBody: 'Inter',
    colors: { bg: '#1a0a0a', surface: '#2d1515', accent: '#f97316', accent2: '#fbbf24', text: '#fef3c7', textMuted: '#d4a574', heading: '#ffedd5', border: '#3d1a1a', success: '#22c55e', danger: '#ef4444', warning: '#f59e0b', chartGrid: '#3d1a1a' },
    css: '--bg:#1a0a0a;--surface:#2d1515;--accent:#f97316;--accent2:#fbbf24;--text:#fef3c7;--textMuted:#d4a574;--heading:#ffedd5;--border:#3d1a1a;--success:#22c55e;--danger:#ef4444;--warning:#f59e0b;--chartGrid:#3d1a1a',
  },
  {
    id: 'forest',
    name: 'Forest',
    fontHeading: 'Crimson Text',
    fontBody: 'Source Sans 3',
    colors: { bg: '#f0fdf4', surface: '#ffffff', accent: '#16a34a', accent2: '#22c55e', text: '#166534', textMuted: '#4d7c5d', heading: '#052e16', border: '#bbf7d0', success: '#16a34a', danger: '#dc2626', warning: '#d97706', chartGrid: '#dcfce7' },
    css: '--bg:#f0fdf4;--surface:#ffffff;--accent:#16a34a;--accent2:#22c55e;--text:#166534;--textMuted:#4d7c5d;--heading:#052e16;--border:#bbf7d0;--success:#16a34a;--danger:#dc2626;--warning:#d97706;--chartGrid:#dcfce7',
  },
  {
    id: 'mono',
    name: 'Monochrome',
    fontHeading: 'Space Grotesk',
    fontBody: 'Inter',
    colors: { bg: '#ffffff', surface: '#f5f5f5', accent: '#171717', accent2: '#525252', text: '#404040', textMuted: '#a3a3a3', heading: '#0a0a0a', border: '#e5e5e5', success: '#171717', danger: '#525252', warning: '#737373', chartGrid: '#e5e5e5' },
    css: '--bg:#ffffff;--surface:#f5f5f5;--accent:#171717;--accent2:#525252;--text:#404040;--textMuted:#a3a3a3;--heading:#0a0a0a;--border:#e5e5e5;--success:#171717;--danger:#525252;--warning:#737373;--chartGrid:#e5e5e5',
  },
  {
    id: 'plum',
    name: 'Plum',
    fontHeading: 'Fraunces',
    fontBody: 'Inter',
    colors: { bg: '#faf5ff', surface: '#ffffff', accent: '#7c3aed', accent2: '#a855f7', text: '#4a1d96', textMuted: '#8b5cf6', heading: '#2e1065', border: '#e9d5ff', success: '#16a34a', danger: '#dc2626', warning: '#d97706', chartGrid: '#f3e8ff' },
    css: '--bg:#faf5ff;--surface:#ffffff;--accent:#7c3aed;--accent2:#a855f7;--text:#4a1d96;--textMuted:#8b5cf6;--heading:#2e1065;--border:#e9d5ff;--success:#16a34a;--danger:#dc2626;--warning:#d97706;--chartGrid:#f3e8ff',
  },
]

function getTheme(themeId: string): ThemeDef {
  return THEMES.find(t => t.id === themeId) || THEMES[0]
}

// ── Common CSS shared across all themes ──

const SHARED_CSS = `
.reveal { font-size: 28px; }
.reveal .slides { text-align: left; }
.reveal .slides section {
  padding: 50px 70px;
  display: flex !important;
  flex-direction: column;
  justify-content: center;
}
.reveal h1 { font-size: 2.8em; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; margin: 0 0 0.15em 0; }
.reveal h2 { font-size: 1.8em; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.4em 0; position: relative; }
.reveal h3 { font-size: 1.3em; font-weight: 700; margin: 0 0 0.3em 0; }
.reveal h4 { font-size: 1.1em; font-weight: 600; margin: 0 0 0.2em 0; }
.reveal p { margin: 0.3em 0; line-height: 1.55; }
.reveal ul, .reveal ol { margin: 0.4em 0; padding-left: 1.6em; }
.reveal li { margin: 0.35em 0; line-height: 1.5; }
.reveal li::marker { color: var(--accent); font-weight: 700; }
.reveal a { color: var(--accent); text-decoration: none; border-bottom: 1px solid var(--accent); }
.reveal img { border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }

/* Accent bar under headings */
.slide-heading-accent {
  display: inline-block;
  border-bottom: 4px solid var(--accent);
  padding-bottom: 0.15em;
  margin-bottom: 0.3em;
}

/* Section divider */
.slide-section-divider {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center;
}
.slide-section-divider h1 { font-size: 3em; }
.slide-section-divider .section-number {
  display: inline-block;
  font-size: 0.4em;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 0.8em;
}

/* Title slide */
.slide-hero {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center;
}
.slide-hero h1 { font-size: 3.2em; margin-bottom: 0.15em; }
.slide-hero .hero-subtitle { font-size: 1.3em; color: var(--textMuted); font-weight: 400; margin-bottom: 1em; }
.slide-hero .hero-line {
  width: 60px; height: 4px; background: var(--accent); border-radius: 2px; margin: 0 auto 1em auto;
}
.slide-hero .hero-meta {
  font-size: 0.8em; color: var(--textMuted); letter-spacing: 0.05em; text-transform: uppercase;
}

/* Card used for stats, KPI, comparison */
.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1em 1.2em;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}
.kpi-card .kpi-value {
  font-size: 2em; font-weight: 800; color: var(--accent); line-height: 1.1;
}
.kpi-card .kpi-label {
  font-size: 0.75em; color: var(--textMuted); margin-top: 0.3em; text-transform: uppercase; letter-spacing: 0.08em;
}

/* Stat grid */
.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.8em; margin: 0.5em 0; }

/* Comparison two-panel */
.comparison-panels {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1em; margin: 0.5em 0;
}
.comparison-panels .panel {
  background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 1em 1.2em;
}
.comparison-panels .panel h3 { text-align: center; margin-bottom: 0.6em; padding-bottom: 0.4em; border-bottom: 2px solid var(--accent); }

/* Timeline */
.timeline { position: relative; padding-left: 2em; margin: 0.5em 0; }
.timeline::before {
  content: ''; position: absolute; left: 0.5em; top: 0; bottom: 0; width: 2px; background: var(--accent); opacity: 0.3;
}
.timeline-item { position: relative; margin-bottom: 0.8em; padding-left: 1em; }
.timeline-item::before {
  content: ''; position: absolute; left: -2.1em; top: 0.4em; width: 10px; height: 10px; border-radius: 50%; background: var(--accent);
}
.timeline-item .timeline-date { font-size: 0.7em; color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.timeline-item .timeline-title { font-weight: 700; margin: 0.1em 0; }
.timeline-item .timeline-desc { font-size: 0.8em; color: var(--textMuted); }

/* Chart container */
.chart-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 0.8em; margin: 0.3em 0; }
.chart-title { font-size: 0.85em; font-weight: 600; color: var(--textMuted); margin-bottom: 0.4em; }

/* Math container */
.math-block {
  background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 0.6em 1em; margin: 0.4em 0;
  text-align: center; overflow-x: auto;
}
.math-block-inline { padding: 0.15em 0.4em; background: var(--surface); border-radius: 4px; }

/* Two-column grid */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2em; margin: 0.4em 0; }
.two-col > div { min-width: 0; }

/* Quote slide */
.slide-quote {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center;
}
.slide-quote blockquote {
  font-size: 1.6em; font-style: italic; line-height: 1.4; max-width: 80%; border: none; padding: 0;
  box-shadow: none; background: none;
}
.slide-quote blockquote::before { content: '"'; font-size: 2em; color: var(--accent); display: block; margin-bottom: 0.2em; }
.slide-quote .quote-author { font-size: 0.85em; color: var(--textMuted); margin-top: 0.8em; }

/* Blank / freeform slide */
.slide-blank { padding: 30px 50px !important; }
.slide-blank > div { position: relative; min-height: 400px; }

/* Thank you slide */
.slide-thanks {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center;
}
.slide-thanks h1 { font-size: 3em; }
.slide-thanks .thanks-line { width: 80px; height: 4px; background: var(--accent); border-radius: 2px; margin: 0.6em auto; }

/* Footer decoration */
.slide-footer {
  position: absolute; bottom: 20px; left: 70px; right: 70px;
  display: flex; justify-content: space-between;
  font-size: 0.5em; color: var(--textMuted); opacity: 0.6;
}
`

// ── Main Compiler ──

export function compileDeckToHTML(spec: DeckSpec): string {
  const theme = getTheme(spec.meta.theme)
  const slidesHTML = spec.slides.map((slide, i) => compileSlide(slide, i, theme, spec.meta)).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(spec.meta.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&family=DM+Serif+Display&family=Lora:wght@600;700&family=Crimson+Text:wght@600;700&family=Source+Sans+3:wght@400;600;700&family=Space+Grotesk:wght@500;700&family=Fraunces:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/white.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    :root { ${theme.css} }
    * { box-sizing: border-box; }
    body { font-family: '${theme.fontBody}', -apple-system, sans-serif; background: var(--bg); color: var(--text); }
    .reveal { font-family: '${theme.fontBody}', -apple-system, sans-serif; }
    .reveal h1, .reveal h2, .reveal h3, .reveal h4 { font-family: '${theme.fontHeading}', Georgia, serif; color: var(--heading); }
    .reveal .slides section { background: var(--bg); }
    ${SHARED_CSS}
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
${slidesHTML}
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/math/math.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script>
    Reveal.initialize({
      controls: true, progress: true, center: false, hash: true,
      transition: 'slide', transitionSpeed: 'default',
      width: 1280, height: 720, margin: 0.04,
      plugins: [ RevealMath.KaTeX ]
    });
  </script>
</body>
</html>`
}

// ── Slide Compilation ──

function compileSlide(slide: Slide, index: number, theme: ThemeDef, meta: DeckMeta): string {
  const bgStyle = slide.background ? ` style="background: ${slide.background};"` : ''
  const notes = slide.notes ? `<aside class="notes">${escapeHTML(slide.notes)}</aside>` : ''
  const footerHTML = `<div class="slide-footer"><span>${escapeHTML(slide.title || '')}</span><span>${escapeHTML(meta.title)}</span></div>`

  let content = ''
  switch (slide.kind) {
    case 'title': content = _compileHeroSlide(slide, theme, meta); break
    case 'section': content = compileSectionDivider(slide, theme, index); break
    case 'quote': content = compileQuoteSlide(slide, theme); break
    case 'two-column': content = compileTwoColumnSlide(slide, theme); break
    case 'comparison': content = compileComparisonSlide(slide, theme); break
    case 'image-full': content = compileImageFullSlide(slide, theme); break
    case 'blank': content = compileBlankSlide(slide, theme); break
    default: content = compileStandardSlide(slide, theme)
  }

  const hasSpatial = slide.blocks.some(b => b.position)
  const slideClass = hasSpatial ? 'slide-blank' : ''

  return `      <section${bgStyle} class="${slideClass}">
        ${content}
        ${notes}
        ${footerHTML}
      </section>`
}

// ── Hero / Title ──

function _compileHeroSlide(slide: Slide, theme: ThemeDef, meta: DeckMeta): string {
  const parts: string[] = []
  if (slide.title) parts.push(`<h1>${escapeHTML(slide.title)}</h1>`)
  parts.push(`<div class="hero-line"></div>`)
  if (slide.subtitle) parts.push(`<p class="hero-subtitle">${escapeHTML(slide.subtitle)}</p>`)
  if (meta.author) parts.push(`<p class="hero-meta">${escapeHTML(meta.author)}${meta.date ? ' · ' + escapeHTML(meta.date) : ''}</p>`)
  const extraContent = compileBlocks(slide.blocks, theme).trim()
  if (extraContent) parts.push(`<div style="margin-top:0.8em;">${extraContent}</div>`)
  return parts.join('\n')
}

// ── Section Divider ──
function compileSectionDivider(slide: Slide, theme: ThemeDef, index: number): string {
  const parts: string[] = []
  parts.push(`<p class="section-number">Section ${String(index).padStart(2, '0')}</p>`)
  if (slide.title) parts.push(`<h1>${escapeHTML(slide.title)}</h1>`)
  if (slide.subtitle) parts.push(`<p class="hero-subtitle" style="margin-top:0.3em;">${escapeHTML(slide.subtitle)}</p>`)
  return `<div class="slide-section-divider">\n${parts.join('\n')}\n</div>`
}

// ── Quote ──
function compileQuoteSlide(slide: Slide, theme: ThemeDef): string {
  const textBlock = slide.blocks.find(b => b.type === 'text')
  const quote = textBlock ? (textBlock as any).content : slide.title || ''
  return `<div class="slide-quote">
    <blockquote>${escapeHTML(quote)}</blockquote>
    ${slide.subtitle ? `<p class="quote-author">— ${escapeHTML(slide.subtitle)}</p>` : ''}
  </div>`
}

// ── Standard ──
function compileStandardSlide(slide: Slide, theme: ThemeDef): string {
  // Detect KPI blocks: text with large size + list = stat cards
  const hasKPIs = slide.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'xlarge').length >= 2

  const parts: string[] = []
  if (slide.title) {
    parts.push(`<h2><span class="slide-heading-accent">${escapeHTML(slide.title)}</span></h2>`)
  }
  if (slide.subtitle) {
    parts.push(`<p style="color:var(--textMuted);font-size:0.9em;margin-bottom:0.6em;">${escapeHTML(slide.subtitle)}</p>`)
  }

  if (hasKPIs) {
    // Render KPI grid
    parts.push(`<div class="stat-grid">`)
    slide.blocks.forEach(b => {
      if (b.type === 'text' && (b as any).style?.size === 'xlarge') {
        parts.push(`<div class="kpi-card"><div class="kpi-value">${escapeHTML((b as any).content)}</div></div>`)
      }
    })
    // Labels
    const labels = slide.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'small')
    if (labels.length > 0) {
      parts.push(`</div><div class="stat-grid" style="margin-top:-0.4em;">`)
      labels.forEach(b => {
        parts.push(`<div class="kpi-card" style="padding-top:0.3em;"><div class="kpi-label">${escapeHTML((b as any).content)}</div></div>`)
      })
    }
    parts.push(`</div>`)
    // Remaining blocks (non-stat)
    const remaining = slide.blocks.filter(b => !(b.type === 'text' && ((b as any).style?.size === 'xlarge' || (b as any).style?.size === 'small')))
    if (remaining.length > 0) {
      parts.push(compileBlocks(remaining, theme))
    }
  } else {
    parts.push(compileBlocks(slide.blocks, theme))
  }

  return parts.join('\n')
}

// ── Two Column ──
function compileTwoColumnSlide(slide: Slide, theme: ThemeDef): string {
  const mid = Math.ceil(slide.blocks.length / 2)
  const left = slide.blocks.slice(0, mid)
  const right = slide.blocks.slice(mid)
  return `
        <h2><span class="slide-heading-accent">${escapeHTML(slide.title || '')}</span></h2>
        <div class="two-col">
          <div>${compileBlocks(left, theme)}</div>
          <div>${compileBlocks(right, theme)}</div>
        </div>`
}

// ── Comparison ──
function compileComparisonSlide(slide: Slide, theme: ThemeDef): string {
  const mid = Math.ceil(slide.blocks.length / 2)
  const left = slide.blocks.slice(0, mid)
  const right = slide.blocks.slice(mid)

  const leftTitle = left.length >= 1 && left[0].type === 'text' ? (left[0] as any).content : 'Left'
  const rightTitle = right.length >= 1 && right[0].type === 'text' ? (right[0] as any).content : 'Right'
  const leftBlocks = left.length >= 1 && left[0].type === 'text' ? left.slice(1) : left
  const rightBlocks = right.length >= 1 && right[0].type === 'text' ? right.slice(1) : right

  return `
        <h2><span class="slide-heading-accent">${escapeHTML(slide.title || '')}</span></h2>
        <div class="comparison-panels">
          <div class="panel"><h3>${escapeHTML(leftTitle)}</h3>${compileBlocks(leftBlocks, theme)}</div>
          <div class="panel"><h3>${escapeHTML(rightTitle)}</h3>${compileBlocks(rightBlocks, theme)}</div>
        </div>`
}

// ── Image Full ──
function compileImageFullSlide(slide: Slide, theme: ThemeDef): string {
  const imgBlock = slide.blocks.find(b => b.type === 'image') as Extract<SlideBlock, { type: 'image' }> | undefined
  const img = imgBlock?.source
  if (!img?.url) return `<p style="color:var(--textMuted);text-align:center;">[No image specified]</p>`
  return `
        ${slide.title ? `<h2><span class="slide-heading-accent">${escapeHTML(slide.title)}</span></h2>` : ''}
        <div style="text-align:center;margin:0.5em 0;">
          <img src="${escapeHTML(img.url)}" alt="${escapeHTML(img.alt || '')}" />
          ${img.caption ? `<p style="font-size:0.7em;color:var(--textMuted);margin-top:0.4em;">${escapeHTML(img.caption)}</p>` : ''}
        </div>`
}

// ── Blank / Spatial ──
function compileBlankSlide(slide: Slide, theme: ThemeDef): string {
  const hasSpatial = slide.blocks.some(b => b.position)
  if (!hasSpatial) {
    return compileBlocks(slide.blocks, theme)
  }
  return `<div style="position:relative;min-height:400px;">
        ${compileBlocks(slide.blocks, theme)}
      </div>`
}

// ── Block Compilation ──

function compileBlocks(blocks: SlideBlock[], theme: ThemeDef): string {
  return blocks.map(b => compileBlock(b, theme)).join('\n')
}

function compileBlock(block: SlideBlock, theme: ThemeDef): string {
  let inner = ''
  switch (block.type) {
    case 'text': inner = compileTextBlock(block, theme); break
    case 'bullets':
    case 'numbered': inner = compileListBlock(block, theme); break
    case 'chart': inner = compileChartBlock(block, theme); break
    case 'math': inner = compileMathBlock(block); break
    case 'image': inner = compileImageBlock(block); break
    default: return ''
  }
  return withPos(block, inner)
}

function compileTextBlock(block: Extract<SlideBlock, { type: 'text' }>, theme: ThemeDef): string {
  const style = block.style || {}
  const sizeMap: Record<string, string> = { small: '0.75em', medium: '0.9em', large: '1.15em', xlarge: '1.5em' }
  const css: string[] = []
  if (style.bold) css.push('font-weight:700')
  if (style.italic) css.push('font-style:italic')
  if (style.size) css.push(`font-size:${sizeMap[style.size] || '0.9em'}`)
  if (style.color) css.push(`color:${style.color}`)
  if (style.align) css.push(`text-align:${style.align}`)
  return `<p style="${css.join(';')};line-height:1.55;margin:0.3em 0;">${escapeHTML(block.content)}</p>`
}

function compileListBlock(block: Extract<SlideBlock, { type: 'bullets' } | { type: 'numbered' }>, theme: ThemeDef): string {
  const tag = block.type === 'numbered' ? 'ol' : 'ul'
  const items = block.items.map(i => `<li>${escapeHTML(i)}</li>`).join('')
  return `<${tag}>${items}</${tag}>`
}

function compileChartBlock(block: Extract<SlideBlock, { type: 'chart' }>, theme: ThemeDef): string {
  const labels = JSON.stringify(block.labels.map(String))
  const datasets = JSON.stringify(block.datasets.map(ds => ({
    label: ds.label,
    data: ds.values,
    borderColor: ds.color || theme.colors.accent,
    backgroundColor: ds.color || theme.colors.accent,
  })))
  const chartId = `c${Math.random().toString(36).slice(2, 8)}`
  return `
        <div class="chart-wrapper">
          ${block.title ? `<div class="chart-title">${escapeHTML(block.title)}</div>` : ''}
          <canvas id="${chartId}" style="width:100%;height:320px;"></canvas>
        </div>
        <script>
        (() => {
          const c = document.getElementById('${chartId}');
          if (!c) return;
          const ctx = c.getContext('2d');
          if (!ctx) return;
          const dpr = window.devicePixelRatio || 1;
          const w = c.parentElement.clientWidth - 16;
          const h = 320;
          c.width = w * dpr; c.height = h * dpr;
          c.style.width = w + 'px'; c.style.height = h + 'px';
          ctx.scale(dpr, dpr);
          const data = { labels: ${labels}, datasets: ${datasets} };
          const pad = { t: 30, b: 40, l: 55, r: 25 };
          const cw = w - pad.l - pad.r;
          const ch = h - pad.t - pad.b;
          const maxV = Math.max(...data.datasets.flatMap(d => d.data), 1);
          const palette = ['${theme.colors.accent}', '${theme.colors.accent2}', '${theme.colors.warning}', '${theme.colors.danger}', '${theme.colors.success}'];

          // Grid lines
          ctx.strokeStyle = '${theme.colors.chartGrid}';
          ctx.lineWidth = 1;
          const steps = 5;
          for (let i = 0; i <= steps; i++) {
            const y = pad.t + (ch / steps) * i;
            ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
            ctx.fillStyle = '${theme.colors.textMuted}';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(maxV - (maxV / steps) * i), pad.l - 8, y + 4);
          }

          // Bars
          const gap = data.labels.length > 1 ? cw / data.labels.length : 60;
          const barW = Math.min(gap * 0.55, 50);
          const dsCount = data.datasets.length;
          const groupW = barW * dsCount;
          const groupGap = (gap - groupW) / 2;

          data.datasets.forEach((ds, di) => {
            const color = ds.borderColor || palette[di % palette.length];
            ds.data.forEach((v, vi) => {
              const x = pad.l + vi * gap + groupGap + di * barW;
              const bh = Math.max((v / maxV) * ch, 1);
              const y = pad.t + ch - bh;
              ctx.fillStyle = color;
              ctx.globalAlpha = 1;
              ctx.beginPath();
              ctx.roundRect(x, y, barW - 2, bh, [4, 4, 0, 0]);
              ctx.fill();
            });
          });

          // Labels
          ctx.fillStyle = '${theme.colors.text}';
          ctx.font = '12px Inter, sans-serif';
          ctx.textAlign = 'center';
          data.labels.forEach((l, vi) => {
            const x = pad.l + vi * gap + gap / 2;
            ctx.fillText(String(l), x, h - 8);
          });

          // Legend
          let lx = pad.l;
          data.datasets.forEach((ds, di) => {
            ctx.fillStyle = ds.borderColor || palette[di % palette.length];
            ctx.fillRect(lx, h - 28, 10, 10);
            ctx.fillStyle = '${theme.colors.textMuted}';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(ds.label, lx + 14, h - 20);
            lx += ctx.measureText(ds.label).width + 30;
          });
        })();
        </script>`
}

function compileMathBlock(block: Extract<SlideBlock, { type: 'math' }>): string {
  const expr = escapeHTML(block.expression)
  if (block.inline) {
    return `<span class="math-block-inline">$${expr}$</span>`
  }
  return `<div class="math-block">$$${expr}$$</div>`
}

function compileImageBlock(block: Extract<SlideBlock, { type: 'image' }>): string {
  const src = block.source
  const imgStyle = [src.width ? `width:${src.width}` : '', src.height ? `height:${src.height}` : '', `max-width:100%`].filter(Boolean).join(';')
  if (!src.url) return `<p style="color:var(--textMuted);">[Image URL missing]</p>`
  return `
        <figure style="text-align:center;margin:0.3em 0;">
          <img src="${escapeHTML(src.url)}" alt="${escapeHTML(src.alt || '')}" style="${imgStyle}" loading="lazy" />
          ${src.caption ? `<figcaption style="font-size:0.7em;color:var(--textMuted);margin-top:0.3em;">${escapeHTML(src.caption)}</figcaption>` : ''}
        </figure>`
}

// ── Positioning ──

function withPos(block: SlideBlock, inner: string): string {
  const ps = posStyle(block.position)
  if (!ps) return inner
  return `<div style="${ps}">\n${inner}\n</div>`
}

function posStyle(pos?: Position): string {
  if (!pos) return ''
  const isPct = pos.unit !== 'px'
  const parts: string[] = [`position:absolute;`, `left:${pos.x}${isPct ? '%' : 'px'};`, `top:${pos.y}${isPct ? '%' : 'px'};`]
  if (pos.width) parts.push(`width:${pos.width}${isPct ? '%' : 'px'};`)
  if (pos.height) parts.push(`height:${pos.height}${isPct ? '%' : 'px'};`)
  if (pos.zIndex) parts.push(`z-index:${pos.zIndex};`)
  return parts.join('')
}

function escapeHTML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
