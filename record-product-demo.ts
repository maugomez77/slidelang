import { chromium } from '@playwright/test'
import { execSync } from 'child_process'
import { createServer } from 'http'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const OLLAMA_BASE = 'http://localhost:11434'
const PORT = 5799
const OUTPUT = process.argv[2] || 'product-demo.mp4'
const VOICE = process.argv[3] || 'Daniel'
const SPEC_FILE = process.argv[4] || null

async function serveDist(): Promise<{ close: () => void }> {
  const server = createServer((_req, res) => {
    try {
      const url = (_req.url || '/').split('?')[0]
      let filePath = url === '/' || url === '' ? '/index.html' : url
      // Strip /slidelang/ prefix since dist files are at root
      filePath = filePath.replace(/^\/slidelang\//, '/')
      const full = join(process.cwd(), 'dist', filePath)
      const content = readFileSync(full)
      const ext = filePath.split('.').pop() || 'html'
      const mime: Record<string, string> = { html: 'text/html', js: 'application/javascript', css: 'text/css', svg: 'image/svg+xml' }
      res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' })
      res.end(content)
    } catch (e) {
      // Fallback to index.html for SPA routing
      try {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(readFileSync(join(process.cwd(), 'dist', 'index.html')))
      } catch {
        res.writeHead(404)
        res.end('Not found')
      }
    }
  })
  return new Promise((resolve) => {
    server.listen(PORT, () => resolve({ close: () => server.close() }))
  })
}

async function narate(lines: string[], outPath: string) {
  const tmp = join(process.env.TMPDIR || '/tmp', `narration-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  const files: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].replace(/["'`]/g, '').replace(/[&|;$<>]/g, ' ')
    const p = join(tmp, `n${String(i).padStart(3, '0')}.aiff`)
    execSync(`say -v "${VOICE}" -o "${p}" "${s}"`, { timeout: 15000 })
    files.push(p)
    console.log(`  ${i + 1}/${lines.length}: "${s.slice(0, 50)}..."`)
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
  console.log(`  Narration: ${outPath}`)
}

async function getScript(): Promise<string[]> {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3.2', prompt: 'Write a 6-line voiceover script for a product demo of a deck-as-code presentation tool. Each line should be one sentence. Lines should cover: 1) intro, 2) prompt input, 3) AI generation, 4) slide browsing, 5) editing/editor, 6) export. Return ONLY the numbered lines.', stream: false }),
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
  let videoPath: string | undefined

  try {
    console.log('  Loading app...')
    await page.goto(url, { waitUntil: 'load', timeout: 15000 })
    await sleep(3000)

    // Dismiss config modal
    try {
      const skip = page.locator('button').filter({ hasText: 'Skip' })
      if (await skip.isVisible({ timeout: 2000 })) { await skip.click(); await sleep(800) }
    } catch { /* */ }

    // Show the UI
    await sleep(2000)

    // Try to type prompt
    try {
      const inputs = page.locator('input[type="text"]')
      const c = await inputs.count()
      for (let i = 0; i < c; i++) {
        const ph = await inputs.nth(i).getAttribute('placeholder')
        if (ph && ph.includes('Describe')) {
          await inputs.nth(i).click()
          await sleep(300)
          await inputs.nth(i).fill('A quarterly business review with revenue charts, growth metrics, and team highlights')
          await sleep(1500)
          const gen = page.locator('button').filter({ hasText: 'Generate' })
          if (await gen.isVisible({ timeout: 1000 }).catch(() => false)) {
            await gen.click()
            console.log('  Generating deck...')
            await sleep(12000)
          }
          break
        }
      }
    } catch { /* */ }

    // Browse slides
    for (let i = 0; i < 5; i++) { try { await page.keyboard.press('ArrowRight') } catch { /* */ }; await sleep(1200) }
    for (let i = 0; i < 2; i++) { try { await page.keyboard.press('ArrowLeft') } catch { /* */ }; await sleep(600) }

    // Open editor
    try {
      const ed = page.locator('button').filter({ hasText: /Editor/ }).first()
      if (await ed.isVisible({ timeout: 1000 })) { await ed.click(); await sleep(2000); await ed.click(); await sleep(800) }
    } catch { /* */ }

    // Open settings
    try {
      const st = page.locator('button').filter({ hasText: /Settings/ }).first()
      if (await st.isVisible({ timeout: 1000 })) { await st.click(); await sleep(2000); await st.click(); await sleep(800) }
    } catch { /* */ }

    for (let i = 0; i < 4; i++) { try { await page.keyboard.press('ArrowRight') } catch { /* */ }; await sleep(1000) }
    await sleep(2000)

    videoPath = await page.video()?.path()
  } catch (err: any) {
    console.log('  Record error:', err?.message || String(err))
  }

  await ctx.close()
  await browser.close()

  if (videoPath) {
    console.log('  Compositing video...')
    execSync(`ffmpeg -y -i "${videoPath}" -i "${narrationFile}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest "${OUTPUT}"`, { timeout: 60000, stdio: 'pipe' })
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  console.log('Building...')
  execSync('npx vite build', { cwd: process.cwd(), timeout: 30000, stdio: 'pipe' })

  console.log('Generating script...')
  let lines = await getScript()
  if (lines.length === 0) {
    lines = [
      'Welcome to Slidelang, the deck-as-code authoring platform.',
      'Simply type a prompt describing your presentation, and artificial intelligence generates a complete deck specification.',
      'The structured JSON spec is fully editable, with real-time preview powered by Reveal.js.',
      'Browse your slides, check charts, math, and images — all rendered live as you edit.',
      'Open the spec editor to inspect or modify the underlying JSON directly.',
      'Export to self-contained HTML, save as JSON for version control, or print your deck.',
    ]
  }

  const tmp = join(process.env.TMPDIR || '/tmp', `demo-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })
  const narration = join(tmp, 'narration.m4a')
  await narate(lines, narration)

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
