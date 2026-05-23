import { compileDeckToHTML } from '../dsl/compiler'
import { DeckSpec } from '../dsl/schema'
import { chromium } from '@playwright/test'
import { execSync, spawn } from 'child_process'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { createServer } from 'http'

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

async function serveHtml(html: string): Promise<{ url: string; close: () => Promise<void> }> {
  const tmpDir = process.env.TMPDIR || '/tmp'
  const filePath = join(tmpDir, `slidelang-video-${Date.now()}.html`)
  writeFileSync(filePath, html)

  const server = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number }
      resolve({
        url: `http://127.0.0.1:${addr.port}`,
        close: async () => {
          server.close()
        },
      })
    })
  })
}

async function generateNarration(slideTitle: string, slideContent: string): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.SLIDELANG_TTS_MODEL || 'llama3.2',
      prompt: `Write a one-sentence voiceover narration for this presentation slide. Be concise and professional. Title: "${slideTitle}". Content: "${slideContent.slice(0, 500)}". Return ONLY the narration sentence, nothing else.`,
      stream: false,
    }),
  })

  if (!response.ok) return slideTitle
  const data = (await response.json()) as { response: string }
  return data.response.trim() || slideTitle
}

function textToSpeech(text: string, outputPath: string, voice?: string): void {
  const v = voice || process.env.SLIDELANG_TTS_VOICE || 'Daniel'
  const sanitized = text.replace(/["'`]/g, '').replace(/[&|;$<>]/g, ' ')
  execSync(`say -v "${v}" -o "${outputPath}" "${sanitized}"`, {
    timeout: 30000,
  })
}

function getAudioDuration(audioPath: string): number {
  const result = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
    { timeout: 10000 }
  )
  return parseFloat(result.toString().trim()) || 3
}

async function renderSlidesToImages(url: string, count: number, outDir: string): Promise<string[]> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 720 })

  const images: string[] = []

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForSelector('.reveal .slides section', { timeout: 10000 })
    await page.waitForTimeout(2000)

    for (let i = 0; i < Math.min(count, 30); i++) {
      const imgPath = join(outDir, `slide_${String(i).padStart(3, '0')}.png`)

      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(800)
      }

      await page.screenshot({ path: imgPath, type: 'png' })
      images.push(imgPath)
    }
  } finally {
    await browser.close()
  }

  return images
}

export async function createDemoVideo(
  spec: DeckSpec,
  options?: {
    outputPath?: string
    voice?: string
    slidesPerSecond?: number
  }
): Promise<string> {
  const outDir = join(process.env.TMPDIR || '/tmp', `slidelang-video-${Date.now()}`)
  mkdirSync(outDir, { recursive: true })

  const outputPath = options?.outputPath || join(outDir, 'demo.mp4')
  const voice = options?.voice

  const html = compileDeckToHTML(spec)
  const { url, close } = await serveHtml(html)

  console.log('Rendering slides...')
  const images = await renderSlidesToImages(url, spec.slides.length, outDir)
  await close()

  const audioFiles: string[] = []
  const durations: number[] = []

  console.log('Generating narration...')
  for (let i = 0; i < spec.slides.length; i++) {
    const slide = spec.slides[i]
    const title = slide.title || `Slide ${i + 1}`
    const content = slide.blocks
      .map((b: any) => {
        if (b.type === 'text') return b.content
        if (b.type === 'bullets' || b.type === 'numbered') return b.items?.join('. ')
        return ''
      })
      .filter(Boolean)
      .join('. ')

    const narration = await generateNarration(title, content)
    console.log(`  Slide ${i + 1}: "${narration.slice(0, 60)}..."`)

    const audioPath = join(outDir, `audio_${String(i).padStart(3, '0')}.aiff`)
    textToSpeech(narration, audioPath, voice)
    audioFiles.push(audioPath)

    const duration = getAudioDuration(audioPath)
    durations.push(duration)
  }

  console.log('Compositing video with FFmpeg...')
  const concatFile = join(outDir, 'concat.txt')

  let ffmpegInput = ''
  for (let i = 0; i < images.length; i++) {
    const dur = Math.max(durations[i] || 3, 2)
    ffmpegInput += `file '${images[i]}'\nduration ${dur}\n`
  }
  ffmpegInput += `file '${images[images.length - 1]}'\n`
  writeFileSync(concatFile, ffmpegInput)

  const audioList = join(outDir, 'audio_list.txt')
  let audioInput = ''
  for (const af of audioFiles) {
    audioInput += `file '${af}'\n`
  }
  writeFileSync(audioList, audioInput)

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -f concat -safe 0 -i "${audioList}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" "${outputPath}"`,
    { timeout: 120000, stdio: 'pipe' }
  )

  console.log(`Video created: ${outputPath}`)
  return outputPath
}
