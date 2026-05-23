import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { chromium } from '@playwright/test'
import { createServer } from 'http'
import { compileDeckToHTML } from './src/dsl/compiler.ts'

const PORT = 6799
const OUTPUT = process.argv[2] || 'submission-demo.mp4'

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

async function main() {
  execSync('npx vite build', { cwd: process.cwd(), timeout: 30000, stdio: 'pipe' })
  const tmp = join(process.env.TMPDIR || '/tmp', `silentdemo-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  const screenshots: string[] = []

  function snap(name: string) { const p = join(tmp, name); screenshots.push(p); return page.screenshot({ path: p, type: 'png' }) }

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

  // ── PART 1: App with showcase deck ──
  await snap('01-app.png')

  // Open editor and navigate slides
  try {
    const ed = page.locator('button').filter({ hasText: /Editor/ }).first()
    if (await ed.isVisible({ timeout: 2000 })) {
      await ed.click(); await sleep(1500)
      await snap('02-editor.png')

      const keySlides = [3, 7, 9, 11, 17, 20, 21]
      for (const ks of keySlides) {
        const tabs = page.locator('button').filter({ hasText: new RegExp(`${ks + 1}\\.`) })
        if (await tabs.first().isVisible({ timeout: 1000 }).catch(() => false)) {
          await tabs.first().click(); await sleep(1000)
          await snap(`ed-${String(ks).padStart(2, '0')}.png`)
        }
      }
      await ed.click(); await sleep(500)
    }
  } catch(e) { console.log('Editor:', String(e)) }

  // Theme builder
  try {
    const th = page.locator('button').filter({ hasText: /Theme/ }).first()
    if (await th.isVisible({ timeout: 1500 })) { await th.click(); await sleep(1200); await snap('03-theme.png'); await th.click(); await sleep(500) }
  } catch { /* */ }

  // Browse preview slides
  const previewSlides = [0, 3, 7, 9, 11, 17, 20, 22]
  for (let i = 0; i <= Math.max(...previewSlides); i++) {
    if (i > 0) { await page.keyboard.press('ArrowRight'); await sleep(400) }
    if (previewSlides.includes(i)) { await snap(`pv-${String(i).padStart(2, '0')}.png`) }
  }

  // ── PART 2: MedTech sample deck ──
  const medtech = JSON.parse(readFileSync('examples/medtech-ai-investor-pitch.json', 'utf-8'))
  await page.evaluate((s: string) => localStorage.setItem('slidelang_deck', s), JSON.stringify(medtech))
  const fi = page.locator('#slidelang-import')
  await fi.setInputFiles(join(process.cwd(), 'examples/medtech-ai-investor-pitch.json'))
  await sleep(2000)
  await snap('04-medtech.png')
  for (let i = 0; i < medtech.slides.length; i++) {
    if (i > 0) { await page.keyboard.press('ArrowRight'); await sleep(400) }
    await snap(`mt-${i}.png`)
  }

  // ── PART 3: SaaS Metrics sample deck ──
  const saas = JSON.parse(readFileSync('examples/saas-metrics-monthly-review.json', 'utf-8'))
  await page.evaluate((s: string) => localStorage.setItem('slidelang_deck', s), JSON.stringify(saas))
  await fi.setInputFiles(join(process.cwd(), 'examples/saas-metrics-monthly-review.json'))
  await sleep(2000)
  await snap('05-saas.png')
  for (let i = 0; i < saas.slides.length; i++) {
    if (i > 0) { await page.keyboard.press('ArrowRight'); await sleep(400) }
    await snap(`sa-${i}.png`)
  }

  // ── PART 4: Presentation mode ──
  try {
    const pb = page.locator('button').filter({ hasText: /Present/ }).first()
    if (await pb.isVisible({ timeout: 1500 })) {
      await pb.click(); await sleep(2000)
      await snap('06-present.png')
      for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowRight'); await sleep(800) }
      await page.keyboard.press('Escape'); await sleep(800)
    }
  } catch { /* */ }

  await browser.close()
  close()

  // ── PART 5: Compiled HTML output ──
  const html = compileDeckToHTML(spec)
  const s2 = createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(html) })
  await new Promise<void>(r => s2.listen(6899, () => r()))

  const b2 = await chromium.launch({ headless: true })
  const p2 = await b2.newPage({ viewport: { width: 1280, height: 720 } })
  await p2.goto('http://localhost:6899', { waitUntil: 'load', timeout: 15000 })
  await p2.waitForSelector('.reveal .slides section', { timeout: 10000 })
  await p2.waitForTimeout(3000)

  const compiledSlides = [0, 3, 7, 9, 11, 17, 20, 21]
  for (let i = 0; i <= Math.max(...compiledSlides); i++) {
    if (i > 0) { await p2.keyboard.press('ArrowRight'); await p2.waitForTimeout(500) }
    if (compiledSlides.includes(i)) { await p2.screenshot({ path: join(tmp, `c-${String(i).padStart(2, '0')}.png`) }); screenshots.push(join(tmp, `c-${String(i).padStart(2, '0')}.png`)) }
  }
  await b2.close()
  s2.close()

  // ── Composite silent video ──
  console.log(`Compositing ${screenshots.length} screenshots...`)
  let vConcat = ''
  for (const s of screenshots) { vConcat += `file '${s}'\nduration 3\n` }
  writeFileSync(join(tmp, 'vlist.txt'), vConcat)

  const final = join(process.cwd(), OUTPUT)
  execSync(`ffmpeg -y -f concat -safe 0 -i "${join(tmp, 'vlist.txt')}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -vf "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2" "${final}"`, { timeout: 120000, stdio: 'pipe' })

  const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${final}"`).toString().trim()
  const sz = execSync(`ls -lh "${final}" | awk '{print $5}'`).toString().trim()
  console.log(`Done: ${OUTPUT} — ${sz}, ${parseFloat(dur).toFixed(1)}s, silent`)
}

main().catch(e => { console.error(e); process.exit(1) })
