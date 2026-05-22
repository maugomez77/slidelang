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
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}
