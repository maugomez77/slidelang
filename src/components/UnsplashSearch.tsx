import React, { useState } from 'react'

export function UnsplashSearch({ onSelect }: { onSelect: (url: string, alt: string) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ id: string; thumb: string; full: string; alt: string }[]>([])
  const [loading, setLoading] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    // Use source.unsplash.com which doesn't require an API key
    const keywords = query.trim().replace(/\s+/g, ',')
    const count = 8
    const items = []
    for (let i = 0; i < count; i++) {
      items.push({
        id: `${keywords}-${i}`,
        thumb: `https://source.unsplash.com/200x150/?${keywords}&sig=${i}`,
        full: `https://source.unsplash.com/1200x800/?${keywords}&sig=${i}`,
        alt: query,
      })
    }
    setResults(items)
    setLoading(false)
  }

  return (
    <div style={{ fontSize: '0.8em' }}>
      <div style={{ display: 'flex', gap: '0.3em', marginBottom: '0.5em' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search Unsplash..."
          style={{ flex: 1, padding: '0.3em 0.5em', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.85em', outline: 'none' }}
        />
        <button onClick={search} disabled={loading} style={{ padding: '0.3em 0.75em', border: 'none', borderRadius: 4, background: '#4361ee', color: 'white', cursor: 'pointer', fontSize: '0.85em', fontWeight: 600 }}>
          {loading ? '...' : 'Search'}
        </button>
      </div>
      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3em', maxHeight: 200, overflow: 'auto' }}>
          {results.map(r => (
            <img
              key={r.id}
              src={r.thumb}
              alt={r.alt}
              onClick={() => onSelect(r.full, r.alt)}
              style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '2px solid transparent' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4361ee')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
