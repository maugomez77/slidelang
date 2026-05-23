import React from 'react'
import { Slide, SlideBlock, Position } from '../dsl/schema'
import { ChartRenderer } from './ChartRenderer'
import { MathRenderer } from './MathRenderer'
import { ImageRenderer } from './ImageRenderer'

function T(txt: string) { return txt }

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
      case 'text': return <TextBlock block={block} />
      case 'bullets': return <BulletList items={(block as any).items} />
      case 'numbered': return <NumberedList items={(block as any).items} />
      case 'chart': return <ChartRenderer block={block as any} />
      case 'math': return <MathRenderer block={block as any} />
      case 'image': return <ImageRenderer block={block as any} />
      default: return null
    }
  })()
  if (block.position) return <div style={posStyle}>{inner}</div>
  return inner
}

function TextBlock({ block }: { block: Extract<SlideBlock, { type: 'text' }> }) {
  const s = block.style || {}
  const sz: Record<string, string> = { small: '0.68em', medium: '0.82em', large: '1.08em', xlarge: '1.7em' }
  return (
    <p style={{
      fontWeight: s.bold ? 700 : undefined, fontStyle: s.italic ? 'italic' : undefined,
      fontSize: s.size ? sz[s.size] : '0.82em', color: s.color, textAlign: s.align || 'left',
      margin: '0.22em 0', lineHeight: 1.65,
    }}>{block.content}</p>
  )
}

function BulletList({ items }: { items: string[] }) {
  return <ul style={{ textAlign: 'left', paddingLeft: '1.5em', margin: '0.25em 0' }}>
    {items.map((item, i) => <li key={i} style={{ margin: '0.38em 0', fontSize: '0.82em', lineHeight: 1.5 }}>{item}</li>)}
  </ul>
}

