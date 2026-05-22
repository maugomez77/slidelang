import React from 'react'
import { Slide, SlideBlock, Position } from '../dsl/schema'
import { ChartRenderer } from './ChartRenderer'
import { MathRenderer } from './MathRenderer'
import { ImageRenderer } from './ImageRenderer'

function posToStyle(pos?: Position): React.CSSProperties {
  if (!pos) return {}
  const isPct = pos.unit !== 'px'
  return {
    position: 'absolute',
    left: isPct ? `${pos.x}%` : `${pos.x}px`,
    top: isPct ? `${pos.y}%` : `${pos.y}px`,
    width: pos.width ? (isPct ? `${pos.width}%` : `${pos.width}px`) : undefined,
    height: pos.height ? (isPct ? `${pos.height}%` : `${pos.height}px`) : undefined,
    zIndex: pos.zIndex ?? 1,
  }
}

function BlockRenderer({ block }: { block: SlideBlock }) {
  const posStyle = posToStyle(block.position)

  const inner = (() => {
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
  })()

  if (block.position) {
    return <div style={posStyle}>{inner}</div>
  }
  return inner
}

function TextBlockRenderer({ block }: { block: Extract<SlideBlock, { type: 'text' }> }) {
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

function getSlideGridStyle(kind: Slide['kind'], blocks: SlideBlock[]): React.CSSProperties {
  const hasSpatial = blocks.some(b => b.position)

  if (hasSpatial) {
    return { position: 'relative', minHeight: 300 }
  }

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
  const gridStyle = getSlideGridStyle(slide.kind, slide.blocks)
  const isComparison = slide.kind === 'comparison'
  const isTwoCol = slide.kind === 'two-column'
  const isSpatial = slide.blocks.some(b => b.position)

  const issues = slide.layoutIssues?.filter(i => i.severity === 'error' || i.severity === 'warning') || []

  return (
    <div style={{ padding: '0.5em', position: 'relative', ...gridStyle }}>
      {issues.length > 0 && (
        <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4, zIndex: 100 }}>
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

      {isSpatial ? (
        <div style={{ position: 'relative', minHeight: 300 }}>
          {slide.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
      ) : isComparison ? (
        renderComparisonBlocks(slide.blocks)
      ) : (
        slide.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))
      )}
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
