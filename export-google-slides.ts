import { readFileSync } from 'fs'
import { DeckSpec } from './src/dsl/schema.ts'

async function getToken(): Promise<string> {
  const tokens = JSON.parse(readFileSync(process.env.HOME + '/.config/google-workspace-mcp/tokens.json', 'utf-8'))
  if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || ''}&client_secret=${process.env.GOOGLE_CLIENT_SECRET || ''}&refresh_token=${tokens.refresh_token}&grant_type=refresh_token`,
    })
    const data = await r.json() as any
    return data.access_token
  }
  return tokens.access_token
}

async function main() {
  const specFile = process.argv[2] || 'examples/showcase.json'
  const spec = JSON.parse(readFileSync(specFile, 'utf-8')) as DeckSpec
  const token = await getToken()

  // Create presentation
  const createRes = await fetch(`https://slides.googleapis.com/v1/presentations?title=${encodeURIComponent(spec.meta.title)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: spec.meta.title }),
  })
  const pres = await createRes.json() as any
  console.log(`Created: https://docs.google.com/presentation/d/${pres.presentationId}/edit`)

  // Build slide requests
  const requests: any[] = []
  let objId = 1

  spec.slides.forEach((slide, slideIdx) => {
    const slideId = `slide_${slideIdx}`
    requests.push({ createSlide: { objectId: slideId, insertionIndex: slideIdx } })

    if (slide.title) {
      const tid = `t${objId++}`
      requests.push({
        createShape: { objectId: tid, shapeType: 'TEXT_BOX', elementProperties: { pageObjectId: slideId, size: { width: { magnitude: 500, unit: 'PT' }, height: { magnitude: 50, unit: 'PT' } }, transform: { scaleX: 1, scaleY: 1, translateX: 50, translateY: 40, unit: 'PT' } } },
      })
      requests.push({ insertText: { objectId: tid, text: slide.title } })
    }

    let y = slide.title ? 100 : 50
    slide.blocks.forEach((block: any) => {
      let text = ''
      if (block.type === 'text') text = block.content || ''
      else if (block.type === 'bullets' || block.type === 'numbered') text = (block.items || []).map((i: string) => `• ${i}`).join('\n')
      else if (block.type === 'math') text = block.expression || ''
      else if (block.type === 'image') text = `[Image: ${block.source?.url || ''}]`

      if (text) {
        const bid = `b${objId++}`
        requests.push({
          createShape: { objectId: bid, shapeType: 'TEXT_BOX', elementProperties: { pageObjectId: slideId, size: { width: { magnitude: 500, unit: 'PT' }, height: { magnitude: 60, unit: 'PT' } }, transform: { scaleX: 1, scaleY: 1, translateX: 50, translateY: y, unit: 'PT' } } },
        })
        requests.push({ insertText: { objectId: bid, text } })
        y += 65
      }
    })
  })

  requests.push({ deleteObject: { objectId: 'p' } })

  await fetch(`https://slides.googleapis.com/v1/presentations/${pres.presentationId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  })

  console.log(`${spec.slides.length} slides added.`)
  console.log(`Open: https://docs.google.com/presentation/d/${pres.presentationId}/edit`)
}

main().catch(e => { console.error(e); process.exit(1) })