function NumberedList({ items }: { items: string[] }) {
  return <ol style={{ textAlign: 'left', paddingLeft: 0, margin: '0.25em 0', listStyle: 'none', counterReset: 'sl' }}>
    {items.map((item, i) => (
      <li key={i} style={{ margin: '0.38em 0', fontSize: '0.82em', lineHeight: 1.5, counterIncrement: 'sl', paddingLeft: '2.3em', position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: '1.7em', height: '1.7em', background: 'var(--accent)', color: '#fff',
          borderRadius: '50%', fontSize: '0.62em', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{i + 1}</span>
        {item}
      </li>
    ))}
  </ol>
}

// ── Theme helpers ──
const thm = () => ({
  bg: 'var(--bg, white)',
  surf: 'var(--surf, #f5f5f5)',
  accent: 'var(--accent, #4361ee)',
  a2: 'var(--a2, #f72585)',
  tx: 'var(--tx, #333)',
  tx2: 'var(--tx2, #999)',
  hd: 'var(--hd, #111)',
  bd: 'var(--bd, #e0e0e0)',
  grd: 'var(--grd, #f0f0f0)',
  ok: 'var(--ok, #22c55e)',
  err: 'var(--err, #ef4444)',
  wrn: 'var(--wrn, #f59e0b)',
})

const s: Record<string, React.CSSProperties> = {
  slide: { padding: '52px 80px 28px 80px', display: 'flex', flexDirection: 'column', minHeight: 400, overflow: 'hidden', background: 'var(--bg)', color: 'var(--tx)' },
  h2: { fontFamily: 'Georgia, serif', fontSize: '2.1em', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.18, margin: '0 0 0.45em 0' },
  ha: { display: 'inline-block', paddingBottom: '0.3em', marginBottom: '0.5em', borderBottom: '3px solid var(--accent)' },
  sub: { fontSize: '0.8em', marginBottom: '0.7em', fontWeight: 500, lineHeight: 1.5 },
  footer: { marginTop: 'auto', paddingTop: 18, fontSize: '0.44em', opacity: 0.45, fontWeight: 500, display: 'flex', justifyContent: 'space-between', flexShrink: 0 },
  kp: { background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 14, padding: '1.4em 0.8em', textAlign: 'center' },
  kv: { fontFamily: 'Georgia, serif', fontSize: '2.2em', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '0.15em' },
  kl: { fontSize: '0.62em', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' },
  cp: { background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 14, padding: '1.1em 1.2em', textAlign: 'left' },
  tlItem: { position: 'relative', paddingLeft: '1.8em', marginBottom: '0.5em' },
  tlLine: { position: 'absolute', left: '0.5em', top: '0.3em', width: 2, bottom: '-0.3em', background: 'linear-gradient(180deg, var(--accent), var(--a2))', borderRadius: 1 },
  tlDot: { position: 'absolute', left: '0.5em', top: '0.3em', width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', transform: 'translateX(-4px)' },
  tlDate: { fontSize: '0.6em', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  tlTitle: { fontWeight: 700, fontSize: '0.85em', margin: '0.08em 0' },
  tlDesc: { fontSize: '0.72em', lineHeight: 1.45 },
  fcNode: { background: 'var(--surf)', border: '2px solid var(--accent)', borderRadius: 14, padding: '0.6em 1em', textAlign: 'center', fontWeight: 600, fontSize: '0.82em', minWidth: 100 },
  agItem: { display: 'flex', alignItems: 'center', gap: '1em', padding: '0.5em 0', borderBottom: '1px solid var(--bd)' },
  agNum: { fontFamily: 'Georgia, serif', fontSize: '1.8em', fontWeight: 800, minWidth: '1.5em', textAlign: 'center' },
  agTitle: { fontWeight: 700, fontSize: '0.9em' },
  agDesc: { fontSize: '0.72em' },
  tmCard: { background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 14, padding: '1em', textAlign: 'center' },
  lgItem: { background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 14, padding: '0.8em', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pgBar: { margin: '0.3em 0' },
  pgTrack: { height: 8, background: 'var(--grd)', borderRadius: 4, overflow: 'hidden' },
  pgFill: { height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, var(--accent), var(--a2))' },
}

export function SlideRenderer({ slide }: { slide: Slide }) {
  const t = thm()
  const isSpatial = slide.blocks.some(b => b.position)
  if (isSpatial) return <FreeformSlide slide={slide} />

  switch (slide.kind) {
    case 'title': return <TitleSlide slide={slide} />
    case 'section': return <SectionSlide slide={slide} />
    case 'quote': return <QuoteSlide slide={slide} />
    case 'two-column': return <TwoColumnSlide slide={slide} />
    case 'comparison': return <ComparisonSlide slide={slide} />
    case 'image-full': return <ImageFullSlide slide={slide} />
    case 'chart': return <StandardSlide slide={slide} />
    case 'math': return <StandardSlide slide={slide} />
    case 'content': return <ContentSlide slide={slide} />
    case 'kpi': return <KpiSlide slide={slide} />
    case 'big-number': return <BigNumberSlide slide={slide} />
    case 'dashboard': return <DashboardSlide slide={slide} />
    case 'timeline': return <TimelineSlide slide={slide} />
    case 'logo-grid': return <LogoGridSlide slide={slide} />
    case 'flowchart': return <FlowchartSlide slide={slide} />
    case 'agenda': return <AgendaSlide slide={slide} />
    case 'team': return <TeamSlide slide={slide} />
    case 'progress': return <ProgressSlide slide={slide} />
    case 'contact': return <ContactSlide slide={slide} />
    default: return <StandardSlide slide={slide} />
  }
}

// ── Slide Layouts ──

function TitleSlide({ slide }: { slide: Slide }) {
  return (
    <div style={{ ...s.slide, justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '60px 100px' }}>
      {slide.title && <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '3.6em', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08, margin: '0 0 0.1em 0', color: 'var(--hd)' }}>{slide.title}</h1>}
      <div style={{ width: 72, height: 5, background: 'linear-gradient(90deg, var(--accent), var(--a2))', borderRadius: 3, margin: '0 auto 1.4em' }} />
      {slide.subtitle && <p style={{ fontSize: '1.15em', color: 'var(--tx2)', maxWidth: '30em', lineHeight: 1.55 }}>{slide.subtitle}</p>}
      {slide.blocks.map((b, i) => <BlockRenderer key={i} block={b} />)}
    </div>
  )
}

function SectionSlide({ slide }: { slide: Slide }) {
  return (
    <div style={{ ...s.slide, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <p style={{ fontSize: '0.36em', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '0.9em' }}>{slide.title}</p>
      {slide.subtitle && <p style={{ fontSize: '0.95em', color: 'var(--tx2)' }}>{slide.subtitle}</p>}
    </div>
  )
}

function QuoteSlide({ slide }: { slide: Slide }) {
  const tb = slide.blocks.find(b => b.type === 'text')
  const q = tb ? (tb as any).content : slide.title || ''
  return (
    <div style={{ ...s.slide, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <blockquote style={{ fontFamily: 'Georgia, serif', fontSize: '2em', fontStyle: 'italic', lineHeight: 1.4, maxWidth: '70%', border: 'none', padding: 0, color: 'var(--hd)' }}>
        <span style={{ fontSize: '2.6em', color: 'var(--accent)', display: 'block', marginBottom: '0.05em', lineHeight: 1 }}>&ldquo;</span>
        {q}
      </blockquote>
      {slide.subtitle && <p style={{ fontSize: '0.78em', color: 'var(--tx2)', fontWeight: 600, marginTop: '1.1em' }}>&mdash; {slide.subtitle}</p>}
    </div>
  )
}

function StandardSlide({ slide }: { slide: Slide }) {
  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      {slide.subtitle && <p style={{ ...s.sub, color: 'var(--tx2)' }}>{slide.subtitle}</p>}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {slide.blocks.map((b, i) => <BlockRenderer key={i} block={b} />)}
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function ContentSlide({ slide }: { slide: Slide }) {
  const kpiVals = slide.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'xlarge')
  const kpiLbls = slide.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'small')
  const rest = slide.blocks.filter(b => !(b.type === 'text' && (((b as any).style?.size === 'xlarge') || ((b as any).style?.size === 'small'))))
  const n = Math.max(kpiVals.length, kpiLbls.length)

  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      {slide.subtitle && <p style={{ ...s.sub, color: 'var(--tx2)' }}>{slide.subtitle}</p>}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {n >= 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85em', marginBottom: '0.5em' }}>
            {Array.from({ length: n }).map((_, i) => (
              <div key={i} style={s.kp}>
                {i < kpiVals.length && <div style={{ ...s.kv, color: 'var(--accent)' }}>{(kpiVals[i] as any).content}</div>}
                {i < kpiLbls.length && <div style={{ ...s.kl, color: 'var(--tx2)' }}>{(kpiLbls[i] as any).content}</div>}
              </div>
            ))}
          </div>
        )}
        {rest.map((b, i) => <BlockRenderer key={i} block={b} />)}
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function TwoColumnSlide({ slide }: { slide: Slide }) {
  const mid = Math.ceil(slide.blocks.length / 2)
  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.4em', flex: 1, overflow: 'auto' }}>
        <div>{slide.blocks.slice(0, mid).map((b, i) => <BlockRenderer key={i} block={b} />)}</div>
        <div>{slide.blocks.slice(mid).map((b, i) => <BlockRenderer key={i} block={b} />)}</div>
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function ComparisonSlide({ slide }: { slide: Slide }) {
  const mid = Math.ceil(slide.blocks.length / 2)
  const L = slide.blocks.slice(0, mid), R = slide.blocks.slice(mid)
  const lt = L.length > 0 && L[0].type === 'text' ? (L[0] as any).content : ''
  const rt = R.length > 0 && R[0].type === 'text' ? (R[0] as any).content : ''
  const lb = L.length > 0 && L[0].type === 'text' ? L.slice(1) : L
  const rb = R.length > 0 && R[0].type === 'text' ? R.slice(1) : R
  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2em', flex: 1, overflow: 'auto' }}>
        <div style={s.cp}>
          {lt && <h3 style={{ fontSize: '1.05em', textAlign: 'center', margin: '0 0 0.7em', paddingBottom: '0.45em', borderBottom: '2px solid var(--accent)' }}>{lt}</h3>}
          {lb.map((b, i) => <BlockRenderer key={i} block={b} />)}
        </div>
        <div style={s.cp}>
          {rt && <h3 style={{ fontSize: '1.05em', textAlign: 'center', margin: '0 0 0.7em', paddingBottom: '0.45em', borderBottom: '2px solid var(--accent)' }}>{rt}</h3>}
          {rb.map((b, i) => <BlockRenderer key={i} block={b} />)}
        </div>
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function ImageFullSlide({ slide }: { slide: Slide }) {
  const ib = slide.blocks.find(b => b.type === 'image') as any
  return (
    <div style={{ ...s.slide, justifyContent: 'center', alignItems: 'center' }}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      {ib ? (
        <>
          <img src={ib.source.url} alt={ib.source.alt || ''} style={{ maxWidth: '85%', maxHeight: '52vh', borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }} />
          {ib.source.caption && <p style={{ fontSize: '0.62em', color: 'var(--tx2)', marginTop: '0.5em', fontWeight: 500 }}>{ib.source.caption}</p>}
        </>
      ) : <p style={{ color: 'var(--tx2)' }}>[No image]</p>}
      <FooterSlide title={slide.title} />
    </div>
  )
}

function KpiSlide({ slide }: { slide: Slide }) {
  const vals = slide.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'xlarge')
  const lbls = slide.blocks.filter(b => b.type === 'text' && (b as any).style?.size === 'small')
  const rest = slide.blocks.filter(b => !(b.type === 'text' && (((b as any).style?.size === 'xlarge') || ((b as any).style?.size === 'small'))))
  const n = Math.max(vals.length, lbls.length)
  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      {slide.subtitle && <p style={{ ...s.sub, color: 'var(--tx2)' }}>{slide.subtitle}</p>}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85em' }}>
          {Array.from({ length: n }).map((_, i) => (
            <div key={i} style={s.kp}>
              {i < vals.length && <div style={{ ...s.kv, color: 'var(--accent)' }}>{(vals[i] as any).content}</div>}
              {i < lbls.length && <div style={{ ...s.kl, color: 'var(--tx2)' }}>{(lbls[i] as any).content}</div>}
            </div>
          ))}
        </div>
        {rest.map((b, i) => <BlockRenderer key={i} block={b} />)}
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function BigNumberSlide({ slide }: { slide: Slide }) {
  const val = slide.blocks.find(b => b.type === 'text' && (b as any).style?.size === 'xlarge')
  const lbl = slide.blocks.find(b => b.type === 'text' && (b as any).style?.size === 'small')
  const desc = slide.blocks.find(b => b.type === 'text' && (!(b as any).style?.size || (b as any).style?.size === 'medium'))
  return (
    <div style={{ ...s.slide, justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '50px 100px' }}>
      {val && <div style={{ fontFamily: 'Georgia, serif', fontSize: '5em', fontWeight: 900, color: 'var(--accent)', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: '0.1em' }}>{(val as any).content}</div>}
      {lbl && <div style={{ fontSize: '0.85em', color: 'var(--tx2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{(lbl as any).content}</div>}
      {slide.subtitle && <div style={{ fontSize: '0.75em', color: 'var(--tx2)', marginTop: '0.8em', maxWidth: '24em', lineHeight: 1.5 }}>{slide.subtitle}</div>}
      <FooterSlide title={slide.title} />
    </div>
  )
}

function DashboardSlide({ slide }: { slide: Slide }) {
  const charts = slide.blocks.filter(b => b.type === 'chart')
  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(charts.length, 2)}, 1fr)`, gap: '0.8em', flex: 1, overflow: 'auto' }}>
        {charts.map((b, i) => <BlockRenderer key={i} block={b} />)}
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function TimelineSlide({ slide }: { slide: Slide }) {
  const texts = slide.blocks.filter(b => b.type === 'text')
  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      {slide.subtitle && <p style={{ ...s.sub, color: 'var(--tx2)' }}>{slide.subtitle}</p>}
      <div style={{ flex: 1, overflow: 'auto', paddingLeft: '2.5em' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '0.7em', top: '0.4em', bottom: '0.4em', width: 2, background: 'linear-gradient(180deg, var(--accent), var(--a2))', borderRadius: 1 }} />
          {texts.map((tb: any, i) => {
            const parts = (tb.content || '').split(' — ')
            const date = parts[0] || ''
            const title = parts.length >= 3 ? parts[1] : ''
            const desc = parts.length >= 3 ? parts.slice(2).join(' — ') : parts.slice(1).join(' — ')
            return (
              <div key={i} style={{ position: 'relative', marginBottom: '0.7em', paddingLeft: '1.2em' }}>
                <div style={{ position: 'absolute', left: '-2.5em', top: '0.45em', width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg)', boxShadow: '0 0 0 2px var(--accent)' }} />
                <div style={{ fontSize: '0.6em', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{date}</div>
                {title && <div style={{ fontWeight: 700, fontSize: '0.85em', margin: '0.08em 0', color: 'var(--hd)' }}>{title}</div>}
                <div style={{ fontSize: '0.72em', color: 'var(--tx2)', lineHeight: 1.45 }}>{desc}</div>
              </div>
            )
          })}
        </div>
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function LogoGridSlide({ slide }: { slide: Slide }) {
  const imgs = slide.blocks.filter(b => b.type === 'image')
  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      {slide.subtitle && <p style={{ ...s.sub, color: 'var(--tx2)' }}>{slide.subtitle}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5em', flex: 1, overflow: 'auto' }}>
        {imgs.map((b: any, i) => (
          <div key={i} style={s.lgItem}>
            <img src={b.source.url} alt={b.source.alt || ''} style={{ maxWidth: '80%', maxHeight: 60, opacity: 0.85 }} />
          </div>
        ))}
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function FlowchartSlide({ slide }: { slide: Slide }) {
  const nodes = slide.blocks.filter(b => b.type === 'text')
  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      {slide.subtitle && <p style={{ ...s.sub, color: 'var(--tx2)' }}>{slide.subtitle}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8em', justifyContent: 'center', flex: 1, overflow: 'auto', alignContent: 'flex-start' }}>
        {nodes.map((n: any, i) => (
          <div key={i} style={{ ...s.fcNode, position: 'relative' }}>
            {n.content}
            {i < nodes.length - 1 && <div style={{ color: 'var(--accent)', fontSize: '1.1em', marginTop: '0.4em', fontWeight: 700 }}>↓</div>}
          </div>
        ))}
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function AgendaSlide({ slide }: { slide: Slide }) {
  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {slide.blocks.map((b, i) => {
          if (b.type === 'text') {
            const parts = ((b as any).content || '').split(' — ')
            const title = parts[0] || ''
            const desc = parts.slice(1).join(' — ')
            return (
              <div key={i} style={s.agItem}>
                <div style={{ ...s.agNum, color: 'var(--accent)' }}>{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div style={{ ...s.agTitle, color: 'var(--hd)' }}>{title}</div>
                  {desc && <div style={{ ...s.agDesc, color: 'var(--tx2)' }}>{desc}</div>}
                </div>
              </div>
            )
          }
          return <BlockRenderer key={i} block={b} />
        })}
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function TeamSlide({ slide }: { slide: Slide }) {
  const texts = slide.blocks.filter(b => b.type === 'text')
  const imgs = slide.blocks.filter(b => b.type === 'image')
  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5em', flex: 1, overflow: 'auto' }}>
        {Array.from({ length: Math.ceil(texts.length / 2) }).map((_, i) => {
          const name = (texts[i * 2] as any)?.content || ''
          const role = (texts[i * 2 + 1] as any)?.content || ''
          const img = imgs[i] as any
          return (
            <div key={i} style={s.tmCard}>
              {img ? <img src={img.source.url} alt={img.source.alt || name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.6em', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--grd)', margin: '0 auto 0.6em', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5em', color: 'var(--accent)', fontWeight: 700 }}>{name.charAt(0).toUpperCase()}</div>}
              <div style={{ fontWeight: 700, fontSize: '0.85em', color: 'var(--hd)' }}>{name}</div>
              {role && <div style={{ fontSize: '0.7em', color: 'var(--accent)', fontWeight: 600, marginTop: '0.2em', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{role}</div>}
            </div>
          )
        })}
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function ProgressSlide({ slide }: { slide: Slide }) {
  const texts = slide.blocks.filter(b => b.type === 'text')
  return (
    <div style={s.slide}>
      {slide.title && <h2 style={{ ...s.h2, color: 'var(--hd)' }}><span style={s.ha}>{slide.title}</span></h2>}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {Array.from({ length: Math.floor(texts.length / 2) }).map((_, i) => {
          const label = (texts[i * 2] as any).content || ''
          const val = (texts[i * 2 + 1] as any).content || ''
          const pct = parseFloat(val) || 0
          return (
            <div key={i} style={s.pgBar}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75em', fontWeight: 600, marginBottom: '0.2em' }}>
                <span>{label}</span>
                <span style={{ color: 'var(--accent)' }}>{val}</span>
              </div>
              <div style={s.pgTrack}>
                <div style={{ ...s.pgFill, width: `${Math.min(100, Math.max(0, pct))}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      <FooterSlide title={slide.title} />
    </div>
  )
}

function ContactSlide({ slide }: { slide: Slide }) {
  const texts = slide.blocks.filter(b => b.type === 'text')
  return (
    <div style={{ ...s.slide, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      {slide.title && <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '3em', fontWeight: 800, color: 'var(--hd)', marginBottom: '0.3em' }}>{slide.title}</h1>}
      <div style={{ width: 60, height: 4, background: 'linear-gradient(90deg, var(--accent), var(--a2))', borderRadius: 2, margin: '0.8em auto' }} />
      {slide.subtitle && <p style={{ fontSize: '1.1em', color: 'var(--tx2)', marginBottom: '0.8em' }}>{slide.subtitle}</p>}
      {texts.map((tb: any, i) => <p key={i} style={{ fontSize: '0.85em', color: 'var(--tx2)', margin: '0.3em 0', lineHeight: 1.6 }}>{tb.content}</p>)}
      <FooterSlide title={slide.title} />
    </div>
  )
}

function FreeformSlide({ slide }: { slide: Slide }) {
  return (
    <div style={{ ...s.slide, position: 'relative', minHeight: 460 }}>
      {slide.blocks.map((b, i) => <BlockRenderer key={i} block={b} />)}
      <FooterSlide title={slide.title} />
    </div>
  )
}

function FooterSlide({ title }: { title?: string }) {
  return (
    <div style={s.footer}>
      <span>{title || ''}</span>
    </div>
  )
}
