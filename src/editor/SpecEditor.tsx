import React, { useState } from 'react'
import { DeckSpec, Slide, SlideBlock } from '../dsl/schema'

export function SpecEditor({ spec, onSpecChange }: { spec: DeckSpec; onSpecChange: (s: DeckSpec) => void }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [showRaw, setShowRaw] = useState(false)

  const updateMeta = (field: string, value: string) => {
    onSpecChange({ ...spec, meta: { ...spec.meta, [field]: value } })
  }

  const updateSlide = (index: number, slide: Slide) => {
    const slides = [...spec.slides]
    slides[index] = slide
    onSpecChange({ ...spec, slides })
  }

  const currentSlide = spec.slides[activeSlide] || null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: '0.5em', padding: '0.5em', borderBottom: '1px solid #e0e0e0', overflowX: 'auto' }}>
        {spec.slides.map((slide, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            style={{
              padding: '0.3em 0.6em',
              border: activeSlide === i ? '2px solid #4361ee' : '1px solid #ddd',
              borderRadius: 4,
              background: activeSlide === i ? '#eef0ff' : 'white',
              fontSize: '0.75em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: activeSlide === i ? 600 : 400,
            }}
          >
            {i + 1}. {slide.title?.slice(0, 20) || slide.kind}
          </button>
        ))}
        <button
          onClick={() => {
            const newSlide: Slide = { kind: 'content', title: `Slide ${spec.slides.length + 1}`, blocks: [] }
            onSpecChange({ ...spec, slides: [...spec.slides, newSlide] })
            setActiveSlide(spec.slides.length)
          }}
          style={{ padding: '0.3em 0.6em', border: '1px dashed #999', borderRadius: 4, background: 'white', cursor: 'pointer', fontSize: '0.75em' }}
        >
          + Add Slide
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '0.75em', overflow: 'auto' }}>
          {showRaw ? (
            <RawSpecEditor spec={spec} onSpecChange={onSpecChange} />
          ) : currentSlide ? (
            <SlideEditor slide={currentSlide} onSlideChange={(s) => updateSlide(activeSlide, s)} />
          ) : (
            <p style={{ opacity: 0.5, padding: '2em', textAlign: 'center' }}>No slides yet</p>
          )}
        </div>
      </div>

      <div style={{ padding: '0.4em 0.75em', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '0.5em', alignItems: 'center', fontSize: '0.75em' }}>
        <label>
          <input type="checkbox" checked={showRaw} onChange={e => setShowRaw(e.target.checked)} />
          {' '}Raw JSON
        </label>
        <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
          {spec.slides.length} slides · {spec.meta.theme} theme
        </span>
      </div>
    </div>
  )
}

