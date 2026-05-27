'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'

const NAVY = '#16181C'
const AMBER = '#F39410'
const OFFWHITE = '#EFEAE0'

const BG = 'var(--ss-bg)'
const SURFACE = 'var(--ss-surface)'
const SURFACE2 = 'var(--ss-surface-2)'
const TEXT = 'var(--ss-text)'
const TEXT_MUTE = 'var(--ss-text-mute)'
const BORDER = 'var(--ss-border)'
const BORDER_STRONG = 'var(--ss-border-strong)'

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [scanMeta, setScanMeta] = useState<{ id: string; site_id: string | null; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [sitesRes, scansRes] = await Promise.all([
        supabase.from('sites').select('*').order('name', { ascending: true }),
        supabase.from('scans').select('id, site_id, created_at').order('created_at', { ascending: false }),
      ])
      setSites(sitesRes.data || [])
      setScanMeta(scansRes.data || [])
      setLoading(false)
    }
    init()
  }, [router])

  const createSite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('sites').insert({
      user_id: user?.id,
      name: newName.trim(),
      location: newLocation.trim() || null,
      archived: false,
    }).select().single()
    if (data) setSites(prev => [data, ...prev].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName('')
    setNewLocation('')
    setShowNewForm(false)
    setSaving(false)
  }

  const toggleArchive = async (site: Site) => {
    const newVal = !site.archived
    await supabase.from('sites').update({ archived: newVal }).eq('id', site.id)
    setSites(prev => prev.map(s => s.id === site.id ? { ...s, archived: newVal } : s))
  }

  const scansBySite: Record<string, { id: string; created_at: string }[]> = {}
  for (const s of scanMeta) {
    const key = s.site_id || 'none'
    if (!scansBySite[key]) scansBySite[key] = []
    scansBySite[key].push({ id: s.id, created_at: s.created_at })
  }

  const activeSites = sites.filter(s => !s.archived)
  const archivedSites = sites.filter(s => s.archived)
  const displaySites = showArchived ? sites : activeSites

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ color: '#aaa', fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="page-slide-right-in" style={{ minHeight: '100vh', background: BG, fontFamily: "Inter, system-ui, sans-serif", willChange: 'transform, opacity' }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <AppHeader />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 16px 0', fontFamily: 'inherit' }}>
          ‹ Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>Sites</div>
          <button onClick={() => setShowNewForm(true)}
            style={{ fontSize: 13, padding: '7px 14px', background: NAVY, border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            + New site
          </button>
        </div>

        {/* New site form */}
        {showNewForm && (
          <form onSubmit={createSite} style={{ background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER_STRONG}`, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12 }}>New site</div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTE, display: 'block', marginBottom: 4 }}>Site name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} required
                placeholder="e.g. Ipswich Motorway Upgrade"
                style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: `0.5px solid ${BORDER_STRONG}`, background: SURFACE2, fontSize: 13, fontFamily: 'inherit', color: TEXT }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTE, display: 'block', marginBottom: 4 }}>
                Location <span style={{ fontWeight: 400, color: '#999' }}>(optional)</span>
              </label>
              <input value={newLocation} onChange={e => setNewLocation(e.target.value)}
                placeholder="e.g. Brisbane, QLD"
                style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: `0.5px solid ${BORDER_STRONG}`, background: SURFACE2, fontSize: 13, fontFamily: 'inherit', color: TEXT }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving}
                style={{ flex: 1, padding: '9px 0', background: saving ? '#888' : NAVY, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Create site'}
              </button>
              <button type="button" onClick={() => { setShowNewForm(false); setNewName(''); setNewLocation('') }}
                style={{ padding: '9px 16px', background: 'transparent', border: '0.5px solid #D3D1C7', borderRadius: 8, fontSize: 13, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Site list */}
        {displaySites.length === 0 && !showNewForm ? (
          <div style={{ background: SURFACE, borderRadius: 14, border: `0.5px solid ${BORDER}`, padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>🏗️</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 4 }}>No sites yet</div>
            <div style={{ fontSize: 13, color: '#999' }}>Create a site to organise your scans by location or client.</div>
          </div>
        ) : (
          displaySites.map(site => {
            const siteScans = scansBySite[site.id] || []
            const lastScan = siteScans[0]
            return (
              <div key={site.id} style={{ background: SURFACE, borderRadius: 12, border: `0.5px solid ${BORDER}`, marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => router.push(`/sites/${site.id}`)}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {site.name}
                      {site.archived && (
                        <span style={{ fontSize: 10, padding: '1px 6px', background: '#F1EFE8', color: '#888', borderRadius: 4, fontWeight: 500 }}>Archived</span>
                      )}
                    </div>
                    {site.location && <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>{site.location}</div>}
                    <div style={{ fontSize: 11, color: '#bbb' }}>
                      {siteScans.length} scan{siteScans.length !== 1 ? 's' : ''}
                      {lastScan ? ` · Last: ${new Date(lastScan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => router.push(`/sites/${site.id}`)}
                      style={{ fontSize: 12, padding: '5px 10px', background: 'transparent', border: '0.5px solid #D3D1C7', borderRadius: 7, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
                      View
                    </button>
                    <button onClick={() => toggleArchive(site)}
                      style={{ fontSize: 12, padding: '5px 10px', background: site.archived ? 'rgba(61,211,122,0.12)' : 'transparent', border: '0.5px solid #D3D1C7', borderRadius: 7, color: site.archived ? '#1a7a45' : '#888', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {site.archived ? 'Unarchive' : 'Archive'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}

        <button onClick={() => setShowArchived(v => !v)}
          style={{ marginTop: 8, fontSize: 12, color: '#888', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
          {showArchived ? 'Hide archived sites' : `Show archived (${archivedSites.length})`}
        </button>

      </main>
    </div>
  )
}
