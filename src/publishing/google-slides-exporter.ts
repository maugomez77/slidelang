const GOOGLE_CLIENT_ID = localStorage.getItem('slidelang_google_client_id') || ''
const SCOPES = 'https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive.file'

let googleToken: string | null = null

export async function exportToGoogleSlides(spec: any, onProgress?: (msg: string) => void): Promise<string | null> {
  if (!googleToken) {
    onProgress?.('Authenticating with Google...')
    googleToken = await getGoogleToken()
  }
  if (!googleToken) {
    onProgress?.('Authentication failed. Please try again.')
    return null
  }

  onProgress?.('Creating presentation...')
  const createRes = await fetch(`https://slides.googleapis.com/v1/presentations?title=${encodeURIComponent(spec.meta.title)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: spec.meta.title }),
  })
  if (!createRes.ok) { onProgress?.('Failed to create presentation.'); return null }
  const pres = await createRes.json() as any

  onProgress?.(`Adding ${spec.slides.length} slides...`)
  const requests: any[] = []
  let objId = 1

  spec.slides.forEach((slide: any, slideIdx: number) => {
    const slideId = `s${slideIdx}`
    requests.push({ createSlide: { objectId: slideId, insertionIndex: slideIdx } })

    if (slide.title) {
      const tid = `t${objId++}`
      requests.push({ createShape: { objectId: tid, shapeType: 'TEXT_BOX', elementProperties: { pageObjectId: slideId, size: { width: { magnitude: 500, unit: 'PT' }, height: { magnitude: 50, unit: 'PT' } }, transform: { scaleX: 1, scaleY: 1, translateX: 50, translateY: 40, unit: 'PT' } } } })
      requests.push({ insertText: { objectId: tid, text: slide.title } })
    }

    let y = slide.title ? 100 : 50
    slide.blocks?.forEach((block: any) => {
      let text = ''
      if (block.type === 'text') text = block.content || ''
      else if (block.type === 'bullets' || block.type === 'numbered') text = (block.items || []).map((i: string) => `• ${i}`).join('\n')
      else if (block.type === 'math') text = block.expression || ''
      else if (block.type === 'image') text = `[Image]`

      if (text) {
        const bid = `b${objId++}`
        requests.push({ createShape: { objectId: bid, shapeType: 'TEXT_BOX', elementProperties: { pageObjectId: slideId, size: { width: { magnitude: 500, unit: 'PT' }, height: { magnitude: 60, unit: 'PT' } }, transform: { scaleX: 1, scaleY: 1, translateX: 50, translateY: y, unit: 'PT' } } } })
        requests.push({ insertText: { objectId: bid, text } })
        y += 65
      }
    })
  })

  requests.push({ deleteObject: { objectId: 'p' } })

  await fetch(`https://slides.googleapis.com/v1/presentations/${pres.presentationId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  })

  return `https://docs.google.com/presentation/d/${pres.presentationId}/edit`
}

function getGoogleToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/slidelang/')}&response_type=token&scope=${encodeURIComponent(SCOPES)}&prompt=consent`

    const popup = window.open(authUrl, 'google-auth', 'width=600,height=700')
    if (!popup) { resolve(null); return }

    const check = setInterval(() => {
      try {
        if (popup.closed) { clearInterval(check); resolve(null); return }
        const hash = popup.location?.hash
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.slice(1))
          const token = params.get('access_token')
          clearInterval(check)
          popup.close()
          resolve(token)
        }
      } catch { /* cross-origin until redirect */ }
    }, 500)

    setTimeout(() => { clearInterval(check); popup.close(); resolve(null) }, 120000)
  })
}
