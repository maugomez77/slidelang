import React, { useState, useCallback, useEffect } from 'react'
import { DeckSpec } from './dsl/schema'
import { PromptInput } from './components/PromptInput'
import { ImagePromptInput } from './components/ImagePromptInput'
import { ValidationPanel } from './components/ValidationPanel'
import { ThemeBuilder, ThemeVars } from './components/ThemeBuilder'
import { PresentationMode } from './components/PresentationMode'
import { SpecEditor } from './editor/SpecEditor'
import { SlideRenderer } from './renderers/SlideRenderer'
import { validateDeck, repairDeck } from './validation/validator'
import { downloadDeck, downloadJSON, printDeck, downloadCSV } from './publishing/publisher'
import { downloadPPTX } from './publishing/pptx-exporter'
import { exportToGoogleSlides } from './publishing/google-slides-exporter'
import { critiqueSlide } from './ai/design-ai'

const THEMES: Record<string, ThemeVars> = {
  noir:   { bg: '#08080f', surf: '#111122', acc: '#d4a853', a2: '#f0c969', tx: '#eeebe5', tx2: '#a0998c', hd: '#ffffff', bd: '#252540', ok: '#5bb87a', err: '#e0556a', wrn: '#d4a853', grd: '#1a1a30' },
  air:    { bg: '#fafaf9', surf: '#ffffff', acc: '#1d4ed8', a2: '#3b82f6', tx: '#1e293b', tx2: '#475569', hd: '#0f172a', bd: '#e8ecf0', ok: '#10b981', err: '#ef4444', wrn: '#f59e0b', grd: '#f1f5f9' },
  bold:   { bg: '#ffffff', surf: '#f5f5f5', acc: '#0a0a0a', a2: '#525252', tx: '#404040', tx2: '#595959', hd: '#0a0a0a', bd: '#e8e8e8', ok: '#0a0a0a', err: '#dc2626', wrn: '#d97706', grd: '#f5f5f5' },
  warm:   { bg: '#1c1410', surf: '#2a1f19', acc: '#e8924f', a2: '#f0b87b', tx: '#f0e8de', tx2: '#b0a090', hd: '#ffffff', bd: '#3d3028', ok: '#6fb86f', err: '#e06b6b', wrn: '#e8a74f', grd: '#2e221a' },
  crimson:{ bg: '#1a0a0c', surf: '#2d1518', acc: '#dc2626', a2: '#f87171', tx: '#f0e5e5', tx2: '#b89595', hd: '#ffffff', bd: '#3d1c1f', ok: '#22c55e', err: '#dc2626', wrn: '#f59e0b', grd: '#2d181a' },
  sage:   { bg: '#f7faf5', surf: '#ffffff', acc: '#5d8a3c', a2: '#84b559', tx: '#2d3a22', tx2: '#4a5a3f', hd: '#1a2e0e', bd: '#dce8d2', ok: '#5d8a3c', err: '#dc2626', wrn: '#d97706', grd: '#edf2e8' },
  navy:   { bg: '#0a1128', surf: '#151d3d', acc: '#3b82f6', a2: '#60a5fa', tx: '#e8edf6', tx2: '#8a9cc4', hd: '#ffffff', bd: '#1e2a4d', ok: '#22c55e', err: '#ef4444', wrn: '#f59e0b', grd: '#182244' },
  neon:   { bg: '#0d0d0d', surf: '#1a1a1a', acc: '#00ff88', a2: '#00ccff', tx: '#e0e0e0', tx2: '#666666', hd: '#ffffff', bd: '#2a2a2a', ok: '#00ff88', err: '#ff3366', wrn: '#ffaa00', grd: '#1a1a1a' },
}

const CUSTOM_THEMES_KEY = 'slidelang_custom_themes'

function loadCustomThemes(): Record<string, ThemeVars> {
  try { const saved = localStorage.getItem(CUSTOM_THEMES_KEY); return saved ? JSON.parse(saved) : {} } catch { return {} }
}

function saveCustomThemes(ct: Record<string, ThemeVars>) { localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(ct)) }

const DEFAULT_SPEC: DeckSpec = {
  meta: { title: 'My Presentation', theme: 'noir', date: new Date().toISOString().slice(0, 10) },
  slides: [
    { kind: 'title', title: 'My Presentation', subtitle: 'Built with Slidelang', blocks: [{ type: 'text', content: 'A deck-as-code authoring platform', style: { italic: true, size: 'large' } }, { type: 'text', content: 'Create. Edit. Present. Share.', style: { size: 'medium' } }] },
    { kind: 'content', title: 'Getting Started', blocks: [{ type: 'bullets', items: ['Type a prompt above and click Generate', 'Or edit the deck spec directly', 'Preview slides in real-time', 'Export as HTML or JSON'] }] },
  ],
}

