'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Scan } from '../../lib/supabase'
import { useUser } from '../../lib/UserContext'
import AppHeader from '../../components/AppHeader'
import { Camera, Archive, Check, Trash2, ChevronRight, X } from 'lucide-react'
import SiteIcon from '../../components/SiteIcon'

type StatusFilter = 'all' | 'issues' | 'compliant' | 'pending'

type ScansCache = { userId: string; scans: any[]; sites: { id: string; name: string }[] }
let _scansCache: ScansCache | null = null

function scanLeftColor(status: string) {
  if (status === 'pass') return 'var(--pass)'
  if (status === 'fail') return 'var(--issue)'
  if (status === 'action') return 'var(--warning)'
  return 'var(--warning)'
}

function statusPill(status: string, issueCount?: number) {
  if (status === 'pass') return { label: 'Compliant', bg: 'var(--pass-tint)', color: 'var(--pass-deep)' }
  if (status === 'fail') return { label: issueCount ? `${issueCount} observation${issueCount !== 1 ? 's' : ''}` : 'Observations', bg: 'var(--fail-tint)', color: 'var(--issue)' }
  if (status === 'action') return { label: 'Confirm on site', bg: 'var(--warn-tint)', color: 'var(--warning)' }
  return { label: 'Confirm on site', bg: 'var(--warn-tint)', color: 'var(--warning)' }
}