function SlideEditor({ slide, onSlideChange }: { slide: Slide; onSlideChange: (s: Slide) => void }) {
  return (
    <div>
      <div style={{ marginBottom: '0.5em' }}>
        <label style={{ fontSize: '0.75em', opacity: 0.7 }}>Slide Kind</label>
        <select
          value={slide.kind}
          onChange={e => onSlideChange({ ...slide, kind: e.target.value as any })}
          style={{ display: 'block', width: '100%', padding: '0.3em', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.85em', marginTop: '0.2em' }}
        >
          {['title', 'section', 'content', 'two-column', 'image-full', 'quote', 'comparison', 'chart', 'math', 'blank'].map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5em', marginBottom: '0.5em' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.75em', opacity: 0.7 }}>Title</label>
          <input
            type="text"
            value={slide.title || ''}
            onChange={e => onSlideChange({ ...slide, title: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '0.3em', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.85em', marginTop: '0.2em' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.75em', opacity: 0.7 }}>Subtitle</label>
          <input
            type="text"
            value={slide.subtitle || ''}
            onChange={e => onSlideChange({ ...slide, subtitle: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '0.3em', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.85em', marginTop: '0.2em' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '0.5em' }}>
        <label style={{ fontSize: '0.75em', opacity: 0.7 }}>Background</label>
        <input
          type="text"
          value={slide.background || ''}
          onChange={e => onSlideChange({ ...slide, background: e.target.value })}
          placeholder="e.g. #f0f0f0 or linear-gradient(...)"
          style={{ display: 'block', width: '100%', padding: '0.3em', borderRadius: 4, border: '1px solid #ccc', fontSize: '0.85em', marginTop: '0.2em' }}
        />
      </div>

      <div>
        <label style={{ fontSize: '0.75em', opacity: 0.7 }}>Blocks ({slide.blocks.length})</label>
        {slide.blocks.map((block, i) => (
          <BlockEditor
            key={i}
            block={block}
            onChange={(b) => {
              const blocks = [...slide.blocks]
              blocks[i] = b
              onSlideChange({ ...slide, blocks })
            }}
            onRemove={() => {
              const blocks = slide.blocks.filter((_, j) => j !== i)
              onSlideChange({ ...slide, blocks })
            }}
          />
        ))}
        <AddBlockMenu onAdd={(type) => {
          const newBlock = createBlock(type)
          onSlideChange({ ...slide, blocks: [...slide.blocks, newBlock] })
        }} />
      </div>
    </div>
  )
}

function BlockEditor({ block, onChange, onRemove }: { block: SlideBlock; onChange: (b: SlideBlock) => void; onRemove: () => void }) {
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 6, padding: '0.5em', margin: '0.3em 0', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3em' }}>
        <span style={{ fontSize: '0.7em', fontWeight: 600, color: '#4361ee' }}>{block.type}</span>
        <button onClick={onRemove} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ff4444', fontSize: '0.8em' }}>✕</button>
      </div>
      {renderBlockFields(block, onChange)}
    </div>
  )
}

function renderBlockFields(block: SlideBlock, onChange: (b: SlideBlock) => void) {
  switch (block.type) {
    case 'text':
      return (
        <>
          <textarea
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
            rows={2}
            style={{ width: '100%', padding: '0.3em', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.8em', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '0.3em', marginTop: '0.3em', flexWrap: 'wrap' }}>
            <label style={labelStyle}><input type="checkbox" checked={block.style?.bold || false} onChange={e => onChange({ ...block, style: { ...block.style, bold: e.target.checked } })} /> Bold</label>
            <label style={labelStyle}><input type="checkbox" checked={block.style?.italic || false} onChange={e => onChange({ ...block, style: { ...block.style, italic: e.target.checked } })} /> Italic</label>
            <select value={block.style?.size || ''} onChange={e => onChange({ ...block, style: { ...block.style, size: e.target.value as any || undefined } })} style={{ fontSize: '0.75em', padding: '0.15em' }}>
              <option value="">Size</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">XLarge</option>
            </select>
          </div>
        </>
      )
    case 'bullets':
    case 'numbered':
      return (
        <div>
          {block.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.3em', marginTop: '0.2em' }}>
              <input
                value={item}
                onChange={e => {
                  const items = [...block.items]
                  items[i] = e.target.value
                  onChange({ ...block, items })
                }}
                style={{ flex: 1, padding: '0.2em', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.8em' }}
              />
              <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: '0.8em' }}>✕</button>
            </div>
          ))}
          <button onClick={() => onChange({ ...block, items: [...block.items, ''] })} style={{ marginTop: '0.3em', padding: '0.15em 0.5em', border: '1px dashed #ccc', borderRadius: 4, background: 'white', cursor: 'pointer', fontSize: '0.75em' }}>+ Item</button>
        </div>
      )
    case 'chart':
      return <ChartBlockEditor block={block} onChange={onChange} />
    case 'math':
      return (
        <input
          type="text"
          value={block.expression}
          onChange={e => onChange({ ...block, expression: e.target.value })}
          placeholder="LaTeX expression (e.g. E = mc^2)"
          style={{ width: '100%', padding: '0.3em', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.8em' }}
        />
      )
    case 'image':
      return (
        <>
          <input
            type="text"
            value={block.source.url}
            onChange={e => onChange({ ...block, source: { ...block.source, url: e.target.value } })}
            placeholder="Image URL"
            style={{ width: '100%', padding: '0.3em', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.8em', marginBottom: '0.2em' }}
          />
          <input
            type="text"
            value={block.source.alt || ''}
            onChange={e => onChange({ ...block, source: { ...block.source, alt: e.target.value } })}
            placeholder="Alt text"
            style={{ width: '100%', padding: '0.3em', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.8em' }}
          />
        </>
      )
    default:
      return null
  }
}

function ChartBlockEditor({ block, onChange }: { block: Extract<SlideBlock, { type: 'chart' }>; onChange: (b: SlideBlock) => void }) {
  return (
    <div>
      <select
        value={block.chartType}
        onChange={e => onChange({ ...block, chartType: e.target.value as any })}
        style={{ fontSize: '0.75em', padding: '0.2em', marginBottom: '0.3em' }}
      >
        <option value="bar">Bar</option>
        <option value="line">Line</option>
        <option value="pie">Pie</option>
        <option value="area">Area</option>
      </select>
      <div style={{ fontSize: '0.75em', opacity: 0.7 }}>Labels: {block.labels.join(', ')}</div>
      {block.datasets.map((ds, i) => (
        <div key={i} style={{ fontSize: '0.75em' }}>{ds.label}: {ds.values.join(', ')}</div>
      ))}
    </div>
  )
}

function AddBlockMenu({ onAdd }: { onAdd: (type: SlideBlock['type']) => void }) {
  const types: SlideBlock['type'][] = ['text', 'bullets', 'numbered', 'chart', 'math', 'image']
  return (
    <div style={{ display: 'flex', gap: '0.3em', marginTop: '0.5em', flexWrap: 'wrap' }}>
      {types.map(t => (
        <button
          key={t}
          onClick={() => onAdd(t)}
          style={{ padding: '0.2em 0.5em', border: '1px dashed #4361ee', borderRadius: 4, background: '#f5f7ff', cursor: 'pointer', fontSize: '0.75em', color: '#4361ee' }}
        >
          + {t}
        </button>
      ))}
    </div>
  )
}

function createBlock(type: SlideBlock['type']): SlideBlock {
  switch (type) {
    case 'text': return { type: 'text', content: '' }
    case 'bullets': return { type: 'bullets', items: [''] }
    case 'numbered': return { type: 'numbered', items: [''] }
    case 'chart': return { type: 'chart', chartType: 'bar', labels: ['A', 'B', 'C'], datasets: [{ label: 'Values', values: [10, 20, 15] }] }
    case 'math': return { type: 'math', expression: 'E = mc^2' }
    case 'image': return { type: 'image', source: { url: 'https://picsum.photos/400/300', alt: 'Image' } }
    default: return { type: 'text', content: '' }
  }
}

function RawSpecEditor({ spec, onSpecChange }: { spec: DeckSpec; onSpecChange: (s: DeckSpec) => void }) {
  const [json, setJson] = useState(JSON.stringify(spec, null, 2))
  const [error, setError] = useState('')

  const apply = () => {
    try {
      const parsed = JSON.parse(json)
      onSpecChange(parsed)
      setError('')
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div>
      <textarea
        value={json}
        onChange={e => { setJson(e.target.value); setError('') }}
        style={{ width: '100%', height: 300, fontFamily: 'monospace', fontSize: '0.75em', padding: '0.5em', border: '1px solid #ddd', borderRadius: 6, resize: 'vertical' }}
      />
      {error && <p style={{ color: '#ff4444', fontSize: '0.75em' }}>{error}</p>}
      <button onClick={apply} style={{ marginTop: '0.3em', padding: '0.3em 0.75em', background: '#4361ee', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8em' }}>
        Apply JSON
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.7em',
  display: 'flex',
  alignItems: 'center',
  gap: '0.2em',
  cursor: 'pointer',
}
