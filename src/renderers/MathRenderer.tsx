import React, { useEffect, useRef } from 'react'
import { MathBlock } from '../dsl/schema'

declare global {
  interface Window {
    katex: any
  }
}

export function MathRenderer({ block }: { block: MathBlock }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const renderMath = () => {
      if (typeof window.katex !== 'undefined' && window.katex.render) {
        try {
          window.katex.render(block.expression, containerRef.current!, {
            displayMode: !block.inline,
            throwOnError: false,
            output: 'html',
          })
        } catch {
          containerRef.current!.textContent = `$${block.expression}$`
        }
      } else {
        containerRef.current!.textContent = `$${block.expression}$`
        loadKaTeX()
      }
    }

    renderMath()
  }, [block])

  return (
    <div
      ref={containerRef}
      style={{
        margin: '0.3em 0',
        padding: '0.4em',
        background: 'var(--code-bg, #f5f5f5)',
        borderRadius: 6,
        overflowX: 'auto',
        fontSize: block.inline ? '0.9em' : '1em',
        textAlign: 'center',
      }}
    />
  )
}

function loadKaTeX() {
  if (document.querySelector('link[href*="katex"]')) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
  document.head.appendChild(link)

  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
  script.onload = () => {
    window.dispatchEvent(new CustomEvent('katex-loaded'))
  }
  document.body.appendChild(script)
}
