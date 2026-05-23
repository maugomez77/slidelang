import { DeckSpec, Slide } from '../dsl/schema'
import pptxgen from 'pptxgenjs'

const THEME_COLORS: Record<string, { bg: string; acc: string; tx: string; hd: string }> = {
  noir:    { bg: '08080f', acc: 'd4a853', tx: 'eeebe5', hd: 'ffffff' },
  air:     { bg: 'fafaf9', acc: '1d4ed8', tx: '1e293b', hd: '0f172a' },
  bold:    { bg: 'ffffff', acc: '0a0a0a', tx: '404040', hd: '0a0a0a' },
  warm:    { bg: '1c1410', acc: 'e8924f', tx: 'f0e8de', hd: 'ffffff' },
  crimson: { bg: '1a0a0c', acc: 'dc2626', tx: 'f0e5e5', hd: 'ffffff' },
  sage:    { bg: 'f7faf5', acc: '5d8a3c', tx: '2d3a22', hd: '1a2e0e' },
  navy:    { bg: '0a1128', acc: '3b82f6', tx: 'e8edf6', hd: 'ffffff' },
  neon:    { bg: '0d0d0d', acc: '00ff88', tx: 'e0e0e0', hd: 'ffffff' },
}

export function exportToPPTX(spec: DeckSpec): pptxgen {
  const pres = new pptxgen()
  const tc = THEME_COLORS[spec.meta.theme] || THEME_COLORS.noir
  const isDark = ['noir', 'warm', 'crimson', 'navy', 'neon'].includes(spec.meta.theme)

  pres.layout = 'LAYOUT_WIDE'
  pres.author = spec.meta.author || 'Slidelang'
  pres.title = spec.meta.title

  spec.slides.forEach((slide) => {
    const s = pres.addSlide()
    s.background = { color: tc.bg }

    switch (slide.kind) {
      case 'title':
        addTitleSlide(s, slide, tc, isDark)
        break
      case 'section':
        addSectionSlide(s, slide, tc, isDark)
        break
      case 'quote':
        addQuoteSlide(s, slide, tc, isDark)
        break
      case 'two-column':
        addTwoColSlide(s, slide, tc, isDark)
        break
      case 'comparison':
        addComparisonSlide(s, slide, tc, isDark)
        break
      case 'image-full':
        addImageSlide(s, slide, tc, isDark)
        break
      default:
        addStandardSlide(s, slide, tc, isDark)
    }
  })

  return pres
}

function addTitleSlide(s: pptxgen.Slide, slide: Slide, tc: typeof THEME_COLORS.noir, isDark: boolean) {
  s.addText(slide.title || '', {
    x: 1.5, y: 1.8, w: 10, h: 1.5,
    fontSize: 44, bold: true, color: tc.hd,
    align: 'center', fontFace: 'Georgia',
  })
  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 2, y: 3.3, w: 9, h: 1,
      fontSize: 20, color: tc.tx,
      align: 'center', fontFace: 'Inter',
    })
  }
  // Accent line
  s.addShape('rect', { x: 5.5, y: 3.1, w: 2, h: 0.04, fill: { color: tc.acc } })
}

function addSectionSlide(s: pptxgen.Slide, slide: Slide, tc: typeof THEME_COLORS.noir, isDark: boolean) {
  s.addText(slide.title || '', {
    x: 1, y: 2.2, w: 11, h: 1.5,
    fontSize: 40, bold: true, color: tc.acc,
    align: 'center', fontFace: 'Georgia', charSpacing: 8,
  })
}

function addQuoteSlide(s: pptxgen.Slide, slide: Slide, tc: typeof THEME_COLORS.noir, isDark: boolean) {
  const tb = slide.blocks.find(b => b.type === 'text')
  const q = tb ? (tb as any).content : slide.title || ''
  s.addText('"', { x: 2, y: 1.2, w: 9, h: 1, fontSize: 60, color: tc.acc, align: 'center', fontFace: 'Georgia', italic: true })
  s.addText(q, { x: 2, y: 2.2, w: 9, h: 2.5, fontSize: 26, color: tc.hd, align: 'center', fontFace: 'Georgia', italic: true, lineSpacing: 36 })
  if (slide.subtitle) {
    s.addText(`— ${slide.subtitle}`, { x: 2, y: 4.5, w: 9, h: 0.5, fontSize: 16, color: tc.tx, align: 'center' })
  }
}

function addTwoColSlide(s: pptxgen.Slide, slide: Slide, tc: typeof THEME_COLORS.noir, isDark: boolean) {
  addHeading(s, slide, tc)
  const mid = Math.ceil(slide.blocks.length / 2)
  const blocks = slide.blocks.map((b, i) => {
    const col = i < mid ? { x: 0.5, w: 5.8 } : { x: 6.7, w: 5.8 }
    const rowIdx = i < mid ? i : i - mid
    addBlock(s, b, col.x, 1.3 + rowIdx * 0.8, col.w, tc, isDark)
  })
}

