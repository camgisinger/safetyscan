'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site } from '../../lib/supabase'
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
    const { data } = await supabase.from('sites').insert({ user_id: user?.id, name: newName.trim(), location: newLocation.trim() || null, archived: false }).select().single()
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
      <div style={{ width: 32, height: 32, border: '2.5px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const activeSites = sites.filter(s => !s.archived)
  const archivedSites = sites.filter(s => s.archived)
  const displaySites = showArchived ? sites : activeSites

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthScans = scanMeta.filter(s => new Date(s.created_at) >= monthStart)

  return (
    <div className="page-slide-right-in" style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff-sans)', willChange: 'transform, opacity' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AppHeader />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 96px' }}>

        {/* Subhead */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, paddingLeft: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-mut)' }}>{activeSites.length} active site{activeSites.length !== 1 ? 's' : ''} · {monthScans.length} scan{monthScans.length !== 1 ? 's' : ''} this month</span>
          <button onClick={() => setShowNewForm(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber)', fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--ff-sans)', padding: 0 }}>
            + New site
          </button>
        </div>

        {/* New site form */}
        {showNewForm && (
          <form onSubmit={createSite} style={{ background: 'var(--card)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-card)', marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>New site</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)', marginBottom: 6, paddingLeft: 2 }}>Site name</div>
              <input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="e.g. Newstead Plaza"
                style={{ display: 'block', width: '100%', height: 50, padding: '0 16px', borderRadius: 12, border: 'none', background: 'var(--card-2)', fontSize: 14, fontFamily: 'var(--ff-sans)', color: 'var(--text)', boxSizing: 'border-box', outline: 'none', boxShadow: 'inset 0 0 0 1px var(--border)' }}/>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)', marginBottom: 6, paddingLeft: 2 }}>Location <span style={{ opacity: 0.6 }}>(optional)</span></div>
              <input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="e.g. Brisbane, QLD"
                style={{ display: 'block', width: '100%', height: 50, padding: '0 16px', borderRadius: 12, border: 'none', background: 'var(--card-2)', fontSize: 14, fontFamily: 'var(--ff-sans)', color: 'var(--text)', boxSizing: 'border-box', outline: 'none', boxShadow: 'inset 0 0 0 1px var(--border)' }}/>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving}
                style={{ flex: 1, height: 44, background: 'var(--amber)', border: 'none', borderRadius: 999, color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--ff-sans)', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Create site'}
              </button>
              <button type="button" onClick={() => { setShowNewForm(false); setNewName(''); setNewLocation('') }}
                style={{ height: 44, padding: '0 18px', background: 'var(--card-2)', border: 'none', borderRadius: 999, fontSize: 14, color: 'var(--text-mut)', cursor: 'pointer', fontFamily: 'var(--ff-sans)' }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Site list */}
        {displaySites.length === 0 && !showNewForm ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-mut)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏗️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No sites yet</div>
            <div style={{ fontSize: 13 }}>Create a site to organise your scans by location.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displaySites.map(site => {
              const siteScans = scanMeta.filter(s => s.site_id === site.id)
              const monthSiteScans = siteScans.filter(s => new Date(s.created_at) >= monthStart)
              const compliant = siteScans.filter(s => s.status === 'pass').length
              const pending = siteScans.filter(s => s.status === 'uncertain').length
              const issues = siteScans.filter(s => s.status === 'fail').length
              const total = siteScans.length
              const score = total > 0 ? Math.round((compliant / total) * 100) : 100
              const scoreColor = score >= 90 ? 'var(--text)' : score >= 70 ? 'var(--amber)' : 'var(--status-red)'
              const gPct = total > 0 ? (compliant / total) * 100 : 100
              const aPct = total > 0 ? (pending / total) * 100 : 0
              const rPct = total > 0 ? (issues / total) * 100 : 0
              return (
                <div key={site.id} onClick={() => router.push(`/sites/${site.id}`)}
                  style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--card)', boxShadow: 'var(--shadow-card)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {site.name}
                        {site.archived && <span style={{ fontSize: 10, padding: '1px 6px', background: 'var(--card-2)', color: 'var(--text-mut)', borderRadius: 4, fontWeight: 500 }}>Archived</span>}
                      </div>
                      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--text-mut)', marginTop: 2, textTransform: 'uppercase' }}>
                        {[site.location, `${monthSiteScans.length} scan${monthSiteScans.length !== 1 ? 's' : ''} this month`].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: scoreColor }}>{score}%</div>
                      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)', marginTop: 2 }}>Compliance</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1, height: 8, borderRadius: 999, overflow: 'hidden', display: 'flex', background: 'var(--card-2)' }}>
                      <div style={{ height: '100%', width: `${gPct}%`, background: 'var(--status-green)' }}/>
                      <div style={{ height: '100%', width: `${aPct}%`, background: 'var(--amber)' }}/>
                      <div style={{ height: '100%', width: `${rPct}%`, background: 'var(--status-red)' }}/>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {archivedSites.length > 0 && (
          <button onClick={() => setShowArchived(v => !v)}
            style={{ marginTop: 12, fontSize: 12, color: 'var(--text-mut)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--ff-sans)', padding: '4px 0' }}>
            {showArchived ? 'Hide archived' : `Show archived (${archivedSites.length})`}
          </button>
        )}
      </main>
    </div>
  )
}
