import { compileDeckToHTML } from './src/dsl/compiler.ts'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { chromium } from '@playwright/test'
import { createServer } from 'http'

const PORT = 6399
const OUTPUT = process.argv[2] || 'submission-demo.mp4'
const VOICE = process.argv[3] || 'Samantha'
const SPEC = JSON.parse(readFileSync('examples/showcase.json', 'utf-8'))

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
  const tmp = join(process.env.TMPDIR || '/tmp', `subdemo-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  const audioFiles: string[] = []
  const screenshots: string[] = []
  let idx = 0

  console.log('Serving app...')
  const { close } = await serve()
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 } })

  function snap(name: string) {
    const p = join(tmp, name); screenshots.push(p)
    return page.screenshot({ path: p, type: 'png' })
  }

  // ── Load showcase deck ──
  await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.evaluate((spec: string) => localStorage.setItem('slidelang_deck', spec), JSON.stringify(SPEC))
  await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'load', timeout: 15000 })
  await sleep(2500)
  try { const b = page.locator('button').filter({ hasText: 'Skip' }); if (await b.isVisible({ timeout: 1500 })) { await b.click(); await sleep(500) } } catch { /* */ }

  // ── Scene 1: Prompt → Generate ──
  await snap('s01-load.png')
  audioFiles.push(speak('Slidelang is a deck-as-code authoring platform. You describe your presentation in natural language, and AI generates a complete structured deck specification as JSON.', tmp, idx++))
  await sleep(2000)
  audioFiles.push(speak('Unlike tools that generate static pixel output, Slidelang produces an editable, versionable spec. You can change any slide, block, theme, or data point without re-prompting the AI.', tmp, idx++))
  await sleep(2000)

  // Type a prompt
  try {
    const inputs = page.locator('input[type="text"]')
    const c = await inputs.count()
    for (let i = 0; i < c; i++) {
      const ph = await inputs.nth(i).getAttribute('placeholder')
      if (ph && ph.includes('Describe')) {
        await inputs.nth(i).click(); await sleep(200)
        await inputs.nth(i).fill('A Q4 2026 business review with revenue charts, team highlights, and growth metrics')
        await sleep(1000)
        const gen = page.locator('button').filter({ hasText: 'Generate' })
        if (await gen.isVisible({ timeout: 1000 }).catch(() => false)) { await gen.click(); await sleep(12000) }
        break
      }
    }
  } catch { /* */ }
  audioFiles.push(speak('The AI generates a complete deck spec with slides, blocks, charts, math, and images. The JSON is the source of truth — editable, versionable, and inspectable.', tmp, idx++))
  await snap('s02-generated.png')
  audioFiles.push(speak('The generated spec includes twenty different slide kinds. Charts with real data. Math formulas with KaTeX rendering. KPIs in card grids. Timelines with visual markers. And much more.', tmp, idx++))
  await sleep(2500)

  // ── Scene 2: Theme + Fonts ──
  try {
    const themeBtn = page.locator('button').filter({ hasText: /Theme/ }).first()
    if (await themeBtn.isVisible({ timeout: 1500 })) {
      await themeBtn.click(); await sleep(1200)
      await snap('s03-theme.png')
      audioFiles.push(speak('Eight themes with twelve customizable color variables each. Custom themes can be created and persisted. Heading and body fonts are selectable from Google Fonts.', tmp, idx++))
      await sleep(3000)
      await themeBtn.click(); await sleep(500)
    }
  } catch { /* */ }

  // ── Scene 3: Editor + Unsplash + AI Rewrite ──
  try {
    const editorBtn = page.locator('button').filter({ hasText: /Editor/ }).first()
    if (await editorBtn.isVisible({ timeout: 1500 })) {
      await editorBtn.click(); await sleep(1200)
      await snap('s04-editor.png')
      audioFiles.push(speak('The browser editor provides per-slide, per-block control over every element in the deck spec. Change slide kinds, edit titles, add blocks, or switch to raw JSON mode.', tmp, idx++))
      await sleep(2500)
      audioFiles.push(speak('Text blocks include an AI rewrite feature. You can make any text more formal, concise, persuasive, or fix grammar with one click — powered by local Ollama models.', tmp, idx++))
      await sleep(2500)
      audioFiles.push(speak('Image blocks have built-in Unsplash search. Find free stock photos without leaving the editor. No API key required.', tmp, idx++))
      await sleep(1500)
      audioFiles.push(speak('Each slide supports transitions — fade, slide, zoom, convex, and concave. These are compiled into the HTML output as Reveal.js data attributes.', tmp, idx++))
      await sleep(2000)

      await editorBtn.click(); await sleep(500)
    }
  } catch { /* */ }

  // ── Scene 4: Browse key slides ──
  // Go to first slide
  for (let i = 0; i < 20; i++) { await page.keyboard.press('ArrowLeft'); await sleep(40) }
  await sleep(800)

  const highlightSlides = [0, 3, 7, 9, 11, 16, 17, 20]
  for (let i = 0; i <= Math.max(...highlightSlides); i++) {
    if (i > 0) { await page.keyboard.press('ArrowRight'); await sleep(300) }
    if (highlightSlides.includes(i)) {
      await snap(`s-k${String(i).padStart(2, '0')}.png`)
      await sleep(300)
    }
  }

  audioFiles.push(speak('Twenty slide kinds including charts rendered with Canvas 2D, KPIs as card grids, math via KaTeX, timelines with visual markers, team profiles, flowcharts, and logo grids. All rendering is zero-dependency — no external chart libraries needed.', tmp, idx++))
  await sleep(3000)

  audioFiles.push(speak('The validation engine runs thirty-three rules checking for layout overflow, missing data, color contrast issues, and empty content. Auto-repair fixes common problems at compile time.', tmp, idx++))
  await sleep(2500)

  // ── Scene 5: Presentation mode ──
  try {
    const presentBtn = page.locator('button').filter({ hasText: /Present/ }).first()
    if (await presentBtn.isVisible({ timeout: 1500 })) {
      await presentBtn.click(); await sleep(2000)
      await snap('s98-present.png')
      audioFiles.push(speak('Full-screen presentation mode with keyboard navigation, slide counter, and progress bar. Theme colors are applied throughout.', tmp, idx++))
      await sleep(2500)
      await page.keyboard.press('Escape'); await sleep(800)
    }
  } catch { /* */ }

  // ── Scene 6: Export ──
  audioFiles.push(speak('When you are ready, export to a self-contained HTML file. The compiled output includes Reveal.js for presentation controls, all eight themes, Canvas rendered charts, KaTeX math, and Google Fonts.', tmp, idx++))
  await sleep(3000)
  audioFiles.push(speak('No build step needed to present. Just open the HTML file in any browser. You can also save the JSON spec for version control, or print directly.', tmp, idx++))
  await sleep(2500)
  audioFiles.push(speak('Slidelang turns AI-generated slide content into an editable, reviewable, and shareable deck. Deck as code, from prompt to publish.', tmp, idx++))
  await sleep(2500)

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
  for (const s of screenshots) { vConcat += `file '${s}'\nduration 3.5\n` }
  writeFileSync(join(tmp, 'vlist.txt'), vConcat)

  const final = join(process.cwd(), OUTPUT)
  execSync(`ffmpeg -y -f concat -safe 0 -i "${join(tmp, 'vlist.txt')}" -i "${audioOut}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest -vf "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2" "${final}"`, { timeout: 120000, stdio: 'pipe' })

  const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${final}"`).toString().trim()
  const sz = execSync(`ls -lh "${final}" | awk '{print $5}'`).toString().trim()
  console.log(`Done: ${OUTPUT} — ${sz}, ${parseFloat(dur).toFixed(1)}s`)
}

main().catch(e => { console.error(e); process.exit(1) })
