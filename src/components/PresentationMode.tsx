import React, { useEffect, useCallback } from 'react'
import { DeckSpec } from '../dsl/schema'
import { SlideRenderer } from '../renderers/SlideRenderer'

export function PresentationMode({ spec, initialSlide, onClose }: {
  spec: DeckSpec
  initialSlide: number
  onClose: () => void
}) {
  const [current, setCurrent] = React.useState(initialSlide)
  const total = spec.slides.length

  const next = useCallback(() => setCurrent(c => Math.min(c + 1, total - 1)), [total])
  const prev = useCallback(() => setCurrent(c => Math.max(c - 1, 0)), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev() }
      else if (e.key === 'Home') { e.preventDefault(); setCurrent(0) }
      else if (e.key === 'End') { e.preventDefault(); setCurrent(total - 1) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, next, prev, total])

  const slide = spec.slides[current]
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg, #08080f)',
      display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 1280, aspectRatio: '16/9', maxHeight: '100%' }}>
          <SlideRenderer slide={slide} />
        </div>
      </div>

      <div style={{
        padding: '0.5em 1.5em', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: 'var(--tx2, #999)', fontSize: '0.75em', borderTop: '1px solid var(--bd, #333)',
        background: 'var(--surf, #111)',
      }}>
        <span>{spec.meta.title}</span>
        <span>{current + 1} / {total}</span>
        <div style={{ display: 'flex', gap: '0.3em' }}>
          {slide.notes && <span title={slide.notes} style={{ cursor: 'help' }}>📝</span>}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: '1.2em' }}>✕</button>
        </div>
      </div>

      <div style={{ height: 3, background: 'var(--grd, #333)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--a2))', transition: 'width 0.3s ease' }} />
      </div>
    </div>
  )
}