function scanWorstStatus(scan: any): string {
  const mods: any[] = scan.scan_modules || []
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
  const mods: any[] = scan.scan_modules || []
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

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [sites, setSites] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [showAssignSheet, setShowAssignSheet] = useState(false)
  const router = useRouter()
  const { user, loading: userLoading } = useUser()

  useEffect(() => {
    document.body.classList.toggle('select-mode', selectMode)
    return () => document.body.classList.remove('select-mode')
  }, [selectMode])

  useEffect(() => {
    if (userLoading) return
    if (!user) { router.push('/login'); return }

    const scansCached = _scansCache
    if (scansCached && scansCached.userId === user.id) {
      setScans(scansCached.scans as unknown as Scan[])
      setSites(scansCached.sites)
      setLoading(false)
    } else {
      setLoading(true)
    }

    const init = async () => {
      const [scansRes, sitesRes] = await Promise.all([
        supabase.from('scans').select('id, status, work_type, created_at, site_id, photo_url, photo_urls, scan_modules(module, status, findings, findings_state)').order('created_at', { ascending: false }).limit(100),
        supabase.from('sites').select('id, name'),
      ])
      const scansData = (scansRes.data || []) as any[]
      const sitesData = (sitesRes.data || []) as { id: string; name: string }[]
      _scansCache = { userId: user.id, scans: scansData, sites: sitesData }
      setScans(scansData as unknown as Scan[])
      setSites(sitesData)
      setLoading(false)
    }
    init()
  }, [user, userLoading, router])

  const counts = useMemo(() => ({
    issues: scans.filter(s => s.status === 'fail' && !(s as any).archived).length,
    compliant: scans.filter(s => s.status === 'pass' && !(s as any).archived).length,
    pending: scans.filter(s => s.status === 'uncertain' && !(s as any).archived).length,
    archived: scans.filter(s => (s as any).archived).length,
  }), [scans])

  const filtered = useMemo(() => {
    let result = scans.filter(s => {
      if (showArchived) return !!(s as any).archived
      if ((s as any).archived) return false
      if (status === 'issues') return s.status === 'fail'
      if (status === 'compliant') return s.status === 'pass'
      if (status === 'pending') return s.status === 'uncertain'
      return true
    })
    return result
  }, [scans, status, showArchived])

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const handleBulkDelete = async () => {
    setDeleting(true)
    const allPaths: string[] = []
    for (const id of Array.from(selected)) {
      const scan = scans.find(s => s.id === id)
      if (scan) {
        const urls = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
        for (const url of urls) {
          const path = url.split('/scan-photos/')[1]
          if (path) allPaths.push(path)
        }
      }
    }
    if (allPaths.length) await supabase.storage.from('scan-photos').remove(allPaths)
    await supabase.from('scans').delete().in('id', Array.from(selected))
    setScans(prev => {
      const next = prev.filter(s => !selected.has(s.id))
      if (_scansCache) _scansCache = { ..._scansCache, scans: next }
      return next
    })
    setSelected(new Set()); setSelectMode(false); setShowDeleteConfirm(false); setDeleting(false)
  }

  const handleBulkArchive = async () => {
    setArchiving(true)
    await supabase.from('scans').update({ archived: true }).in('id', Array.from(selected))
    setScans(prev => prev.map(s => selected.has(s.id) ? { ...s, archived: true } as Scan : s))
    setSelected(new Set()); setSelectMode(false); setArchiving(false)
  }

  const handleBulkAssign = async (siteId: string) => {
    await supabase.from('scans').update({ site_id: siteId }).in('id', Array.from(selected))
    setScans(prev => prev.map(s => selected.has(s.id) ? { ...s, site_id: siteId } as Scan : s))
    setSelected(new Set()); setSelectMode(false); setShowAssignSheet(false)
  }

  const CHIPS: { key: StatusFilter | 'archived'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: scans.filter(s => !(s as any).archived).length },
    { key: 'issues', label: 'Observations', count: counts.issues },
    { key: 'compliant', label: 'Compliant', count: counts.compliant },
    { key: 'pending', label: 'Pending', count: counts.pending },
  ]

  if (loading) return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader title="Scans" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 18px 0' }}>
        {/* Filter chip skeletons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[72, 100, 80, 70, 72].map((w, i) => (
            <div key={i} style={{ width: w, height: 32, borderRadius: 999, background: 'var(--surf-inset)', animation: `pulse 1.4s ease-in-out ${i * 0.06}s infinite`, flexShrink: 0 }} />
          ))}
        </div>
        {/* Scan row skeletons */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ height: 70, borderRadius: 'var(--r-card)', background: 'var(--surf-inset)', marginBottom: 8, animation: `pulse 1.4s ease-in-out ${i * 0.06}s infinite` }} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: selectMode && selected.size > 0 ? 200 : 96 }}>
      <AppHeader title="Scans" rightContent={
        <button onClick={() => { setSelectMode(v => !v); setSelected(new Set()) }} style={{
          height: 34, padding: '0 14px', borderRadius: 'var(--r-control-sm)',
          border: '1.5px solid var(--border-card)', background: 'var(--surf)',
          color: selectMode ? 'var(--amber)' : 'var(--text-secondary)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {selectMode ? 'Done' : 'Select'}
        </button>
      } />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 18px 0' }}>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {CHIPS.map(chip => {
            const active = !showArchived && status === chip.key
            return (
              <button key={chip.key} onClick={() => { setShowArchived(false); setStatus(chip.key as StatusFilter) }} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                height: 34, padding: '0 13px', flexShrink: 0,
                borderRadius: 'var(--r-pill)',
                background: active ? 'var(--amber)' : 'var(--surf)',
                border: `1.5px solid ${active ? 'transparent' : 'var(--border-card)'}`,
                color: active ? '#1B1A12' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
                {chip.label}
                {chip.count > 0 && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 700,
                    background: active ? 'rgba(0,0,0,0.15)' : 'var(--surf-inset)',
                    color: active ? '#1B1A12' : 'var(--text-muted)',
                    borderRadius: 'var(--r-pill)', padding: '1px 5px',
                  }}>{chip.count}</span>
                )}
              </button>
            )
          })}
          {counts.archived > 0 && (
            <button onClick={() => { setShowArchived(true); setStatus('all') }} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 34, padding: '0 13px', flexShrink: 0,
              borderRadius: 'var(--r-pill)',
              background: showArchived ? 'var(--surf-toggle)' : 'var(--surf)',
              border: `1.5px solid ${showArchived ? 'var(--border-card)' : 'var(--border-card)'}`,
              color: 'var(--text-muted)',
              fontSize: 13, fontWeight: showArchived ? 600 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Archive size={12} strokeWidth={1.75} />
              Archived
              <span style={{ fontSize: 10.5, fontWeight: 700, background: 'var(--surf-inset)', color: 'var(--text-muted)', borderRadius: 'var(--r-pill)', padding: '1px 5px' }}>{counts.archived}</span>
            </button>
          )}
        </div>

        {/* Count row */}
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', paddingBottom: 10, paddingLeft: 2 }}>
          {filtered.length} scan{filtered.length !== 1 ? 's' : ''}
          {showArchived ? ' · archived' : status !== 'all' ? ' · filtered' : ''}
        </div>

        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'var(--surf)', border: '1.5px solid var(--border-card)',
            borderRadius: 'var(--r-card)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: 'var(--brand-tint)',
              display: 'grid', placeItems: 'center', margin: '0 auto 14px',
            }}>
              <Camera size={24} strokeWidth={1.75} color="var(--amber)" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No scans found</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {status !== 'all' ? 'Try a different filter' : 'Tap the camera to create your first scan'}
            </div>
          </div>
        ) : filtered.map(scan => {
          const photoUrl = scan.photo_urls?.[0] || scan.photo_url
          const photoCount = scan.photo_urls?.length || (scan.photo_url ? 1 : 0)
          const siteName = sites.find(s => s.id === scan.site_id)?.name
          const worstSt = scanWorstStatus(scan)
          const issueCount = scanIssueCount(scan)
          const pill = statusPill(worstSt, issueCount || undefined)
          const d = new Date(scan.created_at)
          const dateStr = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
          const timeStr = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
          const isSelected = selected.has(scan.id)

          return (
            <div key={scan.id}
              onClick={() => selectMode ? toggleSelect(scan.id) : router.push(`/scan/${scan.id}`)}
              style={{
                display: 'flex', alignItems: 'stretch',
                background: isSelected ? 'var(--brand-tint)' : 'var(--surf)',
                border: `1.5px solid ${isSelected ? 'var(--amber)' : 'var(--border-card)'}`,
                borderRadius: 'var(--r-card)', overflow: 'hidden',
                cursor: 'pointer', marginBottom: 8,
                transition: 'border-color 0.15s, background 0.15s',
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
              <div style={{ alignSelf: 'center', paddingRight: 14, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                {selectMode ? (
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    border: `1.5px solid ${isSelected ? 'var(--amber)' : 'var(--border-card)'}`,
                    background: isSelected ? 'var(--amber)' : 'transparent',
                    display: 'grid', placeItems: 'center', transition: 'all 0.15s',
                  }}>
                    {isSelected && <Check size={13} strokeWidth={2.5} color="#1B1A12" />}
                  </div>
                ) : (
                  <>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 9px',
                      borderRadius: 'var(--r-pill)', whiteSpace: 'nowrap',
                      background: pill.bg, color: pill.color,
                    }}>
                      {pill.label}
                    </span>
                    <ChevronRight size={14} strokeWidth={2} color="var(--text-muted)" />
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 120,
          padding: '12px 18px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          background: 'var(--surf)',
          borderTop: '1.5px solid var(--border-card)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Secondary actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAssignSheet(true)} style={{
              flex: 1, height: 42,
              background: 'var(--surf-inset)', border: '1.5px solid var(--border-card)',
              borderRadius: 'var(--r-control)', color: 'var(--text)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <SiteIcon size={15} strokeWidth={2} />
              Add to site
            </button>
            <button onClick={handleBulkArchive} disabled={archiving} style={{
              flex: 1, height: 42,
              background: 'var(--surf-inset)', border: '1.5px solid var(--border-card)',
              borderRadius: 'var(--r-control)', color: 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, cursor: archiving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              opacity: archiving ? 0.5 : 1,
            }}>
              <Archive size={15} strokeWidth={2} />
              {archiving ? 'Archiving…' : 'Archive'}
            </button>
          </div>
          {/* Primary actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowDeleteConfirm(true)} style={{
              flex: 1, height: 46, background: 'var(--issue)', border: 'none',
              borderRadius: 'var(--r-control)', color: '#fff',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Trash2 size={16} strokeWidth={2} />
              Delete {selected.size} scan{selected.size !== 1 ? 's' : ''}
            </button>
            <button onClick={() => { setSelectMode(false); setSelected(new Set()) }} style={{
              height: 46, padding: '0 18px',
              background: 'var(--surf)', border: '1.5px solid var(--border-card)',
              borderRadius: 'var(--r-control)', color: 'var(--text-secondary)',
              fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assign to site sheet */}
      {showAssignSheet && (
        <>
          <div onClick={() => setShowAssignSheet(false)} style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', zIndex: 200 }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 210,
            background: 'var(--surf-sheet)', borderRadius: 'var(--r-sheet) var(--r-sheet) 0 0',
            boxShadow: 'var(--shadow-sheet)',
            padding: '0 20px',
            paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))',
            animation: 'slideUpIn 0.28s cubic-bezier(0.2,0.7,0.3,1) forwards',
            maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 14px', flexShrink: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Add {selected.size} scan{selected.size !== 1 ? 's' : ''} to site
              </div>
              <button onClick={() => setShowAssignSheet(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            {sites.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
                No sites yet. Create a site first.
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {sites.map(site => (
                  <button key={site.id} onClick={() => handleBulkAssign(site.id)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 0', background: 'none', border: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--brand-tint)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <SiteIcon size={16} strokeWidth={1.75} color="var(--amber)" />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{site.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', padding: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete {selected.size} scan{selected.size !== 1 ? 's' : ''}?</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>This cannot be undone. Photos will also be permanently deleted.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} style={{ flex: 1, height: 46, background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-control)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleBulkDelete} disabled={deleting} style={{ flex: 1, height: 46, background: 'var(--issue)', border: 'none', borderRadius: 'var(--r-control)', fontSize: 14, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: '#fff', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
