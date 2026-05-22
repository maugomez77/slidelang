import React from 'react'
import { Slide, SlideBlock } from '../dsl/schema'
import { ChartRenderer } from './ChartRenderer'
import { MathRenderer } from './MathRenderer'
import { ImageRenderer } from './ImageRenderer'

function BlockRenderer({ block }: { block: SlideBlock }) {
  switch (block.type) {
    case 'text':
      return <TextBlockRenderer block={block} />
    case 'bullets':
      return (
        <ul style={{ textAlign: 'left', paddingLeft: '1.5em', margin: '0.3em 0' }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ margin: '0.2em 0', fontSize: '0.85em' }}>{item}</li>
          ))}
        </ul>
      )
    case 'numbered':
      return (
        <ol style={{ textAlign: 'left', paddingLeft: '1.5em', margin: '0.3em 0' }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ margin: '0.2em 0', fontSize: '0.85em' }}>{item}</li>
          ))}
        </ol>
      )
    case 'chart':
      return <ChartRenderer block={block} />
    case 'math':
      return <MathRenderer block={block} />
    case 'image':
      return <ImageRenderer block={block} />
    default:
      return null
  }
}

function TextBlockRenderer({ block }: { block: TextBlock }) {
  const s = block.style || {}
  const sizeMap: Record<string, string> = { small: '0.75em', medium: '0.9em', large: '1.1em', xlarge: '1.4em' }

  return (
    <p style={{
      fontWeight: s.bold ? 'bold' : undefined,
      fontStyle: s.italic ? 'italic' : undefined,
      fontSize: s.size ? sizeMap[s.size] : '0.9em',
      color: s.color,
      textAlign: s.align || 'left',
      margin: '0.3em 0',
      lineHeight: 1.5,
    }}>
      {block.content}
    </p>
  )
}

type TextBlock = Extract<SlideBlock, { type: 'text' }>

function getSlideGridStyle(kind: Slide['kind']): React.CSSProperties {
  switch (kind) {
    case 'title':
      return { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }
    case 'two-column':
      return { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75em', textAlign: 'left' }
    case 'comparison':
      return { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75em' }
    case 'image-full':
      return { display: 'flex', flexDirection: 'column', alignItems: 'center' }
    default:
      return { textAlign: 'left' }
  }
}

export function SlideRenderer({ slide }: { slide: Slide }) {
  const gridStyle = getSlideGridStyle(slide.kind)
  const isComparison = slide.kind === 'comparison'
  const isTwoCol = slide.kind === 'two-column'

  const issues = slide.layoutIssues?.filter(i => i.severity === 'error' || i.severity === 'warning') || []

  return (
    <div style={{ padding: '0.5em', position: 'relative', ...gridStyle }}>
      {issues.length > 0 && (
        <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
          {issues.map((issue, i) => (
            <span key={i} style={{
              padding: '1px 6px',
              borderRadius: 4,
              fontSize: '0.65em',
              background: issue.severity === 'error' ? '#ff4444' : '#ffaa00',
              color: issue.severity === 'error' ? 'white' : 'black',
            }}>
              {issue.message}
            </span>
          ))}
        </div>
      )}

      {slide.title && slide.kind !== 'title' && (
        <h3 style={{ margin: '0 0 0.3em 0', fontSize: '1.1em', color: 'var(--accent, #4361ee)', gridColumn: isTwoCol || isComparison ? '1 / -1' : undefined }}>
          {slide.title}
        </h3>
      )}

      {slide.title && slide.kind === 'title' && (
        <h1 style={{ margin: '0.2em 0', fontSize: '1.5em' }}>{slide.title}</h1>
      )}

      {slide.subtitle && (
        <p style={{ opacity: 0.7, fontSize: '0.85em', margin: '0 0 0.5em 0' }}>{slide.subtitle}</p>
      )}

      {isComparison ? renderComparisonBlocks(slide.blocks) : slide.blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  )
}

function renderComparisonBlocks(blocks: SlideBlock[]) {
  const mid = Math.ceil(blocks.length / 2)
  const left = blocks.slice(0, mid)
  const right = blocks.slice(mid)
  return (
    <>
      <div style={{ background: 'var(--code-bg, #f5f5f5)', borderRadius: 8, padding: '0.75em' }}>
        {left.map((b, i) => <BlockRenderer key={i} block={b} />)}
      </div>
      <div style={{ background: 'var(--code-bg, #f5f5f5)', borderRadius: 8, padding: '0.75em' }}>
        {right.map((b, i) => <BlockRenderer key={i} block={b} />)}
      </div>
    </>
  )
}
