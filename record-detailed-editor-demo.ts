import { chromium } from '@playwright/test'
import { execSync } from 'child_process'
import { createServer } from 'http'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const OLLAMA = 'http://localhost:11434'
const PORT = 6199
const OUTPUT = process.argv[2] || 'detailed-editor-demo.mp4'
const VOICE = process.argv[3] || 'Daniel'
const SPEC = JSON.parse(readFileSync('examples/showcase.json', 'utf-8'))

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function visionDesc(buf: Buffer): Promise<string> {
  try {
    const r = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2-vision:11b',
        prompt: 'What do you see on this presentation slide? Describe the title, content, and visual elements in ONE sentence.',
        images: [buf.toString('base64')],
        stream: false,
      }),
    })
    return r.ok ? ((await r.json()) as any).response.trim().slice(0, 180) : ''
  } catch { return '' }
}

function serve() {
  const s = createServer((_req, res) => {
    const fp = ((_req.url || '/').split('?')[0]).replace(/^\/slidelang\//, '/') || '/index.html'
    try {
      const c = readFileSync(join(process.cwd(), 'dist', fp))
      res.writeHead(200, { 'Content-Type': fp.endsWith('.js') ? 'application/javascript' : fp.endsWith('.css') ? 'text/css' : 'text/html' })
      res.end(c)
    } catch {
      try { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(readFileSync(join(process.cwd(), 'dist', 'index.html'))) } catch { /* */ }
    }
  })
  return new Promise<{ close: () => void }>(r => s.listen(PORT, () => r({ close: () => s.close() })))
}

// Phase 1: Record the demo (fast, no blocking)
async function recordPhase(): Promise<{ videoPath: string; screenshots: Buffer[] }> {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: process.env.TMPDIR || '/tmp', size: { width: 1280, height: 800 } },
  })
  const page = await ctx.newPage()
  const screenshots: Buffer[] = []

  try {
    await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.evaluate((spec: string) => localStorage.setItem('slidelang_deck', spec), JSON.stringify(SPEC))
    await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'load', timeout: 15000 })
    await sleep(3000)
    try { const b = page.locator('button').filter({ hasText: 'Skip' }); if (await b.isVisible({ timeout: 1500 })) { await b.click(); await sleep(600) } } catch { }
    await sleep(2000)

    // Browse all slides, taking screenshots. Open editor on key slides as we go.
    for (let i = 0; i < SPEC.slides.length; i++) {
      const ss = await page.screenshot({ type: 'png' })
      screenshots.push(Buffer.from(ss))

      const kind = SPEC.slides[i].kind
      const title = SPEC.slides[i].title || ''
      const isEditorSlide = ['chart', 'kpi', 'dashboard', 'timeline', 'math', 'flowchart'].includes(kind)

      // Show editor for these specific slides on-the-spot
      if (isEditorSlide) {
        await sleep(1500)
        try {
          const ed = page.locator('button').filter({ hasText: /Editor/ }).first()
          if (await ed.isVisible({ timeout: 1000 })) {
            await ed.click()
            await sleep(2000)
            for (let p = 0; p < 3; p++) { await page.keyboard.press('PageDown'); await sleep(300) }
            await sleep(800)
            for (let p = 0; p < 3; p++) { await page.keyboard.press('PageUp'); await sleep(300) }
            await sleep(1000)
            await ed.click()
            await sleep(800)
          }
        } catch { /* editor unavailable */ }
      } else {
        await sleep(kind === 'section' ? 1200 : 1800)
      }

      if (i < SPEC.slides.length - 1) {
        await page.keyboard.press('ArrowRight')
        await sleep(600)
      }
    }

    await sleep(2000)
  } catch (e) { console.log('  Record error:', String(e)) }

  const vp = await page.video()?.path()
  await ctx.close()
  await browser.close()
  return { videoPath: vp || '', screenshots }
}

// Phase 2: Enrich narration with vision (parallel vision calls)
async function visionEnrich(screenshots: Buffer[]): Promise<string[]> {
  console.log('  Running vision analysis on', screenshots.length, 'slides...')
  const results: string[] = []

  // Process in batches of 3 to avoid overwhelming Ollama
  for (let i = 0; i < screenshots.length; i += 3) {
    const batch = screenshots.slice(i, i + 3)
    const descs = await Promise.all(batch.map(b => visionDesc(b)))
    results.push(...descs)
    console.log(`    Slides ${i + 1}-${Math.min(i + 3, screenshots.length)}/${screenshots.length} done`)
  }

  return results
}

