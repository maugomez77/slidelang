import React from 'react'
import { LayoutIssue } from '../dsl/schema'

export function ValidationPanel({ issues, repairs, onRepair }: {
  issues: LayoutIssue[]
  repairs: string[]
  onRepair: () => void
}) {
  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')
  const infos = issues.filter(i => i.severity === 'info')

  if (issues.length === 0 && repairs.length === 0) return null

  return (
    <div style={{
      borderTop: '1px solid #e0e0e0',
      padding: '0.75em 1em',
      background: '#fafafa',
      fontSize: '0.8em',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1em', marginBottom: '0.5em' }}>
        <strong>Validation</strong>
        {errors.length > 0 && <span style={{ color: '#ff4444' }}>{errors.length} error{errors.length > 1 ? 's' : ''}</span>}
        {warnings.length > 0 && <span style={{ color: '#ffaa00' }}>{warnings.length} warning{warnings.length > 1 ? 's' : ''}</span>}
        {issues.length === 0 && <span style={{ color: '#2a9d8f' }}>✓ No issues</span>}
        {(errors.length > 0 || warnings.length > 0) && (
          <button onClick={onRepair} style={{
            marginLeft: 'auto',
            padding: '0.3em 0.75em',
            border: 'none',
            borderRadius: 4,
            background: '#4361ee',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.85em',
          }}>
            Auto-repair
          </button>
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
          padding: '0.2em 0.5em',
          margin: '0.15em 0',
          borderRadius: 4,
          background: issue.severity === 'error' ? '#fff0f0' : issue.severity === 'warning' ? '#fff8e1' : '#f5f5ff',
          fontSize: '0.85em',
        }}>
          <span style={{
            display: 'inline-block',
            width: 8, height: 8,
            borderRadius: '50%',
            background: issue.severity === 'error' ? '#ff4444' : issue.severity === 'warning' ? '#ffaa00' : '#4361ee',
            marginRight: '0.4em',
          }} />
          {issue.message}
        </div>
      ))}
    </div>
  )
}
