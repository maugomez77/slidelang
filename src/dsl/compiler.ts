import { DeckSpec, Slide, SlideBlock, Position, DeckMeta } from './schema'

// ── Theme Definitions ──

type T = {
  id: string; light: boolean
  fontH: string; fontB: string
  c: Record<string, string>
}

const TH: T[] = [{
  id: 'noir', light: false,
  fontH: 'Playfair Display', fontB: 'Inter',
  c: { bg: '#08080f', surf: '#111122', acc: '#d4a853', a2: '#f0c969', tx: '#eeebe5', tx2: '#a0998c', hd: '#ffffff', bd: '#252540', ok: '#5bb87a', err: '#e0556a', wrn: '#d4a853', grd: '#1a1a30', kpi: 'linear-gradient(135deg, #1a1a3011 0%, #1a1a3044 100%)' },
}, {
  id: 'air', light: true,
  fontH: 'DM Serif Display', fontB: 'Inter',
  c: { bg: '#fafaf9', surf: '#ffffff', acc: '#1d4ed8', a2: '#3b82f6', tx: '#334155', tx2: '#94a3b8', hd: '#0f172a', bd: '#e8ecf0', ok: '#10b981', err: '#ef4444', wrn: '#f59e0b', grd: '#f1f5f9', kpi: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' },
}, {
  id: 'bold', light: true,
  fontH: 'Space Grotesk', fontB: 'Inter',
  c: { bg: '#ffffff', surf: '#f5f5f5', acc: '#0a0a0a', a2: '#525252', tx: '#404040', tx2: '#a3a3a3', hd: '#0a0a0a', bd: '#e8e8e8', ok: '#0a0a0a', err: '#dc2626', wrn: '#d97706', grd: '#f5f5f5', kpi: 'linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)' },
}, {
  id: 'warm', light: false,
  fontH: 'Lora', fontB: 'Inter',
  c: { bg: '#1c1410', surf: '#2a1f19', acc: '#e8924f', a2: '#f0b87b', tx: '#f0e8de', tx2: '#b0a090', hd: '#ffffff', bd: '#3d3028', ok: '#6fb86f', err: '#e06b6b', wrn: '#e8a74f', grd: '#2e221a', kpi: 'linear-gradient(135deg, #251a1411 0%, #251a1444 100%)' },
}, {
  id: 'crimson', light: false,
  fontH: 'Playfair Display', fontB: 'Inter',
  c: { bg: '#1a0a0c', surf: '#2d1518', acc: '#dc2626', a2: '#f87171', tx: '#f0e5e5', tx2: '#b89595', hd: '#ffffff', bd: '#3d1c1f', ok: '#22c55e', err: '#dc2626', wrn: '#f59e0b', grd: '#2d181a', kpi: 'linear-gradient(135deg, #1a0a0c44 0%, #2d151844 100%)' },
}, {
  id: 'sage', light: true,
  fontH: 'Lora', fontB: 'Inter',
  c: { bg: '#f7faf5', surf: '#ffffff', acc: '#5d8a3c', a2: '#84b559', tx: '#3a4d2d', tx2: '#8a9e7a', hd: '#1a2e0e', bd: '#dce8d2', ok: '#5d8a3c', err: '#dc2626', wrn: '#d97706', grd: '#edf2e8', kpi: 'linear-gradient(135deg, #f0f7e8 0%, #e8f0db 100%)' },
}, {
  id: 'navy', light: false,
  fontH: 'DM Serif Display', fontB: 'Inter',
  c: { bg: '#0a1128', surf: '#151d3d', acc: '#3b82f6', a2: '#60a5fa', tx: '#e8edf6', tx2: '#8a9cc4', hd: '#ffffff', bd: '#1e2a4d', ok: '#22c55e', err: '#ef4444', wrn: '#f59e0b', grd: '#182244', kpi: 'linear-gradient(135deg, #151d3d22 0%, #151d3d55 100%)' },
}, {
  id: 'neon', light: false,
  fontH: 'Space Grotesk', fontB: 'Inter',
  c: { bg: '#0d0d0d', surf: '#1a1a1a', acc: '#00ff88', a2: '#00ccff', tx: '#e0e0e0', tx2: '#666666', hd: '#ffffff', bd: '#2a2a2a', ok: '#00ff88', err: '#ff3366', wrn: '#ffaa00', grd: '#1a1a1a', kpi: 'linear-gradient(135deg, #1a1a1a44 0%, #1a1a1a88 100%)' },
}]

function gt(id: string): T { return TH.find(t => t.id === id) || TH[0] }

// ── Design System ──
function css(t: T): string {
  return `:root{--bg:${t.c.bg};--surf:${t.c.surf};--accent:${t.c.acc};--a2:${t.c.a2};--tx:${t.c.tx};--tx2:${t.c.tx2};--hd:${t.c.hd};--bd:${t.c.bd};--ok:${t.c.ok};--err:${t.c.err};--wrn:${t.c.wrn};--grd:${t.c.grd};--kpi:${t.c.kpi};--r:14px;--r2:22px}
*,*:before,*:after{box-sizing:border-box}
html,body,.reveal,.reveal .slides,.reveal .slides section{background:var(--bg);color:var(--tx);font-family:'${t.fontB}',-apple-system,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.reveal{font-family:'${t.fontB}',-apple-system,sans-serif;font-size:30px}
.reveal .slides{text-align:left}
.reveal .slides section{padding:52px 80px 28px 80px;display:flex;flex-direction:column;justify-content:flex-start;background:var(--bg);overflow:hidden;box-sizing:border-box}
.reveal .slides section>*{flex-shrink:0}
.slide-body{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden}

/* Typography */
h1{font-family:'${t.fontH}',Georgia,serif;font-size:3.6em;font-weight:800;letter-spacing:-0.04em;line-height:1.08;margin:0 0 0.1em 0;color:var(--hd)}
h2{font-family:'${t.fontH}',Georgia,serif;font-size:2.1em;font-weight:700;letter-spacing:-0.025em;line-height:1.18;margin:0 0 0.45em 0;color:var(--hd)}
h3{font-family:'${t.fontH}',Georgia,serif;font-size:1.35em;font-weight:600;margin:0 0 0.35em 0;color:var(--hd)}
p{margin:0.2em 0;line-height:1.65}

/* Lists — clean with accent markers */
ul,ol{margin:0.25em 0;padding-left:1.5em}
li{margin:0.38em 0;line-height:1.5;font-size:0.82em}
li::marker{color:var(--accent);font-weight:700}
ol{counter-reset:sl;padding-left:0;list-style:none}
ol li{counter-increment:sl;padding-left:2.3em;position:relative}
ol li:before{content:counter(sl);position:absolute;left:0;top:50%;transform:translateY(-50%);width:1.7em;height:1.7em;background:var(--accent);color:${t.light?'#fff':t.c.bg};border-radius:50%;font-size:0.62em;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'${t.fontB}',sans-serif}

/* Accent heading bar — gradient underline */
.ha{position:relative;padding-bottom:0.3em;margin-bottom:0.5em;display:inline-block}
.ha:after{content:'';position:absolute;left:0;bottom:0;width:100%;height:3px;background:linear-gradient(90deg,var(--accent),var(--a2));border-radius:2px}

/* Hero title slide */
.hero{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center;padding:60px 100px!important}
.hero h1{font-size:4em;line-height:1.06;margin-bottom:0.22em}
.hero .hl{width:72px;height:5px;background:linear-gradient(90deg,var(--accent),var(--a2));border-radius:3px;margin:0 auto 1.4em}
.hero .hs{font-size:1.15em;color:var(--tx2);font-weight:400;max-width:30em;line-height:1.55}
.hero .hm{font-size:0.68em;color:var(--tx2);letter-spacing:0.1em;text-transform:uppercase;font-weight:600;margin-top:1.6em}

/* Section divider — dramatic, centered */
.sec{display:flex!important;align-items:center!important;justify-content:center!important;text-align:center}
.sec h1{font-size:3.4em;font-weight:800}
.sec .sn{display:inline-block;font-size:0.36em;font-weight:700;color:var(--accent);letter-spacing:0.22em;text-transform:uppercase;margin-bottom:0.9em;font-family:'${t.fontB}',sans-serif}
.sec .ss{font-size:0.95em;color:var(--tx2);margin-top:0.5em;font-weight:400}

/* KPI stat cards */
.sr{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:0.85em;margin:0.5em 0}
.kp{background:var(--kpi);border:1px solid var(--bd);border-radius:var(--r2);padding:1.4em 0.8em;text-align:center;transition:transform 0.2s ease,box-shadow 0.2s ease;overflow:hidden;word-break:break-word}
.kp:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(0,0,0,0.08)}
.kv{font-family:'${t.fontH}',Georgia,serif;font-size:2.2em;font-weight:800;color:var(--accent);line-height:1.05;letter-spacing:-0.03em;margin-bottom:0.15em}
.kl{font-size:0.62em;color:var(--tx2);font-weight:600;text-transform:uppercase;letter-spacing:0.1em}

/* Comparison panels */
.cmp{display:grid;grid-template-columns:1fr 1fr;gap:1.2em;margin:0.35em 0}
.cp{background:var(--surf);border:1px solid var(--bd);border-radius:var(--r);padding:1.1em 1.2em;box-shadow:0 2px 12px rgba(0,0,0,0.04)}
.cp h3{font-size:1.05em;text-align:center;margin-bottom:0.7em;padding-bottom:0.45em;border-bottom:2px solid var(--accent)}
.cp li{font-size:0.78em}

/* Two column */
.ct{display:grid;grid-template-columns:1fr 1fr;gap:1.4em;margin:0.25em 0}
.ct>div{min-width:0}

/* Quote — large, centered, dramatic */
.qt{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center}
.qt blockquote{font-family:'${t.fontH}',Georgia,serif;font-size:2em;font-style:italic;line-height:1.4;max-width:70%;border:none;padding:0;box-shadow:none;background:none;color:var(--hd)}
.qt blockquote:before{content:'"';font-size:2.6em;color:var(--accent);display:block;margin-bottom:0.05em;font-style:normal;line-height:1}
.qt .qa{font-size:0.78em;color:var(--tx2);font-weight:600;margin-top:1.1em;letter-spacing:0.04em}

/* Chart container */
.cb{background:var(--surf);border:1px solid var(--bd);border-radius:var(--r);padding:1em;margin:0.25em 0;box-shadow:0 2px 10px rgba(0,0,0,0.03)}
.cb .ctt{font-size:0.72em;font-weight:700;color:var(--tx2);margin-bottom:0.5em;text-transform:uppercase;letter-spacing:0.07em}

/* Math display */
.mb{background:var(--surf);border:1px solid var(--bd);border-radius:var(--r);padding:0.75em 1.2em;margin:0.35em 0;text-align:center;overflow-x:auto;box-shadow:0 1px 8px rgba(0,0,0,0.03)}
.mi{padding:0.15em 0.45em;background:var(--surf);border-radius:6px;border:1px solid var(--bd)}

/* Image */
.fig{text-align:center;margin:0.25em 0}
.fig img{border-radius:var(--r);box-shadow:0 12px 40px rgba(0,0,0,0.15)}

/* Footer — sits at bottom without overlapping */
.sf{margin-top:auto;padding-top:18px;font-size:0.44em;color:var(--tx2);opacity:0.45;font-weight:500;letter-spacing:0.03em;display:flex;justify-content:space-between;flex-shrink:0}

/* Image full */
.if{display:flex!important;flex-direction:column;align-items:center;justify-content:center}
.if img{max-width:85%;max-height:52vh;border-radius:var(--r);box-shadow:0 16px 48px rgba(0,0,0,0.2)}

/* Big Number — dramatic single stat */
.big-num{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center;padding:50px 100px!important}
.big-num .bn-val{font-family:'${t.fontH}',Georgia,serif;font-size:5em;font-weight:900;color:var(--accent);line-height:1;letter-spacing:-0.04em;margin-bottom:0.1em}
.big-num .bn-lbl{font-size:0.85em;color:var(--tx2);font-weight:600;text-transform:uppercase;letter-spacing:0.12em}
.big-num .bn-desc{font-size:0.75em;color:var(--tx2);margin-top:0.8em;max-width:24em;line-height:1.5;font-weight:400}

/* Timeline */
.tl{position:relative;padding-left:2.5em;margin:0.4em 0}
.tl:before{content:'';position:absolute;left:0.7em;top:0.4em;bottom:0.4em;width:2px;background:linear-gradient(180deg,var(--accent),var(--a2));border-radius:1px}
.tl-item{position:relative;margin-bottom:0.7em;padding-left:1.2em}
.tl-item:before{content:'';position:absolute;left:-2.5em;top:0.45em;width:12px;height:12px;border-radius:50%;background:var(--accent);border:2px solid var(--bg);box-shadow:0 0 0 2px var(--accent)}
.tl-item .tl-date{font-size:0.6em;color:var(--accent);font-weight:700;text-transform:uppercase;letter-spacing:0.08em}
.tl-item .tl-title{font-weight:700;font-size:0.85em;margin:0.08em 0;color:var(--hd)}
.tl-item .tl-desc{font-size:0.72em;color:var(--tx2);line-height:1.45}

/* Logo Grid */
.lg{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:1em;margin:0.4em 0;align-items:center}
.lg-item{background:var(--surf);border:1px solid var(--bd);border-radius:var(--r);padding:0.8em;display:flex;align-items:center;justify-content:center;transition:transform 0.2s ease}
.lg-item:hover{transform:scale(1.04)}
.lg-item img{max-width:80%;max-height:60px;filter:grayscale(30%);opacity:0.85;transition:filter 0.2s ease,opacity 0.2s ease}
.lg-item:hover img{filter:grayscale(0%);opacity:1}

/* Flowchart */
.fc{display:flex;flex-wrap:wrap;gap:0.8em;justify-content:center;margin:0.4em 0}
.fc-node{background:var(--surf);border:2px solid var(--accent);border-radius:var(--r);padding:0.6em 1em;text-align:center;font-weight:600;font-size:0.82em;min-width:100px;position:relative;box-shadow:0 2px 10px rgba(0,0,0,0.04)}
.fc-node:after{content:'↓';display:block;color:var(--accent);font-size:1.1em;margin-top:0.4em;font-weight:700}
.fc-node:last-child:after{content:none}

/* Agenda */
.ag{display:flex;flex-direction:column;gap:0.5em;margin:0.3em 0}
.ag-item{display:flex;align-items:center;gap:1em;padding:0.5em 0;border-bottom:1px solid var(--bd)}
.ag-num{font-family:'${t.fontH}',Georgia,serif;font-size:1.8em;font-weight:800;color:var(--accent);min-width:1.5em;text-align:center;line-height:1}
.ag-title{font-weight:700;font-size:0.9em;color:var(--hd)}
.ag-desc{font-size:0.72em;color:var(--tx2)}

/* Contact */
.ctct{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center}
.ctct h1{font-size:3em;margin-bottom:0.3em}
.ctct .ctct-info{font-size:0.85em;color:var(--tx2);margin:0.3em 0;line-height:1.6}
.ctct .ctct-line{width:60px;height:4px;background:linear-gradient(90deg,var(--accent),var(--a2));border-radius:2px;margin:0.8em auto}

/* Team */
.tm{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1em;margin:0.4em 0}
.tm-card{background:var(--surf);border:1px solid var(--bd);border-radius:var(--r);padding:1em;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,0.03)}
.tm-card img{width:72px;height:72px;border-radius:50%;object-fit:cover;margin-bottom:0.6em;box-shadow:0 4px 16px rgba(0,0,0,0.1)}
.tm-name{font-weight:700;font-size:0.85em;color:var(--hd)}
.tm-role{font-size:0.7em;color:var(--accent);font-weight:600;margin-top:0.2em;text-transform:uppercase;letter-spacing:0.05em}
.tm-bio{font-size:0.68em;color:var(--tx2);margin-top:0.4em;line-height:1.4}

/* Dashboard */
.db{display:grid;grid-template-columns:1fr 1fr;gap:0.8em;margin:0.3em 0}
.db-chart{background:var(--surf);border:1px solid var(--bd);border-radius:var(--r);padding:0.6em;box-shadow:0 2px 8px rgba(0,0,0,0.03)}
.db-chart canvas{width:100%!important;height:180px!important}

/* Progress bars */
.pg{margin:0.3em 0}
.pg-bar{margin:0.5em 0}
.pg-lbl{display:flex;justify-content:space-between;font-size:0.75em;font-weight:600;margin-bottom:0.2em}
.pg-lbl .pg-val{color:var(--accent)}
.pg-track{height:8px;background:var(--grd);border-radius:4px;overflow:hidden}
.pg-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--accent),var(--a2));transition:width 0.6s ease}


/* Freeform layout container */
.ff{padding:30px 60px!important}
`
}

// ── Compiler ──

export function compileDeckToHTML(spec: DeckSpec): string {
  const cloned = JSON.parse(JSON.stringify(spec)) as DeckSpec
  const t = gt(cloned.meta.theme)
  const fixes = autoFix(cloned, t)
  if (fixes.length > 0) console.log('[Slidelang] Auto-fixed:', fixes.join(', '))
  const fw = `Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&DM+Serif+Display:ital@0;1&Lora:ital,wght@0,500;0,600;0,700;1,500;1,600&Space+Grotesk:wght@500;600;700`
  const slides = cloned.slides.map((s, i) => slide(s, i, t, cloned.meta)).join('\n')

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(cloned.meta.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${fw}&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<style>${css(t)}</style></head><body><div class="reveal"><div class="slides">
${slides}
</div></div>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/math/math.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script>Reveal.initialize({controls:true,progress:true,center:false,hash:true,transition:'fade',transitionSpeed:'default',width:1280,height:720,margin:0.04,plugins:[RevealMath.KaTeX]})</script></body></html>`
}

// ── Slide ──

function slide(s: Slide, i: number, t: T, m: DeckMeta): string {
  const bg = s.background ? ` style="background:${s.background}"` : ''
  const notes = s.notes ? `<aside class="notes">${esc(s.notes)}</aside>` : ''
  const ft = `<div class="sf"><span>${esc(s.title||'')}</span><span>${esc(m.title)}</span></div>`
  let c = ''
  switch (s.kind) {
    case 'title': c = hero(s, t, m); break
    case 'section': c = divider(s, t); break
    case 'quote': c = quote(s); break
    case 'two-column': c = twocol(s, t); break
    case 'comparison': c = comparison(s, t); break
    case 'image-full': c = imgFull(s, t); break
    case 'blank': c = freeform(s, t); break
    case 'big-number': c = bigNumber(s, t); break
    case 'timeline': c = timeline(s, t); break
    case 'logo-grid': c = logoGrid(s, t); break
    case 'flowchart': c = flowChart(s, t); break
    case 'kpi': c = kpiSlide(s, t); break
    case 'agenda': c = agendaSlide(s, t); break
    case 'contact': c = contactSlide(s, t); break
    case 'team': c = teamSlide(s, t); break
    case 'dashboard': c = dashboardSlide(s, t); break
    case 'progress': c = progressSlide(s, t); break
    default: c = standard(s, t)
  }
  const cls = s.blocks.some(b => b.position) ? 'ff' : ''
  return `      <section${bg} class="${cls}">\n<div class="slide-body">\n${c}\n</div>\n${notes}\n${ft}\n      </section>`
}

// ── Slide Layouts ──

function hero(s: Slide, t: T, m: DeckMeta): string {
  const p: string[] = []
  if (s.title) p.push(`<h1>${esc(s.title)}</h1>`)
  p.push(`<div class="hl"></div>`)
  if (s.subtitle) p.push(`<p class="hs">${esc(s.subtitle)}</p>`)
  if (m.author) p.push(`<p class="hm">${esc(m.author)}${m.date?' · '+esc(m.date):''}</p>`)
  const xtra = blox(s.blocks, t).trim()
  if (xtra) p.push(`<div style="margin-top:1.2em">${xtra}</div>`)
  return `<div class="hero">\n${p.join('\n')}\n</div>`
}

function divider(s: Slide, t: T): string {
  return `<div class="sec">
    <p class="sn">${esc(s.title||'')}</p>
    ${s.subtitle?`<p class="ss">${esc(s.subtitle)}</p>`:''}
  </div>`
}

function quote(s: Slide): string {
  const tb = s.blocks.find(b => b.type === 'text')
  const q = tb ? (tb as any).content : s.title || ''
  return `<div class="qt">
    <blockquote>${esc(q)}</blockquote>
    ${s.subtitle?`<p class="qa">— ${esc(s.subtitle)}</p>`:''}
  </div>`
}

function standard(s: Slide, t: T): string {
  const kpiVals = s.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'xlarge')
  const kpiLbls = s.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'small')
  const rest = s.blocks.filter(b => {
    if (b.type !== 'text') return true
    const sz = (b as any).style?.size
    return sz !== 'xlarge' && sz !== 'small'
  })

  const hasKPI = kpiVals.length >= 2
  const p: string[] = []
  if (s.title) p.push(`<h2><span class="ha">${esc(s.title)}</span></h2>`)
  if (s.subtitle) p.push(`<p style="color:var(--tx2);font-size:0.8em;margin-bottom:0.7em;font-weight:500;line-height:1.5">${esc(s.subtitle)}</p>`)

  if (hasKPI) {
    // Group values and labels by their order: each value paired with the corresponding label
    const n = Math.max(kpiVals.length, kpiLbls.length)
    const kpiCards: string[] = []
    for (let i = 0; i < n; i++) {
      const val = i < kpiVals.length ? esc((kpiVals[i] as any).content) : ''
      const lbl = i < kpiLbls.length ? esc((kpiLbls[i] as any).content) : ''
      kpiCards.push(`<div class="kp"><div class="kv">${val}</div><div class="kl">${lbl}</div></div>`)
    }
    p.push(`<div class="sr">${kpiCards.join('')}</div>`)
    if (rest.length > 0) p.push(blox(rest, t))
  } else {
    p.push(blox(s.blocks, t))
  }
  return p.join('\n')
}

function twocol(s: Slide, t: T): string {
  const mid = Math.ceil(s.blocks.length / 2)
  return `<h2><span class="ha">${esc(s.title||'')}</span></h2>
<div class="ct"><div>${blox(s.blocks.slice(0,mid),t)}</div><div>${blox(s.blocks.slice(mid),t)}</div></div>`
}

function comparison(s: Slide, t: T): string {
  const mid = Math.ceil(s.blocks.length / 2)
  const L = s.blocks.slice(0, mid), R = s.blocks.slice(mid)
  const lt = L.length > 0 && L[0].type === 'text' ? (L[0] as any).content : ''
  const rt = R.length > 0 && R[0].type === 'text' ? (R[0] as any).content : ''
  const lb = L.length > 0 && L[0].type === 'text' ? L.slice(1) : L
  const rb = R.length > 0 && R[0].type === 'text' ? R.slice(1) : R
  return `<h2><span class="ha">${esc(s.title||'')}</span></h2>
<div class="cmp">
  <div class="cp"><h3>${esc(lt)}</h3>${blox(lb,t)}</div>
  <div class="cp"><h3>${esc(rt)}</h3>${blox(rb,t)}</div>
</div>`
}

function imgFull(s: Slide, t: T): string {
  const ib = s.blocks.find(b => b.type === 'image') as any
  return `<div class="if">
    ${s.title?`<h2><span class="ha">${esc(s.title)}</span></h2>`:''}
    ${ib?`<img src="${esc(ib.source.url||'')}" alt="${esc(ib.source.alt||'')}"><p style="font-size:0.62em;color:var(--tx2);margin-top:0.5em;font-weight:500">${esc(ib.source.caption||'')}</p>`:'<p style="color:var(--tx2)">[No image]</p>'}
  </div>`
}

function freeform(s: Slide, t: T): string {
  if (!s.blocks.some(b => b.position)) return blox(s.blocks, t)
  return `<div style="position:relative;min-height:460px">${blox(s.blocks, t)}</div>`
}

// ── Big Number ──
function bigNumber(s: Slide, t: T): string {
  const val = s.blocks.find(b => b.type === 'text' && (b as any).style?.size === 'xlarge')
  const lbl = s.blocks.find(b => b.type === 'text' && (b as any).style?.size === 'small')
  const desc = s.blocks.find(b => b.type === 'text' && (!(b as any).style?.size || (b as any).style?.size === 'medium'))
  return `<div class="big-num">
    ${val ? `<div class="bn-val">${esc((val as any).content)}</div>` : ''}
    ${lbl ? `<div class="bn-lbl">${esc((lbl as any).content)}</div>` : ''}
    ${s.subtitle ? `<div class="bn-desc">${esc(s.subtitle)}</div>` : desc ? `<div class="bn-desc">${esc((desc as any).content)}</div>` : ''}
  </div>`
}

// ── KPI Grid ──
function kpiSlide(s: Slide, t: T): string {
  const kpiVals = s.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'xlarge')
  const kpiLbls = s.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'small')
  const rest = s.blocks.filter(b => {
    if (b.type !== 'text') return true
    const sz = (b as any).style?.size
    return sz !== 'xlarge' && sz !== 'small'
  })
  const n = Math.max(kpiVals.length, kpiLbls.length)
  const cards: string[] = []
  for (let i = 0; i < n; i++) {
    const val = i < kpiVals.length ? esc((kpiVals[i] as any).content) : ''
    const lbl = i < kpiLbls.length ? esc((kpiLbls[i] as any).content) : ''
    cards.push(`<div class="kp"><div class="kv">${val}</div><div class="kl">${lbl}</div></div>`)
  }
  const p: string[] = []
  if (s.title) p.push(`<h2><span class="ha">${esc(s.title)}</span></h2>`)
  if (s.subtitle) p.push(`<p style="color:var(--tx2);font-size:0.8em;margin-bottom:0.7em;font-weight:500;line-height:1.5">${esc(s.subtitle)}</p>`)
  p.push(`<div class="sr">${cards.join('')}</div>`)
  if (rest.length > 0) p.push(blox(rest, t))
  return p.join('\n')
}

// ── Timeline ──
function timeline(s: Slide, t: T): string {
  let html = ''
  if (s.title) html += `<h2><span class="ha">${esc(s.title)}</span></h2>`
  if (s.subtitle) html += `<p style="color:var(--tx2);font-size:0.8em;margin-bottom:0.7em">${esc(s.subtitle)}</p>`
  html += '<div class="tl">'

  // Try text blocks first: parse "Date — Title — Description" or "Date — Description"
  const texts = s.blocks.filter(b => b.type === 'text')
  if (texts.length > 0) {
    for (const tb of texts) {
      const content = (tb as any).content || ''
      const parts = content.split(' — ')
      if (parts.length >= 2) {
        const date = parts[0]
        const title = parts.length >= 3 ? parts[1] : ''
        const desc = parts.length >= 3 ? parts.slice(2).join(' — ') : parts.slice(1).join(' — ')
        if (title) {
          html += `<div class="tl-item"><div class="tl-date">${esc(date)}</div><div class="tl-title">${esc(title)}</div><div class="tl-desc">${esc(desc)}</div></div>`
        } else {
          html += `<div class="tl-item"><div class="tl-date">${esc(date)}</div><div class="tl-desc">${esc(desc)}</div></div>`
        }
      } else {
        html += `<div class="tl-item"><div class="tl-date">${esc(content)}</div></div>`
      }
    }
  } else {
    // Fallback to bullet/numbered lists
    const bullets = s.blocks.filter(b => b.type === 'bullets' || b.type === 'numbered')
    if (bullets.length > 0) {
      for (const b of bullets) {
        for (const item of (b as any).items) {
          const parts = item.split(' — ')
          const date = parts[0] || ''
          const desc = parts.slice(1).join(' — ')
          html += `<div class="tl-item"><div class="tl-date">${esc(date)}</div><div class="tl-desc">${esc(desc)}</div></div>`
        }
      }
    } else {
      html += '<p style="color:var(--tx2)">No timeline items found. Add text blocks with "Date — Description" format.</p>'
    }
  }

  html += '</div>'
  html += blox(s.blocks.filter(b => b.type !== 'text' && b.type !== 'bullets' && b.type !== 'numbered'), t)
  return html
}

// ── Logo Grid ──
function logoGrid(s: Slide, t: T): string {
  const imgs = s.blocks.filter(b => b.type === 'image')
  const p: string[] = []
  if (s.title) p.push(`<h2><span class="ha">${esc(s.title)}</span></h2>`)
  if (s.subtitle) p.push(`<p style="color:var(--tx2);font-size:0.8em;margin-bottom:0.7em">${esc(s.subtitle)}</p>`)
  p.push('<div class="lg">')
  imgs.forEach(b => {
    const img = (b as any).source
    p.push(`<div class="lg-item"><img src="${esc(img.url||'')}" alt="${esc(img.alt||'')}" loading="lazy"></div>`)
  })
  p.push('</div>')
  const rest = s.blocks.filter(b => b.type !== 'image')
  if (rest.length > 0) p.push(blox(rest, t))
  return p.join('\n')
}

// ── Flowchart ──
function flowChart(s: Slide, t: T): string {
  const nodes = s.blocks.filter(b => b.type === 'text')
  const p: string[] = []
  if (s.title) p.push(`<h2><span class="ha">${esc(s.title)}</span></h2>`)
  if (s.subtitle) p.push(`<p style="color:var(--tx2);font-size:0.8em;margin-bottom:0.7em">${esc(s.subtitle)}</p>`)
  p.push('<div class="fc">')
  nodes.forEach((b: any) => { p.push(`<div class="fc-node">${esc(b.content)}</div>`) })
  p.push('</div>')
  return p.join('\n')
}

// ── Agenda ──
function agendaSlide(s: Slide, t: T): string {
  const p: string[] = []
  if (s.title) p.push(`<h2><span class="ha">${esc(s.title)}</span></h2>`)
  p.push('<div class="ag">')
  s.blocks.forEach((b, i) => {
    if (b.type === 'text') {
      const c = (b as any).content
      const parts = c.split(' — ')
      const title = parts[0] || ''
      const desc = parts.slice(1).join(' — ')
      p.push(`<div class="ag-item"><div class="ag-num">${String(i+1).padStart(2,'0')}</div><div><div class="ag-title">${esc(title)}</div>${desc?`<div class="ag-desc">${esc(desc)}</div>`:''}</div></div>`)
    } else if (b.type === 'bullets' || b.type === 'numbered') {
      (b as any).items.forEach((item: string) => {
        const parts = item.split(' — ')
        p.push(`<div class="ag-item"><div class="ag-num">${String(i+1).padStart(2,'0')}</div><div><div class="ag-title">${esc(parts[0]||'')}</div>${parts[1]?`<div class="ag-desc">${esc(parts.slice(1).join(' — '))}</div>`:''}</div></div>`)
      })
    }
  })
  p.push('</div>')
  return p.join('\n')
}

// ── Contact / CTA ──
function contactSlide(s: Slide, t: T): string {
  const texts = s.blocks.filter(b => b.type === 'text').map((b: any) => b.content)
  return `<div class="ctct">
    ${s.title?`<h1>${esc(s.title)}</h1>`:''}
    <div class="ctct-line"></div>
    ${s.subtitle?`<p style="font-size:1.1em;color:var(--tx2);margin-bottom:0.8em">${esc(s.subtitle)}</p>`:''}
    ${texts.map(txt => `<p class="ctct-info">${esc(txt)}</p>`).join('')}
  </div>`
}

// ── Team ──
function teamSlide(s: Slide, t: T): string {
  const imgs = s.blocks.filter(b => b.type === 'image')
  const texts = s.blocks.filter(b => b.type === 'text')
  const p: string[] = []
  if (s.title) p.push(`<h2><span class="ha">${esc(s.title)}</span></h2>`)
  p.push('<div class="tm">')
  for (let i = 0; i < texts.length; i += 2) {
    const name = (texts[i] as any).content || ''
    const role = i + 1 < texts.length ? (texts[i + 1] as any).content : ''
    const img = imgs[i / 2]
    p.push(`<div class="tm-card">
      ${img?`<img src="${esc((img as any).source.url||'')}" alt="${esc((img as any).source.alt||name)}">`:'<div style="width:72px;height:72px;border-radius:50%;background:var(--grd);margin:0 auto 0.6em;display:flex;align-items:center;justify-content:center;font-size:1.5em;color:var(--accent);font-weight:700">${name.charAt(0).toUpperCase()}</div>'}
      <div class="tm-name">${esc(name)}</div>
      ${role?`<div class="tm-role">${esc(role)}</div>`:''}
    </div>`)
  }
  p.push('</div>')
  return p.join('\n')
}

// ── Dashboard ──
function dashboardSlide(s: Slide, t: T): string {
  const charts = s.blocks.filter(b => b.type === 'chart')
  const p: string[] = []
  if (s.title) p.push(`<h2><span class="ha">${esc(s.title)}</span></h2>`)
  p.push('<div class="db">')
  charts.forEach(b => { p.push(`<div class="db-chart">${blox([b], t)}</div>`) })
  p.push('</div>')
  return p.join('\n')
}

// ── Progress ──
function progressSlide(s: Slide, t: T): string {
  const p: string[] = []
  if (s.title) p.push(`<h2><span class="ha">${esc(s.title)}</span></h2>`)
  p.push('<div class="pg">')
  const texts = s.blocks.filter(b => b.type === 'text')
  for (let i = 0; i < texts.length; i += 2) {
    const label = (texts[i] as any).content || ''
    const val = i + 1 < texts.length ? (texts[i + 1] as any).content : ''
    const pct = parseFloat(val) || 0
    p.push(`<div class="pg-bar"><div class="pg-lbl"><span>${esc(label)}</span><span class="pg-val">${esc(val)}</span></div><div class="pg-track"><div class="pg-fill" style="width:${Math.min(100,Math.max(0,pct))}%"></div></div></div>`)
  }
  p.push('</div>')
  return p.join('\n')
}

// ── Blocks ──

function blox(bs: SlideBlock[], t: T): string { return bs.map(b => block(b, t)).join('\n') }

function block(b: SlideBlock, t: T): string {
  let inner = ''
  switch (b.type) {
    case 'text': inner = txt(b); break
    case 'bullets': case 'numbered': inner = lst(b); break
    case 'chart': inner = chrt(b, t); break
    case 'math': inner = math(b); break
    case 'image': inner = img(b); break
  }
  return pos(b, inner)
}

function txt(b: Extract<SlideBlock, { type: 'text' }>): string {
  const st = b.style || {}
  const sz: Record<string, string> = { small: '0.68em', medium: '0.82em', large: '1.08em', xlarge: '1.7em' }
  const css: string[] = ['line-height:1.65', 'margin:0.22em 0']
  if (st.bold) css.push('font-weight:700')
  if (st.italic) css.push('font-style:italic')
  if (st.size) css.push(`font-size:${sz[st.size]||'0.82em'}`)
  if (st.color) css.push(`color:${st.color}`)
  if (st.align) css.push(`text-align:${st.align}`)
  return `<p style="${css.join(';')}">${esc(b.content)}</p>`
}

function lst(b: Extract<SlideBlock, { type: 'bullets' }|{ type: 'numbered' }>): string {
  const tag = b.type === 'numbered' ? 'ol' : 'ul'
  return `<${tag}>${b.items.map(i=>`<li>${esc(i)}</li>`).join('')}</${tag}>`
}

function chrt(b: Extract<SlideBlock, { type: 'chart' }>, t: T): string {
  const labels = JSON.stringify(b.labels.map(String))
  const datasets = JSON.stringify(b.datasets.map(d => ({ label: d.label, data: d.values, color: d.color || t.c.acc })))
  const id = `c${Math.random().toString(36).slice(2,8)}`
  const pal = [t.c.acc, t.c.a2, t.c.wrn, t.c.err, t.c.ok]
  const ct = b.chartType || 'bar'

  if (ct === 'donut' || ct === 'pie') {
    return chrtDonut(b, t, labels, datasets, id, pal)
  }
  if (ct === 'scatter') {
    return chrtScatter(b, t, labels, datasets, id, pal)
  }
  return chrtBar(b, t, labels, datasets, id, pal)
}

function chrtBar(b: Extract<SlideBlock, { type: 'chart' }>, t: T, labels: string, datasets: string, id: string, pal: string[]): string {
  return `<div class="cb">
    ${b.title?`<div class="ctt">${esc(b.title)}</div>`:''}
    <canvas id="${id}" style="width:100%;height:300px"></canvas>
  </div>
  <script>(()=>{const c=document.getElementById('${id}');if(!c)return;const ctx=c.getContext('2d');if(!ctx)return;const dpr=window.devicePixelRatio||1;const w=c.parentElement.clientWidth-20,h=300;c.width=w*dpr;c.height=h*dpr;c.style.width=w+'px';c.style.height=h+'px';ctx.scale(dpr,dpr);const data={labels:${labels},datasets:${datasets}};const pad={t:28,b:46,l:56,r:20},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;const maxV=Math.max(...data.datasets.flatMap(d=>d.data.map(v=>v)),1);const pal=['${t.c.acc}','${t.c.a2}','${t.c.wrn}','${t.c.err}','${t.c.ok}'];
  ctx.strokeStyle='${t.c.grd}';ctx.lineWidth=1;for(let i=0;i<=4;i++){const y=pad.t+ch*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillStyle='${t.c.tx2}';ctx.font='600 10px Inter,sans-serif';ctx.textAlign='right';ctx.fillText(Math.round(maxV*(1-i/4)),pad.l-6,y+4)}
  const gap=data.labels.length>1?cw/data.labels.length:80;const barW=Math.min(gap*0.5,44);const groupW=barW*data.datasets.length;const gg=(gap-groupW)/2;
  data.datasets.forEach((ds,di)=>{const col=ds.color||pal[di%pal.length];ds.data.forEach((v,vi)=>{const x=pad.l+vi*gap+gg+di*barW;const bh=Math.max((v/maxV)*ch,2);const y=pad.t+ch-bh;const grd=ctx.createLinearGradient(x,pad.t,x,pad.t+ch);grd.addColorStop(0,col);grd.addColorStop(1,col+'22');ctx.fillStyle=grd;ctx.beginPath();ctx.roundRect(x,y,barW-3,bh,[5,5,0,0]);ctx.fill();ctx.fillStyle='${t.c.tx2==='#a3a3a3'?'#404040':t.c.tx}';ctx.font='600 11px Inter,sans-serif';ctx.textAlign='center';ctx.fillText(Math.round(v),x+(barW-3)/2,y-7)})});
  ctx.fillStyle='${t.c.tx}';ctx.font='600 11px Inter,sans-serif';ctx.textAlign='center';data.labels.forEach((l,vi)=>{ctx.fillText(String(l),pad.l+vi*gap+gap/2,h-12)});
  let lx=pad.l;ctx.textAlign='left';data.datasets.forEach((ds,di)=>{ctx.fillStyle=ds.color||pal[di%pal.length];ctx.beginPath();ctx.arc(lx+5,h-30,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='${t.c.tx2}';ctx.font='600 10px Inter,sans-serif';ctx.fillText(ds.label,lx+14,h-24);lx+=ctx.measureText(ds.label).width+34})})()</script>`
}

function chrtDonut(b: Extract<SlideBlock, { type: 'chart' }>, t: T, labels: string, datasets: string, id: string, pal: string[]): string {
  const lblStr = JSON.stringify(b.labels)
  return '<div class="cb">' +
    (b.title ? '<div class="ctt">' + esc(b.title) + '</div>' : '') +
    '<canvas id="' + id + '" style="width:100%;height:300px"></canvas></div>' +
    '<script>(()=>{const c=document.getElementById(\'' + id + '\');if(!c)return;const ctx=c.getContext(\'2d\');if(!ctx)return;const dpr=window.devicePixelRatio||1;const w=c.parentElement.clientWidth-20,h=300;c.width=w*dpr;c.height=h*dpr;c.style.width=w+\'px\';c.style.height=h+\'px\';ctx.scale(dpr,dpr);const data={labels:' + lblStr + ',datasets:' + datasets + '};const cx=w/2,cy=h/2-10,r=Math.min(w,h)/2-55,ir=r*0.55;const ds=data.datasets[0];const total=ds.data.reduce(function(a,v){return a+v},0);if(total===0)return;const colors=[\'' + t.c.acc + '\',\'' + t.c.a2 + '\',\'' + t.c.wrn + '\',\'' + t.c.err + '\',\'' + t.c.ok + '\'];let angle=-Math.PI/2;' +
    'ds.data.forEach(function(v,i){var slice=v/total*Math.PI*2;var color=ds.color||colors[i%colors.length];ctx.fillStyle=color;ctx.beginPath();ctx.arc(cx,cy,r,angle,angle+slice);ctx.arc(cx,cy,ir,angle+slice,angle,true);ctx.closePath();ctx.fill();var mid=angle+slice/2;var pct=Math.round(v/total*100);if(pct>5){var lx=cx+Math.cos(mid)*(r+ir)/2,ly=cy+Math.sin(mid)*(r+ir)/2;ctx.fillStyle=\'#ffffff\';ctx.font=\'600 12px Inter,sans-serif\';ctx.textAlign=\'center\';ctx.textBaseline=\'middle\';ctx.fillText(pct+\'%\',lx,ly)}angle+=slice});' +
    'var lx=20,ly=h-20;ds.data.forEach(function(v,i){var color=ds.color||colors[i%colors.length];var pct=Math.round(v/total*100);ctx.fillStyle=color;ctx.fillRect(lx,ly-8,10,10);ctx.fillStyle=\'' + t.c.tx + '\';ctx.font=\'600 10px Inter,sans-serif\';ctx.textAlign=\'left\';ctx.fillText(data.labels[i]+\' \'+pct+\'%\',lx+14,ly);lx+=ctx.measureText(data.labels[i]+\' \'+pct+\'%\').width+28})})()</script>'
}

function chrtScatter(b: Extract<SlideBlock, { type: 'chart' }>, t: T, labels: string, datasets: string, id: string, pal: string[]): string {
  const lblStr = JSON.stringify(b.labels)
  return '<div class="cb">' +
    (b.title ? '<div class="ctt">' + esc(b.title) + '</div>' : '') +
    '<canvas id="' + id + '" style="width:100%;height:320px"></canvas></div>' +
    '<script>(()=>{const c=document.getElementById(\'' + id + '\');if(!c)return;const ctx=c.getContext(\'2d\');if(!ctx)return;const dpr=window.devicePixelRatio||1;const w=c.parentElement.clientWidth-20,h=320;c.width=w*dpr;c.height=h*dpr;c.style.width=w+\'px\';c.style.height=h+\'px\';ctx.scale(dpr,dpr);const data={labels:' + lblStr + ',datasets:' + datasets + '};const pad={t:24,b:44,l:60,r:24},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;const allVals=[];data.datasets.forEach(function(d){allVals.push.apply(allVals,d.data)});const maxV=Math.max.apply(null,allVals)||1;const colors=[\'' + t.c.acc + '\',\'' + t.c.a2 + '\',\'' + t.c.wrn + '\',\'' + t.c.err + '\',\'' + t.c.ok + '\'];' +
    'ctx.strokeStyle=\'' + t.c.grd + '\';ctx.lineWidth=1;for(var i=0;i<=5;i++){var y=pad.t+ch*i/5;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillStyle=\'' + t.c.tx2 + '\';ctx.font=\'600 10px Inter,sans-serif\';ctx.textAlign=\'right\';ctx.fillText(Math.round(maxV*(1-i/5)),pad.l-6,y+4)}' +
    'data.datasets.forEach(function(ds,di){var color=ds.color||colors[di%colors.length];ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.beginPath();' +
    'ds.data.forEach(function(v,vi){var x=pad.l+vi*cw/(Math.max(ds.data.length-1,1));var y=pad.t+ch-(v/maxV)*ch;if(vi===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.stroke();' +
    'ds.data.forEach(function(v,vi){var x=pad.l+vi*cw/(Math.max(ds.data.length-1,1));var y=pad.t+ch-(v/maxV)*ch;' +
    'ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();' +
    'ctx.fillStyle=\'#ffffff\';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill()})});' +
    'ctx.fillStyle=\'' + t.c.tx + '\';ctx.font=\'600 11px Inter,sans-serif\';ctx.textAlign=\'center\';data.labels.forEach(function(l,vi){ctx.fillText(String(l),pad.l+vi*cw/(Math.max(data.labels.length-1,1)),h-12)});' +
    'var lx=pad.l;ctx.textAlign=\'left\';data.datasets.forEach(function(ds,di){ctx.fillStyle=ds.color||colors[di%colors.length];ctx.beginPath();ctx.arc(lx+5,h-30,5,0,Math.PI*2);ctx.fill();ctx.fillStyle=\'' + t.c.tx2 + '\';ctx.font=\'600 10px Inter,sans-serif\';ctx.fillText(ds.label,lx+14,h-24);lx+=ctx.measureText(ds.label).width+34})})()</script>'
}

function math(b: Extract<SlideBlock, { type: 'math' }>): string {
  return b.inline ? `<span class="mi">$${esc(b.expression)}$</span>` : `<div class="mb">$$${esc(b.expression)}$$</div>`
}

function img(b: Extract<SlideBlock, { type: 'image' }>): string {
  const s = b.source
  if (!s.url) return `<p style="color:var(--tx2)">[Image URL missing]</p>`
  return `<figure class="fig">
    <img src="${esc(s.url)}" alt="${esc(s.alt||'')}" style="max-width:85%;max-height:45vh;${s.width?'width:'+s.width+';':''}${s.height?'height:'+s.height+';':''}" loading="lazy">
    ${s.caption?`<figcaption style="font-size:0.62em;color:var(--tx2);margin-top:0.4em;font-weight:500">${esc(s.caption)}</figcaption>`:''}
  </figure>`
}

// ── Spatial Positioning ──

function pos(b: SlideBlock, inner: string): string {
  if (!b.position) return inner
  const pct = b.position.unit !== 'px'
  const s = [`position:absolute`,`left:${b.position.x}${pct?'%':'px'}`,`top:${b.position.y}${pct?'%':'px'}`]
  if (b.position.width) s.push(`width:${b.position.width}${pct?'%':'px'}`)
  if (b.position.height) s.push(`height:${b.position.height}${pct?'%':'px'}`)
  if (b.position.zIndex) s.push(`z-index:${b.position.zIndex}`)
  return `<div style="${s.join(';')}">\n${inner}\n</div>`
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// ── Auto-fix engine — catches and corrects issues during compilation ──

function autoFix(spec: DeckSpec, t: T): string[] {
  const fixes: string[] = []

  for (const slide of spec.slides) {
    for (const block of slide.blocks) {
      if (block.type === 'text') {
        // Fix 1: low-contrast text colors → use theme default
        if (block.style?.color && t.c.bg) {
          const cr = _contrastRatio(block.style.color, t.c.bg)
          if (cr < 3.0) {
            block.style.color = t.c.tx
            fixes.push(`Low-contrast text "${block.content.slice(0,20)}" (${cr.toFixed(1)}:1) → auto-fixed to theme text color`)
          }
        }
        // Fix 2: KPI values too long → reduce font size
        if (block.style?.size === 'xlarge' && block.content.length > 7) {
          block.style.size = 'large'
          fixes.push(`KPI value "${block.content}" too long for card → font reduced to large`)
        }
      }
    }
  }

  return fixes
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : null
}

function _contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1), rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 21
  const lum = (r: number, g: number, b: number) => {
    const lin = (c: number) => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4) }
    return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b)
  }
  const l1 = lum(...rgb1), l2 = lum(...rgb2)
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)
}
