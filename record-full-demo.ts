import { compileDeckToHTML } from './src/dsl/compiler.ts'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { chromium } from '@playwright/test'
import { createServer } from 'http'

const OLLAMA = 'http://localhost:11434'
const PORT = 6299
const OUTPUT = process.argv[2] || 'slidelang-full-demo.mp4'
const VOICE = process.argv[3] || 'Samantha'

const SPEC = JSON.parse(readFileSync('examples/showcase.json', 'utf-8'))
const SPEC_STR = JSON.stringify(SPEC)

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function serve() {
  const s = createServer((_req, res) => {
    let fp = ((_req.url || '/').split('?')[0]).replace(/^\/slidelang\/?/, '/')
    if (fp === '' || fp === '/') fp = '/index.html'
    try {
      const full = join(process.cwd(), 'dist', fp)
      const mt = fp.endsWith('.js') ? 'application/javascript' : fp.endsWith('.css') ? 'text/css' : fp.endsWith('.svg') ? 'image/svg+xml' : 'text/html'
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

  const tmp = join(process.env.TMPDIR || '/tmp', `fulldemo-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  const audioFiles: string[] = []
  const screenshots: string[] = []
  let idx = 0

  console.log('Building app...')
  const { close } = await serve()

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 } })

  function snap(name: string) {
    const p = join(tmp, name)
    screenshots.push(p)
    return page.screenshot({ path: p, type: 'png' })
  }

  console.log('Phase 1: Recording app features...')

  // ── Scene 1: App loads with showcase deck ──
  await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.evaluate((spec: string) => localStorage.setItem('slidelang_deck', spec), SPEC_STR)
  await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'load', timeout: 15000 })
  await sleep(3000)
  try { const b = page.locator('button').filter({ hasText: 'Skip' }); if (await b.isVisible({ timeout: 1500 })) { await b.click(); await sleep(500) } } catch { /* */ }

  await snap('00-app-loaded.png')
  audioFiles.push(speak('Welcome to Slidelang. We have loaded the showcase deck with all 20 slide kinds, demonstrating the full DSL capability.', tmp, idx++))
  await sleep(3000)

  // ── Scene 2: Theme builder + Fonts ──
  try {
    const themeBtn = page.locator('button').filter({ hasText: /Theme/ }).first()
    if (await themeBtn.isVisible({ timeout: 1500 })) {
      await themeBtn.click()
      await sleep(1500)
      await snap('01-theme-panel.png')
      audioFiles.push(speak('The theme builder lets you customize all 12 color variables per theme, or create custom themes by duplicating existing ones.', tmp, idx++))
      await sleep(3000)

      audioFiles.push(speak('You can also change the heading and body fonts from eight options each. Fonts load dynamically from Google Fonts.', tmp, idx++))
      await sleep(3000)

      await themeBtn.click()
      await sleep(800)
    }
  } catch { /* */ }

  // ── Scene 3: Editor with Unsplash + AI Rewrite ──
  try {
    const editorBtn = page.locator('button').filter({ hasText: /Editor/ }).first()
    if (await editorBtn.isVisible({ timeout: 1500 })) {
      await editorBtn.click()
      await sleep(1500)
      await snap('02-editor-open.png')
      audioFiles.push(speak('The JSON editor provides granular control over every slide. Each block has its own editor with type-specific options.', tmp, idx++))
      await sleep(3500)

      // Show image block with Unsplash
      // Navigate to an image slide first
      for (let i = 0; i < 14; i++) { await page.keyboard.press('ArrowRight'); await sleep(200) }
      await sleep(500)

      audioFiles.push(speak('Image blocks have an Unsplash search button to find free stock photos without leaving the editor.', tmp, idx++))
      await sleep(3000)

      // Go back to slide 3 (content)
      for (let i = 0; i < 14; i++) { await page.keyboard.press('ArrowLeft'); await sleep(150) }
      await sleep(300)
      for (let i = 0; i < 3; i++) { await page.keyboard.press('ArrowRight'); await sleep(150) }
      await sleep(500)

      audioFiles.push(speak('Text blocks have an AI rewrite button. You can make text more formal, concise, persuasive, or fix grammar with one click.', tmp, idx++))
      await sleep(3500)

      // Show transition picker
      audioFiles.push(speak('Each slide also has a transition picker. Choose from fade, slide, zoom, convex, or concave animations. These are compiled into the HTML output.', tmp, idx++))
      await sleep(3500)

      await editorBtn.click()
      await sleep(500)
    }
  } catch { /* */ }

  // ── Scene 4: Drag-and-drop ──
  audioFiles.push(speak('You can reorder slides by dragging and dropping the thumbnails in the strip below the preview.', tmp, idx++))
  await sleep(2500)

  // ── Scene 5: Browse showcase slides ──
  // Go to first slide
  for (let i = 0; i < 20; i++) { await page.keyboard.press('ArrowLeft'); await sleep(50) }
  await sleep(1000)
  for (let i = 0; i < SPEC.slides.length; i++) {
    if (i > 0) { await page.keyboard.press('ArrowRight'); await sleep(400) }
    await sleep(400)

    const kind = SPEC.slides[i].kind
    const title = SPEC.slides[i].title || `Slide ${i + 1}`
    if (['chart', 'kpi', 'dashboard', 'timeline', 'math', 'flowchart', 'big-number'].includes(kind)) {
      await snap(`slide-${String(i).padStart(2, '0')}-${kind}.png`)
      await sleep(200)
    }
  }

  audioFiles.push(speak('Here are the compiled slides. Charts render with Canvas 2D, math with KaTeX, KPIs as card grids, timelines with visual markers, and much more.', tmp, idx++))
  await sleep(2000)

  // ── Scene 6: Presentation mode ──
  try {
    const presentBtn = page.locator('button').filter({ hasText: /Present/ }).first()
    if (await presentBtn.isVisible({ timeout: 1500 })) {
      await presentBtn.click()
      await sleep(2500)
      await snap('99-present-mode.png')
      audioFiles.push(speak('Clicking Present opens a full-screen presentation mode with keyboard navigation, a slide counter, and a progress bar.', tmp, idx++))
      await sleep(3000)

      // Navigate a few slides in present mode
      for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowRight'); await sleep(800) }
      audioFiles.push(speak('Use arrow keys or space to advance, escape to exit. The theme colors are applied throughout.', tmp, idx++))
      await sleep(3000)

      await page.keyboard.press('Escape')
      await sleep(1000)
    }
  } catch { /* */ }

  // ── Scene 7: Show compiled HTML ──
  const html = compileDeckToHTML(SPEC)
  audioFiles.push(speak('Exporting compiles the deck to a self-contained HTML file with Reveal.js, all themes, charts, and fonts included. No build step needed to present.', tmp, idx++))
  await sleep(4000)

  await browser.close()
  close()

  // ── Phase 2: Compile slides to screenshots ──
  console.log('\nPhase 2: Rendering compiled slides...')
  const htmlFile = join(tmp, 'showcase.html')
  writeFileSync(htmlFile, html)

  const s2 = createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html) })
  await new Promise<void>(r => s2.listen(6399, () => r()))

  const b2 = await chromium.launch({ headless: true })
  const p2 = await b2.newPage({ viewport: { width: 1280, height: 720 } })
  await p2.goto('http://localhost:6399', { waitUntil: 'load', timeout: 15000 })
  await p2.waitForSelector('.reveal .slides section', { timeout: 10000 })
  await p2.waitForTimeout(3000)

  const compiledSlides: string[] = []
  for (let i = 0; i < SPEC.slides.length; i++) {
    if (i > 0) { await p2.keyboard.press('ArrowRight'); await p2.waitForTimeout(500) }
    const kind = SPEC.slides[i].kind
    if (['chart', 'kpi', 'dashboard', 'timeline', 'math', 'flowchart', 'big-number', 'image-full', 'comparison', 'two-column', 'progress'].includes(kind)) {
      const fp = join(tmp, `compiled-${String(i).padStart(2, '0')}-${kind}.png`)
      await p2.screenshot({ path: fp, type: 'png' })
      compiledSlides.push(fp)
    }
  }

  await b2.close()
  s2.close()

  // ── Phase 3: Composite everything into video ──
  console.log('Phase 3: Compositing...')

  // Build audio
  let audioConcat = ''
  for (const a of audioFiles) {
    try {
      const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${a}"`, { timeout: 5000 }).toString().trim()) || 2
      audioConcat += `file '${a}'\nduration ${d + 0.5}\n`
    } catch { audioConcat += `file '${a}'\nduration 3\n` }
  }
  const audioFinal = join(tmp, 'narration.m4a')
  writeFileSync(join(tmp, 'alist.txt'), audioConcat)
  execSync(`ffmpeg -y -f concat -safe 0 -i "${join(tmp, 'alist.txt')}" -c:a aac -b:a 128k "${audioFinal}"`, { timeout: 30000, stdio: 'pipe' })

  // Build video from screenshots
  let videoConcat = ''
  for (const s of screenshots) {
    videoConcat += `file '${s}'\nduration 3\n`
  }
  // Add compiled slides
  for (const s of compiledSlides) {
    videoConcat += `file '${s}'\nduration 2.5\n`
  }
  writeFileSync(join(tmp, 'vlist.txt'), videoConcat)

  const final = OUTPUT.startsWith('/') ? OUTPUT : join(process.cwd(), OUTPUT)
  execSync(`ffmpeg -y -f concat -safe 0 -i "${join(tmp, 'vlist.txt')}" -i "${audioFinal}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest -vf "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2" "${final}"`, { timeout: 120000, stdio: 'pipe' })

  const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${final}"`).toString().trim()
  const sz = execSync(`ls -lh "${final}" | awk '{print $5}'`).toString().trim()
  console.log(`\nDone: ${final} — ${sz}, ${parseFloat(dur).toFixed(1)}s`)
}

main().catch(e => { console.error(e); process.exit(1) })
