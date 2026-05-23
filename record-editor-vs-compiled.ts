import { chromium } from '@playwright/test'
import { execSync } from 'child_process'
import { createServer } from 'http'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const OLLAMA = 'http://localhost:11434'
const PORT = 6299
const OUTPUT = process.argv[2] || 'editor-vs-compiled.mp4'
const VOICE = process.argv[3] || 'Daniel'
const NARRATION_FILE = process.argv[4] || '' // path to pre-recorded .m4a/.mp3 audio file
const SPEC = JSON.parse(readFileSync('examples/showcase.json', 'utf-8'))

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function serve() {
  const s = createServer((_req, res) => {
    let fp = (_req.url || '/').split('?')[0]
    // Normalize: handle /slidelang, /slidelang/, and /slidelang/something
    fp = fp.replace(/^\/slidelang\/?/, '/')
    if (fp === '' || fp === '/') fp = '/index.html'

    try {
      const full = join(process.cwd(), 'dist', fp)
      const c = readFileSync(full)
      const mt = fp.endsWith('.js') ? 'application/javascript'
        : fp.endsWith('.css') ? 'text/css'
        : fp.endsWith('.svg') ? 'image/svg+xml'
        : 'text/html'
      res.writeHead(200, { 'Content-Type': mt })
      res.end(c)
    } catch {
      res.writeHead(404)
      res.end()
    }
  })
  return new Promise<{ close: () => void }>(r => s.listen(PORT, () => r({ close: () => s.close() })))
}

