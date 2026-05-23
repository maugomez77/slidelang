import { compileDeckToHTML } from './src/dsl/compiler.ts'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { chromium } from '@playwright/test'
import { createServer } from 'http'

const OLLAMA_BASE = 'http://localhost:11434'
const SPEC = process.argv[2] || 'examples/showcase.json'
const OUTPUT = process.argv[3] || 'showcase-demo.mp4'
const VOICE = process.argv[4] || 'Daniel'

const spec = JSON.parse(readFileSync(SPEC, 'utf-8'))
const html = compileDeckToHTML(spec)

const tmpDir = join(process.env.TMPDIR || '/tmp', `showcase-${Date.now()}`)
mkdirSync(tmpDir, { recursive: true })

const htmlFile = join(tmpDir, 'index.html')
writeFileSync(htmlFile, html)

async function main() {
  // Start server for the HTML
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })

  const PORT = 5899
  await new Promise<void>(r => server.listen(PORT, () => r()))

  // Render slides
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'load', timeout: 15000 })
  await page.waitForSelector('.reveal .slides section', { timeout: 10000 })
  await page.waitForTimeout(3000)

  const images: string[] = []
  const narrations: string[] = []

  for (let i = 0; i < spec.slides.length; i++) {
    const slide = spec.slides[i]
    const imgPath = join(tmpDir, `slide_${String(i).padStart(3, '0')}.png`)

    if (i > 0) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(600)
    }

    await page.screenshot({ path: imgPath, type: 'png' })
    images.push(imgPath)

    // Vision QA
    let visionResult = ''
    try {
      const buf = readFileSync(imgPath)
      const r = await fetch(`${OLLAMA_BASE}/api/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2-vision:11b',
          prompt: `Check this slide for: rendering issues, cut-off text, broken images, layout problems, empty areas. If it looks perfect say "OK". Otherwise list specific issues. Be very brief — one short sentence max.`,
          images: [buf.toString('base64')],
          stream: false,
        }),
      })
      if (r.ok) visionResult = ((await r.json()) as any).response.trim().slice(0, 100)
    } catch { visionResult = 'QA skipped' }

    const kind = slide.kind || 'content'
    const title = slide.title || `Slide ${i + 1}`
    const status = visionResult.toLowerCase().startsWith('ok') ? '✅' : '⚠️'
    console.log(`  ${status} Slide ${i + 1} [${kind}] "${title.slice(0, 40)}" — ${visionResult}`)
    narrations.push(visionResult)
  }

  await browser.close()
  server.close()

  // Generate narration audio per slide
  console.log('\nGenerating narration...')
  const audioFiles: string[] = []
  for (let i = 0; i < spec.slides.length; i++) {
    const slide = spec.slides[i]
    const title = slide.title || `Slide ${i + 1}`
    const kind = slide.kind

    let text = ''
    try {
      const r = await fetch(`${OLLAMA_BASE}/api/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: `Write a ONE-SENTENCE voiceover for this slide. Title: "${title}". Kind: "${kind}". Be concise and professional. Return ONLY the sentence, nothing else.`,
          stream: false,
        }),
      })
      if (r.ok) text = ((await r.json()) as any).response.trim()
    } catch { /* */ }
    if (!text) text = title

    const clean = text.replace(/["'`]/g, '').replace(/[&|;$<>]/g, ' ')
    const audioPath = join(tmpDir, `audio_${String(i).padStart(3, '0')}.aiff`)
    execSync(`say -v "${VOICE}" -o "${audioPath}" "${clean}"`, { timeout: 15000 })
    audioFiles.push(audioPath)
    console.log(`  ${i + 1}/${spec.slides.length}: "${clean.slice(0, 60)}..."`)
  }

  // Composite video
  console.log('\nCompositing...')
  let concatVideo = ''
  for (let i = 0; i < images.length; i++) {
    const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFiles[i]}"`, { timeout: 5000 }).toString().trim()) || 2
    concatVideo += `file '${images[i]}'\nduration ${Math.max(dur + 0.3, 2)}\n`
  }
  concatVideo += `file '${images[images.length - 1]}'\n`
  const videoList = join(tmpDir, 'video_list.txt')
  writeFileSync(videoList, concatVideo)

  let concatAudio = ''
  for (let i = 0; i < audioFiles.length; i++) {
    const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFiles[i]}"`, { timeout: 5000 }).toString().trim()) || 2
    concatAudio += `file '${audioFiles[i]}'\nduration ${dur + 0.5}\n`
  }
  const audioList = join(tmpDir, 'audio_list.txt')
  writeFileSync(audioList, concatAudio)

  const audioOut = join(tmpDir, 'narration.m4a')
  execSync(`ffmpeg -y -f concat -safe 0 -i "${audioList}" -c:a aac -b:a 128k "${audioOut}"`, { timeout: 30000, stdio: 'pipe' })

  execSync(`ffmpeg -y -f concat -safe 0 -i "${videoList}" -i "${audioOut}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" "${OUTPUT}"`, { timeout: 120000, stdio: 'pipe' })

  const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${OUTPUT}"`).toString().trim()
  const sz = execSync(`ls -lh "${OUTPUT}" | awk '{print $5}'`).toString().trim()
  console.log(`\nDone: ${OUTPUT} — ${sz}, ${parseFloat(dur).toFixed(1)}s, ${spec.slides.length} slides`)
}

main().catch(e => { console.error(e); process.exit(1) })
