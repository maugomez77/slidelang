import React, { useState } from 'react'
import { DeckSpec } from '../dsl/schema'
import { planDeck, isAIConfigured, setAIConfig } from '../ai/planner'

export function PromptInput({ onDeckGenerated }: { onDeckGenerated: (spec: DeckSpec) => void }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfig, setShowConfig] = useState(!isAIConfigured())
  const [apiKey, setApiKey] = useState(localStorage.getItem('slidelang_api_key') || '')
  const [model, setModel] = useState(localStorage.getItem('slidelang_model') || 'openai/gpt-4o-mini')

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const spec = await planDeck(prompt)
      onDeckGenerated(spec)
    } catch (err) {
      console.error('Generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = () => {
    setAIConfig(apiKey, model)
    setShowConfig(false)
  }

  return (
    <div style={{ padding: '1em', borderBottom: '1px solid #e0e0e0' }}>
      {showConfig ? (
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 0.5em 0' }}>AI Configuration</h3>
          <p style={{ fontSize: '0.8em', opacity: 0.7, marginBottom: '0.5em' }}>
            Enter your OpenRouter API key for AI-powered deck generation. Without one, a template deck will be used.
          </p>
          <input
            type="password"
            placeholder="OpenRouter API Key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: '0.5em', marginTop: '0.5em' }}>
            <input
              type="text"
              placeholder="Model (default: openai/gpt-4o-mini)"
              value={model}
              onChange={e => setModel(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={saveConfig} style={btnStyle}>Save</button>
          </div>
          {!apiKey && (
            <button
              onClick={() => setShowConfig(false)}
              style={{ ...btnStyle, background: 'transparent', color: '#666', border: '1px solid #ccc', marginTop: '0.5em' }}
            >
              Skip — use template
            </button>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5em', alignItems: 'center' }}>
            <button
              onClick={() => setShowConfig(true)}
              style={{ ...btnStyle, background: 'transparent', color: '#666', border: '1px solid #ccc', fontSize: '0.75em', padding: '0.3em 0.6em', whiteSpace: 'nowrap' }}
              title="Configure AI API key"
            >
              {isAIConfigured() ? '🔑 AI' : '⚙️ AI Config'}
            </button>
            <input
              type="text"
              placeholder="Describe your deck... (e.g., 'A pitch deck for a new AI-powered design tool')"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              style={{
                ...btnStyle,
                background: loading ? '#999' : '#4361ee',
                color: 'white',
                opacity: loading || !prompt.trim() ? 0.6 : 1,
              }}
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {!isAIConfigured() && (
            <p style={{ fontSize: '0.7em', opacity: 0.5, marginTop: '0.3em' }}>
              No AI key configured — will use a built-in template. Configure above for AI-powered generation.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.5em 0.75em',
  border: '1px solid #ccc',
  borderRadius: 6,
  fontSize: '0.85em',
  outline: 'none',
  boxSizing: 'border-box',
  width: '100%',
}

const btnStyle: React.CSSProperties = {
  padding: '0.5em 1em',
  border: 'none',
  borderRadius: 6,
  fontSize: '0.85em',
  cursor: 'pointer',
  fontWeight: 600,
}