function addComparisonSlide(s: pptxgen.Slide, slide: Slide, tc: typeof THEME_COLORS.noir, isDark: boolean) {
  addHeading(s, slide, tc)
  const mid = Math.ceil(slide.blocks.length / 2)
  const L = slide.blocks.slice(0, mid)
  const R = slide.blocks.slice(mid)
  const lt = L.length > 0 && L[0].type === 'text' ? (L[0] as any).content : ''
  const rt = R.length > 0 && R[0].type === 'text' ? (R[0] as any).content : ''
  const lb = L.length > 0 && L[0].type === 'text' ? L.slice(1) : L
  const rb = R.length > 0 && R[0].type === 'text' ? R.slice(1) : R

  // Left panel
  s.addShape('rect', { x: 0.5, y: 1.2, w: 5.8, h: 5.5, fill: { color: isDark ? '1a1a30' : 'f5f5f5' }, rectRadius: 0.1 })
  if (lt) s.addText(lt, { x: 0.5, y: 1.3, w: 5.8, h: 0.5, fontSize: 22, bold: true, color: tc.hd, align: 'center' })
  lb.forEach((b, i) => addBlock(s, b, 0.8, 1.9 + i * 0.65, 5.2, tc, isDark))

  // Right panel
  s.addShape('rect', { x: 6.7, y: 1.2, w: 5.8, h: 5.5, fill: { color: isDark ? '1a1a30' : 'f5f5f5' }, rectRadius: 0.1 })
  if (rt) s.addText(rt, { x: 6.7, y: 1.3, w: 5.8, h: 0.5, fontSize: 22, bold: true, color: tc.hd, align: 'center' })
  rb.forEach((b, i) => addBlock(s, b, 7, 1.9 + i * 0.65, 5.2, tc, isDark))
}

function addImageSlide(s: pptxgen.Slide, slide: Slide, tc: typeof THEME_COLORS.noir, isDark: boolean) {
  addHeading(s, slide, tc)
  const ib = slide.blocks.find(b => b.type === 'image') as any
  if (ib?.source?.url) {
    s.addImage({ path: ib.source.url, x: 2, y: 1.5, w: 9, h: 5, sizing: { type: 'contain', w: 9, h: 5 } })
  }
}

function addStandardSlide(s: pptxgen.Slide, slide: Slide, tc: typeof THEME_COLORS.noir, isDark: boolean) {
  addHeading(s, slide, tc)
  if (slide.subtitle) {
    s.addText(slide.subtitle, { x: 0.5, y: 1.1, w: 12, h: 0.5, fontSize: 14, color: tc.tx, italic: true })
  }
  slide.blocks.forEach((b, i) => {
    addBlock(s, b, 0.5, 1.5 + i * 0.85, 12, tc, isDark)
  })
}

function addHeading(s: pptxgen.Slide, slide: Slide, tc: typeof THEME_COLORS.noir) {
  if (slide.title) {
    s.addText(slide.title, { x: 0.5, y: 0.3, w: 12, h: 0.7, fontSize: 28, bold: true, color: tc.hd, fontFace: 'Georgia' })
    s.addShape('rect', { x: 0.5, y: 0.95, w: 3, h: 0.03, fill: { color: tc.acc } })
  }
}

function addBlock(s: pptxgen.Slide, block: any, x: number, y: number, w: number, tc: typeof THEME_COLORS.noir, isDark: boolean) {
  switch (block.type) {
    case 'text':
      s.addText(block.content, {
        x, y, w, h: 0.5,
        fontSize: block.style?.size === 'xlarge' ? 28 : block.style?.size === 'large' ? 18 : 13,
        bold: block.style?.bold, italic: block.style?.italic,
        color: block.style?.color || tc.tx,
        fontFace: 'Inter',
      })
      break
    case 'bullets':
      block.items?.forEach((item: string, i: number) => {
        s.addText(`• ${item}`, {
          x: x + 0.3, y: y + i * 0.5, w: w - 0.3, h: 0.4,
          fontSize: 13, color: tc.tx, bullet: false, fontFace: 'Inter',
        })
      })
      break
    case 'numbered':
      block.items?.forEach((item: string, i: number) => {
        s.addText(`${i + 1}. ${item}`, {
          x: x + 0.3, y: y + i * 0.5, w: w - 0.3, h: 0.4,
          fontSize: 13, color: tc.tx, fontFace: 'Inter',
        })
      })
      break
    case 'math':
      s.addText(block.expression || '', {
        x, y, w, h: 0.6,
        fontSize: 16, color: tc.hd,
        align: 'center', fontFace: 'Georgia', italic: true,
      })
      break
  }
}

export function downloadPPTX(spec: DeckSpec) {
  const pres = exportToPPTX(spec)
  pres.writeFile({ fileName: `${spec.meta.title.replace(/[^a-z0-9]+/gi, '-')}.pptx` })
}