function speak(text: string, tmpDir: string, i: number): string {
  const clean = text.replace(/["'`]/g, '').replace(/[&|;$<>]/g, ' ').slice(0, 250)
  const path = join(tmpDir, `audio_${String(i).padStart(3, '0')}.aiff`)
  execSync(`say -v "${VOICE}" -o "${path}" "${clean}"`, { timeout: 15000 })
  return path
}

async function record() {
  const tmp = join(process.env.TMPDIR || '/tmp', `sidexside-${Date.now()}`)
  mkdirSync(tmp, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 800 },
    recordVideo: { dir: process.env.TMPDIR || '/tmp', size: { width: 1440, height: 800 } },
  })
  const page = await ctx.newPage()
  const audioFiles: string[] = []
  let idx = 0

  try {
    // Inject showcase spec
    await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.evaluate((spec: string) => localStorage.setItem('slidelang_deck', spec), JSON.stringify(SPEC))
    await page.goto(`http://localhost:${PORT}/slidelang/`, { waitUntil: 'load', timeout: 15000 })
    await sleep(2500)
    try { const b = page.locator('button').filter({ hasText: 'Skip' }); if (await b.isVisible({ timeout: 1500 })) { await b.click(); await sleep(500) } } catch { }

    // Open the editor panel so we get the side-by-side view
    try {
      const editorBtn = page.locator('button').filter({ hasText: /Editor/ }).first()
      if (await editorBtn.isVisible({ timeout: 2000 })) {
        await editorBtn.click()
        await sleep(1500)
        console.log('  Editor panel open — side-by-side mode')
      }
    } catch { /* */ }

    audioFiles.push(speak('Here we have the Slidelang editor in side-by-side mode. The left panel shows the JSON specification, and the right side shows the live compiled preview.', tmp, idx++))
    await sleep(5000)

    // Now go through each slide
    const highlightSlides: Record<number, string> = {
      0: 'The title slide. Notice the kind field is title, with a subtitle and a text block styled as italic large.',
      3: 'A content slide. The blocks array contains bullet items and a text block. Changing the items array would update the bullet points instantly.',
      5: 'A comparison slide. Two sets of text and bullets. The compiler splits them into left and right panels automatically.',
      7: 'A chart slide. The kind is chart, with a chart block containing chartType bar, labels, and datasets. The Canvas chart is rendered from this JSON.',
      9: 'A KPI dashboard. Extra large text paired with small text auto-creates KPI cards. The compiler detects the pattern and generates the grid.',
      10: 'A big number slide with a single dramatic stat.',
      11: 'A dashboard slide with two charts side by side — bar and donut. Each chart is a separate block in the blocks array.',
      12: 'A progress bar slide. Each pair of text blocks creates a labeled progress bar with percentage fill.',
      15: 'A logo grid. Multiple image blocks automatically arranged in a responsive grid layout.',
      16: 'A team slide. Text blocks paired with image blocks create profile cards with photos.',
      17: 'A timeline. Each text block with dash-separated parts creates a timeline entry with date, title, and description.',
      20: 'A math slide. Math blocks with LaTeX expressions are rendered by KaTeX. Just write the formula in the JSON.',
      21: 'A flowchart. Text blocks are rendered as connected nodes showing process flow.',
    }

    for (let i = 0; i < SPEC.slides.length; i++) {
      const slide = SPEC.slides[i]
      const kind = slide.kind
      const title = slide.title || `Slide ${i + 1}`

      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await sleep(500)
      }
      await sleep(1000)

      if (highlightSlides[i]) {
        audioFiles.push(speak(`Slide ${i + 1}: ${title}. ${highlightSlides[i]}`, tmp, idx++))
        await sleep(4000)
      } else {
        audioFiles.push(speak(`${title}.`, tmp, idx++))
        await sleep(2000)
      }
    }

    // Scroll through the editor JSON one more time
    await sleep(1000)
    try {
      const editorPane = page.locator('textarea, pre, [class*="editor"]').first()
      if (await editorPane.isVisible({ timeout: 1000 }).catch(() => false)) {
        for (let i = 0; i < 5; i++) { await page.keyboard.press('PageDown'); await sleep(200) }
        await sleep(800)
        for (let i = 0; i < 5; i++) { await page.keyboard.press('PageUp'); await sleep(200) }
      }
    } catch { /* */ }

    audioFiles.push(speak('This is deck as code. Every slide, every chart, every image is defined in a structured JSON specification. Edit the JSON, see the result instantly. Compile to HTML, export, and share.', tmp, idx++))
    await sleep(4000)

  } catch (e) { console.log('  Error:', String(e)) }

  const videoPath = await page.video()?.path()
  await ctx.close()
  await browser.close()
  if (!videoPath) { console.log('No video'); return }

  let narrationOut: string

  if (NARRATION_FILE && readFileSync(NARRATION_FILE, { flag: 'r' })) {
    // Use pre-recorded human voiceover
    console.log('  Using pre-recorded narration:', NARRATION_FILE)
    narrationOut = NARRATION_FILE
  } else {
    // Build TTS audio
    let concat = ''
    for (const a of audioFiles) {
      try {
        const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${a}"`, { timeout: 5000 }).toString().trim()) || 2
        concat += `file '${a}'\nduration ${d + 0.4}\n`
      } catch { concat += `file '${a}'\nduration 2.5\n` }
    }
    concat += `file '${audioFiles[audioFiles.length - 1]}'\n`
    writeFileSync(join(tmp, 'audio_list.txt'), concat)
    narrationOut = join(tmp, 'narration.m4a')
    execSync(`ffmpeg -y -f concat -safe 0 -i "${join(tmp, 'audio_list.txt')}" -c:a aac -b:a 128k "${narrationOut}"`, { timeout: 30000, stdio: 'pipe' })
    console.log('  TTS narration built')
  }

  const final = OUTPUT.startsWith('/') ? OUTPUT : join(process.cwd(), OUTPUT)
  execSync(`ffmpeg -y -i "${videoPath}" -i "${narrationOut}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest "${final}"`, { timeout: 60000, stdio: 'pipe' })

  console.log(`\nDone: ${final}`)
  const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${final}"`).toString().trim()
  console.log(`${parseFloat(dur).toFixed(1)}s, ${execSync('ls -lh "' + final + '" | awk \'{print $5}\'').toString().trim()}`)
}

async function main() {
  execSync('npx vite build', { cwd: process.cwd(), timeout: 30000, stdio: 'pipe' })
  console.log('Starting server...')
  const { close } = await serve()
  console.log('Recording side-by-side editor vs compiled...')
  await record()
  close()
}

main().catch(e => { console.error(e); process.exit(1) })
