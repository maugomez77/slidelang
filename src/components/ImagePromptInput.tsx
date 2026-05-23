import React, { useState, useRef } from 'react'
import { DeckSpec } from '../dsl/schema'
import { planDeckFromImage, ollamaDescribeImage } from '../ai/ollama'

export function ImagePromptInput({ onDeckGenerated }: { onDeckGenerated: (spec: DeckSpec) => void }) {
  const [image, setImage] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPreview(result)
      const base64 = result.split(',')[1]
      setImage(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleDescribe = async () => {
    if (!image) return
    setLoading(true)
    try {
      const desc = await ollamaDescribeImage(image, prompt || undefined)
      setDescription(desc)
    } catch (err) {
      console.error('Vision describe failed:', err)
      setDescription('Error: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!image) return
    setLoading(true)
    try {
      const spec = await planDeckFromImage(image)
      onDeckGenerated(spec)
    } catch (err) {
      console.error('Deck generation from image failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearImage = () => {
    setImage(null)
    setPreview(null)
    setDescription(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div style={{ padding: '0.5em 1em', borderBottom: '1px solid #e0e0e0', background: '#fafafa' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '0.5em', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <label style={{
            padding: '0.5em 1em',
            border: '1px dashed #aaa',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.8em',
            color: '#666',
            background: 'white',
            whiteSpace: 'nowrap',
          }}>
            🖼️ Upload Image
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          <input
            type="text"
            placeholder="Custom prompt for vision model... (default: describe in detail)"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            style={{
              padding: '0.5em 0.75em',
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: '0.85em',
              flex: 1,
              minWidth: 200,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <button
            onClick={handleDescribe}
            disabled={loading || !image}
            style={{
              padding: '0.5em 1em',
              border: 'none',
              borderRadius: 6,
              fontSize: '0.85em',
              cursor: loading || !image ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              background: '#7209b7',
              color: 'white',
              opacity: loading || !image ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Processing...' : 'Describe'}
          </button>

          <button
            onClick={handleGenerate}
            disabled={loading || !image}
            style={{
              padding: '0.5em 1em',
              border: 'none',
              borderRadius: 6,
              fontSize: '0.85em',
              cursor: loading || !image ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              background: '#4361ee',
              color: 'white',
              opacity: loading || !image ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Generating...' : 'Generate Deck'}
          </button>

          {image && (
            <button onClick={clearImage} style={{
              padding: '0.5em 1em',
              border: '1px solid #ccc',
              borderRadius: 6,
              fontSize: '0.85em',
              cursor: 'pointer',
              background: 'transparent',
              color: '#666',
              whiteSpace: 'nowrap',
            }}>
              ✕ Clear
            </button>
          )}
        </div>

        {preview && (
          <div style={{ marginTop: '0.5em', display: 'flex', gap: '1em', alignItems: 'flex-start' }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: 120,
                maxHeight: 80,
                borderRadius: 6,
                border: '1px solid #ddd',
                objectFit: 'cover',
              }}
            />
            {description && (
              <div style={{
                flex: 1,
                fontSize: '0.75em',
                color: '#555',
                padding: '0.5em',
                background: 'white',
                borderRadius: 6,
                border: '1px solid #e0e0e0',
                maxHeight: 80,
                overflow: 'auto',
              }}>
                {description}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
