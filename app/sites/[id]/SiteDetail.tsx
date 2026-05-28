'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../../lib/supabase'
import AppHeader from '../../../components/AppHeader'

function Thumb({ url }: { url?: string | null }) {
  if (url) return <img src={url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
  return <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, backgroundColor: 'var(--thumb)', backgroundImage: 'repeating-linear-gradient(135deg, var(--thumb-2) 0 1px, transparent 1px 8px)', backgroundSize: '8px 8px' }}/>
}

function Badge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    pass:      { bg: 'var(--status-green-bg)', color: 'var(--status-green)', dot: 'var(--status-green)', label: 'Clear' },
    fail:      { bg: 'var(--status-red-bg)',   color: 'var(--status-red)',   dot: 'var(--status-red)',   label: 'Issues' },
    uncertain: { bg: 'var(--status-amber-bg)', color: 'var(--amber)',        dot: 'var(--amber)',        label: 'Pending' },
  }
  const c = cfg[status] || cfg.uncertain
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, padding: '4px 10px 4px 8px', borderRadius: 999, background: c.bg, color: c.color, flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }}/>
      {c.label}
    </div>
  )
}

export default function SiteDetail({ id }: { id: string }) {
  const [site, setSite] = useState<Site | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteSite, setShowDeleteSite] = useState(false)
  const [deleteWithScans, setDeleteWithScans] = useState(false)
  const [deletingSite, setDeletingSite] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [siteRes, scansRes] = await Promise.all([
        supabase.from('sites').select('*').eq('id', id).single(),
        supabase.from('scans').select('id, work_type, status, confidence, created_at, checklist, checklist_state, photo_urls, photo_url').eq('site_id', id).order('created_at', { ascending: false }),
      ])
      if (siteRes.error) { setError(`Could not load site: ${siteRes.error.message}`); setLoading(false); return }
      setSite(siteRes.data)
      setScans((scansRes.data || []) as Scan[])
      setLoading(false)
    }
    init()
  }, [id, router])

  const toggleArchive = async () => {
    if (!site) return
    const newVal = !site.archived
    await supabase.from('sites').update({ archived: newVal }).eq('id', site.id)
    setSite(prev => prev ? { ...prev, archived: newVal } : prev)
  }

  const handleDeleteSite = async () => {
    setDeletingSite(true)
    if (deleteWithScans) {
      const { data: siteScans } = await supabase.from('scans').select('id, photo_urls, photo_url').eq('site_id', id)
      for (const scan of siteScans || []) {
        const urls = (scan as any).photo_urls || ((scan as any).photo_url ? [(scan as any).photo_url] : [])
        for (const url of urls) {
          const path = url.split('/scan-photos/')[1]
          if (path) await supabase.storage.from('scan-photos').remove([path])
        }
      }
      await supabase.from('scans').delete().eq('site_id', id)
    } else {
      await supabase.from('scans').update({ site_id: null }).eq('site_id', id)
    }
    await supabase.from('sites').delete().eq('id', id)
    router.push('/sites')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-sans)' }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error || !site) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff-sans)' }}>
      <AppHeader variant="detail" title="Site" onBack={() => router.push('/sites')}/>
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 48px' }}>
        <div style={{ background: 'var(--status-red-bg)', border: '0.5px solid var(--status-red)', borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-red)', marginBottom: 6 }}>Could not load site</div>
          <div style={{ fontSize: 13, color: 'var(--text-mut)', lineHeight: 1.5 }}>{error}</div>
        </div>
      </main>
    </div>
  )

  const totalScans = scans.length
  const compliantCount = scans.filter(s => s.status === 'pass').length
  const issuesCount = scans.filter(s => s.status === 'fail').length
  const uncertainCount = scans.filter(s => s.status === 'uncertain').length
  const complianceRate = totalScans > 0 ? Math.round((compliantCount / totalScans) * 100) : 100
  const scoreColor = complianceRate >= 90 ? 'var(--text)' : complianceRate >= 70 ? 'var(--amber)' : 'var(--status-red)'

  // 30-bar histogram values (mock sparkline)
  const bars = [18,22,32,28,36,30,38,36,40,28,34,38,30,36,42,40,36,30,38,42,36,38,28,34,40,38,42,30,32,38]

  return (
    <div className="page-slide-right-in" style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff-sans)', willChange: 'transform, opacity' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AppHeader variant="detail" title="Site" onBack={() => router.push('/sites')}/>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 48px' }}>

        {/* Page title */}
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)', padding: '4px 4px 4px' }}>
          {site.name}
          {site.archived && <span style={{ fontSize: 11, padding: '2px 8px', background: 'var(--card-2)', color: 'var(--text-mut)', borderRadius: 6, fontWeight: 500, marginLeft: 8, verticalAlign: 'middle' }}>Archived</span>}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-mut)', padding: '0 4px 12px' }}>
          {[site.location, `Created ${new Date(site.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`].filter(Boolean).join(' · ')}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => router.push(`/?site_id=${site.id}`)}
            style={{ flex: 1, height: 44, background: 'var(--amber)', border: 'none', borderRadius: 999, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)', boxShadow: 'var(--shadow-btn-amber)' }}>
            + New scan
          </button>
          <button onClick={toggleArchive}
            style={{ height: 44, padding: '0 18px', background: 'var(--card)', border: 'none', borderRadius: 999, fontSize: 14, color: site.archived ? 'var(--status-green)' : 'var(--text-mut)', cursor: 'pointer', fontFamily: 'var(--ff-sans)', boxShadow: '0 0 0 1px var(--border)' }}>
            {site.archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>

        {/* Compliance card */}
        {totalScans > 0 && (
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-card)', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)' }}>Compliance</span>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-mut)', opacity: 0.6 }}>Last 30 days</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
              <div>
                <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: scoreColor }}>
                  {complianceRate}<span style={{ fontSize: 22, opacity: 0.6 }}>%</span>
                </div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)', marginTop: 8 }}>Site score</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                {[
                  { dot: 'var(--status-green)', label: `${compliantCount} clear` },
                  { dot: 'var(--amber)', label: `${uncertainCount} pending` },
                  { dot: 'var(--status-red)', label: `${issuesCount} issue${issuesCount !== 1 ? 's' : ''}` },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.dot }}/>
                    <span style={{ fontSize: 12, color: 'var(--text)' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Histogram */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 44, marginTop: 16 }}>
              {bars.map((h, i) => (
                <div key={i} style={{ flex: 1, height: h, borderRadius: 2, background: i === 22 ? 'var(--status-red)' : i % 7 === 3 ? 'var(--amber)' : 'var(--card-2)' }}/>
              ))}
            </div>
          </div>
        )}

        {/* Recent scans */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 4px 10px' }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-mut)' }}>Scans ({totalScans})</span>
        </div>

        {scans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--card)', borderRadius: 16, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>📷</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No scans yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-mut)' }}>Run a compliance scan to add it to this site.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scans.map(scan => {
              const photoUrl = (scan as any).photo_urls?.[0] || (scan as any).photo_url
              const d = new Date(scan.created_at)
              const meta = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase() + ' · ' + d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase().replace(' ', '')
              return (
                <div key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'var(--card)', boxShadow: 'var(--shadow-card)', cursor: 'pointer' }}>
                  <Thumb url={photoUrl}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.work_type || 'Unnamed scan'}</div>
                    <div style={{ marginTop: 2, fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--text-mut)', textTransform: 'uppercase' }}>{meta}</div>
                  </div>
                  <Badge status={scan.status}/>
                </div>
              )
            })}
          </div>
        )}

        {/* Delete site */}
        <button onClick={() => setShowDeleteSite(true)}
          style={{ width: '100%', height: 44, background: 'transparent', border: '1px solid var(--status-red)', borderRadius: 12, color: 'var(--status-red)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ff-sans)', marginTop: 20 }}>
          Delete site
        </button>
      </main>

      {showDeleteSite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, maxWidth: 340, width: '100%' }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Delete "{site.name}"?</div>
            <div style={{ fontSize: 14, color: 'var(--text-mut)', lineHeight: 1.5, marginBottom: 16 }}>This will permanently delete the site. Choose what to do with its scans:</div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={deleteWithScans} onChange={e => setDeleteWithScans(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--status-red)', flexShrink: 0 }}/>
              <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>Also delete all {scans.length} scan{scans.length !== 1 ? 's' : ''} and their photos</span>
            </label>
            {!deleteWithScans && scans.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-mut)', background: 'var(--card-2)', borderRadius: 10, padding: '8px 12px', marginBottom: 16 }}>Scans will be kept but unassigned from this site.</div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowDeleteSite(false); setDeleteWithScans(false) }} disabled={deletingSite}
                style={{ flex: 1, height: 44, background: 'var(--card-2)', border: 'none', borderRadius: 999, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--ff-sans)', color: 'var(--text-mut)' }}>
                Cancel
              </button>
              <button onClick={handleDeleteSite} disabled={deletingSite}
                style={{ flex: 1, height: 44, background: 'var(--status-red)', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: deletingSite ? 'not-allowed' : 'pointer', fontFamily: 'var(--ff-sans)', color: '#fff', opacity: deletingSite ? 0.6 : 1 }}>
                {deletingSite ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
