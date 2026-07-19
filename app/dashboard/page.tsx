'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Scan } from '../../lib/supabase'
import { useUser } from '../../lib/UserContext'
import { useCount } from '../../lib/CountContext'
import AppHeader from '../../components/AppHeader'
import { Camera, ChevronRight, TriangleAlert, CircleHelp, BookOpen } from 'lucide-react'
import SiteIcon from '../../components/SiteIcon'

type DashCache = { userId: string; scans: any[]; sites: { id: string; name: string }[] }
let _dashCache: DashCache | null = null

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  if (hrs < 48) return 'yesterday'
  return `${Math.floor(hrs / 24)} days ago`
}

function statusPill(status: string, issueCount?: number) {
  if (status === 'pass') return { label: 'Compliant', bg: 'var(--pass-tint)', color: 'var(--pass-deep)', border: 'var(--pass-border)' }
  if (status === 'fail') return { label: issueCount ? `${issueCount} observation${issueCount !== 1 ? 's' : ''}` : 'Observations', bg: 'var(--fail-tint)', color: 'var(--issue)', border: 'transparent' }
  if (status === 'action') return { label: 'Confirm on site', bg: 'var(--warn-tint)', color: 'var(--warning)', border: 'transparent' }
  return { label: 'Confirm on site', bg: 'var(--warn-tint)', color: 'var(--warning)', border: 'transparent' }
}

function scanLeftColor(status: string) {
  if (status === 'pass') return 'var(--pass)'
  if (status === 'fail') return 'var(--issue)'
  return 'var(--warning)'
}

function scanWorstStatus(scan: any): string {
  const mods: any[] = (scan as any).scan_modules || []
  if (mods.length === 0) return scan.status || 'uncertain'
  let hasAction = false
  for (const m of mods) {
    if (m.status === 'not_applicable' || m.status === 'error') continue
    const state: Record<string, string> = m.findings_state || {}
    for (const f of (m.findings || [])) {
      if (state[f.id] === 'done' || state[f.id] === 'dismissed') continue
      if (f.type === 'critical' || f.type === 'warning') return 'fail'
      if (f.type === 'action') hasAction = true
    }
  }
  return hasAction ? 'action' : 'pass'
}

function scanIssueCount(scan: any): number {
  const mods: any[] = (scan as any).scan_modules || []
  if (mods.length === 0) return (scan.findings || []).filter((f: any) => f.type === 'critical').length
  let count = 0
  for (const m of mods) {
    const state: Record<string, string> = m.findings_state || {}
    for (const f of (m.findings || [])) {
      if (state[f.id] !== 'done' && state[f.id] !== 'dismissed' && (f.type === 'critical' || f.type === 'warning')) count++
    }
  }
  return count
}

