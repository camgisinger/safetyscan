'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

export default function SharedScan({ token }: { token: string }) {
  const [scan, setScan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(localStorage.getItem('theme') !== 'light')
    supabase.from('scans').select('*').eq('share_token', token).eq('share_enabled', true).single()
      .then(({ data, error }) => { if (error || !data) setNotFound(true); else setScan(data); setLoading(false) })
  }, [token])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid var(--line)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Scan not available</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mut)', marginBottom: 24 }}>This link is no longer active.</div>
        <Link href="/login" style={{ height: 46, padding: '0 24px', background: 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, color: '#1B1A12', fontSize: 13.5, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Try SafetyScan</Link>
      </div>
    </div>
  )

  const photoUrls: string[] = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
  const findings: any[] = scan.findings || []
  const dateStr = new Date(scan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const issueCount = findings.filter(f => f.type === 'critical').length || findings.filter(f => f.type === 'warning').length
  const statusColor = scan.status === 'pass' ? 'var(--clear-tx)' : scan.status === 'fail' ? 'var(--issue-tx-theme)' : 'var(--amber)'
  const statusLabel = scan.status === 'pass' ? 'Clear' : scan.status === 'fail' ? `${issueCount} issues found` : 'Pending review'
  const statusBarColor = scan.status === 'pass' ? '#3E8E5A' : scan.status === 'fail' ? '#D63A26' : 'var(--amber)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ height: 7, background: 'var(--hazard-bg)', flexShrink: 0 }} />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px 12px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 30, height: 30 }}>
            <img src={isDark ? '/brand/mark-amber.svg' : '/brand/mark-duo-light.svg'} alt="" style={{ width: 30, height: 30 }}/>
          </div>
          <span style={{ fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text)' }}>Safety<b style={{ color: 'var(--amber)' }}>Scan</b></span>
        </div>
        <span style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--mut)' }}>Shared report</span>
      </div>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 48px' }}>
        {/* Read-only banner */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, marginBottom: 14, fontSize: 12, fontWeight: 500, color: 'var(--mut)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }}/>
          Read-only · shared {dateStr}
        </div>

        <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--text)', paddingBottom: 4 }}>{scan.work_type || 'Compliance Scan'}</div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--mut)', marginBottom: 14 }}>{dateStr}</div>

        {/* Photo carousel */}
        {photoUrls.length > 0 && (
          <div style={{ position: 'relative', height: 216, borderRadius: 6, overflow: 'hidden', border: '1.5px solid var(--line)', marginBottom: 14, backgroundColor: 'var(--surf)', backgroundImage: 'repeating-linear-gradient(135deg, var(--div) 0 1.5px, transparent 1.5px 13px)' }}>
            <img src={photoUrls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
            {photoUrls.length > 1 && <div style={{ position: 'absolute', top: 11, right: 11, padding: '4px 9px', borderRadius: 4, background: 'rgba(20,18,12,0.62)', color: '#F1EFE6', fontWeight: 600, fontSize: 10.5, letterSpacing: '0.06em' }}>1 / {photoUrls.length}</div>}
          </div>
        )}

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: statusBarColor }}/>
            <span style={{ fontWeight: 600, fontSize: 13, color: statusColor }}>{statusLabel}</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--mut)', opacity: 0.7 }}>
            AI · {scan.confidence?.toUpperCase() || 'LOW'} CONFIDENCE
          </span>
        </div>

        {/* Summary */}
        {scan.summary && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px 11px' }}>
              <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }}/>
              <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)' }}>Summary</span>
            </div>
            <div style={{ background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, padding: '14px 15px', fontSize: 13, fontWeight: 500, lineHeight: 1.55, color: 'var(--text)', marginBottom: 4 }}>
              {scan.summary}
            </div>
          </>
        )}

        {/* Issues */}
        {findings.filter(f => f.type === 'critical' || f.type === 'warning').length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '18px 2px 11px' }}>
              <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }}/>
              <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)' }}>Issues</span>
            </div>
            {findings.filter(f => f.type === 'critical' || f.type === 'warning').map((f: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'stretch', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: 5, flexShrink: 0, background: f.type === 'critical' ? '#D63A26' : 'var(--amber)' }} />
                <div style={{ flex: 1, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: f.detail ? 4 : 0 }}>{f.title || f.text}</div>
                  {f.detail && <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.45 }}>{f.detail}</div>}
                </div>
              </div>
            ))}
          </>
        )}

        <Link href="/login"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 46, marginTop: 24, background: 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, color: '#1B1A12', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>
          Open in SafetyScan
        </Link>
        <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--mut)', textAlign: 'center', marginTop: 12 }}>
          safetyscan.com.au/shared/{token}
        </div>
      </main>
    </div>
  )
}
