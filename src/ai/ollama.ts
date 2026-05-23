import { DeckSpec } from '../dsl/schema'

const DEFAULT_OLLAMA_BASE = 'http://localhost:11434'
const DEFAULT_OLLAMA_MODEL = 'llama3.2'

function getOllamaBase(): string {
  return localStorage.getItem('slidelang_ollama_url') || DEFAULT_OLLAMA_BASE
}

function getOllamaModel(): string {
  return localStorage.getItem('slidelang_ollama_model') || DEFAULT_OLLAMA_MODEL
}

const SYSTEM_PROMPT = `You are Slidelang, a deck specification generator. 
Given a user's topic prompt, generate a complete deck specification as JSON.

The deck spec schema is:
{
  meta: { title, author?, date?, theme: "noir"|"air"|"bold"|"warm"|"crimson"|"sage"|"navy"|"neon", description? },
  slides: [
    {
      kind: "title"|"section"|"content"|"two-column"|"image-full"|"quote"|"comparison"|"chart"|"math"|"blank"|"kpi"|"timeline"|"big-number"|"logo-grid"|"flowchart"|"agenda"|"contact"|"dashboard"|"team"|"progress",
      title?, subtitle?,
      blocks: [
        { type: "text", content: string, style?: { bold?, italic?, size?: "small"|"medium"|"large"|"xlarge", color?, align? } },
        { type: "bullets"|"numbered", items: string[] },
        { type: "chart", chartType: "bar"|"line"|"pie"|"donut"|"area"|"scatter", title?, labels: string[], datasets: [{ label: string, values: number[], color? }] },
        { type: "math", expression: string, inline?: boolean },
        { type: "image", source: { url: string, alt?, caption?, width?, height? }, fit? }
      ],
      background?, notes?, layoutIssues?
    }
  ]
}

Rules:
1. Generate 4-8 slides for a standard deck, 8-12 for a detailed one.
2. Use a title slide first, then section/content slides.
3. Include at least one chart block with realistic data.
4. Include at least one math block with a relevant formula.
5. Include at least one image block with a placeholder URL from picsum.photos.
6. Use two-column slides for comparisons, content slides for explanations.
7. Make the content substantive and realistic — not generic filler.
8. For math: use LaTeX expressions without delimiters.
9. For charts: provide realistic labels and values.
10. Return ONLY valid JSON — no markdown, no explanation.`

export async function ollamaGenerate(prompt: string): Promise<DeckSpec> {
  const baseUrl = getOllamaBase()
  const model = getOllamaModel()

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `${SYSTEM_PROMPT}\n\nUser prompt: ${prompt}\n\nGenerate the JSON deck specification:`,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.response as string
    if (!content) {
      throw new Error('No content in Ollama response')
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Ollama response')
    }

    const spec = JSON.parse(jsonMatch[0]) as DeckSpec
    validateSpec(spec)
    return spec
  } catch (err) {
    console.warn('Ollama generation failed:', err)
    throw err
  }
}

export async function ollamaDescribeImage(base64Image: string, prompt?: string): Promise<string> {
  const baseUrl = getOllamaBase()
  const model = localStorage.getItem('slidelang_vision_model') || 'llama3.2-vision:11b'

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: prompt || 'describe this image in detail',
      images: [base64Image],
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama vision API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.response as string
}

export async function planDeckFromImage(imageBase64: string): Promise<DeckSpec> {
  const description = await ollamaDescribeImage(imageBase64)

  const deckPrompt = `Based on this image description, create a presentation deck:\n\n${description}`

  return ollamaGenerate(deckPrompt)
}

function validateSpec(spec: DeckSpec): void {
  if (!spec.meta) spec.meta = { title: 'Untitled Deck', theme: 'noir' }
  if (!spec.meta.theme) spec.meta.theme = 'noir'
  if (!Array.isArray(spec.slides)) {
    spec.slides = []
  }
  spec.slides.forEach((slide) => {
    if (!slide.kind) slide.kind = 'content'
    if (!Array.isArray(slide.blocks)) slide.blocks = []
  })
}

export function isOllamaConfigured(): boolean {
  return true
}

export function setOllamaConfig(baseUrl?: string, model?: string, visionModel?: string): void {
  if (baseUrl) localStorage.setItem('slidelang_ollama_url', baseUrl)
  if (model) localStorage.setItem('slidelang_ollama_model', model)
  if (visionModel) localStorage.setItem('slidelang_vision_model', visionModel)
}

export function getOllamaConfig(): { baseUrl: string; model: string; visionModel: string } {
  return {
    baseUrl: getOllamaBase(),
    model: getOllamaModel(),
    visionModel: localStorage.getItem('slidelang_vision_model') || 'llama3.2-vision:11b',
  }
}
