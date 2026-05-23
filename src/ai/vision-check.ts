import { compileDeckToHTML } from '../dsl/compiler'
import { DeckSpec } from '../dsl/schema'
import { chromium } from '@playwright/test'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { createServer } from 'http'
import { readFileSync } from 'fs'

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

export type VisionIssue = {
  slide: number
  severity: 'error' | 'warning' | 'info'
  type: 'collapsed_element' | 'text_overflow' | 'broken_image' | 'low_contrast' | 'layout_break' | 'readability'
  description: string
}

async function serveHtml(html: string): Promise<{ url: string; close: () => Promise<void> }> {
  const tmpDir = process.env.TMPDIR || '/tmp'
  const filePath = join(tmpDir, `slidelang-vision-${Date.now()}.html`)
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
          try { unlinkSync(filePath) } catch { /* ignore */ }
        },
      })
    })
  })
}

async function screenshotSlides(url: string, count: number): Promise<string[]> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 720 })

  const screenshots: string[] = []

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForSelector('.reveal .slides section', { timeout: 10000 })
    await page.waitForTimeout(2000)

    for (let i = 0; i < Math.min(count, 10); i++) {
      const tmpPath = join(process.env.TMPDIR || '/tmp', `slidelang-slide-${Date.now()}-${i}.png`)

      if (i > 0) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(600)
      }

      await page.screenshot({ path: tmpPath, type: 'png' })
      const imageBuf = readFileSync(tmpPath)
      const base64 = imageBuf.toString('base64')
      screenshots.push(base64)
      try { unlinkSync(tmpPath) } catch { /* ignore */ }
    }
  } finally {
    await browser.close()
  }

  return screenshots
}

async function ollamaVisionCheck(imageBase64: string): Promise<VisionIssue[]> {
  const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.SLIDELANG_VISION_MODEL || 'llama3.2-vision:11b',
      prompt: `Analyze this presentation slide for visual quality issues. Check ONLY for:
1. Text overlapping or clipping (text cut off by boundaries)
2. Collapsed or broken elements (images not loading, blank spaces)
3. Layout breaks (elements misaligned, overlapping each other)
4. Unreadable text (too small, wrong color)
5. Broken or missing images

Return ONLY a JSON array of issues found. Each issue: {"type":"collapsed_element|text_overflow|broken_image|low_contrast|layout_break|readability","description":"brief description"}. 
If the slide looks perfect with no issues, return an empty array [].
Example response: [{"type":"low_contrast","description":"Subtitle text '#94a3b8' is too light on white background"},{"type":"broken_image","description":"Image at top right failed to load"}]

IMPORTANT: Respond with ONLY valid JSON array, no other text.`,
      images: [imageBase64],
      stream: false,
    }),
  })

  if (!response.ok) {
    console.error(`Ollama vision check failed: ${response.status}`)
    return []
  }

  const data = (await response.json()) as { response: string }
  try {
    const jsonMatch = data.response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    return JSON.parse(jsonMatch[0]) as VisionIssue[]
  } catch {
    return []
  }
}

export async function checkDeckWithVision(spec: DeckSpec): Promise<{
  html: string
  issues: VisionIssue[]
}> {
  const html = compileDeckToHTML(spec)

  try {
    const { url, close } = await serveHtml(html)
    const screenshots = await screenshotSlides(url, spec.slides.length)
    await close()

    const allIssues: VisionIssue[] = []

    for (let i = 0; i < screenshots.length; i++) {
      const slideIssues = await ollamaVisionCheck(screenshots[i])
      for (const issue of slideIssues) {
        allIssues.push({ ...issue, slide: i })
      }
    }

    return { html, issues: allIssues }
  } catch (err) {
    console.error('Vision check error:', err)
    return { html, issues: [] }
  }
}
