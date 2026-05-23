import { DeckSpec, Slide } from '../dsl/schema'

const OLLAMA = 'http://localhost:11434'

async function ollamaCall(prompt: string, model = 'llama3.2'): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const r = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: controller.signal,
    })
    if (!r.ok) {
      const err = await r.text().catch(() => '')
      throw new Error(`Ollama API ${r.status}: ${err.slice(0, 100)}`)
    }
    const data = await r.json() as any
    return data.response?.trim() || ''
  } finally {
    clearTimeout(timeout)
  }
}

export async function generateSpeakerNotes(slide: Slide): Promise<string> {
  const title = slide.title || 'Untitled'
  const content = slide.blocks.map(b => {
    if (b.type === 'text') return (b as any).content
    if (b.type === 'bullets' || b.type === 'numbered') return (b as any).items?.join('. ')
    return ''
  }).filter(Boolean).join(' ').slice(0, 500)

  return ollamaCall(
    `Write 2-3 sentences of speaker notes for this presentation slide. Be conversational and natural, as if speaking to an audience. Include key talking points. Slide title: "${title}". Content: "${content}". Return ONLY the notes, no labels.`
  )
}

export async function generateAllSpeakerNotes(spec: DeckSpec, onProgress?: (i: number, total: number) => void): Promise<DeckSpec> {
  const slides = [...spec.slides]
  for (let i = 0; i < slides.length; i++) {
    onProgress?.(i, slides.length)
    try {
      slides[i] = { ...slides[i], notes: await generateSpeakerNotes(slides[i]) }
    } catch { /* skip failed slides */ }
  }
  onProgress?.(slides.length, slides.length)
  return { ...spec, slides }
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  return ollamaCall(
    `Translate this text to ${targetLang}. Return ONLY the translated text.\n\n"${text}"`
  )
}

export async function translateDeck(spec: DeckSpec, targetLang: string, onProgress?: (i: number, total: number) => void): Promise<DeckSpec> {
  const slides = [...spec.slides]
  const allTexts: { slideIdx: number; blockIdx: number; text: string }[] = []

  for (let i = 0; i < slides.length; i++) {
    if (slides[i].title) allTexts.push({ slideIdx: i, blockIdx: -1, text: slides[i].title! })
    if (slides[i].subtitle) allTexts.push({ slideIdx: i, blockIdx: -2, text: slides[i].subtitle! })
    for (let j = 0; j < slides[i].blocks.length; j++) {
      const b = slides[i].blocks[j]
      if (b.type === 'text') allTexts.push({ slideIdx: i, blockIdx: j, text: (b as any).content })
    }
  }

  for (let t = 0; t < allTexts.length; t++) {
    onProgress?.(t, allTexts.length)
    try {
      const translated = await translateText(allTexts[t].text, targetLang)
      const { slideIdx, blockIdx } = allTexts[t]
      if (blockIdx === -1) slides[slideIdx] = { ...slides[slideIdx], title: translated }
      else if (blockIdx === -2) slides[slideIdx] = { ...slides[slideIdx], subtitle: translated }
      else {
        const blocks = [...slides[slideIdx].blocks]
        blocks[blockIdx] = { ...blocks[blockIdx], content: translated } as any
        slides[slideIdx] = { ...slides[slideIdx], blocks }
      }
    } catch { /* skip */ }
  }
  return { ...spec, slides }
}

export async function critiqueSlide(base64Image: string): Promise<string> {
  try {
    const r = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2-vision:11b',
        prompt: 'Review this presentation slide for visual design. Check: text-to-background contrast, alignment, spacing, font size readability, color harmony, visual balance, and any overlapping elements. Give 2-3 specific, actionable suggestions. Be constructive and brief.',
        images: [base64Image],
        stream: false,
      }),
    })
    if (!r.ok) return 'Vision model not available. Pull llama3.2-vision:11b to enable design critique.'
    return ((await r.json()) as any).response.trim()
  } catch { return 'Design critique unavailable.' }
}
