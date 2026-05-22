import React, { useState, useCallback } from 'react'
import { DeckSpec, Slide } from './dsl/schema'
import { PromptInput } from './components/PromptInput'
import { ValidationPanel } from './components/ValidationPanel'
import { DeckSpecPanel } from './components/DeckSpecPanel'
import { SpecEditor } from './editor/SpecEditor'
import { SlideRenderer } from './renderers/SlideRenderer'
import { validateDeck, repairDeck } from './validation/validator'
import { downloadDeck, downloadJSON, printDeck } from './publishing/publisher'

const DEFAULT_SPEC: DeckSpec = {
  meta: { title: 'My Presentation', theme: 'noir', date: new Date().toISOString().slice(0, 10) },
  slides: [
    {
      kind: 'title',
      title: 'My Presentation',
      subtitle: 'Built with Slidelang',
      blocks: [
        { type: 'text', content: 'A deck-as-code authoring platform', style: { italic: true, size: 'large' } },
        { type: 'text', content: 'Create. Edit. Present. Share.', style: { size: 'medium' } },
      ],
    },
    {
      kind: 'content',
      title: 'Getting Started',
      blocks: [
        { type: 'bullets', items: ['Type a prompt above and click Generate', 'Or edit the deck spec directly', 'Preview slides in real-time', 'Export as HTML or JSON'] },
      ],
    },
  ],
}

function App() {
  const [spec, setSpec] = useState<DeckSpec>(() => {
    const saved = localStorage.getItem('slidelang_deck')
    if (saved) {
      try { return JSON.parse(saved) as DeckSpec } catch { /* ignore */ }
    }
    return DEFAULT_SPEC
  })
  const [activeSlide, setActiveSlide] = useState(0)
  const [showEditor, setShowEditor] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [issues, setIssues] = useState(() => validateDeck(DEFAULT_SPEC))
  const [repairs, setRepairs] = useState<string[]>([])

  const handleSpecChange = useCallback((newSpec: DeckSpec) => {
    setSpec(newSpec)
    setIssues(validateDeck(newSpec))
    localStorage.setItem('slidelang_deck', JSON.stringify(newSpec))
  }, [])

  const handleGenerate = useCallback((newSpec: DeckSpec) => {
    handleSpecChange(newSpec)
    setActiveSlide(0)
  }, [handleSpecChange])

  const handleRepair = useCallback(() => {
    const { spec: repaired, repairs: rep } = repairDeck(spec)
    handleSpecChange(repaired)
    setRepairs(rep)
    setTimeout(() => setRepairs([]), 5000)
  }, [spec, handleSpecChange])

  const currentSlide = spec.slides[activeSlide] || null

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <header style={{
        background: 'linear-gradient(135deg, #4361ee 0%, #7209b7 100%)',
        color: 'white',
        padding: '0.5em 1em',
        display: 'flex',
        alignItems: 'center',
        gap: '1em',
        flexShrink: 0,
      }}>
        <h1 style={{ margin: 0, fontSize: '1.2em', fontWeight: 700 }}>Slidelang</h1>
        <span style={{ fontSize: '0.75em', opacity: 0.8 }}>Deck-as-Code</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4em' }}>
          <button onClick={() => setShowSettings(!showSettings)} style={headerBtnStyle}>
            {showSettings ? '✕ Settings' : '⚙️ Settings'}
          </button>
          <button onClick={() => setShowEditor(!showEditor)} style={headerBtnStyle}>
            {showEditor ? '✕ Editor' : '📝 Editor'}
          </button>
          <button onClick={() => document.getElementById('slidelang-import')?.click()} style={headerBtnStyle}>📂 Load JSON</button>
          <input id="slidelang-import" type="file" accept=".json" style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            try {
              const text = await file.text()
              const parsed = JSON.parse(text) as DeckSpec
              handleSpecChange(parsed)
              setActiveSlide(0)
            } catch { alert('Invalid Slidelang JSON file') }
            e.target.value = ''
          }} />
          <button onClick={() => downloadJSON(spec)} style={headerBtnStyle}>💾 Save JSON</button>
          <button onClick={() => downloadDeck(spec)} style={headerBtnStyle}>📤 Export HTML</button>
          <button onClick={() => printDeck(spec)} style={headerBtnStyle}>🖨️ Print</button>
        </div>
      </header>

      <PromptInput onDeckGenerated={handleGenerate} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {showSettings && (
          <div style={{ width: 250, borderRight: '1px solid #e0e0e0', overflow: 'auto', flexShrink: 0 }}>
            <DeckSpecPanel spec={spec} onSpecChange={handleSpecChange} />
          </div>
        )}

        {showEditor && (
          <div style={{ width: 400, borderRight: '1px solid #e0e0e0', overflow: 'auto', flexShrink: 0 }}>
            <SpecEditor spec={spec} onSpecChange={handleSpecChange} />
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '1em', background: '#f5f5f5' }}>
            <div style={{
              maxWidth: 800,
              margin: '0 auto',
              background: 'white',
              borderRadius: 12,
              boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
              minHeight: 400,
              overflow: 'hidden',
              position: 'relative',
            }}>
              {currentSlide ? (
                <SlideRenderer slide={currentSlide} />
              ) : (
                <div style={{ padding: '2em', textAlign: 'center', opacity: 0.5 }}>
                  No slides. Enter a prompt and click Generate.
                </div>
              )}
            </div>
          </div>

          <div style={{
            padding: '0.5em 1em',
            borderTop: '1px solid #e0e0e0',
            background: 'white',
            display: 'flex',
            gap: '0.3em',
            overflowX: 'auto',
            flexShrink: 0,
          }}>
            {spec.slides.map((slide, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                style={{
                  padding: '0.4em 0.75em',
                  border: activeSlide === i ? '2px solid #4361ee' : '1px solid #ddd',
                  borderRadius: 6,
                  background: activeSlide === i ? '#eef0ff' : 'white',
                  cursor: 'pointer',
                  fontSize: '0.75em',
                  whiteSpace: 'nowrap',
                  fontWeight: activeSlide === i ? 600 : 400,
                  flexShrink: 0,
                }}
              >
                {slide.kind === 'title' ? '🏠' : slide.kind === 'section' ? '📂' : slide.kind === 'chart' ? '📊' : slide.kind === 'math' ? '∑' : slide.kind === 'image-full' ? '🖼️' : '📄'}
                {' '}
                {slide.title?.slice(0, 25) || `Slide ${i + 1}`}
              </button>
            ))}
          </div>

          <ValidationPanel issues={issues} repairs={repairs} onRepair={handleRepair} />
        </div>
      </div>
    </div>
  )
}

const headerBtnStyle: React.CSSProperties = {
  padding: '0.3em 0.6em',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 4,
  background: 'rgba(255,255,255,0.1)',
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.75em',
  whiteSpace: 'nowrap',
}

export default App
