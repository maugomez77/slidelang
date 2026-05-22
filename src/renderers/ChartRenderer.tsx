import React, { useEffect, useRef } from 'react'
import { ChartBlock } from '../dsl/schema'

const COLORS = ['#4361ee', '#f72585', '#4cc9f0', '#7209b7', '#3a0ca3', '#e63946', '#2a9d8f', '#e9c46a']

export function ChartRenderer({ block }: { block: ChartBlock }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const pad = { t: 25, b: 35, l: 50, r: 20 }
    const chartW = w - pad.l - pad.r
    const chartH = h - pad.t - pad.b

    ctx.clearRect(0, 0, w, h)

    if (block.labels.length === 0) {
      ctx.fillStyle = '#999'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No data', w / 2, h / 2)
      return
    }

    const allValues = block.datasets.flatMap(d => d.values)
    const maxVal = Math.max(...allValues, 1)

    ctx.fillStyle = '#666'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    const steps = 4
    for (let i = 0; i <= steps; i++) {
      const v = (maxVal / steps) * i
      const y = pad.t + chartH - (v / maxVal) * chartH
      ctx.fillText(Math.round(v).toString(), pad.l - 5, y + 4)
      ctx.strokeStyle = '#eee'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(pad.l, y)
      ctx.lineTo(w - pad.r, y)
      ctx.stroke()
    }

    block.datasets.forEach((ds, di) => {
      const color = ds.color || COLORS[di % COLORS.length]
      const gap = block.labels.length > 1 ? chartW / block.labels.length : 60
      const barWidth = Math.min(gap * 0.5, 30)

      ds.values.forEach((v, i) => {
        const x = pad.l + i * gap + (gap - barWidth) / 2
        const barH = (v / maxVal) * chartH
        const y = pad.t + chartH - barH

        ctx.fillStyle = color
        ctx.globalAlpha = 1 - di * 0.2
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0])
        ctx.fill()
        ctx.globalAlpha = 1

        ctx.fillStyle = '#666'
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(ds.label, x + barWidth / 2, y - 4)
      })
    })

    ctx.fillStyle = '#666'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    block.labels.forEach((l, i) => {
      const gap = block.labels.length > 1 ? chartW / block.labels.length : 60
      const x = pad.l + i * gap + gap / 2
      ctx.fillText(l, x, h - 5)
    })
  }, [block])

  return (
    <div style={{ margin: '0.3em 0' }}>
      {block.title && <div style={{ fontSize: '0.8em', fontWeight: 600, marginBottom: 4 }}>{block.title}</div>}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 200, maxWidth: 500 }}
      />
    </div>
  )
}