function injectTheme(theme: string, customThemes: Record<string, ThemeVars>) {
  const t = customThemes[theme] || THEMES[theme] || THEMES.noir
  let el = document.getElementById('slidelang-theme') as HTMLStyleElement | null
  if (!el) { el = document.createElement('style'); el.id = 'slidelang-theme'; document.head.appendChild(el) }
  el.textContent = `:root { --bg: ${t.bg}; --surf: ${t.surf}; --accent: ${t.acc}; --a2: ${t.a2}; --tx: ${t.tx}; --tx2: ${t.tx2}; --hd: ${t.hd}; --bd: ${t.bd}; --ok: ${t.ok}; --err: ${t.err}; --wrn: ${t.wrn}; --grd: ${t.grd}; }`
}

function App() {
  const [spec, setSpec] = useState<DeckSpec>(() => {
    const saved = localStorage.getItem('slidelang_deck'); if (saved) { try { return JSON.parse(saved) as DeckSpec } catch { /* */ } }
    return DEFAULT_SPEC
  })
  const [activeSlide, setActiveSlide] = useState(0)
  const [showEditor, setShowEditor] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPresent, setShowPresent] = useState(false)
  const [issues, setIssues] = useState(() => validateDeck(DEFAULT_SPEC))
  const [repairs, setRepairs] = useState<string[]>([])
  const [customThemes, setCustomThemes] = useState<Record<string, ThemeVars>>(loadCustomThemes)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [undoStack, setUndoStack] = useState<DeckSpec[]>([])
  const [redoStack, setRedoStack] = useState<DeckSpec[]>([])
  const [critique, setCritique] = useState('')
  const [critiquing, setCritiquing] = useState(false)
  const [exportingSlides, setExportingSlides] = useState(false)
  const [exportProgress, setExportProgress] = useState('')

  const allThemes = { ...THEMES, ...customThemes }

  const handleSpecChange = useCallback((newSpec: DeckSpec) => {
    setUndoStack(prev => [...prev.slice(-49), spec])
    setRedoStack([])
    setSpec(newSpec); setIssues(validateDeck(newSpec)); localStorage.setItem('slidelang_deck', JSON.stringify(newSpec))
  }, [spec])

  useEffect(() => { injectTheme(spec.meta.theme, allThemes) }, [spec.meta.theme, customThemes])

  // Undo/redo keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (undoStack.length > 0) {
          setRedoStack(prev => [spec, ...prev.slice(0, 49)])
          setSpec(undoStack[undoStack.length - 1])
          setUndoStack(prev => prev.slice(0, -1))
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        if (redoStack.length > 0) {
          setUndoStack(prev => [...prev.slice(-49), spec])
          setSpec(redoStack[0])
          setRedoStack(prev => prev.slice(1))
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [spec, undoStack, redoStack])

  const handleGenerate = useCallback((newSpec: DeckSpec) => { handleSpecChange(newSpec); setActiveSlide(0) }, [handleSpecChange])

  const handleRepair = useCallback(() => {
    const { spec: repaired, repairs: rep } = repairDeck(spec); handleSpecChange(repaired); setRepairs(rep); setTimeout(() => setRepairs([]), 5000)
  }, [spec, handleSpecChange])

  const handleGoogleSlidesExport = async () => {
    setExportingSlides(true)
    const url = await exportToGoogleSlides(spec, (msg) => setExportProgress(msg))
    setExportingSlides(false)
    setExportProgress('')
    if (url) window.open(url, '_blank')
  }

  const handleVisionCritique = async () => {
    setCritiquing(true); setCritique('')
    try {
      const container = document.querySelector('#slide-preview-container')
      if (!container) { setCritique('Preview not found.'); setCritiquing(false); return }
      const canvas = document.createElement('canvas')
      canvas.width = 1280; canvas.height = 720
      const ctx = canvas.getContext('2d')
      if (!ctx) { setCritique('Canvas not supported.'); setCritiquing(false); return }
      const slideEl = container.children[0] || container
      const html = slideEl.innerHTML
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Inter,sans-serif;font-size:14px;color:#333;background:white;padding:40px;width:1200px;height:640px">
            ${html.replace(/<canvas[^>]*>[\s\S]*?<\/canvas>/g, '[Chart]').replace(/<img[^>]*>/g, '[Image]')}
          </div>
        </foreignObject>
      </svg>`
      const img = new Image()
      const svgB64 = btoa(String.fromCharCode(...new TextEncoder().encode(svg)))
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve(); img.onerror = reject
        img.src = 'data:image/svg+xml;base64,' + svgB64
      })
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1280, 720)
      ctx.drawImage(img, 0, 0)
      const result = await critiqueSlide(canvas.toDataURL('image/png').split(',')[1])
      setCritique(result || 'No feedback returned.')
    } catch (e) {
      setCritique('Critique unavailable. Ensure Ollama is running with llama3.2-vision:11b.')
    }
    setCritiquing(false)
  }

  const handleThemeApply = (name: string, vars: ThemeVars) => {
    if (!THEMES[name]) { const updated = { ...customThemes, [name]: vars }; setCustomThemes(updated); saveCustomThemes(updated) }
    handleSpecChange({ ...spec, meta: { ...spec.meta, theme: name } })
  }

  const handleFontChange = (fontH?: string, fontB?: string) => {
    if (fontH || fontB) {
      const family = [fontH, fontB].filter(Boolean).map(f => `family=${f!.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&')
      const link = document.createElement('link'); link.href = `https://fonts.googleapis.com/css2?${family}&display=swap`; link.rel = 'stylesheet'; link.id = 'slidelang-fonts-dynamic'
      const existing = document.getElementById('slidelang-fonts-dynamic'); if (existing) existing.remove(); document.head.appendChild(link)
    }
    handleSpecChange({ ...spec, meta: { ...spec.meta, fontH, fontB } })
  }

  const handleDragStart = (i: number) => setDragIndex(i)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (targetIdx: number) => {
    if (dragIndex === null || dragIndex === targetIdx) return
    const slides = [...spec.slides]; const [moved] = slides.splice(dragIndex, 1); slides.splice(targetIdx, 0, moved)
    handleSpecChange({ ...spec, slides })
    if (activeSlide === dragIndex) setActiveSlide(targetIdx)
    else if (activeSlide > dragIndex && activeSlide <= targetIdx) setActiveSlide(activeSlide - 1)
    else if (activeSlide < dragIndex && activeSlide >= targetIdx) setActiveSlide(activeSlide + 1)
    setDragIndex(null)
  }

  const currentSlide = spec.slides[activeSlide] || null

  if (showPresent) return <PresentationMode spec={spec} initialSlide={activeSlide} onClose={() => setShowPresent(false)} />

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <header style={{ background: 'linear-gradient(135deg, #4361ee 0%, #7209b7 100%)', color: 'white', padding: '0.5em 1em', display: 'flex', alignItems: 'center', gap: '1em', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '1.2em', fontWeight: 700 }}>Slidelang</h1>
        <span style={{ fontSize: '0.75em', opacity: 0.8 }}>Deck-as-Code</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4em', alignItems: 'center' }}>
          <button onClick={() => setShowPresent(true)} style={{ ...headerBtnStyle, background: 'rgba(255,255,255,0.25)' }}>▶️ Present</button>
          <button onClick={() => setShowSettings(!showSettings)} style={headerBtnStyle}>{showSettings ? '✕ Theme' : '🎨 Theme'}</button>
          <button onClick={() => setShowEditor(!showEditor)} style={headerBtnStyle}>{showEditor ? '✕ Editor' : '📝 Editor'}</button>
          <button onClick={() => document.getElementById('slidelang-import')?.click()} style={headerBtnStyle}>📂 Load JSON</button>
          <input id="slidelang-import" type="file" accept=".json" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return
            try { const t = await file.text(); handleSpecChange(JSON.parse(t) as DeckSpec); setActiveSlide(0) } catch { alert('Invalid JSON') }
            e.target.value = ''
          }} />
          <button onClick={() => downloadJSON(spec)} style={headerBtnStyle}>💾 Save</button>
          <button onClick={() => downloadDeck(spec)} style={headerBtnStyle}>📤 HTML</button>
          <button onClick={() => downloadPPTX(spec)} style={headerBtnStyle}>📥 PPTX</button>
          <button onClick={() => printDeck(spec)} style={headerBtnStyle}>📄 PDF</button>
          <button onClick={() => downloadCSV(spec)} style={headerBtnStyle}>📊 CSV</button>
          <button onClick={handleGoogleSlidesExport} disabled={exportingSlides} style={headerBtnStyle}>{exportingSlides ? '...' : '📑 Slides'}</button>
        </div>
      </header>

      <PromptInput onDeckGenerated={handleGenerate} />
      <ImagePromptInput onDeckGenerated={handleGenerate} />
      {exportProgress && (
        <div style={{ padding: '0.3em 1em', background: '#fef3c7', fontSize: '0.75em', color: '#92400e', fontWeight: 600 }}>{exportProgress}</div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {showSettings && (
          <div style={{ width: 280, borderRight: '1px solid #e0e0e0', overflow: 'auto', flexShrink: 0 }}>
            <ThemeBuilder currentTheme={spec.meta.theme} themes={allThemes} fontH={spec.meta.fontH} fontB={spec.meta.fontB} onApply={handleThemeApply} onFontChange={handleFontChange} />
            <div style={{ padding: '0 0.75em 0.75em', fontSize: '0.8em' }}>
              <div style={{ marginBottom: '0.4em' }}><label style={{ display: 'block', fontSize: '0.75em', opacity: 0.7, marginBottom: '0.15em' }}>Title</label><input type="text" value={spec.meta.title} onChange={e => handleSpecChange({ ...spec, meta: { ...spec.meta, title: e.target.value } })} style={inputStyle} /></div>
              <div style={{ marginBottom: '0.4em' }}><label style={{ display: 'block', fontSize: '0.75em', opacity: 0.7, marginBottom: '0.15em' }}>Author</label><input type="text" value={spec.meta.author || ''} onChange={e => handleSpecChange({ ...spec, meta: { ...spec.meta, author: e.target.value } })} style={inputStyle} /></div>
              <div style={{ fontSize: '0.8em', opacity: 0.5, marginTop: '0.5em' }}>{spec.slides.length} slides</div>
            </div>
          </div>
        )}
        {showEditor && <div style={{ width: 400, borderRight: '1px solid #e0e0e0', overflow: 'auto', flexShrink: 0 }}><SpecEditor spec={spec} onSpecChange={handleSpecChange} /></div>}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '1em', background: 'var(--grd, #f5f5f5)' }}>
            <div id="slide-preview-container" style={{ maxWidth: 800, margin: '0 auto', background: 'var(--bg, white)', borderRadius: 12, boxShadow: '0 2px 20px rgba(0,0,0,0.1)', minHeight: 400, overflow: 'hidden', position: 'relative' }}>
              {currentSlide ? <SlideRenderer slide={currentSlide} /> : <div style={{ padding: '2em', textAlign: 'center', opacity: 0.5, color: 'var(--tx)' }}>No slides.</div>}
            </div>
          </div>
          <div style={{ padding: '0.5em 1em', borderTop: '1px solid #e0e0e0', background: 'white', display: 'flex', gap: '0.3em', overflowX: 'auto', flexShrink: 0 }}>
            {spec.slides.map((slide, i) => (
              <button key={i} draggable onDragStart={() => handleDragStart(i)} onDragOver={handleDragOver} onDrop={() => handleDrop(i)} onDragEnd={() => setDragIndex(null)} onClick={() => { setActiveSlide(i); setCritique('') }}
                style={{ padding: '0.4em 0.75em', border: activeSlide === i ? '2px solid #4361ee' : dragIndex === i ? '2px dashed #999' : '1px solid #ddd', borderRadius: 6, background: activeSlide === i ? '#eef0ff' : 'white', cursor: 'grab', fontSize: '0.75em', whiteSpace: 'nowrap', fontWeight: activeSlide === i ? 600 : 400, flexShrink: 0, opacity: dragIndex === i ? 0.5 : 1 }}>
                {slide.kind === 'title' ? '🏠' : slide.kind === 'section' ? '📂' : slide.kind === 'chart' ? '📊' : slide.kind === 'math' ? '∑' : slide.kind === 'image-full' ? '🖼️' : '📄'}
                {' '}{slide.title?.slice(0, 25) || `Slide ${i + 1}`}
              </button>
            ))}
          </div>
          <ValidationPanel issues={issues} repairs={repairs} onRepair={handleRepair} onCritique={handleVisionCritique} critique={critique} critiquing={critiquing} />
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '0.3em 0.5em', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.85em', boxSizing: 'border-box' }
const headerBtnStyle: React.CSSProperties = { padding: '0.3em 0.6em', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '0.75em', whiteSpace: 'nowrap' }

export default App
