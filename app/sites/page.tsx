'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site } from '../../lib/supabase'
import { useOrg } from '../../lib/useOrg'
import AppHeader from '../../components/AppHeader'

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [scanMeta, setScanMeta] = useState<{ site_id: string | null; status: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const { orgId } = useOrg()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [sitesRes, scansRes] = await Promise.all([
        supabase.from('sites').select('*').order('name', { ascending: true }),
        supabase.from('scans').select('id, site_id, status, created_at').order('created_at', { ascending: false }),
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
    const { data } = await supabase.from('sites').insert({ created_by: user?.id, org_id: orgId, name: newName.trim(), location: newLocation.trim() || null, archived: false }).select().single()
    if (data) setSites(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName(''); setNewLocation(''); setShowNewForm(false); setSaving(false)
  }

  const toggleArchive = async (site: Site) => {
    const newVal = !site.archived
    await supabase.from('sites').update({ archived: newVal }).eq('id', site.id)
    setSites(prev => prev.map(s => s.id === site.id ? { ...s, archived: newVal } : s))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid var(--line)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  )

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const activeSites = sites.filter(s => !s.archived)
  const archivedSites = sites.filter(s => s.archived)
  const displaySites = showArchived ? sites : activeSites
  const monthScans = scanMeta.filter(s => new Date(s.created_at) >= monthStart)

  const inputStyle: React.CSSProperties = { display: 'block', width: '100%', height: 50, padding: '0 14px', borderRadius: 8, border: '1.5px solid var(--line)', background: 'var(--surf)', fontSize: 14, color: 'var(--text)', boxSizing: 'border-box' }

  return (
    <div className="page-slide-right-in" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 96 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AppHeader />
      <div style={{ padding: '0 18px' }}>
        {/* Subhead */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, paddingLeft: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--mut)' }}>{activeSites.length} active site{activeSites.length !== 1 ? 's' : ''} · {monthScans.length} scans this month</span>
          <button onClick={() => setShowNewForm(v => !v)} style={{ fontWeight: 500, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>+ New site</button>
        </div>

        {showNewForm && (
          <form onSubmit={createSite} style={{ background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 14 }}>New site</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>Site name</div>
              <input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="e.g. Newstead Plaza" style={inputStyle}/>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>Location <span style={{ opacity: 0.6 }}>(optional)</span></div>
              <input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="e.g. Brisbane, QLD" style={inputStyle}/>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving} style={{ flex: 1, height: 46, background: 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, color: '#1B1A12', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Create site'}
              </button>
              <button type="button" onClick={() => { setShowNewForm(false); setNewName(''); setNewLocation('') }}
                style={{ height: 46, padding: '0 18px', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13.5, color: 'var(--mut)', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {displaySites.length === 0 && !showNewForm ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--mut)', fontSize: 13, fontWeight: 500 }}>No sites yet</div>
        ) : displaySites.map(site => {
          const siteScans = scanMeta.filter(s => s.site_id === site.id)
          const monthSiteScans = siteScans.filter(s => new Date(s.created_at) >= monthStart)
          const compliant = siteScans.filter(s => s.status === 'pass').length
          const pending   = siteScans.filter(s => s.status === 'uncertain').length
          const issues    = siteScans.filter(s => s.status === 'fail').length
          const total     = siteScans.length
          const score     = total > 0 ? Math.round((compliant / total) * 100) : 100
          const scoreCls  = score >= 90 ? 'var(--text)' : score >= 70 ? 'var(--amber)' : '#D63A26'
          const gPct = total > 0 ? (compliant / total) * 100 : 100
          const aPct = total > 0 ? (pending   / total) * 100 : 0
          const rPct = total > 0 ? (issues    / total) * 100 : 0
          return (
            <div key={site.id} onClick={() => router.push(`/sites/${site.id}`)}
              style={{ padding: '14px 16px', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.02em', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {site.name}
                    {site.archived && <span style={{ fontSize: 9.5, padding: '2px 6px', border: '1.5px solid var(--line)', borderRadius: 4, color: 'var(--mut)', fontWeight: 600, letterSpacing: '0.06em' }}>ARCHIVED</span>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 3 }}>
                    {[site.location, `${monthSiteScans.length} scan${monthSiteScans.length !== 1 ? 's' : ''} this month`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: scoreCls }}>{score}%</div>
                  <div style={{ fontWeight: 600, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 2 }}>Compliance</div>
                </div>
              </div>
              <div style={{ marginTop: 12, height: 8, borderRadius: 999, overflow: 'hidden', display: 'flex', background: 'var(--bg)' }}>
                <div style={{ height: '100%', width: `${gPct}%`, background: '#3E8E5A' }}/>
                <div style={{ height: '100%', width: `${aPct}%`, background: 'var(--amber)' }}/>
                <div style={{ height: '100%', width: `${rPct}%`, background: '#D63A26' }}/>
              </div>
            </div>
          )
        })}

        {archivedSites.length > 0 && (
          <button onClick={() => setShowArchived(v => !v)}
            style={{ marginTop: 8, fontSize: 12, color: 'var(--mut)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}>
            {showArchived ? 'Hide archived' : `Show archived (${archivedSites.length})`}
          </button>
        )}
      </div>
    </div>
  )
}
