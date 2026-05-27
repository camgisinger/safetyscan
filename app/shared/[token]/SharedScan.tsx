'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

const NAVY = '#16181C'
const AMBER = '#F39410'
const OFFWHITE = '#EFEAE0'
const PASS_GREEN = '#1a7a45'
const FAIL_RED = '#E14B3D'
const WARN_AMBER = '#a36200'

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    pass: { bg: 'rgba(61,211,122,0.12)', color: PASS_GREEN, label: 'Compliant' },
    fail: { bg: 'rgba(225,75,61,0.12)', color: FAIL_RED, label: 'Issues found' },
    uncertain: { bg: 'rgba(243,148,16,0.12)', color: WARN_AMBER, label: 'Uncertain' },
    not_applicable: { bg: 'rgba(0,0,0,0.05)', color: '#4A4D52', label: 'N/A' },
  }
  const c = cfg[status] || cfg.uncertain
  return (
    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: c.bg, color: c.color, fontWeight: 600 }}>
      {c.label}
    </span>
  )
}

const findingColors: Record<string, { bg: string; border: string; color: string; dot: string }> = {
  ok: { bg: 'rgba(61,211,122,0.08)', border: 'rgba(61,211,122,0.25)', color: PASS_GREEN, dot: PASS_GREEN },
  warning: { bg: 'rgba(243,148,16,0.08)', border: 'rgba(243,148,16,0.25)', color: WARN_AMBER, dot: AMBER },
  critical: { bg: 'rgba(225,75,61,0.08)', border: 'rgba(225,75,61,0.25)', color: FAIL_RED, dot: FAIL_RED },
}

export default function SharedScan({ token }: { token: string }) {
  const [scan, setScan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase
      .from('scans')
      .select('*')
      .eq('share_token', token)
      .eq('share_enabled', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true) }
        else { setScan(data) }
        setLoading(false)
      })
  }, [token])

  const ShieldLogo = () => (
    <svg width="28" height="28" viewBox="0 0 240 240" fill="none">
      <g opacity="0.7">
        <path d="M14 14 H58 V25 H25 V58 H14 Z" fill="#EFEAE0"/>
        <path d="M226 14 H182 V25 H215 V58 H226 Z" fill="#EFEAE0"/>
        <path d="M14 226 H58 V215 H25 V182 H14 Z" fill="#EFEAE0"/>
        <path d="M226 226 H182 V215 H215 V182 H226 Z" fill="#EFEAE0"/>
      </g>
      <path d="M120 32 L190 56 V128 C190 170 162 196 120 214 C78 196 50 170 50 128 V56 Z" fill="none" stroke="#F39410" strokeWidth="8" strokeLinejoin="miter"/>
      <polyline points="88,120 110,142 154,96" fill="none" stroke="#F39410" strokeWidth="16" strokeLinecap="square" strokeLinejoin="miter"/>
    </svg>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 32, height: 32, border: '3px solid #E0DDD6', borderTopColor: AMBER, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "Inter, system-ui, sans-serif" }}>
      <header style={{ background: NAVY, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShieldLogo />
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>
          <span style={{ color: '#EFEAE0' }}>Safety</span><span style={{ color: AMBER }}>Scan</span>
        </div>
      </header>
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Scan unavailable</div>
        <div style={{ fontSize: 14, color: '#7A7468', lineHeight: 1.6, marginBottom: 32 }}>
          This scan is no longer available. The link may have expired or sharing may have been disabled.
        </div>
        <Link href="/" style={{ display: 'inline-block', padding: '12px 24px', background: NAVY, color: '#EFEAE0', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          Go to SafetyScan
        </Link>
      </div>
    </div>
  )

  const photoUrls: string[] = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
  const findings: any[] = scan.findings || []
  const legislation: any[] = scan.legislation || []
  const dateStr = new Date(scan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <header style={{ background: NAVY, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldLogo />
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>
            <span style={{ color: '#EFEAE0' }}>Safety</span><span style={{ color: AMBER }}>Scan</span>
          </div>
        </div>
        <div style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(243,148,16,0.15)', color: AMBER, borderRadius: 10, border: '0.5px solid rgba(243,148,16,0.3)', fontWeight: 600 }}>
          Shared report
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* Title + meta */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{scan.work_type || 'Compliance Scan'}</h1>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{dateStr}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={scan.status} />
            <span style={{ fontSize: 12, color: '#aaa' }}>Confidence: {scan.confidence || 'low'}</span>
          </div>
        </div>

        {/* Photos */}
        {photoUrls.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 2 }}>
            {photoUrls.map((url, i) => (
              <div key={i} style={{ flexShrink: 0, width: photoUrls.length === 1 ? '100%' : 'auto' }}>
                <img src={url} alt={`Photo ${i + 1}`}
                  style={{ width: photoUrls.length === 1 ? '100%' : 120, height: photoUrls.length === 1 ? 'auto' : 90, maxHeight: photoUrls.length === 1 ? 260 : undefined, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {scan.summary && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Summary</div>
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{scan.summary}</div>
          </div>
        )}

        {/* Findings */}
        {findings.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Findings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {findings.map((f: any, i: number) => {
                const fc = findingColors[f.type] || findingColors.warning
                return (
                  <div key={i} style={{ background: fc.bg, border: `0.5px solid ${fc.border}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: fc.color, marginBottom: f.detail ? 4 : 0 }}>{f.title}</div>
                    {f.detail && <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{f.detail}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Legislation */}
        {legislation.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Queensland Legislation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {legislation.map((leg: any, i: number) => (
                <div key={i}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{leg.code}: {leg.name}</div>
                  {leg.clauses && leg.clauses.length > 0 && (
                    <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{leg.clauses.join(' · ')}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6, textAlign: 'center', padding: '0 10px', marginBottom: 28 }}>
          This report was generated by SafetyScan AI. Results are indicative only and should be verified by a qualified professional before sign-off.
        </div>

        {/* CTA */}
        <div style={{ background: NAVY, borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Check your own site's compliance</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18, lineHeight: 1.5 }}>
            SafetyScan uses AI to assess Queensland construction compliance from site photos — in seconds.
          </div>
          <Link href="/login" style={{ display: 'inline-block', padding: '12px 28px', background: AMBER, color: NAVY, borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Sign up to SafetyScan →
          </Link>
        </div>

      </main>
    </div>
  )
}
