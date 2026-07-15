'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import LegislationList from '../../../components/LegislationList'

export default function SharedScan({ token }: { token: string }) {
  const [scan, setScan] = useState<any>(null)
  const [scanModules, setScanModules] = useState<any[]>([])
  const [activeModule, setActiveModule] = useState<string>('')
  const [openLeg, setOpenLeg] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(localStorage.getItem('theme') !== 'light')
    const load = async () => {
      const { data: scanData, error } = await supabase
        .from('scans').select('*, scan_modules(*)').eq('share_token', token).eq('share_enabled', true).single()
      if (error || !scanData) { setNotFound(true); setLoading(false); return }
      const modulesData: any[] = (scanData as any).scan_modules || []
      setScan(scanData)
      const modOrder = ['safety', 'quality', 'environmental']
      const sorted = modulesData.sort(
        (a: any, b: any) => modOrder.indexOf(a.module) - modOrder.indexOf(b.module)
      )
      setScanModules(sorted)
      if (sorted.length > 0) setActiveModule(sorted[0].module)
      setLoading(false)
    }
    load()
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
        <Link href="/login" style={{ height: 46, padding: '0 24px', background: 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, color: '#1B1A12', fontSize: 13.5, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Try SiteSpotter</Link>
      </div>
    </div>
  )

  // ── Derivation ───────────────────────────────────────────────────────────────
  const isLegacy = scanModules.length === 0
  const activeModuleData = isLegacy ? null : scanModules.find((m: any) => m.module === activeModule) ?? null
  const displayFindings: any[] = isLegacy ? (scan.findings || []) : (activeModuleData?.findings || [])
  const displayLegislation: any[] = isLegacy ? (scan.legislation || []) : (activeModuleData?.legislation || [])
  const displaySummary: string = isLegacy ? (scan.summary || '') : (activeModuleData?.summary || '')
  const displayStatus: string = isLegacy ? scan.status : (activeModuleData?.status || 'uncertain')

  const photoUrls: string[] = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
  const dateStr = new Date(scan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const issueFindings = displayFindings.filter((f: any) => f.type === 'critical' || f.type === 'warning')
  const issueCount = issueFindings.length
  const statusColor = displayStatus === 'pass' ? 'var(--clear-tx)' : displayStatus === 'fail' ? 'var(--issue-tx-theme)' : 'var(--amber)'
  const statusLabel = displayStatus === 'pass' ? 'Clear' : displayStatus === 'fail' ? `${issueCount} observation${issueCount !== 1 ? 's' : ''} found` : 'Pending review'
  const statusBarColor = displayStatus === 'pass' ? '#3E8E5A' : displayStatus === 'fail' ? '#D63A26' : 'var(--amber)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ height: 7, background: 'var(--hazard-bg)', flexShrink: 0 }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px 12px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--amber)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <img src="/brand/mark-black-white.png" alt="" style={{ width: 26, height: 26 }}/>
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

        {/* Module tabs — only for multi-module scans */}
        {!isLegacy && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {scanModules.map((m: any) => {
              const isActive = m.module === activeModule
              const tabStatusColor = m.status === 'pass' ? '#3E8E5A' : m.status === 'fail' ? '#D63A26' : 'var(--amber)'
              const label = m.module === 'safety' ? 'Safety' : m.module === 'quality' ? 'Quality' : 'Environmental'
              return (
                <button key={m.module} onClick={() => { setActiveModule(m.module); setOpenLeg(null) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 6, border: `1.5px solid ${isActive ? 'var(--amber)' : 'var(--line)'}`, background: isActive ? 'var(--amber)' : 'var(--surf)', color: isActive ? '#1B1A12' : 'var(--text)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: isActive ? '#1B1A12' : tabStatusColor, flexShrink: 0 }}/>
                  {label}
                </button>
              )
            })}
          </div>
        )}

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: statusBarColor }}/>
            <span style={{ fontWeight: 600, fontSize: 13, color: statusColor }}>{statusLabel}</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--mut)', opacity: 0.7 }}>
            AI ANALYSIS
          </span>
        </div>

        {/* Summary + legislation */}
        {displaySummary && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px 11px' }}>
              <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }}/>
              <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)' }}>Summary</span>
            </div>
            <div style={{ background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, padding: '14px 15px', fontSize: 13, fontWeight: 500, lineHeight: 1.55, color: 'var(--text)', marginBottom: 4 }}>
              {displaySummary}
            </div>
            <LegislationList legislation={displayLegislation} openLeg={openLeg} setOpenLeg={setOpenLeg} />
          </>
        )}

        {/* Issues */}
        {issueFindings.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '18px 2px 11px' }}>
              <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }}/>
              <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)' }}>Observations</span>
            </div>
            {issueFindings.map((f: any, i: number) => (
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
          Open in SiteSpotter
        </Link>
        <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--mut)', textAlign: 'center', marginTop: 12 }}>
          sitespotter.com.au/shared/{token}
        </div>

      </main>
    </div>
  )
}
