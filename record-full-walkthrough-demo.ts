import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { chromium } from '@playwright/test'
import { createServer } from 'http'
import { compileDeckToHTML } from './src/dsl/compiler.ts'

const PORT = 6699
const OUTPUT = process.argv[2] || 'full-walkthrough-demo.mp4'
const VOICE = process.argv[3] || 'Samantha'

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function serve() {
  const s = createServer((_req, res) => {
    let fp = ((_req.url || '/').split('?')[0]).replace(/^\/slidelang\/?/, '/')
    if (fp === '' || fp === '/') fp = '/index.html'
    try {
      const full = join(process.cwd(), 'dist', fp)
      const mt = fp.endsWith('.js') ? 'application/javascript' : fp.endsWith('.css') ? 'text/css' : 'text/html'
      res.writeHead(200, { 'Content-Type': mt }); res.end(readFileSync(full))
    } catch { res.writeHead(404); res.end() }
  })
  return new Promise<{ close: () => void }>(r => s.listen(PORT, () => r({ close: () => s.close() })))
}

function speak(text: string, tmpDir: string, i: number): string {
  const clean = text.replace(/["'`]/g, '').replace(/[&|;$<>]/g, ' ').slice(0, 300)
  const path = join(tmpDir, `a${String(i).padStart(3, '0')}.aiff`)
  execSync(`say -v "${VOICE}" -r 160 -o "${path}" "${clean}"`, { timeout: 15000 })
  return path
}

async function main() {
  execSync('npx vite build', { cwd: process.cwd(), timeout: 30000, stdio: 'pipe' })
  const tmp = join(process.env.TMPDIR || '/tmp', `walk-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  const screenshots: string[] = []
  const audioFiles: string[] = []
  let idx = 0

  function snap(name: string) {
    const p = join(tmp, name); screenshots.push(p)
    return page.screenshot({ path: p, type: 'png' })
  }

  console.log('Serving...')
  const { close } = await serve()
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 } })

  // Load showcase deck
  const spec = JSON.parse(readFileSync('examples/showcase.json', 'utf-8'))
  await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.evaluate((s: string) => localStorage.setItem('slidelang_deck', s), JSON.stringify(spec))
  await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'load', timeout: 15000 })
  await sleep(2500)
  try { const b = page.locator('button').filter({ hasText: 'Skip' }); if (await b.isVisible({ timeout: 1500 })) { await b.click(); await sleep(500) } } catch { /* */ }

  // ── PART 1: Open editor and navigate slides ──
  audioFiles.push(speak('Slidelang — deck-as-code authoring platform. Loaded here is a showcase deck with all twenty slide kinds.', tmp, idx++))
  await snap('w00-loaded.png')
  await sleep(3000)

  try {
    const ed = page.locator('button').filter({ hasText: /Editor/ }).first()
    if (!(await ed.isVisible({ timeout: 2000 }))) throw new Error('no editor')
    await ed.click()
    await sleep(1500)
    await snap('w01-editor-open.png')
    audioFiles.push(speak('Opening the editor reveals the full JSON specification. Each slide has a kind, title, and blocks array. We can navigate through slides using the editor tabs.', tmp, idx++))
    await sleep(4000)

    // Navigate through key slides in the editor by clicking the editor's slide tabs
    const keySlides = [
      { idx: 3, label: 'content slide with bullet points' },
      { idx: 7, label: 'bar chart slide with Canvas 2D rendering' },
      { idx: 9, label: 'KPI dashboard with auto-detected card grid' },
      { idx: 11, label: 'dashboard slide with dual charts' },
      { idx: 17, label: 'timeline slide with visual markers' },
      { idx: 20, label: 'math slide with KaTeX formulas' },
      { idx: 21, label: 'flowchart slide with connected nodes' },
    ]

    for (const ks of keySlides) {
      // Click the editor slide tab
      const tabs = page.locator('button').filter({ hasText: new RegExp(`${ks.idx + 1}\\.`) })
      if (await tabs.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await tabs.first().click()
        await sleep(1000)
        await snap(`w-ed-${String(ks.idx).padStart(2, '0')}.png`)
        audioFiles.push(speak(`Slide ${ks.idx + 1}: a ${ks.label}. The JSON on the left defines the structure, and the preview on the right shows the live output.`, tmp, idx++))
        await sleep(3500)
      }
    }

    await ed.click()
    await sleep(500)
  } catch(e) { console.log('Editor nav:', String(e)) }

  // ── PART 2: Theme builder ──
  try {
    const th = page.locator('button').filter({ hasText: /Theme/ }).first()
    if (await th.isVisible({ timeout: 1500 })) {
      await th.click(); await sleep(1200)
      await snap('w02-theme.png')
      audioFiles.push(speak('The theme builder provides eight presets with twelve color variables each. You can also select heading and body fonts from Google Fonts. Changes apply instantly.', tmp, idx++))
      await sleep(4500)
      await th.click(); await sleep(500)
    }
  } catch { /* */ }

  // ── PART 3: Browse preview slides ──
  for (let i = 0; i < 5; i++) { await page.keyboard.press('ArrowRight'); await sleep(500) }
  await snap('w03-slides.png')
  audioFiles.push(speak('Browsing through slides in the live preview. Each slide kind has a dedicated layout renderer that matches the compiled HTML output exactly.', tmp, idx++))
  await sleep(4000)

  for (let i = 0; i < 8; i++) { await page.keyboard.press('ArrowRight'); await sleep(400) }
  await snap('w04-charts.png')
  audioFiles.push(speak('Charts are rendered with Canvas 2D — bar, line, pie, and donut. Zero external charting library dependencies. KPIs auto-detect from text size pairs.', tmp, idx++))
  await sleep(4500)

  for (let i = 0; i < 8; i++) { await page.keyboard.press('ArrowRight'); await sleep(300) }
  await snap('w05-math.png')
  audioFiles.push(speak('Math formulas via KaTeX. Timelines with visual markers and description text. Flowcharts with auto-connected nodes.', tmp, idx++))
  await sleep(3500)

  // ── PART 4: COMPILED HTML output ──
  audioFiles.push(speak('Now let us see the compiled HTML output — the final presentation that gets exported.', tmp, idx++))
  await sleep(2500)

  await browser.close()
  close()

  // Render compiled HTML via Playwright
  const html = compileDeckToHTML(spec)
  const htmlFile = join(tmp, 'compiled.html')
  writeFileSync(htmlFile, html)

  const s2 = createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html) })
  await new Promise<void>(r => s2.listen(6799, () => r()))

  const b2 = await chromium.launch({ headless: true })
  const p2 = await b2.newPage({ viewport: { width: 1280, height: 720 } })
  await p2.goto('http://localhost:6799', { waitUntil: 'load', timeout: 15000 })
  await p2.waitForSelector('.reveal .slides section', { timeout: 10000 })
  await p2.waitForTimeout(3000)

  await p2.screenshot({ path: join(tmp, 'c00-title.png') })
  screenshots.push(join(tmp, 'c00-title.png'))
  audioFiles.push(speak('Here is the compiled HTML output. Self-contained, with Reveal.js, all themes, charts, math, and fonts included. No build step needed. Just open and present.', tmp, idx++))
  await sleep(5000)

  const compiledSlides = [0, 3, 7, 9, 11, 17, 20, 21]
  for (let i = 0; i <= Math.max(...compiledSlides); i++) {
    if (i > 0) { await p2.keyboard.press('ArrowRight'); await p2.waitForTimeout(500) }
    if (compiledSlides.includes(i)) {
      const fp = join(tmp, `c-${String(i).padStart(2, '0')}.png`)
      await p2.screenshot({ path: fp })
      screenshots.push(fp)
    }
  }
  audioFiles.push(speak('The compiled output matches the editor preview exactly. Charts render with Canvas 2D, math with KaTeX, and all theme colors are baked in. This is the final deliverable — a single HTML file ready to present.', tmp, idx++))
  await sleep(5000)

  // Navigate back and show presentation controls
  for (let i = 0; i < 5; i++) { await p2.keyboard.press('ArrowLeft'); await p2.waitForTimeout(300) }
  await p2.waitForTimeout(500)

  for (let i = 0; i < 5; i++) { await p2.keyboard.press('ArrowRight'); await p2.waitForTimeout(600) }
  audioFiles.push(speak('The presentation includes keyboard navigation, fragment animations, and full-screen support. Ready for any audience, any device.', tmp, idx++))
  await sleep(4000)

  await b2.close()
  s2.close()

  // ── Composite ──
  console.log(`Compositing ${screenshots.length} screenshots with ${audioFiles.length} audio clips...`)
  let aConcat = ''
  for (const a of audioFiles) {
    try {
      const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${a}"`, { timeout: 5000 }).toString().trim()) || 2
      aConcat += `file '${a}'\nduration ${d + 0.6}\n`
    } catch { aConcat += `file '${a}'\nduration 3\n` }
  }
  writeFileSync(join(tmp, 'alist.txt'), aConcat)
  const audioOut = join(tmp, 'narration.m4a')
  execSync(`ffmpeg -y -f concat -safe 0 -i "${join(tmp, 'alist.txt')}" -c:a aac -b:a 128k "${audioOut}"`, { timeout: 30000, stdio: 'pipe' })

  let vConcat = ''
  for (const s of screenshots) { vConcat += `file '${s}'\nduration 5\n` }
  writeFileSync(join(tmp, 'vlist.txt'), vConcat)

  const final = join(process.cwd(), OUTPUT)
  execSync(`ffmpeg -y -f concat -safe 0 -i "${join(tmp, 'vlist.txt')}" -i "${audioOut}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -vf "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2" "${final}"`, { timeout: 120000, stdio: 'pipe' })

  const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${final}"`).toString().trim()
  const sz = execSync(`ls -lh "${final}" | awk '{print $5}'`).toString().trim()
  console.log(`Done: ${OUTPUT} — ${sz}, ${parseFloat(dur).toFixed(1)}s`)
}

main().catch(e => { console.error(e); process.exit(1) })
