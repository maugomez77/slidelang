import React from 'react'
import { DeckSpec } from '../dsl/schema'

export function DeckSpecPanel({ spec, onSpecChange }: { spec: DeckSpec; onSpecChange: (s: DeckSpec) => void }) {
  const themes = ['noir', 'air', 'bold', 'warm', 'crimson', 'sage', 'navy', 'neon']

  return (
    <div style={{ padding: '0.75em', fontSize: '0.8em' }}>
      <h4 style={{ margin: '0 0 0.5em 0' }}>Deck Settings</h4>

      <div style={{ marginBottom: '0.5em' }}>
        <label style={labelStyle}>Title</label>
        <input
          type="text"
          value={spec.meta.title}
          onChange={e => onSpecChange({ ...spec, meta: { ...spec.meta, title: e.target.value } })}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '0.5em' }}>
        <label style={labelStyle}>Theme</label>
        <select
          value={spec.meta.theme}
          onChange={e => onSpecChange({ ...spec, meta: { ...spec.meta, theme: e.target.value as any } })}
          style={selectStyle}
        >
          {themes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '0.5em' }}>
        <label style={labelStyle}>Author</label>
        <input
          type="text"
          value={spec.meta.author || ''}
          onChange={e => onSpecChange({ ...spec, meta: { ...spec.meta, author: e.target.value } })}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '0.5em' }}>
        <label style={labelStyle}>Description</label>
        <textarea
          value={spec.meta.description || ''}
          onChange={e => onSpecChange({ ...spec, meta: { ...spec.meta, description: e.target.value } })}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ fontSize: '0.8em', opacity: 0.5, marginTop: '0.5em' }}>
        {spec.slides.length} slides
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75em',
  opacity: 0.7,
  marginBottom: '0.15em',
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '0.3em 0.5em',
  border: '1px solid #ddd',
  borderRadius: 4,
  fontSize: '0.85em',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}
