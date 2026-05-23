import { DeckSpec } from '../dsl/schema'
import { compileDeckToHTML } from '../dsl/compiler'

export function exportHTML(spec: DeckSpec): Blob {
  const html = compileDeckToHTML(spec)
  return new Blob([html], { type: 'text/html' })
}

export function downloadDeck(spec: DeckSpec): void {
  const blob = exportHTML(spec)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${spec.meta.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getPresentationUrl(spec: DeckSpec): string {
  const html = compileDeckToHTML(spec)
  const blob = new Blob([html], { type: 'text/html' })
  return URL.createObjectURL(blob)
}

export function getDeckJSON(spec: DeckSpec): string {
  return JSON.stringify(spec, null, 2)
}

export function downloadJSON(spec: DeckSpec): void {
  const json = getDeckJSON(spec)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${spec.meta.title.replace(/[^a-zA-Z0-9]/g, '_')}.slidelang.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function printDeck(spec: DeckSpec): void {
  const html = compileDeckToHTML(spec)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

export function exportDeckAsPDF(spec: DeckSpec): void {
  const html = compileDeckToHTML(spec)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) return
  win.onload = () => {
    setTimeout(() => {
      win.document.body.classList.add('print-pdf')
      win.print()
    }, 2000)
  }
}

export function downloadCSV(spec: DeckSpec): void {
  const rows: string[] = ['Slide,Kind,Title,Subtitle,Block Type,Content']
  spec.slides.forEach((slide, i) => {
    const title = (slide.title || '').replace(/"/g, '""')
    const subtitle = (slide.subtitle || '').replace(/"/g, '""')
    if (slide.blocks.length === 0) {
      rows.push(`${i + 1},${slide.kind},"${title}","${subtitle}",,`)
    } else {
      slide.blocks.forEach((block: any) => {
        let content = ''
        if (block.type === 'text') content = (block.content || '').replace(/"/g, '""')
        else if (block.type === 'bullets' || block.type === 'numbered') content = (block.items || []).join('; ').replace(/"/g, '""')
        else if (block.type === 'chart') content = `[${block.chartType}] ${block.labels?.join(',')}`
        else if (block.type === 'math') content = (block.expression || '').replace(/"/g, '""')
        else if (block.type === 'image') content = block.source?.url || ''
        rows.push(`${i + 1},${slide.kind},"${title}","${subtitle}",${block.type},"${content}"`)
      })
    }
  })
  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${spec.meta.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
