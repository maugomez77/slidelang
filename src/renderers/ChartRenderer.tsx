import React, { useEffect, useRef } from 'react'
import { ChartBlock } from '../dsl/schema'

export function ChartRenderer({ block }: { block: ChartBlock }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.parentElement?.clientWidth || 500
    const h = 260
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    if (block.labels.length === 0) {
      ctx.fillStyle = '#999'; ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'; ctx.fillText('No data', w / 2, h / 2)
      return
    }

    const ct = block.chartType || 'bar'
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--sl-accent').trim() || '#4361ee'
    const a2 = getComputedStyle(document.documentElement).getPropertyValue('--sl-a2').trim() || '#f72585'
    const tx = getComputedStyle(document.documentElement).getPropertyValue('--sl-tx').trim() || '#333'
    const tx2 = getComputedStyle(document.documentElement).getPropertyValue('--sl-tx2').trim() || '#999'

    const pal = [accent, a2, '#f59e0b', '#ef4444', '#22c55e']

    if (ct === 'pie' || ct === 'donut') {
      drawPie(ctx, block, w, h, pal)
    } else if (ct === 'line') {
      drawLine(ctx, block, w, h, pal)
    } else {
      drawBar(ctx, block, w, h, pal, tx, tx2)
    }
  }, [block])

  return (
    <div style={{ margin: '0.3em 0' }}>
      {block.title && <div style={{ fontSize: '0.72em', fontWeight: 700, opacity: 0.6, marginBottom: 4, textTransform: 'uppercase' }}>{block.title}</div>}
      <canvas ref={canvasRef} style={{ width: '100%', height: 260, borderRadius: 6 }} />
    </div>
  )
}

function drawBar(ctx: CanvasRenderingContext2D, block: ChartBlock, w: number, h: number, pal: string[], tx: string, tx2: string) {
  const pad = { t: 24, b: 40, l: 50, r: 16 }
  const cw = w - pad.l - pad.r
  const ch = h - pad.t - pad.b
  const maxV = Math.max(...block.datasets.flatMap(d => d.values), 1)

  // Grid lines
  ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ch * i / 4
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke()
    ctx.fillStyle = tx2; ctx.font = '600 9px sans-serif'; ctx.textAlign = 'right'
    ctx.fillText(String(Math.round(maxV * (1 - i / 4))), pad.l - 6, y + 3)
  }

  const gap = block.labels.length > 1 ? cw / block.labels.length : 60
  const barW = Math.min(gap * 0.5, 36)
  const groupW = barW * block.datasets.length
  const gg = (gap - groupW) / 2

  block.datasets.forEach((ds, di) => {
    const col = ds.color || pal[di % pal.length]
    ds.values.forEach((v, vi) => {
      const x = pad.l + vi * gap + gg + di * barW
      const bh = Math.max((v / maxV) * ch, 2)
      const y = pad.t + ch - bh

      const grd = ctx.createLinearGradient(x, pad.t, x, pad.t + ch)
      grd.addColorStop(0, col); grd.addColorStop(1, col + '33')
      ctx.fillStyle = grd
      ctx.beginPath(); ctx.roundRect(x, y, barW - 2, bh, [4, 4, 0, 0]); ctx.fill()

      ctx.fillStyle = tx; ctx.font = '600 10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(String(Math.round(v)), x + (barW - 2) / 2, y - 5)
    })
  })

  // Labels
  ctx.fillStyle = tx; ctx.font = '600 10px sans-serif'; ctx.textAlign = 'center'
  block.labels.forEach((l, vi) => ctx.fillText(String(l), pad.l + vi * gap + gap / 2, h - 10))

  // Legend
  let lx = pad.l; ctx.textAlign = 'left'
  block.datasets.forEach((ds, di) => {
    const col = ds.color || pal[di % pal.length]
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx + 5, h - 24, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = tx2; ctx.font = '600 9px sans-serif'; ctx.fillText(ds.label, lx + 13, h - 20)
    lx += ctx.measureText(ds.label).width + 28
  })
}

function drawLine(ctx: CanvasRenderingContext2D, block: ChartBlock, w: number, h: number, pal: string[]) {
  const pad = { t: 20, b: 40, l: 50, r: 20 }
  const cw = w - pad.l - pad.r
  const ch = h - pad.t - pad.b
  const maxV = Math.max(...block.datasets.flatMap(d => d.values), 1)

  ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ch * i / 4
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke()
    ctx.fillStyle = '#999'; ctx.font = '600 9px sans-serif'; ctx.textAlign = 'right'
    ctx.fillText(String(Math.round(maxV * (1 - i / 4))), pad.l - 6, y + 3)
  }

  block.datasets.forEach((ds, di) => {
    const col = ds.color || pal[di % pal.length]
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath()
    ds.values.forEach((v, vi) => {
      const x = pad.l + vi * cw / Math.max(ds.values.length - 1, 1)
      const y = pad.t + ch - (v / maxV) * ch
      if (vi === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()

    ds.values.forEach((v, vi) => {
      const x = pad.l + vi * cw / Math.max(ds.values.length - 1, 1)
      const y = pad.t + ch - (v / maxV) * ch
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
    })
  })

  ctx.fillStyle = '#333'; ctx.font = '600 10px sans-serif'; ctx.textAlign = 'center'
  block.labels.forEach((l, vi) => ctx.fillText(String(l), pad.l + vi * cw / Math.max(block.labels.length - 1, 1), h - 12))
}

function drawPie(ctx: CanvasRenderingContext2D, block: ChartBlock, w: number, h: number, pal: string[]) {
  const cx = w / 2, cy = h / 2 - 10, r = Math.min(w, h) / 2 - 50
  const ir = block.chartType === 'donut' ? r * 0.55 : 0
  const ds = block.datasets[0]
  if (!ds) return
  const total = ds.values.reduce((a, v) => a + v, 0)
  if (total === 0) return

  let angle = -Math.PI / 2
  ds.values.forEach((v, i) => {
    const slice = v / total * Math.PI * 2
    const col = ds.color || pal[i % pal.length]
    ctx.fillStyle = col
    ctx.beginPath(); ctx.arc(cx, cy, r, angle, angle + slice)
    if (ir > 0) ctx.arc(cx, cy, ir, angle + slice, angle, true)
    else ctx.lineTo(cx, cy)
    ctx.closePath(); ctx.fill()

    const mid = angle + slice / 2
    const pct = Math.round(v / total * 100)
    if (pct > 5) {
      const lx = cx + Math.cos(mid) * (r + ir) / 2
      const ly = cy + Math.sin(mid) * (r + ir) / 2
      ctx.fillStyle = '#fff'; ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(pct + '%', lx, ly)
    }
    angle += slice
  })

  // Legend
  let ly = h - 20; ctx.textAlign = 'left'
  ds.values.forEach((v, i) => {
    const col = ds.color || pal[i % pal.length]
    const pct = Math.round(v / total * 100)
    ctx.fillStyle = col; ctx.fillRect(10, ly - 7, 10, 10)
    ctx.fillStyle = '#333'; ctx.font = '600 10px sans-serif'
    ctx.fillText((block.labels[i] || '') + ' ' + pct + '%', 24, ly + 2)
    ly -= 16
  })
}
