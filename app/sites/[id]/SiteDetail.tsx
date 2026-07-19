'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../../lib/supabase'
import { useUser } from '../../../lib/UserContext'
import AppHeader from '../../../components/AppHeader'
import { Camera, MapPin, Archive, Trash2, ChevronRight, ChevronDown, Shield, Ruler, Leaf, TriangleAlert, Check, FileDown, CircleHelp } from 'lucide-react'

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

function statusPill(status: string, issueCount?: number) {
  if (status === 'pass') return { label: 'Compliant', bg: 'var(--pass-tint)', color: 'var(--pass-deep)' }
  if (status === 'fail') return { label: issueCount ? `${issueCount} observation${issueCount !== 1 ? 's' : ''}` : 'Observations', bg: 'var(--fail-tint)', color: 'var(--issue)' }
  if (status === 'action') return { label: 'Confirm on site', bg: 'var(--warn-tint)', color: 'var(--warning)' }
  return { label: 'Confirm on site', bg: 'var(--warn-tint)', color: 'var(--warning)' }
}

export default function SiteDetail({ id }: { id: string }) {
  const [site, setSite] = useState<Site | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteWithScans, setDeleteWithScans] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const router = useRouter()
  const { user, loading: userLoading } = useUser()

  useEffect(() => {
    if (userLoading) return
    if (!user) { router.push('/login'); return }
    const init = async () => {
      const [siteRes, scansRes] = await Promise.all([
        supabase.from('sites').select('id, name, location, archived').eq('id', id).single(),
        supabase.from('scans')
          .select('id, work_type, status, created_at, photo_urls, photo_url, scan_modules(module, status, findings, findings_state)')
          .eq('site_id', id)
          .order('created_at', { ascending: false }),
      ])
      if (siteRes.error) { setError(siteRes.error.message); setLoading(false); return }
      const siteScans = (scansRes.data || []) as any[]
      setSite(siteRes.data as unknown as Site)
      setScans(siteScans as Scan[])
      setModules(siteScans.flatMap((s: any) => s.scan_modules || []))
      setLoading(false)
    }
    init()
  }, [id, user, userLoading, router])

  const toggleArchive = async () => {
    if (!site) return
    const val = !site.archived
    await supabase.from('sites').update({ archived: val }).eq('id', id)
    setSite(prev => prev ? { ...prev, archived: val } : prev)
  }

  const handleDelete = async () => {
    setDeleting(true)
    if (deleteWithScans) {
      const { data: allScans } = await supabase.from('scans').select('id, photo_urls, photo_url').eq('site_id', id)
      const allPaths: string[] = []
      for (const s of allScans || []) {
        const urls = (s as any).photo_urls || ((s as any).photo_url ? [(s as any).photo_url] : [])
        for (const url of urls) { const p = url.split('/scan-photos/')[1]; if (p) allPaths.push(p) }
      }
      if (allPaths.length) await supabase.storage.from('scan-photos').remove(allPaths)
      await supabase.from('scans').delete().eq('site_id', id)
    } else {
      await supabase.from('scans').update({ site_id: null }).eq('site_id', id)
    }
    await supabase.from('sites').delete().eq('id', id)
    router.push('/sites')
  }

  if (loading) return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader variant="detail" onBack={() => router.back()} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 18px' }}>
        {/* Site header skeleton */}
        <div style={{ height: 24, width: '50%', borderRadius: 8, background: 'var(--surf-inset)', animation: 'pulse 1.4s ease-in-out infinite', marginBottom: 12 }} />
        <div style={{ height: 80, borderRadius: 'var(--r-card)', background: 'var(--surf-inset)', animation: 'pulse 1.4s ease-in-out infinite 0.05s', marginBottom: 16 }} />
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: 70, borderRadius: 'var(--r-card)', background: 'var(--surf-inset)', marginBottom: 8, animation: `pulse 1.4s ease-in-out ${i * 0.08}s infinite` }} />
        ))}
      </div>
    </div>
  )

  if (error || !site) return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <AppHeader variant="detail" onBack={() => router.back()} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ background: 'var(--fail-tint)', border: '1.5px solid var(--issue)', borderRadius: 'var(--r-card)', padding: '16px 18px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--issue)' }}>Could not load site</div>
          {error && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{error}</div>}
        </div>
      </div>
    </div>
  )

  const totalScans = scans.length
  const pending = scans.filter(scan => {
    const scanMods: any[] = (scan as any).scan_modules || []
    return scanMods.some((mod: any) => {
      const state: Record<string, string> = mod.findings_state || {}
      return (mod.findings || []).some((f: any) =>
        (f.type === 'critical' || f.type === 'warning' || f.type === 'action') &&
        state[f.id] !== 'done' && state[f.id] !== 'dismissed'
      )
    })
  }).length
  const outstandingCount = modules.reduce((acc, m) => {
    const findings = m.findings || []
    const state = m.findings_state || {}
    return acc + findings.filter((f: any) => (f.type === 'critical' || f.type === 'warning' || f.type === 'action') && !f.tentative && state[f.id] !== 'done' && state[f.id] !== 'dismissed').length
  }, 0)

  const moduleBreakdown = ['safety', 'quality', 'environmental'].map(mod => {
    const modMods = modules.filter(m => m.module === mod)
    const pass = modMods.filter(m => m.status === 'pass').length
    const fail = modMods.filter(m => m.status === 'fail').length
    const modRate = modMods.length > 0 ? Math.round((pass / modMods.length) * 100) : null
    const outstanding = modMods.reduce((acc, m) => {
      const findings = m.findings || []
      const state = m.findings_state || {}
      return acc + findings.filter((f: any) => (f.type === 'critical' || f.type === 'warning' || f.type === 'action') && !f.tentative && state[f.id] !== 'done' && state[f.id] !== 'dismissed').length
    }, 0)
    return { mod, modRate, outstanding, total: modMods.length }
  }).filter(m => m.total > 0)

  const MOD_ICON: Record<string, any> = { safety: Shield, quality: Ruler, environmental: Leaf }
  const MOD_LABEL: Record<string, string> = { safety: 'Safety', quality: 'Quality', environmental: 'Environmental' }

  return (
    <div className="page-slide-right-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader variant="detail" onBack={() => router.back()} rightContent={
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={toggleArchive} style={{
            width: 38, height: 38, borderRadius: 'var(--r-control-sm)',
            border: '1.5px solid var(--border-card)', background: 'var(--surf)',
            color: 'var(--text-secondary)', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            <Archive size={16} strokeWidth={1.75} />
          </button>
          <button onClick={() => {}} style={{
            width: 38, height: 38, borderRadius: 'var(--r-control-sm)',
            border: '1.5px solid var(--border-card)', background: 'var(--surf)',
            color: 'var(--text-secondary)', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            <FileDown size={16} strokeWidth={1.75} />
          </button>
          <button onClick={() => setShowDelete(true)} style={{
            width: 38, height: 38, borderRadius: 'var(--r-control-sm)',
            border: '1.5px solid var(--issue)', background: 'var(--fail-tint)',
            color: 'var(--issue)', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      } />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 18px 24px' }}>

        {/* Site name + location */}
        <div style={{ paddingTop: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: 0 }}>{site.name}</h1>
            {site.archived && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--r-pill)', background: 'var(--surf-inset)', color: 'var(--text-muted)', border: '1.5px solid var(--border-card)', flexShrink: 0 }}>
                Archived
              </span>
            )}
          </div>
          {site.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
              <MapPin size={13} strokeWidth={1.75} />
              {site.location}
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          <div style={{ padding: '12px', background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-tile)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: outstandingCount > 0 ? 'var(--issue)' : 'var(--text)' }}>{outstandingCount}</div>
            <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>Outstanding</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-tile)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: pending > 0 ? 'var(--amber)' : 'var(--text)' }}>{pending}</div>
            <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>Pending scans</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-tile)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' }}>{totalScans}</div>
            <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>Total scans</div>
          </div>
        </div>

        {/* Per-module breakdown accordion */}
        {moduleBreakdown.length > 0 && (
          <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', marginBottom: 14, overflow: 'hidden' }}>
            <button onClick={() => setBreakdownOpen(v => !v)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Module breakdown</span>
              <ChevronDown size={16} strokeWidth={2} color="var(--text-muted)" style={{ transform: breakdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {breakdownOpen && (
              <div style={{ borderTop: '1.5px solid var(--border-card)' }}>
                {moduleBreakdown.map(({ mod, modRate, outstanding: mOut }, i) => {
                  const Icon = MOD_ICON[mod] || Shield
                  return (
                    <div key={mod} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      borderTop: i > 0 ? '1.5px solid var(--border-subtle)' : 'none',
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}><Icon size={16} strokeWidth={1.75} /></span>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{MOD_LABEL[mod]}</span>
                      {mOut > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--issue)' }}>
                          <TriangleAlert size={12} strokeWidth={2} />
                          {mOut}
                        </span>
                      )}
                      {mOut === 0 && modRate !== null && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--pass-deep)' }}>
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          <button onClick={() => router.push(`/scan/new?site_id=${site.id}`)} style={{
            height: 50,
            background: 'var(--amber)', border: 'none', borderRadius: 'var(--r-control)',
            color: '#1B1A12', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            boxShadow: 'var(--shadow-btn)',
          }}>
            <Camera size={18} strokeWidth={2.2} />
            New scan
          </button>
          <button onClick={toggleArchive} style={{
            height: 50,
            background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-control)',
            color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <Archive size={18} strokeWidth={1.75} />
            {site.archived ? 'Unarchive' : 'Archive'}
          </button>
          <button onClick={() => {}} style={{
            height: 50,
            background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-control)',
            color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <FileDown size={18} strokeWidth={1.75} />
            Export
          </button>
        </div>

        {/* Scans list */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px 12px' }}>
          <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Scans ({totalScans})
          </span>
        </div>

        {scans.length === 0 ? (
          <div style={{
            padding: '36px 24px', textAlign: 'center',
            background: 'var(--surf)', border: '1.5px dashed var(--border-card)',
            borderRadius: 'var(--r-card)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No scans yet</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 16 }}>Add your first scan to start tracking compliance</div>
            <button onClick={() => router.push(`/scan/new?site_id=${site.id}`)} style={{
              height: 40, padding: '0 20px',
              background: 'var(--amber)', border: 'none', borderRadius: 'var(--r-control)',
              color: '#1B1A12', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              New scan
            </button>
          </div>
        ) : scans.map(scan => {
          const photoUrl = (scan as any).photo_urls?.[0] || (scan as any).photo_url
          const photoCount = (scan as any).photo_urls?.length || ((scan as any).photo_url ? 1 : 0)
          const worstSt = scanWorstStatus(scan)
          const iCount = scanIssueCount(scan)
          const pill = statusPill(worstSt, iCount || undefined)
          const d = new Date(scan.created_at)

          return (
            <div key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)} style={{
              display: 'flex', alignItems: 'stretch',
              background: 'var(--surf)', border: '1.5px solid var(--border-card)',
              borderRadius: 'var(--r-card)', overflow: 'hidden', cursor: 'pointer', marginBottom: 8,
            }}>
              <div style={{ width: 4, flexShrink: 0, background: scanLeftColor(scan.status) }} />
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
                <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.02em', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {scan.work_type || 'Unnamed scan'}
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 3 }}>
                  {d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} · {d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
              </div>
              <div style={{ alignSelf: 'center', paddingRight: 13, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 'var(--r-pill)', background: pill.bg, color: pill.color }}>{pill.label}</span>
                <ChevronRight size={14} strokeWidth={2} color="var(--text-muted)" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', padding: 24, maxWidth: 340, width: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Delete "{site.name}"?</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
              This will permanently delete the site. Scans can be kept or also deleted.
            </div>
            {scans.length > 0 && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
                <input type="checkbox" checked={deleteWithScans} onChange={e => setDeleteWithScans(e.target.checked)} style={{ marginTop: 2 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Also delete all {scans.length} scans and photos</span>
              </label>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowDelete(false); setDeleteWithScans(false) }} disabled={deleting} style={{ flex: 1, height: 46, background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-control)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, height: 46, background: 'var(--issue)', border: 'none', borderRadius: 'var(--r-control)', fontSize: 14, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: '#fff', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
