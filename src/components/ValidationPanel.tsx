import React, { useState } from 'react'
import { LayoutIssue } from '../dsl/schema'

export function ValidationPanel({ issues, repairs, onRepair, onCritique, critique, critiquing, onApplyFix, applyingFix }: {
  issues: LayoutIssue[]
  repairs: string[]
  onRepair: () => void
  onCritique?: () => void
  critique?: string
  critiquing?: boolean
  onApplyFix?: () => void
  applyingFix?: boolean
}) {
  const [tab, setTab] = useState<'static' | 'vision'>('static')
  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')
  const hasIssues = issues.length > 0 || repairs.length > 0

  return (
    <div style={{
      borderTop: '1px solid #e0e0e0',
      background: '#fafafa',
      fontSize: '0.8em',
    }}>
      <div style={{
        display: 'flex', borderBottom: '1px solid #e0e0e0',
        background: 'white',
      }}>
        <button onClick={() => setTab('static')} style={{
          flex: 1, padding: '0.5em', border: 'none', cursor: 'pointer',
          background: tab === 'static' ? '#fafafa' : 'white',
          borderBottom: tab === 'static' ? '2px solid #4361ee' : '2px solid transparent',
          fontSize: '0.85em', fontWeight: tab === 'static' ? 600 : 400, color: tab === 'static' ? '#4361ee' : '#666',
        }}>
          📋 Rules {hasIssues && <span style={{ fontSize: '0.8em', color: errors.length ? '#ff4444' : warnings.length ? '#ffaa00' : '#2a9d8f' }}>({issues.length})</span>}
        </button>
        <button onClick={() => setTab('vision')} style={{
          flex: 1, padding: '0.5em', border: 'none', cursor: 'pointer',
          background: tab === 'vision' ? '#fafafa' : 'white',
          borderBottom: tab === 'vision' ? '2px solid #7209b7' : '2px solid transparent',
          fontSize: '0.85em', fontWeight: tab === 'vision' ? 600 : 400, color: tab === 'vision' ? '#7209b7' : '#666',
        }}>
          🔍 AI Critique {critique && <span style={{ fontSize: '0.8em', color: '#2a9d8f' }}>✓</span>}
        </button>
      </div>

      {tab === 'static' && (
        <div style={{ padding: '0.75em 1em', maxHeight: 200, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', marginBottom: '0.5em', flexWrap: 'wrap' }}>
            {errors.length > 0 && <span style={{ color: '#ff4444', fontWeight: 600 }}>{errors.length} error{errors.length > 1 ? 's' : ''}</span>}
            {warnings.length > 0 && <span style={{ color: '#ffaa00', fontWeight: 600 }}>{warnings.length} warning{warnings.length > 1 ? 's' : ''}</span>}
            {!hasIssues && <span style={{ color: '#2a9d8f', fontWeight: 600 }}>✓ All 33 rules passed</span>}
            {(errors.length > 0 || warnings.length > 0) && (
              <button onClick={onRepair} style={{
                padding: '0.3em 0.75em', border: 'none', borderRadius: 4,
                background: '#4361ee', color: 'white', cursor: 'pointer', fontSize: '0.85em',
                marginLeft: 'auto',
              }}>Auto-repair</button>
            )}
          </div>

          {repairs.length > 0 && (
            <div style={{ marginBottom: '0.5em', padding: '0.4em', background: '#e8f5e9', borderRadius: 4 }}>
              <strong style={{ color: '#2e7d32' }}>Repairs applied:</strong>
              <ul style={{ margin: '0.2em 0 0 1.2em', padding: 0 }}>
                {repairs.map((r, i) => <li key={i} style={{ fontSize: '0.85em' }}>{r}</li>)}
              </ul>
            </div>
          )}

          {issues.map((issue, i) => (
            <div key={i} style={{
              padding: '0.25em 0.5em', margin: '0.15em 0', borderRadius: 4,
              background: issue.severity === 'error' ? '#fff0f0' : issue.severity === 'warning' ? '#fff8e1' : '#f5f5ff',
              fontSize: '0.85em',
            }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                background: issue.severity === 'error' ? '#ff4444' : issue.severity === 'warning' ? '#ffaa00' : '#4361ee',
                marginRight: '0.4em',
              }} />
              {issue.message}
            </div>
          ))}

          {!hasIssues && (
            <div style={{ padding: '1em', textAlign: 'center', opacity: 0.5 }}>
              No layout issues detected for this deck.
            </div>
          )}
        </div>
      )}

      {tab === 'vision' && (
        <div style={{ padding: '0.75em 1em', maxHeight: 200, overflow: 'auto' }}>
          {onCritique && !critique && (
            <div style={{ textAlign: 'center', padding: '1.5em' }}>
              <p style={{ opacity: 0.6, marginBottom: '0.75em' }}>Use AI to analyze the current slide for visual design issues.</p>
              <button onClick={onCritique} disabled={critiquing} style={{
                padding: '0.5em 1.5em', border: 'none', borderRadius: 6,
                background: '#7209b7', color: 'white', cursor: 'pointer',
                fontSize: '0.9em', fontWeight: 600,
              }}>
                {critiquing ? 'Analyzing with llama3.2-vision...' : '🔍 Analyze Current Slide'}
              </button>
            </div>
          )}

          {critiquing && !critique && (
            <div style={{ textAlign: 'center', padding: '1.5em', opacity: 0.6 }}>
              Vision model is analyzing this slide for contrast, alignment, spacing, readability, and visual balance...
            </div>
          )}

          {critique && (
            <div style={{
              padding: '0.75em', background: '#fffbeb', borderRadius: 6,
              border: '1px solid #fde68a', whiteSpace: 'pre-wrap',
              lineHeight: 1.6, color: '#92400e',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5em' }}>
                <strong>🔍 Vision Analysis</strong>
                <div style={{ display: 'flex', gap: '0.3em' }}>
                  <button onClick={onCritique} disabled={critiquing} style={{
                    padding: '0.2em 0.5em', border: '1px solid #7209b7', borderRadius: 4,
                    background: 'white', color: '#7209b7', cursor: 'pointer', fontSize: '0.75em',
                  }}>{critiquing ? '...' : 'Refresh'}</button>
                  {onApplyFix && (
                    <button onClick={onApplyFix} disabled={applyingFix} style={{
                      padding: '0.2em 0.5em', border: 'none', borderRadius: 4,
                      background: '#22c55e', color: 'white', cursor: 'pointer', fontSize: '0.75em', fontWeight: 600,
                    }}>{applyingFix ? 'Fixing...' : '✨ Apply Fixes'}</button>
                  )}
                </div>
              </div>
              {critique}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
