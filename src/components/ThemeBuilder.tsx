import React, { useState } from 'react'

export type ThemeVars = {
  bg: string; surf: string; acc: string; a2: string
  tx: string; tx2: string; hd: string; bd: string
  ok: string; err: string; wrn: string; grd: string
}

const FONT_HEADINGS = ['Playfair Display', 'DM Serif Display', 'Lora', 'Space Grotesk', 'Bebas Neue', 'Oswald', 'Montserrat', 'Raleway']
const FONT_BODY = ['Inter', 'Source Sans 3', 'Roboto', 'Lato', 'Nunito', 'Open Sans', 'Poppins', 'Merriweather']

const LABELS: Record<keyof ThemeVars, string> = {
  bg: 'Background', surf: 'Surface', acc: 'Accent', a2: 'Accent 2',
  tx: 'Body Text', tx2: 'Secondary Text', hd: 'Heading', bd: 'Border',
  ok: 'Success', err: 'Error', wrn: 'Warning', grd: 'Grid'
}

type ThemeData = { name: string; vars: ThemeVars }

export function ThemeBuilder({ currentTheme, themes, fontH, fontB, onApply, onFontChange }: {
  currentTheme: string
  themes: Record<string, ThemeVars>
  fontH?: string
  fontB?: string
  onApply: (name: string, vars: ThemeVars) => void
  onFontChange: (fontH?: string, fontB?: string) => void
}) {
  const [editing, setEditing] = useState<ThemeData | null>(null)

  const startEdit = (name: string) => {
    const base = themes[name] || themes.noir
    setEditing({ name, vars: { ...base } })
  }

  const updateVar = (key: keyof ThemeVars, value: string) => {
    if (!editing) return
    setEditing({ ...editing, vars: { ...editing.vars, [key]: value } })
  }

  const applyEditing = () => {
    if (!editing) return
    onApply(editing.name, editing.vars)
    setEditing(null)
  }

  const duplicate = (name: string) => {
    const base = themes[name] || themes.noir
    const newName = `${name}-custom`
    onApply(newName, { ...base })
  }

  return (
    <div style={{ padding: '0.75em', fontSize: '0.8em' }}>
      <h4 style={{ margin: '0 0 0.5em 0' }}>Theme Builder</h4>

      {!editing ? (
        <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3em' }}>
          {Object.entries(themes).map(([name, vars]) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: '0.4em', padding: '0.3em 0.5em',
              border: currentTheme === name ? '2px solid #4361ee' : '1px solid #ddd',
              borderRadius: 6, cursor: 'pointer', background: currentTheme === name ? '#eef0ff' : 'white',
            }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[vars.bg, vars.acc, vars.tx, vars.surf].map((c, i) => (
                  <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                ))}
              </div>
              <span style={{ flex: 1, fontSize: '0.8em', fontWeight: currentTheme === name ? 700 : 500 }}>{name}</span>
              <button onClick={(e) => { e.stopPropagation(); onApply(name, vars) }} style={smallBtn}>Apply</button>
              <button onClick={(e) => { e.stopPropagation(); startEdit(name) }} style={{ ...smallBtn, background: '#4361ee', color: 'white' }}>Edit</button>
              <button onClick={(e) => { e.stopPropagation(); duplicate(name) }} style={smallBtn}>+</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '0.75em', borderTop: '1px solid #e0e0e0', paddingTop: '0.5em' }}>
          <label style={{ fontSize: '0.7em', opacity: 0.7, display: 'block', marginBottom: '0.2em' }}>Heading Font</label>
          <select value={fontH || 'Playfair Display'} onChange={e => onFontChange(e.target.value || undefined, fontB)} style={selectStyle}>
            {FONT_HEADINGS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <label style={{ fontSize: '0.7em', opacity: 0.7, display: 'block', marginBottom: '0.2em', marginTop: '0.4em' }}>Body Font</label>
          <select value={fontB || 'Inter'} onChange={e => onFontChange(fontH, e.target.value || undefined)} style={selectStyle}>
            {FONT_BODY.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        </>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3em', marginBottom: '0.5em' }}>
            <button onClick={() => setEditing(null)} style={smallBtn}>← Back</button>
            <span style={{ fontWeight: 600 }}>Editing: {editing.name}</span>
            <button onClick={applyEditing} style={{ ...smallBtn, background: '#22c55e', color: 'white', marginLeft: 'auto' }}>Apply</button>
          </div>

          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {(Object.keys(LABELS) as (keyof ThemeVars)[]).map(key => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3em', marginBottom: '0.3em' }}>
                <label style={{ width: 80, fontSize: '0.7em', opacity: 0.7 }}>{LABELS[key]}</label>
                <input
                  type="color"
                  value={editing.vars[key]}
                  onChange={e => updateVar(key, e.target.value)}
                  style={{ width: 28, height: 22, border: 'none', borderRadius: 3, cursor: 'pointer', padding: 0 }}
                />
                <input
                  type="text"
                  value={editing.vars[key]}
                  onChange={e => updateVar(key, e.target.value)}
                  style={{ flex: 1, padding: '0.2em 0.3em', border: '1px solid #ddd', borderRadius: 3, fontSize: '0.75em', outline: 'none', fontFamily: 'monospace' }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: '0.5em', padding: '0.4em', borderRadius: 6, background: editing.vars.bg, border: `1px solid ${editing.vars.bd}` }}>
            <div style={{ color: editing.vars.hd, fontSize: '0.9em', fontWeight: 700, marginBottom: '0.2em' }}>Heading</div>
            <div style={{ color: editing.vars.tx, fontSize: '0.75em', marginBottom: '0.2em' }}>Body text on this background</div>
            <div style={{ color: editing.vars.tx2, fontSize: '0.65em' }}>Secondary text preview</div>
          </div>
        </div>
      )}
    </div>
  )
}

const smallBtn: React.CSSProperties = {
  padding: '0.15em 0.4em', border: '1px solid #ddd', borderRadius: 4,
  background: 'white', cursor: 'pointer', fontSize: '0.75em', fontWeight: 600,
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '0.3em 0.5em', border: '1px solid #ddd',
  borderRadius: 4, fontSize: '0.8em', outline: 'none', cursor: 'pointer',
  boxSizing: 'border-box',
}
