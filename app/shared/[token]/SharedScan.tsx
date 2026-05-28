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
    const saved = localStorage.getItem('theme')
    setIsDark(saved !== 'light')
    supabase.from('scans').select('*').eq('share_token', token).eq('share_enabled', true).single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setScan(data)
        setLoading(false)
      })
  }, [token])

  const markSrc = isDark ? '/brand/mark-amber.svg' : '/brand/mark-ink.svg'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-sans)' }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-sans)' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Scan not available</div>
        <div style={{ fontSize: 14, color: 'var(--text-mut)', marginBottom: 24 }}>This link is no longer active or has been disabled.</div>
        <Link href="/login" style={{ height: 44, padding: '12px 24px', background: 'var(--amber)', color: '#fff', borderRadius: 999, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>Try SafetyScan</Link>
      </div>
    </div>
  )

  const photoUrls: string[] = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
  const findings: any[] = scan.findings || []
  const legislation: any[] = scan.legislation || []
  const dateStr = new Date(scan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = new Date(scan.created_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
  const shareLink = `safetyscan.com.au/shared/${token}`
  const issueCount = findings.filter(f => f.type === 'critical').length || findings.filter(f => f.type === 'warning').length

  const statusCfg: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    pass:      { bg: 'var(--status-green-bg)', color: 'var(--status-green)', dot: 'var(--status-green)', label: 'Clear' },
    fail:      { bg: 'var(--status-red-bg)',   color: 'var(--status-red)',   dot: 'var(--status-red)',   label: `${issueCount} issue${issueCount !== 1 ? 's' : ''} found` },
    uncertain: { bg: 'var(--status-amber-bg)', color: 'var(--amber)',        dot: 'var(--amber)',        label: 'Pending review' },
  }
  const sc = statusCfg[scan.status] || statusCfg.uncertain

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff-sans)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ padding: '8px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--card)', boxShadow: '0 0 0 1px var(--border)', display: 'grid', placeItems: 'center' }}>
            <img src={markSrc} alt="" style={{ width: 22, height: 22 }}/>
          </div>
          <div style={{ fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em', color: 'var(--text)' }}>
            Safety<span style={{ color: 'var(--amber)' }}>Scan</span>
          </div>
        </div>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Shared report</span>
      </div>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 48px' }}>

        {/* Read-only banner */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', borderRadius: 16, background: 'var(--card-2)', marginBottom: 12, fontSize: 12, color: 'var(--text-mut)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }}/>
          Read-only · shared {dateStr}
        </div>

        {/* Title */}
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)', padding: '4px 4px 4px' }}>{scan.work_type || 'Compliance Scan'}</div>
        <div style={{ fontSize: 13, color: 'var(--text-mut)', padding: '0 4px 12px' }}>{dateStr}, {timeStr}</div>

        {/* Photo carousel */}
        {photoUrls.length > 0 && (
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 220, marginBottom: 14 }}>
            <img src={photoUrls[0]} alt="Site photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
            {photoUrls.length > 1 && (
              <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', color: '#fff', fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.08em' }}>1 / {photoUrls.length}</div>
            )}
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
              {photoUrls.map((_: string, i: number) => (
                <span key={i} style={{ width: i === 0 ? 18 : 6, height: 6, borderRadius: 999, background: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)' }}/>
              ))}
            </div>
          </div>
        )}

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, padding: '6px 12px 6px 10px', borderRadius: 999, background: sc.bg, color: sc.color }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }}/>
            {sc.label}
          </div>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-mut)', opacity: 0.6 }}>
            AI · {Math.round((scan.confidence === 'high' ? 0.94 : scan.confidence === 'medium' ? 0.78 : 0.55) * 100)}% confidence
          </span>
        </div>

        {/* Summary */}
        {scan.summary && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', padding: '18px 4px 10px' }}>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-mut)' }}>Summary</span>
            </div>
            <div style={{ background: 'var(--card-2)', borderRadius: 16, padding: '14px 16px', fontSize: 13.2, lineHeight: 1.55, color: 'var(--text)' }}>
              {scan.summary}
            </div>
          </>
        )}

        {/* Issues */}
        {findings.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', padding: '18px 4px 10px' }}>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-mut)' }}>Issues</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {findings.filter(f => f.type === 'critical' || f.type === 'warning').map((f: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'var(--card)', boxShadow: 'var(--shadow-card)', alignItems: 'flex-start' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 7, flexShrink: 0, background: f.type === 'critical' ? 'var(--status-red)' : 'var(--amber)' }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)', marginBottom: 3 }}>{f.title || f.text}</div>
                    {f.detail && <div style={{ fontSize: 12.5, color: 'var(--text-mut)', lineHeight: 1.45 }}>{f.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <Link href="/login"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, marginTop: 28, background: 'var(--amber)', borderRadius: 999, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: 'var(--shadow-btn-amber)' }}>
          Open in SafetyScan
        </Link>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-dim)', textAlign: 'center', marginTop: 12 }}>
          {shareLink}
        </div>
      </main>
    </div>
  )
}
