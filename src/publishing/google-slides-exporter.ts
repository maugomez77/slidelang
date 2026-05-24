const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = 'https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive.file'

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<string | null> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: window.location.origin + '/slidelang/auth-callback.html',
    }),
  })
  if (!r.ok) return null
  const data = await r.json() as any
  return data.access_token
}

export async function exportToGoogleSlides(spec: any, onProgress?: (msg: string) => void): Promise<string | null> {
  if (!GOOGLE_CLIENT_ID) {
    onProgress?.('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env')
    return null
  }

  onProgress?.('Authenticating...')
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', window.location.origin + '/slidelang/auth-callback.html')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('state', 'slidelang-slides')

  const popup = window.open(authUrl.toString(), 'gauth', 'width=600,height=700')
  if (!popup) { onProgress?.('Popup blocked. Allow popups and try again.'); return null }

  const code = await new Promise<string | null>((resolve) => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'slidelang-oauth' && e.data?.code) {
        window.removeEventListener('message', handler)
        resolve(e.data.code)
      }
    }
    window.addEventListener('message', handler)
    // Also poll for popup close
    const check = setInterval(() => {
      try { if (popup.closed) { clearInterval(check); window.removeEventListener('message', handler); resolve(null) } } catch { /* */ }
    }, 500)
    setTimeout(() => { clearInterval(check); window.removeEventListener('message', handler); resolve(null) }, 180000)
  })

  if (!code) { onProgress?.('Authentication cancelled.'); return null }

  onProgress?.('Exchanging code for token...')
  const token = await exchangeCodeForToken(code, codeVerifier)
  if (!token) { onProgress?.('Token exchange failed.'); return null }

  onProgress?.('Creating presentation...')
  const createRes = await fetch(`https://slides.googleapis.com/v1/presentations?title=${encodeURIComponent(spec.meta.title)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  })

  return `https://docs.google.com/presentation/d/${pres.presentationId}/edit`
}
