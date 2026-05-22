import { DeckSpec, Slide, SlideBlock, Position } from './schema'

const THEME_CSS: Record<string, string> = {
  default: '--bg: #fff; --fg: #1a1a2e; --accent: #4361ee; --heading: #1a1a2e; --code-bg: #f5f5f5;',
  dark: '--bg: #0f0f23; --fg: #e0e0e0; --accent: #7b2ff7; --heading: #ffffff; --code-bg: #1a1a2e;',
  minimal: '--bg: #fafafa; --fg: #333; --accent: #000; --heading: #000; --code-bg: #eee;',
  gradient: '--bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%); --fg: #fff; --accent: #fff; --heading: #fff; --code-bg: rgba(255,255,255,0.15);',
  corporate: '--bg: #f0f2f5; --fg: #1a1a2e; --accent: #0052cc; --heading: #0052cc; --code-bg: #e8ecf1;',
}

export function compileDeckToHTML(spec: DeckSpec): string {
  const slidesHTML = spec.slides.map((slide, i) => compileSlide(slide, i)).join('\n')
  const theme = THEME_CSS[spec.meta.theme] || THEME_CSS.default

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(spec.meta.title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/white.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    :root { ${theme} }
    .reveal { background: var(--bg); color: var(--fg); }
    .reveal h1, .reveal h2, .reveal h3, .reveal h4 { color: var(--heading); }
    .reveal .slides section { padding: 1em; }
    .reveal .slides section.slide-title { display: flex; flex-direction: column; justify-content: center; align-items: center; }
    .reveal .slides section.slide-title h1 { font-size: 2.5em; margin-bottom: 0.3em; }
    .reveal .slides section.slide-title p.subtitle { font-size: 1.2em; opacity: 0.8; }
    .block-text { margin: 0.4em 0; font-size: 0.9em; line-height: 1.5; }
    .block-text.small { font-size: 0.75em; }
    .block-text.large { font-size: 1.1em; }
    .block-text.xlarge { font-size: 1.4em; }
    .block-bullets, .block-numbered { text-align: left; margin: 0.5em 0; padding-left: 1.5em; }
    .block-bullets li, .block-numbered li { margin: 0.3em 0; font-size: 0.85em; }
    .block-chart { width: 100%; max-width: 600px; margin: 0.5em auto; }
    .block-math { margin: 0.5em 0; padding: 0.5em; background: var(--code-bg); border-radius: 6px; overflow-x: auto; }
    .block-image { margin: 0.5em auto; text-align: center; }
    .block-image img { max-width: 90%; max-height: 400px; border-radius: 8px; }
    .block-image figcaption { font-size: 0.75em; opacity: 0.7; margin-top: 0.3em; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1em; text-align: left; }
    .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5em; }
    .comparison-col { padding: 1em; border-radius: 8px; background: var(--code-bg); }
    .comparison-col h3 { text-align: center; margin-bottom: 0.5em; }
    .validation-badge { display: inline-block; padding: 0.2em 0.6em; border-radius: 4px; font-size: 0.7em; margin-left: 0.5em; }
    .validation-error { background: #ff4444; color: white; }
    .validation-warning { background: #ffaa00; color: black; }
    .slide-notes { display: none; }
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
      controls: true,
      progress: true,
      center: true,
      hash: true,
      plugins: [ RevealMath.KaTeX ]
    });
  </script>
</body>
</html>`
}

function compileSlide(slide: Slide, index: number): string {
  const issues = slide.layoutIssues?.filter(i => i.severity === 'error' || i.severity === 'warning') || []
  const issueBadges = issues.map(i =>
    `<span class="validation-badge validation-${i.severity}">${i.severity}: ${escapeHTML(i.message)}</span>`
  ).join('')

  let content = ''
  switch (slide.kind) {
    case 'title': content = compileTitleSlide(slide); break
    case 'two-column': content = compileTwoColumnSlide(slide); break
    case 'comparison': content = compileComparisonSlide(slide); break
    case 'image-full': content = compileImageFullSlide(slide); break
    default: content = compileStandardSlide(slide)
  }

  const notes = slide.notes ? `<aside class="slide-notes">${escapeHTML(slide.notes)}</aside>` : ''
  const bgStyle = slide.background ? ` style="background: ${slide.background};"` : ''

  return `      <section${bgStyle}>
        ${issueBadges}
        ${content}
        ${notes}
      </section>`
}

function compileTitleSlide(slide: Slide): string {
  const parts: string[] = []
  if (slide.title) parts.push(`<h1>${escapeHTML(slide.title)}</h1>`)
  if (slide.subtitle) parts.push(`<p class="subtitle">${escapeHTML(slide.subtitle)}</p>`)
  parts.push(compileBlocks(slide.blocks))
  return parts.join('\n')
}

function compileStandardSlide(slide: Slide): string {
  const parts: string[] = []
  if (slide.title) parts.push(`<h2>${escapeHTML(slide.title)}</h2>`)
  if (slide.subtitle) parts.push(`<p style="opacity:0.7;margin-bottom:0.5em;">${escapeHTML(slide.subtitle)}</p>`)
  parts.push(compileBlocks(slide.blocks))
  return parts.join('\n')
}

function compileTwoColumnSlide(slide: Slide): string {
  const mid = Math.ceil(slide.blocks.length / 2)
  const left = slide.blocks.slice(0, mid)
  const right = slide.blocks.slice(mid)
  return `
        <h2>${escapeHTML(slide.title || '')}</h2>
        <div class="two-col">
          <div>${compileBlocks(left)}</div>
          <div>${compileBlocks(right)}</div>
        </div>`
}

function compileComparisonSlide(slide: Slide): string {
  const mid = Math.ceil(slide.blocks.length / 2)
  const left = slide.blocks.slice(0, mid)
  const right = slide.blocks.slice(mid)
  return `
        <h2>${escapeHTML(slide.title || '')}</h2>
        <div class="comparison-grid">
          <div class="comparison-col">
            ${left.length === 1 && left[0].type === 'text' ? `<h3>${escapeHTML((left[0] as Extract<SlideBlock, { type: 'text' }>).content)}</h3>` : compileBlocks(left)}
          </div>
          <div class="comparison-col">
            ${right.length === 1 && right[0].type === 'text' ? `<h3>${escapeHTML((right[0] as Extract<SlideBlock, { type: 'text' }>).content)}</h3>` : compileBlocks(right)}
          </div>
        </div>`
}

function compileImageFullSlide(slide: Slide): string {
  const imgBlock = slide.blocks.find(b => b.type === 'image') as Extract<SlideBlock, { type: 'image' }> | undefined
  const img = imgBlock?.source
  return `
        ${slide.title ? `<h2>${escapeHTML(slide.title)}</h2>` : ''}
        <div class="block-image">
          <img src="${escapeHTML(img?.url || '')}" alt="${escapeHTML(img?.alt || '')}" />
          ${img?.caption ? `<figcaption>${escapeHTML(img.caption)}</figcaption>` : ''}
        </div>`
}

function withPos(block: SlideBlock, inner: string): string {
  const ps = posStyle(block.position)
  if (!ps) return inner
  return `<div style="${ps}">\n${inner}\n</div>`
}

function compileBlocks(blocks: SlideBlock[]): string {
  return blocks.map(b => compileBlock(b)).join('\n')
}

function compileBlock(block: SlideBlock): string {
  let inner = ''
  switch (block.type) {
    case 'text': inner = compileTextBlock(block); break
    case 'bullets':
    case 'numbered': inner = compileListBlock(block); break
    case 'chart': inner = compileChartBlock(block); break
    case 'math': inner = compileMathBlock(block); break
    case 'image': inner = compileImageBlock(block); break
    default: return ''
  }
  return withPos(block, inner)
}

function compileTextBlock(block: Extract<SlideBlock, { type: 'text' }>): string {
  const style = block.style || {}
  const classes = ['block-text', style.size || ''].filter(Boolean).join(' ')
  const css: string[] = []
  if (style.bold) css.push('font-weight: bold;')
  if (style.italic) css.push('font-style: italic;')
  if (style.color) css.push(`color: ${style.color};`)
  if (style.align) css.push(`text-align: ${style.align};`)
  const styleAttr = css.length ? ` style="${css.join(' ')}"` : ''
  return `<p class="${classes}"${styleAttr}>${escapeHTML(block.content)}</p>`
}

function compileListBlock(block: Extract<SlideBlock, { type: 'bullets' } | { type: 'numbered' }>): string {
  const tag = block.type === 'numbered' ? 'ol' : 'ul'
  const cls = block.type === 'numbered' ? 'block-numbered' : 'block-bullets'
  const items = block.items.map(i => `<li>${escapeHTML(i)}</li>`).join('\n')
  return `<${tag} class="${cls}">\n${items}\n</${tag}>`
}

function compileChartBlock(block: Extract<SlideBlock, { type: 'chart' }>): string {
  const labels = JSON.stringify(block.labels)
  const datasets = JSON.stringify(block.datasets.map(ds => ({
    label: ds.label,
    data: ds.values,
    borderColor: ds.color || '#4361ee',
    backgroundColor: ds.color ? ds.color + '33' : '#4361ee33',
  })))
  const chartId = `chart-${Math.random().toString(36).slice(2, 8)}`
  return `
        <div class="block-chart">
          <canvas id="${chartId}"></canvas>
        </div>
        <script>
        (function() {
          const c = document.getElementById('${chartId}');
          if (!c) return;
          const ctx = c.getContext('2d');
          if (!ctx) return;
          const data = { labels: ${labels}, datasets: ${datasets} };
          const w = c.parentElement.clientWidth || 500;
          const h = Math.min(w * 0.6, 350);
          c.width = w; c.height = h;
          const pad = { t: 20, b: 30, l: 50, r: 20 };
          const chartW = w - pad.l - pad.r;
          const chartH = h - pad.t - pad.b;
          const maxVal = Math.max(...data.datasets.flatMap(d => d.data), 1);
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = '#1a1a2e';
          data.datasets.forEach((ds, di) => {
            const barW = data.labels.length > 1 ? chartW / data.labels.length * 0.6 : 40;
            const gap = data.labels.length > 1 ? chartW / data.labels.length : 60;
            ds.data.forEach((v, i) => {
              const x = pad.l + i * gap + (gap - barW) / 2;
              const bh = (v / maxVal) * chartH;
              const y = pad.t + chartH - bh;
              ctx.fillStyle = ds.borderColor;
              ctx.fillRect(x, y, barW, bh);
            });
          });
          ctx.fillStyle = '#1a1a2e';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          data.labels.forEach((l, i) => {
            const x = pad.l + i * gap + gap / 2;
            ctx.fillText(l, x, h - 5);
          });
        })();
        </script>`
}

function compileMathBlock(block: Extract<SlideBlock, { type: 'math' }>): string {
  const expr = escapeHTML(block.expression)
  if (block.inline) return `<span class="block-math">$${expr}$</span>`
  return `<div class="block-math">$$${expr}$$</div>`
}

function compileImageBlock(block: Extract<SlideBlock, { type: 'image' }>): string {
  const src = block.source
  return `
        <figure class="block-image">
          <img src="${escapeHTML(src.url)}" alt="${escapeHTML(src.alt || '')}" style="${src.width ? `width:${src.width};` : ''}${src.height ? `height:${src.height};` : ''}" />
          ${src.caption ? `<figcaption>${escapeHTML(src.caption)}</figcaption>` : ''}
        </figure>`
}

function posStyle(pos?: Position): string {
  if (!pos) return ''
  const isPct = pos.unit !== 'px'
  const parts: string[] = [
    `position:absolute;`,
    `left:${pos.x}${isPct ? '%' : 'px'};`,
    `top:${pos.y}${isPct ? '%' : 'px'};`,
  ]
  if (pos.width) parts.push(`width:${pos.width}${isPct ? '%' : 'px'};`)
  if (pos.height) parts.push(`height:${pos.height}${isPct ? '%' : 'px'};`)
  if (pos.zIndex) parts.push(`z-index:${pos.zIndex};`)
  return parts.join('')
}

function escapeHTML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