// Phase 3: Generate narration from vision descriptions
async function generateNarration(descs: string[]): Promise<string[]> {
  const lines: string[] = []
  lines.push('Welcome to Slidelang. We have loaded a showcase deck demonstrating all 20 slide kinds in the DSL.')

  for (let i = 0; i < descs.length; i++) {
    const slide = SPEC.slides[i]
    const title = slide.title || `Slide ${i + 1}`
    const kind = slide.kind
    const desc = descs[i] || ''
    const isEditorSlide = ['chart', 'kpi', 'dashboard', 'timeline', 'math', 'flowchart'].includes(kind)

    if (desc && desc.length > 10) {
      const prefix = isEditorSlide ? `Opening the editor to inspect the JSON for this slide. ` : ''
      lines.push(`${prefix}${title}. ${desc}`)
    } else {
      lines.push(`${title}. A ${kind} slide.`)
    }
  }

  lines.push('This is Slidelang. Write a JSON spec, edit with live preview, compile to HTML, and export. Deck as code.')
  return lines
}

// Phase 4: TTS
function speakAll(lines: string[], tmpDir: string): string[] {
  const audioFiles: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const clean = lines[i].replace(/["'`]/g, '').replace(/[&|;$<>]/g, ' ').slice(0, 250)
    const path = join(tmpDir, `audio_${String(i).padStart(3, '0')}.aiff`)
    execSync(`say -v "${VOICE}" -o "${path}" "${clean}"`, { timeout: 15000 })
    audioFiles.push(path)
    if (i % 5 === 0) console.log(`    TTS ${i + 1}/${lines.length}`)
  }
  console.log(`    TTS ${lines.length}/${lines.length} done`)
  return audioFiles
}

// Phase 5: Composite
function composite(videoPath: string, audioFiles: string[], tmpDir: string, output: string) {
  // Concat audio
  let concat = ''
  for (const a of audioFiles) {
    try {
      const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${a}"`, { timeout: 5000 }).toString().trim()) || 2
      concat += `file '${a}'\nduration ${d + 0.3}\n`
    } catch { concat += `file '${a}'\nduration 2.5\n` }
  }
  concat += `file '${audioFiles[audioFiles.length - 1]}'\n`
  const list = join(tmpDir, 'audio_list.txt')
  writeFileSync(list, concat)
  const narrationOut = join(tmpDir, 'narration.m4a')
  execSync(`ffmpeg -y -f concat -safe 0 -i "${list}" -c:a aac -b:a 128k "${narrationOut}"`, { timeout: 30000, stdio: 'pipe' })

  const final = output.startsWith('/') ? output : join(process.cwd(), output)
  execSync(`ffmpeg -y -i "${videoPath}" -i "${narrationOut}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest "${final}"`, { timeout: 60000, stdio: 'pipe' })
}

async function main() {
  execSync('npx vite build', { cwd: process.cwd(), timeout: 30000, stdio: 'pipe' })

  const tmp = join(process.env.TMPDIR || '/tmp', `viddemo-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })

  console.log('Starting server...')
  const { close } = await serve()

  console.log('Phase 1: Recording demo...')
  const { videoPath, screenshots } = await recordPhase()
  close()

  if (!videoPath) { console.log('No video recorded'); return }
  console.log(`  Video: ${videoPath}`)

  console.log('Phase 2: Vision enrichment...')
  const descs = await visionEnrich(screenshots)

  console.log('Phase 3: Generating narration...')
  const lines = await generateNarration(descs)

  console.log('Phase 4: Text-to-speech...')
  const audioFiles = speakAll(lines, tmp)

  console.log('Phase 5: Compositing...')
  composite(videoPath, audioFiles, tmp, OUTPUT)

  const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${OUTPUT}"`).toString().trim()
  const sz = execSync(`ls -lh "${OUTPUT}" | awk '{print $5}'`).toString().trim()
  console.log(`\nDone: ${OUTPUT} — ${sz}, ${parseFloat(dur).toFixed(1)}s`)
}

main().catch(e => { console.error(e); process.exit(1) })
