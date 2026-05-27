'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'

const NAVY = '#16181C'
const AMBER = '#F39410'
const FAIL_RED = '#E14B3D'

const BG = 'var(--ss-bg)'
const SURFACE = 'var(--ss-surface)'
const TEXT = 'var(--ss-text)'
const TEXT_MUTE = 'var(--ss-text-mute)'
const BORDER = 'var(--ss-border)'
const BORDER_STRONG = 'var(--ss-border-strong)'

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [scanMeta, setScanMeta] = useState<{ id: string; site_id: string | null; created_at: string }[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [selectedScans, setSelectedScans] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [statsVisible, setStatsVisible] = useState(true)
  const [activeTab, setActiveTab] = useState<'scans' | 'sites' | 'activity'>('scans')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [recentRes, metaRes, sitesRes] = await Promise.all([
        supabase.from('scans').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('scans').select('id, site_id, created_at').order('created_at', { ascending: false }),
        supabase.from('sites').select('*').order('name', { ascending: true }),
      ])
      setScans(recentRes.data || [])
      setScanMeta(metaRes.data || [])
      setSites(sitesRes.data || [])
      setLoading(false)
    }
    init()
  }, [router])

  const toggleSelect = (id: string) => {
    setSelectedScans(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkDelete = async () => {
    setDeleting(true)
    const ids = Array.from(selectedScans)
    for (const scanId of ids) {
      const scan = scans.find(s => s.id === scanId)
      if (scan) {
        const urls = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
        for (const url of urls) {
          const path = url.split('/scan-photos/')[1]
          if (path) await supabase.storage.from('scan-photos').remove([path])
        }
      }
    }
    await supabase.from('scans').delete().in('id', ids)
    setScans(prev => prev.filter(s => !selectedScans.has(s.id)))
    setScanMeta(prev => prev.filter(s => !selectedScans.has(s.id)))
    setSelectedScans(new Set())
    setEditMode(false)
    setShowDeleteConfirm(false)
    setDeleting(false)
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${mins}m ago`
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ color: '#aaa', fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  const totalScans = scanMeta.length
  const compliantCount = scans.filter(s => s.status === 'pass').length
  const issuesCount = scans.filter(s => s.status === 'fail').length
  const complianceRate = scans.length > 0 ? Math.round((compliantCount / scans.length) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <AppHeader />

      {/* Stats bar */}
      <div style={{ background: '#16181C', padding: '0 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 8px' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(239,234,224,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Overview</span>
          <button onClick={() => setStatsVisible(!statsVisible)} style={{ background: 'transparent', border: 'none', color: 'rgba(239,234,224,0.4)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            {statsVisible ? 'Hide ▲' : 'Show ▼'}
          </button>
        </div>
        {statsVisible && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, paddingBottom: 14 }}>
            {[
              { val: `${complianceRate}%`, label: 'Compliance', color: complianceRate >= 80 ? '#3DD37A' : complianceRate >= 50 ? '#F39410' : '#E14B3D' },
              { val: totalScans, label: 'Total scans', color: '#EFEAE0' },
              { val: issuesCount, label: 'Issues found', color: issuesCount > 0 ? '#E14B3D' : '#EFEAE0' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 10px 8px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(239,234,224,0.4)', marginTop: 2, letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', background: SURFACE, borderBottom: `0.5px solid ${BORDER}`, position: 'sticky', top: 56, zIndex: 9 }}>
        {(['scans', 'sites', 'activity'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: '12px 4px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? AMBER : TEXT_MUTE, background: 'transparent', border: 'none', borderBottom: activeTab === tab ? `2px solid ${AMBER}` : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {tab}
          </button>
        ))}
      </div>

      <main style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 96 }}>

        {/* Scans tab */}
        {activeTab === 'scans' && (
          <div style={{ padding: '14px 14px' }}>
            {scans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: TEXT_MUTE }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 4 }}>No scans yet</div>
                <div style={{ fontSize: 13 }}>Tap the + button to run your first compliance scan</div>
              </div>
            ) : scans.map(scan => {
              const photoUrl = scan.photo_urls?.[0] || scan.photo_url
              const statusColor: Record<string, string> = { pass: '#1a7a45', fail: '#b33428', uncertain: '#a36200' }
              const statusBg: Record<string, string> = { pass: 'rgba(61,211,122,0.12)', fail: 'rgba(225,75,61,0.12)', uncertain: 'rgba(243,148,16,0.12)' }
              const statusLabel: Record<string, string> = { pass: 'Compliant', fail: 'Issues', uncertain: 'Unclear' }
              const siteName = sites.find(s => s.id === scan.site_id)?.name
              const isSelected = selectedScans.has(scan.id)

              return (
                <div key={scan.id}
                  onClick={() => editMode ? toggleSelect(scan.id) : router.push(`/scan/${scan.id}`)}
                  style={{ background: SURFACE, borderRadius: 10, border: isSelected ? `1.5px solid ${AMBER}` : `0.5px solid ${BORDER}`, padding: '11px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  {editMode && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSelected ? AMBER : BORDER_STRONG}`, background: isSelected ? AMBER : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <span style={{ color: NAVY, fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                  )}
                  {!editMode && (photoUrl ? (
                    <img src={photoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--ss-surface-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: TEXT_MUTE }}>📷</div>
                  ))}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.work_type || 'Unnamed scan'}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTE }}>
                      {new Date(scan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      {siteName && ` · ${siteName}`}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: statusBg[scan.status] || statusBg.uncertain, color: statusColor[scan.status] || statusColor.uncertain, flexShrink: 0 }}>
                    {statusLabel[scan.status] || 'Unclear'}
                  </div>
                </div>
              )
            })}

            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditMode(!editMode); setSelectedScans(new Set()) }}
                style={{ background: 'transparent', border: 'none', fontSize: 13, color: TEXT_MUTE, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 0' }}>
                {editMode ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>
        )}

        {/* Sites tab */}
        {activeTab === 'sites' && (
          <div style={{ padding: '14px 14px' }}>
            <button onClick={() => router.push('/sites')}
              style={{ width: '100%', padding: '11px', background: AMBER, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, color: NAVY, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}>
              Manage all sites →
            </button>
            {sites.filter(s => !s.archived).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: TEXT_MUTE }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 4 }}>No sites yet</div>
                <div style={{ fontSize: 13 }}>Create a site to organise your scans by job location</div>
              </div>
            ) : sites.filter(s => !s.archived).map(site => {
              const siteScans = scans.filter(s => s.site_id === site.id)
              const siteCompliant = siteScans.filter(s => s.status === 'pass').length
              const siteRate = siteScans.length > 0 ? Math.round((siteCompliant / siteScans.length) * 100) : 0
              const rateColor = siteRate >= 80 ? '#3DD37A' : siteRate >= 50 ? '#F39410' : '#E14B3D'

              return (
                <div key={site.id} onClick={() => router.push(`/sites/${site.id}`)}
                  style={{ background: SURFACE, borderRadius: 10, border: `0.5px solid ${BORDER}`, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{site.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: siteScans.length > 0 ? rateColor : TEXT_MUTE }}>{siteScans.length > 0 ? `${siteRate}%` : '—'}</div>
                  </div>
                  {siteScans.length > 0 && (
                    <div style={{ height: 4, background: 'var(--ss-surface-2)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${siteRate}%`, background: rateColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: TEXT_MUTE, display: 'flex', gap: 10 }}>
                    <span>{siteScans.length} scan{siteScans.length !== 1 ? 's' : ''}</span>
                    {site.location && <span>{site.location}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Activity tab */}
        {activeTab === 'activity' && (
          <div style={{ padding: '14px 14px' }}>
            {scans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: TEXT_MUTE }}>
                <div style={{ fontSize: 13 }}>No activity yet</div>
              </div>
            ) : scans.map((scan, i) => {
              const dotColor: Record<string, string> = { pass: '#3DD37A', fail: '#E14B3D', uncertain: '#F39410' }
              const action: Record<string, string> = { pass: 'Compliant scan', fail: 'Issues found', uncertain: 'Scan unclear' }
              const siteName = sites.find(s => s.id === scan.site_id)?.name

              return (
                <div key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)}
                  style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `0.5px solid ${BORDER}`, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor[scan.status] || '#F39410', flexShrink: 0 }} />
                    {i < scans.length - 1 && <div style={{ width: 1, flex: 1, background: BORDER, marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{action[scan.status] || 'Scan completed'}</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTE, marginBottom: 2 }}>{scan.work_type || 'Unknown work type'}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTE, display: 'flex', gap: 8 }}>
                      <span>{timeAgo(scan.created_at)}</span>
                      {siteName && <span>· {siteName}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Guide button */}
        <div style={{ padding: '0 14px', marginTop: 8, paddingTop: 16, borderTop: `0.5px solid ${BORDER}` }}>
          <button onClick={() => router.push('/guide')}
            style={{ width: '100%', padding: '12px', background: 'transparent', border: `0.5px solid ${BORDER}`, borderRadius: 10, fontSize: 14, color: TEXT_MUTE, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>?</span> SafetyScan guide
          </button>
        </div>

      </main>

      {/* Bulk delete bottom bar */}
      {editMode && selectedScans.size > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: SURFACE, borderTop: `0.5px solid ${BORDER}`, padding: '12px 20px', display: 'flex', gap: 10, zIndex: 20 }}>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{ flex: 1, padding: '12px', background: FAIL_RED, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Delete {selectedScans.size} scan{selectedScans.size !== 1 ? 's' : ''}
          </button>
          <button onClick={() => { setEditMode(false); setSelectedScans(new Set()) }}
            style={{ padding: '12px 20px', background: 'transparent', border: `0.5px solid ${BORDER_STRONG}`, borderRadius: 10, fontSize: 14, color: TEXT_MUTE, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
        </div>
      )}

      {/* Bulk delete confirm modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: SURFACE, borderRadius: 16, padding: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Delete {selectedScans.size} scan{selectedScans.size !== 1 ? 's' : ''}?</div>
            <div style={{ fontSize: 14, color: '#888', lineHeight: 1.5, marginBottom: 20 }}>This cannot be undone. Photos will also be permanently deleted.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                style={{ flex: 1, padding: 11, background: 'transparent', border: `1px solid ${BORDER_STRONG}`, borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: TEXT_MUTE }}>Cancel</button>
              <button onClick={handleBulkDelete} disabled={deleting}
                style={{ flex: 1, padding: 11, background: FAIL_RED, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: '#fff', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
