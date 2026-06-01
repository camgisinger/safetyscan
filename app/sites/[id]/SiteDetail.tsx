'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../../lib/supabase'
import AppHeader from '../../../components/AppHeader'

function statusBar(s: string)   { return s === 'pass' ? '#3E8E5A' : s === 'fail' ? '#D63A26' : 'var(--amber)' }
function statusColor(s: string) { return s === 'pass' ? 'var(--clear-tx)' : s === 'fail' ? 'var(--issue-tx-theme)' : 'var(--amber)' }
function statusLabel(s: string) { return s === 'pass' ? 'Compliant' : s === 'fail' ? 'Issues' : 'Pending' }

function Thumb({ url }: { url?: string | null }) {
  if (url) return <img src={url} alt="" style={{ width: 46, alignSelf: 'stretch', objectFit: 'cover', display: 'block', borderRight: '1.5px solid var(--line)', flexShrink: 0 }}/>
  return <div style={{ width: 46, alignSelf: 'stretch', borderRight: '1.5px solid var(--line)', flexShrink: 0, backgroundColor: 'var(--surf)', backgroundImage: 'repeating-linear-gradient(135deg, var(--div) 0 1.5px, transparent 1.5px 8px)', backgroundSize: '8px 8px' }} />
}

export default function SiteDetail({ id }: { id: string }) {
  const [site, setSite]   = useState<Site | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [showDeleteSite, setShowDeleteSite] = useState(false)
  const [deleteWithScans, setDeleteWithScans] = useState(false)
  const [deletingSite, setDeletingSite]       = useState(false)
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
      setSite(siteRes.data); setScans((scansRes.data || []) as Scan[]); setLoading(false)
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
        for (const url of urls) { const path = url.split('/scan-photos/')[1]; if (path) await supabase.storage.from('scan-photos').remove([path]) }
      }
      await supabase.from('scans').delete().eq('site_id', id)
    } else { await supabase.from('scans').update({ site_id: null }).eq('site_id', id) }
    await supabase.from('sites').delete().eq('id', id)
    router.push('/sites')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid var(--line)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  )

  if (error || !site) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AppHeader variant="detail" title="Site" onBack={() => router.push('/sites')}/>
      <div style={{ padding: '0 18px' }}>
        <div style={{ background: 'var(--issue-bg)', border: '1.5px solid var(--issue)', borderRadius: 4, padding: '16px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--issue-tx-theme)', marginBottom: 6 }}>Could not load site</div>
          <div style={{ fontSize: 13, color: 'var(--mut)' }}>{error}</div>
        </div>
      </div>
    </div>
  )

  const totalScans     = scans.length
  const compliantCount = scans.filter(s => s.status === 'pass').length
  const issuesCount    = scans.filter(s => s.status === 'fail').length
  const uncertainCount = scans.filter(s => s.status === 'uncertain').length
  const complianceRate = totalScans > 0 ? Math.round((compliantCount / totalScans) * 100) : 100
  const scoreColor     = complianceRate >= 90 ? 'var(--text)' : complianceRate >= 70 ? 'var(--amber)' : '#D63A26'
  const bars = [18,22,32,28,36,30,38,36,40,28,34,38,30,36,42,40,36,30,38,42,36,38,28,34,40,38,42,30,32,38]

  return (
    <div className="page-slide-right-in" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 48 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AppHeader variant="detail" title="Site" onBack={() => router.push('/sites')}/>
      <div style={{ padding: '0 18px' }}>

        {/* Page title */}
        <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--text)', paddingTop: 4 }}>
          {site.name}
          {site.archived && <span style={{ fontSize: 10, padding: '2px 7px', border: '1.5px solid var(--line)', borderRadius: 4, color: 'var(--mut)', fontWeight: 600, letterSpacing: '0.08em', marginLeft: 8, verticalAlign: 'middle' }}>ARCHIVED</span>}
        </div>
        {site.location && <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--mut)', marginTop: 4 }}>{site.location}</div>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 4 }}>
          <button onClick={() => router.push(`/?site_id=${site.id}`)}
            style={{ flex: 1, height: 46, background: 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, color: '#1B1A12', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            + New scan
          </button>
          <button onClick={toggleArchive}
            style={{ height: 46, padding: '0 18px', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 8, color: 'var(--mut)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {site.archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>

        {/* Compliance card */}
        {totalScans > 0 && (
          <div style={{ background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, padding: 16, marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--mut)' }}>Compliance</span>
              <span style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mut)', opacity: 0.7 }}>Last 30 days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, color: scoreColor }}>
                  {complianceRate}<span style={{ fontSize: 22, opacity: 0.6 }}>%</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 8 }}>Site score</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                {[{ dot: '#3E8E5A', label: `${compliantCount} clear` }, { dot: 'var(--amber)', label: `${uncertainCount} pending` }, { dot: '#D63A26', label: `${issuesCount} issue${issuesCount !== 1 ? 's' : ''}` }].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.dot }}/>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Histogram */}
            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: 44, marginTop: 16 }}>
              {bars.map((h, i) => (
                <div key={i} style={{ flex: 1, height: h, borderRadius: 2, background: i === 22 ? '#D63A26' : i % 7 === 3 ? 'var(--amber)' : 'var(--div)' }}/>
              ))}
            </div>
          </div>
        )}

        {/* Recent scans */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '22px 2px 11px' }}>
          <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }}/>
          <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)' }}>Scans ({totalScans})</span>
        </div>

        {scans.length === 0 ? (
          <div style={{ background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mut)' }}>No scans yet</div>
          </div>
        ) : scans.map(scan => {
          const photoUrl = (scan as any).photo_urls?.[0] || (scan as any).photo_url
          const d = new Date(scan.created_at)
          const meta = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).toUpperCase() + ' · ' + d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase().replace(' ', '')
          return (
            <div key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)}
              style={{ display: 'flex', alignItems: 'stretch', background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', marginBottom: 8 }}>
              <div style={{ width: 5, flexShrink: 0, background: statusBar(scan.status) }} />
              <Thumb url={photoUrl} />
              <div style={{ flex: 1, padding: '11px 13px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.work_type || 'Unnamed scan'}</div>
                <div style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 4 }}>{meta}</div>
              </div>
              <div style={{ alignSelf: 'center', paddingRight: 13 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, color: statusColor(scan.status) }}>{statusLabel(scan.status)}</div>
              </div>
            </div>
          )
        })}

        <button onClick={() => setShowDeleteSite(true)}
          style={{ width: '100%', height: 44, background: 'transparent', border: '1.5px solid var(--issue)', borderRadius: 6, color: 'var(--issue-tx-theme)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 16 }}>
          Delete site
        </button>
      </div>

      {showDeleteSite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, padding: 24, maxWidth: 340, width: '100%' }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Delete "{site.name}"?</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.5, marginBottom: 16 }}>This will permanently delete the site.</div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={deleteWithScans} onChange={e => setDeleteWithScans(e.target.checked)} style={{ marginTop: 2 }}/>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Also delete all {scans.length} scans and photos</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowDeleteSite(false); setDeleteWithScans(false) }} disabled={deletingSite}
                style={{ flex: 1, height: 44, background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 6, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--mut)' }}>Cancel</button>
              <button onClick={handleDeleteSite} disabled={deletingSite}
                style={{ flex: 1, height: 44, background: '#D63A26', border: '1.5px solid var(--issue)', borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: deletingSite ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: '#fff', opacity: deletingSite ? 0.6 : 1 }}>
                {deletingSite ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
