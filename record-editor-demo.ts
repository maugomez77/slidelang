import { chromium } from '@playwright/test'
import { execSync } from 'child_process'
import { createServer } from 'http'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const OLLAMA_BASE = 'http://localhost:11434'
const PORT = 5999
const OUTPUT = process.argv[2] || 'editor-demo.mp4'
const VOICE = process.argv[3] || 'Daniel'
const SPEC = JSON.parse(readFileSync('examples/showcase.json', 'utf-8'))
const SPEC_STR = JSON.stringify(SPEC)

async function serveDist() {
  const server = createServer((_req, res) => {
    const url = (_req.url || '/').split('?')[0]
    let fp = url === '/' || url === '' ? '/index.html' : url
    fp = fp.replace(/^\/slidelang\//, '/')
    
    try {
      const full = join(process.cwd(), 'dist', fp)
      const content = readFileSync(full)
      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': fp.endsWith('.js') ? 'application/javascript' : fp.endsWith('.css') ? 'text/css' : fp.endsWith('.svg') ? 'image/svg+xml' : 'text/html' })
        res.end(content)
      }
    } catch {
      if (!res.headersSent) {
        try {
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(readFileSync(join(process.cwd(), 'dist', 'index.html')))
        } catch {
          if (!res.headersSent) { res.writeHead(404); res.end('Not found') }
        }
      }
    }
  })
  return new Promise<{ close: () => void }>(r => server.listen(PORT, () => r({ close: () => server.close() })))
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function narrate(lines: string[], outPath: string) {
  const tmp = join(process.env.TMPDIR || '/tmp', `ed-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  const files: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].replace(/["'`]/g, '').replace(/[&|;$<>]/g, ' ')
    const p = join(tmp, `n${i}.aiff`)
    execSync(`say -v "${VOICE}" -o "${p}" "${s}"`, { timeout: 15000 })
    files.push(p)
  }
  let concat = ''
  for (const f of files) {
    const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${f}"`, { timeout: 5000 }).toString().trim())
    concat += `file '${f}'\nduration ${d + 0.6}\n`
  }
  concat += `file '${files[files.length - 1]}'\n`
  const list = join(tmp, 'list.txt')
  writeFileSync(list, concat)
  execSync(`ffmpeg -y -f concat -safe 0 -i "${list}" -c:a aac -b:a 128k "${outPath}"`, { timeout: 30000, stdio: 'pipe' })
}

async function getScript(): Promise<string[]> {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3.2', prompt: 'Write a 6-line voiceover for a demo showing the JSON editor in a deck-as-code app. Lines: 1) the app loads with a showcase deck, 2) opening the JSON editor reveals the full deck spec, 3) the spec has slides, kind, blocks, charts, math, 4) editing a slide title updates the preview instantly, 5) the validation panel checks for issues, 6) closing the editor and browsing the final slides. Return ONLY the numbered lines.', stream: false }),
    })
    if (!r.ok) return []
    return ((await r.json()) as any).response.split('\n').map((l: string) => l.replace(/^\d+[\.\)]\s*/, '').trim()).filter((l: string) => l.length > 10)
  } catch { return [] }
}

async function record(url: string, narrationFile: string) {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: process.env.TMPDIR || '/tmp', size: { width: 1280, height: 800 } },
  })
  const page = await ctx.newPage()

  try {
    // Inject the showcase spec into localStorage before the app loads
    await page.goto(url + '/slidelang/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.evaluate((spec: string) => {
      localStorage.setItem('slidelang_deck', spec)
    }, SPEC_STR)
    console.log('  Injected showcase spec into localStorage')

    // Reload to pick up the spec
    await page.goto(url + '/slidelang/', { waitUntil: 'load', timeout: 15000 })
    await sleep(3000)

    // Dismiss config modal
    try {
      const skip = page.locator('button').filter({ hasText: 'Skip' })
      if (await skip.isVisible({ timeout: 2000 })) { await skip.click(); await sleep(800) }
    } catch { /* */ }

    await sleep(2000)

    // Browse a few slides first to show they loaded
    console.log('  Browsing slides...')
    for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowRight'); await sleep(1200) }
    for (let i = 0; i < 2; i++) { await page.keyboard.press('ArrowLeft'); await sleep(600) }
    await sleep(1000)

    // Open editor panel
    console.log('  Opening editor...')
    try {
      const editor = page.locator('button').filter({ hasText: /Editor/ }).first()
      if (await editor.isVisible({ timeout: 2000 })) {
        await editor.click()
        await sleep(2500)

        // Scroll through the JSON editor to show the spec
        const editorPane = page.locator('[style*="overflow"] textarea, pre, code').first()
        if (await editorPane.isVisible({ timeout: 1000 }).catch(() => false)) {
          for (let i = 0; i < 8; i++) { await page.keyboard.press('PageDown'); await sleep(400) }
          await sleep(1000)
          for (let i = 0; i < 4; i++) { await page.keyboard.press('PageUp'); await sleep(300) }
        }

        // Close editor
        await editor.click()
        await sleep(1000)
      }
    } catch (e) { console.log('  Editor interaction skipped:', String(e)) }

    // Open settings panel
    console.log('  Opening settings...')
    try {
      const settings = page.locator('button').filter({ hasText: /Settings/ }).first()
      if (await settings.isVisible({ timeout: 2000 })) {
        await settings.click()
        await sleep(2500)
        await settings.click()
        await sleep(800)
      }
    } catch { /* */ }

    // Browse remaining slides
    console.log('  Browsing remaining slides...')
    for (let i = 0; i < 8; i++) { await page.keyboard.press('ArrowRight'); await sleep(1000) }

    await sleep(2000)
  } catch (e) { console.log('  Error:', String(e)) }

  const videoPath = await page.video()?.path()
  await ctx.close()
  await browser.close()

  if (videoPath) {
    console.log('  Compositing...')
    execSync(`ffmpeg -y -i "${videoPath}" -i "${narrationFile}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest "${OUTPUT}"`, { timeout: 60000, stdio: 'pipe' })
  }
}

async function main() {
  execSync('npx vite build', { cwd: process.cwd(), timeout: 30000, stdio: 'pipe' })

  const lines = await getScript()
  if (lines.length === 0) {
    lines.push(
      'The Slidelang app loads with our showcase deck — 23 slides covering all 20 slide kinds.',
      'Opening the JSON editor reveals the complete deck specification as structured, editable JSON.',
      'Each slide has a kind, title, and blocks array — you can see charts with data, math formulas, images, and KPIs.',
      'Editing the spec updates the live preview in real time — change a title, and the slide updates instantly.',
      'The validation panel at the bottom checks for layout issues, contrast problems, and missing data.',
      'After editing, close the editor and browse the final slides — your deck is ready to export.'
    )
  }

  const tmp = join(process.env.TMPDIR || '/tmp', `editor-demo-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  const narration = join(tmp, 'narration.m4a')
  await narrate(lines, narration)

  console.log('Starting server...')
  const { close } = await serveDist()

  console.log('Recording...')
  await record(`http://localhost:${PORT}`, narration)

  close()

  console.log(`\nDone: ${OUTPUT}`)
  const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${OUTPUT}"`).toString().trim()
  const sz = execSync(`ls -lh "${OUTPUT}" | awk '{print $5}'`).toString().trim()
  console.log(`Size: ${sz}, Duration: ${parseFloat(dur).toFixed(1)}s`)
}

main().catch(e => { console.error(e); process.exit(1) })