function ScanRow({ scan, siteName, onClick }: { scan: Scan; siteName?: string; onClick: () => void }) {
  const photoUrl = scan.photo_urls?.[0] || scan.photo_url
  const photoCount = scan.photo_urls?.length || (scan.photo_url ? 1 : 0)
  const worstSt = scanWorstStatus(scan)
  const issueCount = scanIssueCount(scan)
  const pill = statusPill(worstSt, issueCount || undefined)
  const d = new Date(scan.created_at)
  const dateStr = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  const timeStr = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'stretch',
      background: 'var(--surf)', border: '1.5px solid var(--border-card)',
      borderRadius: 'var(--r-card)', overflow: 'hidden', cursor: 'pointer', marginBottom: 8,
    }}>
      <div style={{ width: 4, flexShrink: 0, background: scanLeftColor(worstSt) }} />
      {photoUrl ? (
        <div style={{ position: 'relative', width: 52, alignSelf: 'stretch', flexShrink: 0 }}>
          <img src={photoUrl} alt="" style={{ width: 52, height: '100%', objectFit: 'cover', display: 'block' }} />
          {photoCount > 1 && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{photoCount}</span>
              <span style={{ fontSize: 8.5, fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em' }}>photos</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ width: 52, alignSelf: 'stretch', flexShrink: 0, background: 'var(--surf-inset)', display: 'grid', placeItems: 'center' }}>
          <Camera size={18} strokeWidth={1.5} color="var(--text-muted)" />
        </div>
      )}
      <div style={{ flex: 1, padding: '11px 13px', minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {scan.work_type || 'Unnamed scan'}
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 3 }}>
          {[siteName, dateStr, timeStr].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div style={{ alignSelf: 'center', paddingRight: 13, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.01em',
          padding: '3px 9px', borderRadius: 'var(--r-pill)',
          background: pill.bg, color: pill.color,
          border: `1px solid ${pill.border}`,
          whiteSpace: 'nowrap',
        }}>
          {pill.label}
        </span>
        <ChevronRight size={14} strokeWidth={2} color="var(--text-muted)" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [sites, setSites] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { outstandingCount, scansWithIssues } = useCount()

  const userName = user?.user_metadata?.full_name?.split(' ')[0] ?? null

  useEffect(() => {
    if (userLoading) return
    if (!user) { router.push('/login'); return }

    const dashCached = _dashCache
    if (dashCached && dashCached.userId === user.id) {
      setScans(dashCached.scans as unknown as Scan[])
      setSites(dashCached.sites)
      setLoading(false)
    } else {
      setLoading(true)
    }

    const init = async () => {
      const [scansRes, sitesRes] = await Promise.all([
        supabase.from('scans').select('id, status, work_type, created_at, site_id, photo_url, photo_urls, scan_modules(module, status, findings, findings_state)').order('created_at', { ascending: false }).limit(20),
        supabase.from('sites').select('id, name').order('name'),
      ])
      const scansData = (scansRes.data || []) as any[]
      const sitesData = (sitesRes.data || []) as { id: string; name: string }[]
      _dashCache = { userId: user.id, scans: scansData, sites: sitesData }
      setScans(scansData as unknown as Scan[])
      setSites(sitesData)
      setLoading(false)
    }
    init()
  }, [user, userLoading, router])

  if (loading) return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 18px' }}>
        {/* Greeting skeleton */}
        <div style={{ padding: '20px 0 20px' }}>
          <div style={{ width: 130, height: 11, borderRadius: 6, background: 'var(--surf-inset)', animation: 'pulse 1.4s ease-in-out infinite', marginBottom: 10 }} />
          <div style={{ width: '55%', height: 26, borderRadius: 8, background: 'var(--surf-inset)', animation: 'pulse 1.4s ease-in-out infinite 0.1s' }} />
        </div>
        <div className="dashboard-grid">
          <div>
            {/* Hero button skeleton */}
            <div style={{ height: 92, borderRadius: 'var(--r-card-hero)', background: 'var(--surf-inset)', animation: 'pulse 1.4s ease-in-out infinite', marginBottom: 20 }} />
            {/* Stat cards skeleton (mobile) */}
            <div className="mobile-stat-row">
              {[0, 1].map(i => (
                <div key={i} style={{ flex: 1, height: 82, borderRadius: 'var(--r-card)', background: 'var(--surf-inset)', animation: `pulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
              ))}
            </div>
            {/* Scan row skeletons */}
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ height: 70, borderRadius: 'var(--r-card)', background: 'var(--surf-inset)', marginBottom: 8, animation: `pulse 1.4s ease-in-out ${i * 0.07}s infinite` }} />
            ))}
          </div>
          <div>
            {/* Right column skeleton */}
            <div style={{ height: 14, width: 110, borderRadius: 6, background: 'var(--surf-inset)', animation: 'pulse 1.4s ease-in-out infinite', marginBottom: 10 }} />
            {[0, 1].map(i => (
              <div key={i} style={{ height: 90, borderRadius: 'var(--r-card)', background: 'var(--surf-inset)', marginBottom: 8, animation: `pulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const recent = scans.slice(0, 4)
  const isEmpty = scans.length === 0
  const lastScan = scans[0]

  // Subtitle parts
  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
  const subtitleParts = [
    sites.length > 0 ? `${sites.length} site${sites.length !== 1 ? 's' : ''}` : null,
    lastScan ? `last scan ${relativeTime(lastScan.created_at)}` : null,
  ].filter(Boolean)

  // Per-site outstanding counts
  const siteOutstanding = (siteId: string) => {
    let n = 0
    for (const s of scans) {
      if (s.site_id !== siteId) continue
      n += scanIssueCount(s)
    }
    return n
  }
  const siteWorst = (siteId: string): string => {
    for (const s of scans) {
      if (s.site_id !== siteId) continue
      if (scanWorstStatus(s) === 'fail') return 'fail'
    }
    for (const s of scans) {
      if (s.site_id !== siteId) continue
      if (scanWorstStatus(s) === 'action') return 'action'
    }
    return 'pass'
  }

  const dotColor = (status: string) => status === 'fail' ? 'var(--issue)' : status === 'action' ? 'var(--warning)' : 'var(--pass)'

  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 18px' }}>

        {/* Greeting — full width */}
        <div style={{ padding: '20px 0 20px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 3 }}>{today}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 4px' }}>
            {greeting()}{userName ? `, ${userName}` : ''}
          </h1>
          {subtitleParts.length > 0 && (
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)' }}>
              {subtitleParts.join('  ·  ')}
            </div>
          )}
        </div>

        {/* Two-column grid */}
        <div className="dashboard-grid">

          {/* ── LEFT COLUMN ─────────────────────────────── */}
          <div>
            {/* New scan hero */}
            <button onClick={() => router.push('/scan/new')} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 18,
              padding: '20px 22px',
              background: 'var(--amber)', borderRadius: 'var(--r-card-hero)',
              boxShadow: 'var(--shadow-hero)', border: 'none', cursor: 'pointer',
              textAlign: 'left', marginBottom: 20, fontFamily: 'inherit',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>
                <Camera size={26} strokeWidth={2.2} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.1 }}>New Scan</div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Upload site photos to check compliance</div>
              </div>
              <ChevronRight size={22} strokeWidth={2.5} color="rgba(255,255,255,0.6)" />
            </button>

            {/* Stat cards — mobile only (side by side) */}
            <div className="mobile-stat-row">
              <button onClick={() => router.push('/issues')} style={{
                flex: 1, padding: '13px 14px',
                background: 'var(--surf)', border: '1.5px solid var(--border-card)',
                borderRadius: 'var(--r-card)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--issue)', flexShrink: 0 }} />
                    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Outstanding</span>
                  </div>
                  <ChevronRight size={12} strokeWidth={2} color="var(--text-muted)" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>{outstandingCount ?? '—'}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 3 }}>
                  {outstandingCount === 0 ? 'All clear' : `Observation${outstandingCount !== 1 ? 's' : ''}`}
                </div>
              </button>
              <button onClick={() => router.push('/scans')} style={{
                flex: 1, padding: '13px 14px',
                background: 'var(--surf)', border: '1.5px solid var(--border-card)',
                borderRadius: 'var(--r-card)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', flexShrink: 0 }} />
                    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Unresolved</span>
                  </div>
                  <ChevronRight size={12} strokeWidth={2} color="var(--text-muted)" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>{scansWithIssues ?? '—'}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 3 }}>
                  {scansWithIssues === 0 ? 'All resolved' : `Pending scan${scansWithIssues !== 1 ? 's' : ''}`}
                </div>
              </button>
            </div>

            {/* Empty state */}
            {isEmpty ? (
              <div style={{
                padding: '48px 24px', textAlign: 'center',
                background: 'var(--surf)', border: '1.5px solid var(--border-card)',
                borderRadius: 'var(--r-card)',
              }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: 'var(--brand-tint)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
                  <Camera size={28} strokeWidth={1.75} color="var(--amber)" />
                </div>
                <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', marginBottom: 8 }}>Start your first scan</div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto 24px' }}>
                  Upload a photo of your construction site to instantly identify compliance issues.
                </div>
              </div>
            ) : (
              <>
                {/* Recent activity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 2px 12px' }}>
                  <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Recent activity</span>
                  <button onClick={() => router.push('/scans')} style={{
                    marginLeft: 'auto', fontWeight: 600, fontSize: 12,
                    color: 'var(--amber)', background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>View all</button>
                </div>
                {recent.map(scan => (
                  <ScanRow key={scan.id} scan={scan}
                    siteName={sites.find(s => s.id === scan.site_id)?.name}
                    onClick={() => router.push(`/scan/${scan.id}`)}
                  />
                ))}

                {/* Sites */}
                {sites.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 2px 12px' }}>
                      <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sites</span>
                      <button onClick={() => router.push('/sites')} style={{
                        marginLeft: 'auto', fontWeight: 600, fontSize: 12,
                        color: 'var(--amber)', background: 'none', border: 'none',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>View all</button>
                    </div>
                    {sites.map(site => {
                      const outstanding = siteOutstanding(site.id)
                      const worst = siteWorst(site.id)
                      return (
                        <button key={site.id} onClick={() => router.push(`/sites/${site.id}`)} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', marginBottom: 8,
                          background: 'var(--surf)', border: '1.5px solid var(--border-card)',
                          borderRadius: 'var(--r-card)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: 'var(--surf-inset)', border: '1.5px solid var(--border-card)',
                            display: 'grid', placeItems: 'center',
                          }}>
                            <SiteIcon size={16} strokeWidth={1.75} color="var(--text-muted)" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {site.name}
                            </div>
                            {outstanding > 0 && (
                              <div style={{ fontSize: 11.5, fontWeight: 500, color: dotColor(worst), marginTop: 2 }}>
                                {outstanding} outstanding observation{outstanding !== 1 ? 's' : ''}
                              </div>
                            )}
                            {outstanding === 0 && (
                              <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--pass-deep)', marginTop: 2 }}>
                                All clear
                              </div>
                            )}
                          </div>
                          <ChevronRight size={15} strokeWidth={2} color="var(--text-muted)" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────── */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div className="desktop-needs-attention" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              Needs attention
            </div>

            {/* Outstanding */}
            <button className="desktop-stat-card" onClick={() => router.push('/issues')} style={{
              width: '100%', padding: '16px', marginBottom: 8,
              background: 'var(--surf)', border: '1.5px solid var(--border-card)',
              borderRadius: 'var(--r-card)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--issue)', flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Outstanding</span>
                </div>
                <ChevronRight size={13} strokeWidth={2} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>{outstandingCount ?? '—'}</div>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 4 }}>
                {outstandingCount === null ? 'Loading…' : outstandingCount === 0 ? 'No outstanding observations' : `Observation${outstandingCount !== 1 ? 's' : ''}`}
              </div>
            </button>

            {/* Unresolved */}
            <button className="desktop-stat-card" onClick={() => router.push('/scans')} style={{
              width: '100%', padding: '16px', marginBottom: 16,
              background: 'var(--surf)', border: '1.5px solid var(--border-card)',
              borderRadius: 'var(--r-card)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--warning)', flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Unresolved</span>
                </div>
                <ChevronRight size={13} strokeWidth={2} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>{scansWithIssues ?? '—'}</div>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 4 }}>
                {scansWithIssues === null ? 'Loading…' : scansWithIssues === 0 ? 'All scans resolved' : `Pending scan${scansWithIssues !== 1 ? 's' : ''}`}
              </div>
            </button>

            {/* SiteSpotter Guide */}
            <button onClick={() => router.push('/guide')} style={{
              width: '100%', padding: '13px 14px',
              background: 'var(--surf)', border: '1.5px solid var(--border-card)',
              borderRadius: 'var(--r-card)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'var(--brand-tint)', display: 'grid', placeItems: 'center',
              }}>
                <BookOpen size={17} strokeWidth={1.75} color="var(--amber)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>SiteSpotter Guide</div>
                <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 1 }}>How scanning & modules work</div>
              </div>
              <ChevronRight size={14} strokeWidth={2} color="var(--text-muted)" />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
