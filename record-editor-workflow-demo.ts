import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { chromium } from '@playwright/test'
import { createServer } from 'http'

const PORT = 6499
const OUTPUT = process.argv[2] || 'editor-workflow-demo.mp4'
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
  const clean = text.replace(/["'`]/g, '').replace(/[&|;$<>]/g, ' ').slice(0, 250)
  const path = join(tmpDir, `a${String(i).padStart(3, '0')}.aiff`)
  execSync(`say -v "${VOICE}" -o "${path}" "${clean}"`, { timeout: 15000 })
  return path
}

async function main() {
  execSync('npx vite build', { cwd: process.cwd(), timeout: 30000, stdio: 'pipe' })
  const tmp = join(process.env.TMPDIR || '/tmp', `edwork-${Date.now()}`)
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

  // Load showcase spec
  const spec = JSON.parse(readFileSync('examples/showcase.json', 'utf-8'))
  await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.evaluate((s: string) => localStorage.setItem('slidelang_deck', s), JSON.stringify(spec))
  await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'load', timeout: 15000 })
  await sleep(2500)
  try { const b = page.locator('button').filter({ hasText: 'Skip' }); if (await b.isVisible({ timeout: 1500 })) { await b.click(); await sleep(500) } } catch { /* */ }

  // ── Scene: Editor deep dive ──
  try {
    const editorBtn = page.locator('button').filter({ hasText: /Editor/ }).first()
    if (!(await editorBtn.isVisible({ timeout: 2000 }))) throw new Error('no editor')
    await editorBtn.click(); await sleep(1500)

    // Go to a content slide with text
    for (let i = 0; i < 3; i++) { await page.keyboard.press('ArrowRight'); await sleep(300) }
    await sleep(500)
    await snap('ed-01-content-slide.png')
    audioFiles.push(speak('Opening the editor reveals the full deck specification. Here we see a content slide with bullet points. Every element maps to a JSON field you can edit.', tmp, idx++))
    await sleep(3500)

    // Navigate to a chart slide
    for (let i = 0; i < 5; i++) { await page.keyboard.press('ArrowRight'); await sleep(300) }
    await sleep(500)
    await snap('ed-02-chart.png')
    audioFiles.push(speak('Chart slides include the chart type, labels, and datasets in the JSON. The bar chart renders with Canvas 2D using the theme accent colors. No external charting library needed.', tmp, idx++))
    await sleep(4000)

    // Navigate to KPI slide
    for (let i = 0; i < 1; i++) { await page.keyboard.press('ArrowRight'); await sleep(300) }
    await sleep(500)
    await snap('ed-03-kpi.png')
    audioFiles.push(speak('KPI dashboards are auto-detected from extra large and small text pairs in the blocks array. The compiler automatically creates the card grid layout.', tmp, idx++))
    await sleep(3500)

    // Navigate to math slide
    for (let i = 0; i < 11; i++) { await page.keyboard.press('ArrowRight'); await sleep(300) }
    await sleep(500)
    await snap('ed-04-math.png')
    audioFiles.push(speak('Math slides embed LaTeX expressions directly in the JSON. KaTeX renders them beautifully without any manual formatting.', tmp, idx++))
    await sleep(3000)

    // Go back to first slide and open theme panel
    for (let i = 0; i < 22; i++) { await page.keyboard.press('ArrowLeft'); await sleep(100) }
    await sleep(800)

    await editorBtn.click(); await sleep(500)
  } catch(e) { console.log('Editor scene error:', String(e)) }

  // ── Scene: Theme customization ──
  try {
    const themeBtn = page.locator('button').filter({ hasText: /Theme/ }).first()
    if (await themeBtn.isVisible({ timeout: 1500 })) {
      await themeBtn.click(); await sleep(1200)
      await snap('ed-05-theme.png')
      audioFiles.push(speak('The theme builder provides eight presets with twelve color variables each. Customize the accent, background, text, borders, and more. Custom themes persist across sessions.', tmp, idx++))
      await sleep(4000)

      audioFiles.push(speak('Eight heading fonts and eight body fonts are available from Google Fonts. Changes apply instantly to the preview and are compiled into the exported HTML.', tmp, idx++))
      await sleep(3500)

      await themeBtn.click(); await sleep(500)
    }
  } catch { /* */ }

  // ── Scene: Drag and drop ──
  audioFiles.push(speak('Slides can be reordered by dragging and dropping the thumbnails in the strip below. The preview updates in real time.', tmp, idx++))
  await sleep(2500)

  // ── Scene: Presentation mode ──
  try {
    const presentBtn = page.locator('button').filter({ hasText: /Present/ }).first()
    if (await presentBtn.isVisible({ timeout: 1500 })) {
      await presentBtn.click(); await sleep(2000)
      await snap('ed-06-present.png')
      audioFiles.push(speak('Full-screen presentation mode with keyboard navigation. Arrow keys or space to advance. A progress bar shows your position, and the slide counter is always visible.', tmp, idx++))
      await sleep(4000)

      for (let i = 0; i < 5; i++) { await page.keyboard.press('ArrowRight'); await sleep(800) }
      audioFiles.push(speak('The presentation respects the selected theme colors throughout. Escape to exit and return to the editor.', tmp, idx++))
      await sleep(2500)

      await page.keyboard.press('Escape'); await sleep(800)
    }
  } catch { /* */ }

  // ── Scene: Export ──
  audioFiles.push(speak('When your deck is ready, export to self-contained HTML. The file includes everything — Reveal.js, charts, math, fonts, and transitions. No server, no build step. Just open and present.', tmp, idx++))
  await sleep(4000)

  audioFiles.push(speak('Slidelang: structured deck authoring where humans and AI collaborate to create editable, presentable, and shareable presentations.', tmp, idx++))
  await sleep(3000)

  await browser.close()
  close()

  // ── Composite ──
  console.log('Compositing...')
  let aConcat = ''
  for (const a of audioFiles) {
    try {
      const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${a}"`, { timeout: 5000 }).toString().trim()) || 2
      aConcat += `file '${a}'\nduration ${d + 0.5}\n`
    } catch { aConcat += `file '${a}'\nduration 3\n` }
  }
  writeFileSync(join(tmp, 'alist.txt'), aConcat)
  const audioOut = join(tmp, 'narration.m4a')
  execSync(`ffmpeg -y -f concat -safe 0 -i "${join(tmp, 'alist.txt')}" -c:a aac -b:a 128k "${audioOut}"`, { timeout: 30000, stdio: 'pipe' })

  let vConcat = ''
  for (const s of screenshots) { vConcat += `file '${s}'\nduration 6\n` }
  writeFileSync(join(tmp, 'vlist.txt'), vConcat)

  const final = join(process.cwd(), OUTPUT)
  execSync(`ffmpeg -y -f concat -safe 0 -i "${join(tmp, 'vlist.txt')}" -i "${audioOut}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest -vf "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2" "${final}"`, { timeout: 120000, stdio: 'pipe' })

  const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${final}"`).toString().trim()
  const sz = execSync(`ls -lh "${final}" | awk '{print $5}'`).toString().trim()
  console.log(`Done: ${OUTPUT} — ${sz}, ${parseFloat(dur).toFixed(1)}s`)
}

main().catch(e => { console.error(e); process.exit(1) })
