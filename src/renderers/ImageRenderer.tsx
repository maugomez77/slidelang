import React from 'react'
import { ImageBlock } from '../dsl/schema'

export function ImageRenderer({ block }: { block: ImageBlock }) {
  const { source } = block

  return (
    <figure style={{ margin: '0.3em auto', textAlign: 'center' }}>
      <img
        src={source.url}
        alt={source.alt || ''}
        style={{
          maxWidth: source.width || '90%',
          maxHeight: source.height || 300,
          borderRadius: 8,
          objectFit: block.fit || 'contain',
        }}
        onError={(e) => {
          const el = e.currentTarget
          el.style.display = 'none'
          if (el.nextSibling) return
          const fallback = document.createElement('div')
          fallback.textContent = `[Image: ${source.alt || 'unavailable'}]`
          fallback.style.cssText = 'padding: 1em; background: #f0f0f0; border-radius: 8px; color: #999; font-style: italic;'
          el.parentElement?.appendChild(fallback)
        }}
      />
      {source.caption && (
        <figcaption style={{ fontSize: '0.7em', opacity: 0.7, marginTop: '0.2em' }}>
          {source.caption}
        </figcaption>
      )}
    </figure>
  )
}
