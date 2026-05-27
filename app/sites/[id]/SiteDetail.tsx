'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../../lib/supabase'
import AppHeader from '../../../components/AppHeader'

const NAVY = '#16181C'
const AMBER = '#F39410'
const OFFWHITE = '#EFEAE0'
const PASS_GREEN = '#1a7a45'
const FAIL_RED = '#E14B3D'
const WARN_AMBER = '#a36200'

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 32, height: 32, border: '3px solid #E0DDD6', borderTopColor: AMBER, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    pass: { bg: 'rgba(61,211,122,0.12)', color: PASS_GREEN, label: 'Compliant' },
    fail: { bg: 'rgba(225,75,61,0.12)', color: FAIL_RED, label: 'Issues found' },
    uncertain: { bg: 'rgba(243,148,16,0.12)', color: WARN_AMBER, label: 'Uncertain' },
    not_applicable: { bg: 'rgba(0,0,0,0.05)', color: '#4A4D52', label: 'N/A' },
  }
  const c = cfg[status] || cfg.uncertain
  return (
    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 8, background: c.bg, color: c.color, fontWeight: 600, flexShrink: 0 }}>
      {c.label}
    </span>
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
      if (!siteRes.data) { setError('Site not found.'); setLoading(false); return }

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

  if (loading) return <Spinner />

  if (error) return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>
      <AppHeader />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>
        <button onClick={() => router.push('/sites')} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 16px 0', fontFamily: 'inherit' }}>‹ Sites</button>
        <div style={{ background: 'rgba(225,75,61,0.1)', border: '0.5px solid #F09595', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: FAIL_RED, marginBottom: 6 }}>Could not load site</div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{error}</div>
        </div>
      </main>
    </div>
  )

  // Checklist progress
  let totalItems = 0, doneItems = 0
  for (const scan of scans) {
    const items: any[] = (scan as any).checklist || []
    const state: Record<string, any> = (scan as any).checklist_state || {}
    for (let i = 0; i < items.length; i++) {
      if (!state[`d_${i}`]) {
        totalItems++
        if (state[`c_${i}`]) doneItems++
      }
    }
  }
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>
      <AppHeader />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

        <button onClick={() => router.push('/sites')} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 16px 0', fontFamily: 'inherit' }}>
          ‹ Sites
        </button>

        {site && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {site.name}
                  {site.archived && <span style={{ fontSize: 11, padding: '2px 8px', background: '#F1EFE8', color: '#888', borderRadius: 6, fontWeight: 500 }}>Archived</span>}
                </div>
                {site.location && <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>{site.location}</div>}
                <div style={{ fontSize: 11, color: '#aaa' }}>
                  Created {new Date(site.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => router.push(`/?site_id=${site.id}`)}
                  style={{ fontSize: 12, padding: '6px 12px', background: NAVY, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  + New scan
                </button>
                <button onClick={toggleArchive}
                  style={{ fontSize: 12, padding: '6px 12px', background: site.archived ? 'rgba(61,211,122,0.12)' : 'transparent', border: '0.5px solid #D3D1C7', borderRadius: 8, color: site.archived ? PASS_GREEN : '#888', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {site.archived ? 'Unarchive' : 'Archive'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
          Scans ({scans.length})
        </div>

        {scans.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>📷</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 4 }}>No scans yet</div>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>Run a compliance scan to add it to this site.</div>
            {site && (
              <button onClick={() => router.push(`/?site_id=${site.id}`)}
                style={{ padding: '9px 18px', background: NAVY, border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + New scan
              </button>
            )}
          </div>
        ) : (
          scans.map(scan => (
            <div key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)}
              style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E0DDD6', padding: '13px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {scan.work_type || 'Unknown work type'}
                </div>
                <div style={{ fontSize: 11, color: '#aaa' }}>
                  {new Date(scan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge status={scan.status} />
                <span style={{ fontSize: 14, color: '#ccc' }}>›</span>
              </div>
            </div>
          ))
        )}

        {/* Checklist progress */}
        {totalItems > 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginTop: 4, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Checklist progress</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#555' }}>{doneItems} of {totalItems} items complete across all scans</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? PASS_GREEN : AMBER }}>{pct}%</div>
            </div>
            <div style={{ height: 6, background: '#F1EFE8', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? PASS_GREEN : AMBER, borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
        ) : scans.length > 0 ? (
          <div style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '12px 0 20px' }}>No checklists generated for this site yet</div>
        ) : null}

        {/* Delete site */}
        <button
          onClick={() => setShowDeleteSite(true)}
          style={{ width: '100%', padding: 11, background: 'transparent', border: '1px solid #E14B3D', borderRadius: 8, color: '#E14B3D', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}
        >
          Delete site
        </button>

      </main>

      {/* Delete site modal */}
      {showDeleteSite && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Delete "{site?.name}"?</div>
            <div style={{ fontSize: 14, color: '#888', lineHeight: 1.5, marginBottom: 16 }}>
              This will permanently delete the site. Choose what to do with its scans:
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={deleteWithScans}
                onChange={e => setDeleteWithScans(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, accentColor: FAIL_RED, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                Also delete all {scans.length} scan{scans.length !== 1 ? 's' : ''} associated with this site (and their photos)
              </span>
            </label>
            {!deleteWithScans && scans.length > 0 && (
              <div style={{ fontSize: 12, color: '#888', background: '#F8F7F3', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
                Scans will be kept but unassigned from this site.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowDeleteSite(false); setDeleteWithScans(false) }} disabled={deletingSite}
                style={{ flex: 1, padding: 11, background: 'transparent', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>
                Cancel
              </button>
              <button onClick={() => handleDeleteSite()} disabled={deletingSite}
                style={{ flex: 1, padding: 11, background: FAIL_RED, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: deletingSite ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: '#fff', opacity: deletingSite ? 0.6 : 1 }}>
                {deletingSite ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
