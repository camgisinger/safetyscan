'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../lib/supabase'
import { useUser } from '../../lib/UserContext'
import AppHeader from '../../components/AppHeader'
import { MapPin, ChevronRight, FolderPlus, X, Archive } from 'lucide-react'


export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [scans, setScans] = useState<Scan[]>([])
  const [siteOutstanding, setSiteOutstanding] = useState<Record<string, number>>({})
  const [sitePending, setSitePending] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showNewSheet, setShowNewSheet] = useState(false)
  useEffect(() => {
    document.body.classList.toggle('sheet-open', showNewSheet)
    return () => document.body.classList.remove('sheet-open')
  }, [showNewSheet])
  const [newName, setNewName] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [creating, setCreating] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const { user, loading: userLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (userLoading) return
    if (!user) { router.push('/login'); return }
    setLoading(true)
    const init = async () => {
      const [sitesRes, scansRes, modulesRes] = await Promise.all([
        supabase.from('sites').select('id, name, location, archived').order('name'),
        supabase.from('scans').select('id, site_id'),
        supabase.from('scan_modules').select('scan_id, findings, findings_state, scans!inner(site_id)'),
      ])
      const scansData = (scansRes.data || []) as any[]
      setSites((sitesRes.data || []) as unknown as Site[])
      setScans(scansData as unknown as Scan[])
      const scanSiteMap = Object.fromEntries(scansData.map((s: any) => [s.id, s.site_id]))
      const outstanding: Record<string, number> = {}
      const pendingScans: Record<string, Set<string>> = {}
      for (const mod of (modulesRes.data || [])) {
        const scanId: string = (mod as any).scan_id
        if (!scanId) continue
        const siteId: string = (mod as any).scans?.site_id || scanSiteMap[scanId]
        if (!siteId) continue
        const state: Record<string, string> = (mod as any).findings_state || {}
        let modHasPending = false
        for (const f of ((mod as any).findings || [])) {
          if ((f.type === 'critical' || f.type === 'warning' || f.type === 'action') &&
              state[f.id] !== 'done' && state[f.id] !== 'dismissed') {
            outstanding[siteId] = (outstanding[siteId] || 0) + 1
            modHasPending = true
          }
        }
        if (modHasPending && scanId) {
          if (!pendingScans[siteId]) pendingScans[siteId] = new Set()
          pendingScans[siteId].add(scanId)
        }
      }
      setSiteOutstanding(outstanding)
      setSitePending(Object.fromEntries(Object.entries(pendingScans).map(([k, v]) => [k, v.size])))
      setLoading(false)
    }
    init()
  }, [user, userLoading, router])

  const handleCreate = async () => {
    if (!newName.trim() || !user) return
    setCreating(true)
    const { data: site, error } = await supabase.from('sites').insert({
      name: newName.trim(),
      location: newLocation.trim() || null,
      created_by: user.id,
      archived: false,
    }).select().single()
    if (!error && site) {
      setSites(prev => [...prev, site].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setCreating(false)
    setNewName(''); setNewLocation(''); setShowNewSheet(false)
  }

  const visibleSites = sites.filter(s => showArchived ? s.archived : !s.archived)
  const archivedCount = sites.filter(s => s.archived).length

  if (loading) return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader title="Sites" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 18px 0' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: 128, borderRadius: 'var(--r-card)', background: 'var(--surf-inset)', marginBottom: 10, animation: `pulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader title="Sites" rightContent={
        sites.length > 0 ? (
          <button onClick={() => setShowNewSheet(true)} style={{
            height: 34, padding: '0 14px', borderRadius: 'var(--r-control-sm)',
            background: 'var(--amber)', border: 'none',
            color: '#1B1A12', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: 'var(--shadow-btn)',
          }}>
            <FolderPlus size={14} strokeWidth={2.2} />
            New site
          </button>
        ) : undefined
      } />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 18px 0' }}>

        {/* Archive toggle */}
        {archivedCount > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button onClick={() => setShowArchived(false)} style={{
              height: 32, padding: '0 14px', borderRadius: 'var(--r-pill)',
              background: !showArchived ? 'var(--amber)' : 'var(--surf)',
              border: `1.5px solid ${!showArchived ? 'transparent' : 'var(--border-card)'}`,
              color: !showArchived ? '#1B1A12' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: !showArchived ? 700 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Active</button>
            <button onClick={() => setShowArchived(true)} style={{
              height: 32, padding: '0 14px', borderRadius: 'var(--r-pill)',
              display: 'flex', alignItems: 'center', gap: 6,
              background: showArchived ? 'var(--surf-toggle)' : 'var(--surf)',
              border: '1.5px solid var(--border-card)',
              color: 'var(--text-muted)',
              fontSize: 13, fontWeight: showArchived ? 600 : 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Archive size={12} strokeWidth={1.75} />
              Archived ({archivedCount})
            </button>
          </div>
        )}

        {visibleSites.length === 0 ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            background: 'var(--surf)', border: '1.5px solid var(--border-card)',
            borderRadius: 'var(--r-card)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: 'var(--brand-tint)',
              display: 'grid', placeItems: 'center', margin: '0 auto 16px',
            }}>
              <MapPin size={26} strokeWidth={1.75} color="var(--amber)" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 8 }}>
              {showArchived ? 'No archived sites' : 'No sites yet'}
            </div>
            {!showArchived && (
              <>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto 24px' }}>
                  Create a site to group scans and track compliance over time.
                </div>
                <button onClick={() => setShowNewSheet(true)} style={{
                  height: 46, padding: '0 24px',
                  background: 'var(--amber)', border: 'none',
                  borderRadius: 'var(--r-control)', fontFamily: 'inherit',
                  fontSize: 14, fontWeight: 700, color: '#1B1A12',
                  cursor: 'pointer', boxShadow: 'var(--shadow-btn)',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                  <FolderPlus size={16} strokeWidth={2.2} />
                  New site
                </button>
              </>
            )}
          </div>
        ) : visibleSites.map(site => {
          const siteScans = scans.filter(s => s.site_id === site.id)
          const outstanding = siteOutstanding[site.id] || 0
          const pending = sitePending[site.id] || 0


          return (
            <div key={site.id} onClick={() => router.push(`/sites/${site.id}`)} style={{
              display: 'flex', alignItems: 'stretch',
              background: 'var(--surf)', border: '1.5px solid var(--border-card)',
              borderRadius: 'var(--r-card)', overflow: 'hidden',
              cursor: 'pointer', marginBottom: 10,
            }}>
              <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.2 }}>
                    {site.name}
                  </div>
                  {site.archived && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 'var(--r-pill)', background: 'var(--surf-inset)', color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
                      Archived
                    </span>
                  )}
                </div>
                {site.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 12 }}>
                    <MapPin size={11} strokeWidth={1.75} />
                    {site.location}
                  </div>
                )}
                {/* Stat tiles */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    flex: 1, padding: '9px 12px',
                    background: 'var(--surf-inset)', borderRadius: 'var(--r-tile)',
                    border: '1.5px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: outstanding > 0 ? 'var(--issue)' : 'var(--text)', letterSpacing: '-0.03em' }}>{outstanding}</div>
                    <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 1 }}>Outstanding</div>
                  </div>
                  <div style={{
                    flex: 1, padding: '9px 12px',
                    background: 'var(--surf-inset)', borderRadius: 'var(--r-tile)',
                    border: '1.5px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: pending > 0 ? 'var(--amber)' : 'var(--text)', letterSpacing: '-0.03em' }}>{pending}</div>
                    <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 1 }}>Pending scans</div>
                  </div>
                  <div style={{
                    flex: 1, padding: '9px 12px',
                    background: 'var(--surf-inset)', borderRadius: 'var(--r-tile)',
                    border: '1.5px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>{siteScans.length}</div>
                    <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 1 }}>Total scans</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', placeItems: 'center', paddingRight: 14, flexShrink: 0 }}>
                <ChevronRight size={18} strokeWidth={1.75} color="var(--text-muted)" />
              </div>
            </div>
          )
        })}
      </div>

      {/* New site bottom sheet */}
      {showNewSheet && (
        <>
          <div onClick={() => setShowNewSheet(false)} style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', zIndex: 100 }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 110,
            background: 'var(--surf-sheet)', borderRadius: 'var(--r-sheet) var(--r-sheet) 0 0',
            boxShadow: 'var(--shadow-sheet)',
            padding: '0 20px',
            paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))',
            animation: 'slideUpIn 0.28s cubic-bezier(0.2,0.7,0.3,1) forwards',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 16px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>New site</div>
              <button onClick={() => setShowNewSheet(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Site name</label>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Ipswich Motorway Upgrade"
                  style={{
                    width: '100%', height: 46, padding: '0 14px',
                    border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-input)',
                    background: 'var(--surf-inset)', color: 'var(--text)',
                    fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Location <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <input value={newLocation} onChange={e => setNewLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Ipswich, QLD"
                  style={{
                    width: '100%', height: 46, padding: '0 14px',
                    border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-input)',
                    background: 'var(--surf-inset)', color: 'var(--text)',
                    fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }} />
              </div>
              <button onClick={handleCreate} disabled={!newName.trim() || creating} style={{
                width: '100%', height: 50, marginTop: 4,
                background: 'var(--amber)', border: 'none',
                borderRadius: 'var(--r-control)', fontFamily: 'inherit',
                fontSize: 15, fontWeight: 700, color: '#1B1A12',
                cursor: !newName.trim() || creating ? 'not-allowed' : 'pointer',
                opacity: !newName.trim() || creating ? 0.5 : 1,
                boxShadow: 'var(--shadow-btn)',
              }}>
                {creating ? 'Creating…' : 'Create site'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
