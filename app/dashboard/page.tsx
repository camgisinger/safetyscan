'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Site, Scan } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'

const NAVY = '#16181C'
const AMBER = '#F39410'
const OFFWHITE = '#EFEAE0'
const PASS_GREEN = '#1a7a45'
const FAIL_RED = '#E14B3D'
const WARN_AMBER = '#a36200'

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [recentScans, setRecentScans] = useState<Scan[]>([])
  const [scanMeta, setScanMeta] = useState<{ id: string; site_id: string | null; created_at: string }[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [openUnassigned, setOpenUnassigned] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedScans, setSelectedScans] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const [recentRes, metaRes, sitesRes] = await Promise.all([
        supabase.from('scans').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('scans').select('id, site_id, created_at').order('created_at', { ascending: false }),
        supabase.from('sites').select('*').order('name', { ascending: true }),
      ])
      setRecentScans(recentRes.data || [])
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

  const cancelEdit = () => {
    setEditMode(false)
    setSelectedScans(new Set())
  }

  const handleBulkDelete = async () => {
    setDeleting(true)
    const ids = Array.from(selectedScans)
    for (const scanId of ids) {
      const scan = recentScans.find(s => s.id === scanId)
      if (scan) {
        const urls = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
        for (const url of urls) {
          const path = url.split('/scan-photos/')[1]
          if (path) await supabase.storage.from('scan-photos').remove([path])
        }
      }
    }
    await supabase.from('scans').delete().in('id', ids)
    setRecentScans(prev => prev.filter(s => !selectedScans.has(s.id)))
    setScanMeta(prev => prev.filter(s => !selectedScans.has(s.id)))
    setSelectedScans(new Set())
    setEditMode(false)
    setShowDeleteConfirm(false)
    setDeleting(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: OFFWHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ color: '#aaa', fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  const scansBySite: Record<string, { id: string; created_at: string }[]> = {}
  for (const s of scanMeta) {
    const key = s.site_id || 'unassigned'
    if (!scansBySite[key]) scansBySite[key] = []
    scansBySite[key].push({ id: s.id, created_at: s.created_at })
  }

  const activeSites = sites.filter(s => !s.archived)
  const archivedSites = sites.filter(s => s.archived)
  const displaySites = showArchived ? sites : activeSites
  const unassignedMeta = scansBySite['unassigned'] || []
  const unassignedRecent = recentScans.filter(s => !s.site_id)

  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <AppHeader />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 96px' }}>

        <Link href="/" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
          <div style={{ background: NAVY, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>New compliance scan</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Upload photos and check Queensland compliance</div>
            </div>
            <div style={{ fontSize: 22, color: AMBER }}>→</div>
          </div>
        </Link>

        {/* Recent scans */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Recent scans</div>
            {recentScans.length > 0 && (
              editMode ? (
                <button onClick={cancelEdit} style={{ fontSize: 12, color: '#888', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cancel</button>
              ) : (
                <button onClick={() => setEditMode(true)} style={{ fontSize: 12, color: NAVY, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Edit</button>
              )
            )}
          </div>

          {recentScans.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 4 }}>No scans yet</div>
              <div style={{ fontSize: 13, color: '#999' }}>Run your first compliance check to see results here.</div>
            </div>
          ) : (
            recentScans.map(scan => {
              const siteName = scan.site_id ? sites.find(s => s.id === scan.site_id)?.name : null
              const isSelected = selectedScans.has(scan.id)
              return (
                <div
                  key={scan.id}
                  onClick={() => editMode ? toggleSelect(scan.id) : router.push(`/scan/${scan.id}`)}
                  style={{ background: '#fff', borderRadius: 12, border: `0.5px solid ${isSelected ? AMBER : '#E0DDD6'}`, marginBottom: 8, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: isSelected ? `0 0 0 1.5px ${AMBER}` : 'none' }}
                >
                  {editMode && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSelected ? AMBER : '#C8C5BE'}`, background: isSelected ? AMBER : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <span style={{ color: NAVY, fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                    </div>
                  )}
                  {!editMode && (scan.photo_urls?.[0] || scan.photo_url) ? (
                    <img src={scan.photo_urls?.[0] || scan.photo_url!} alt="" style={{ width: 44, height: 44, borderRadius: 7, objectFit: 'cover', flexShrink: 0, border: '0.5px solid #E0DDD6' }} />
                  ) : !editMode ? (
                    <div style={{ width: 44, height: 44, borderRadius: 7, background: '#EFEAE0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📷</div>
                  ) : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {scan.work_type || 'Unknown work type'}
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>
                      {formatDate(scan.created_at)}
                      {siteName && <span style={{ marginLeft: 6, color: '#bbb' }}>· {siteName}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusBadge status={scan.status} />
                    {!editMode && <span style={{ fontSize: 14, color: '#ccc' }}>›</span>}
                  </div>
                </div>
              )
            })
          )}
        </section>

        {/* Sites */}
        {!editMode && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Sites</div>
              <Link href="/sites" style={{ fontSize: 12, color: NAVY, fontWeight: 600, textDecoration: 'none' }}>Manage sites →</Link>
            </div>

            {displaySites.length === 0 && unassignedMeta.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#999', lineHeight: 1.6 }}>No sites yet. <Link href="/sites" style={{ color: NAVY, fontWeight: 600 }}>Create a site</Link> to organise scans by location or client.</div>
              </div>
            ) : (
              <>
                {displaySites.map(site => {
                  const siteScans = scansBySite[site.id] || []
                  const lastScan = siteScans[0]
                  return (
                    <Link key={site.id} href={`/sites/${site.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E0DDD6', padding: '13px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: site.location ? 2 : 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {site.name}
                            {site.archived && <span style={{ fontSize: 10, padding: '1px 6px', background: '#EFEAE0', color: '#888', borderRadius: 4, fontWeight: 500 }}>Archived</span>}
                          </div>
                          {site.location && <div style={{ fontSize: 11, color: '#aaa' }}>{site.location}</div>}
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                            {siteScans.length} scan{siteScans.length !== 1 ? 's' : ''}
                            {lastScan ? ` · Last: ${formatShortDate(lastScan.created_at)}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: 14, color: '#ccc' }}>›</span>
                      </div>
                    </Link>
                  )
                })}

                {unassignedMeta.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E0DDD6', marginBottom: 8, overflow: 'hidden' }}>
                    <div onClick={() => setOpenUnassigned(v => !v)}
                      style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 2 }}>No site</div>
                        <div style={{ fontSize: 11, color: '#bbb' }}>{unassignedMeta.length} unassigned scan{unassignedMeta.length !== 1 ? 's' : ''}</div>
                      </div>
                      <span style={{ fontSize: 12, color: '#ccc' }}>{openUnassigned ? '▲' : '▼'}</span>
                    </div>
                    {openUnassigned && (
                      <div style={{ borderTop: '0.5px solid #F0EDE6', padding: '8px 16px 12px' }}>
                        {unassignedRecent.length === 0 ? (
                          <div style={{ fontSize: 12, color: '#aaa', padding: '8px 0' }}>Load more scans to see unassigned details.</div>
                        ) : (
                          unassignedRecent.map(scan => (
                            <Link key={scan.id} href={`/scan/${scan.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #F5F4F0' }}>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{scan.work_type || 'Unknown'}</div>
                                <div style={{ fontSize: 11, color: '#aaa' }}>{formatDate(scan.created_at)}</div>
                              </div>
                              <StatusBadge status={scan.status} />
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <button onClick={() => setShowArchived(v => !v)}
              style={{ marginTop: 8, fontSize: 12, color: '#888', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
              {showArchived ? 'Hide archived sites' : `Show archived sites (${archivedSites.length})`}
            </button>
          </section>
        )}
      </main>

      {/* Bulk delete bar */}
      {editMode && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '0.5px solid #E0DDD6', padding: '12px 20px', display: 'flex', gap: 10, zIndex: 20 }}>
          <button
            onClick={() => selectedScans.size > 0 && setShowDeleteConfirm(true)}
            disabled={selectedScans.size === 0}
            style={{ flex: 1, padding: '12px', background: selectedScans.size === 0 ? '#E0DDD6' : FAIL_RED, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: selectedScans.size === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {selectedScans.size === 0 ? 'Select scans to delete' : `Delete ${selectedScans.size} scan${selectedScans.size !== 1 ? 's' : ''}`}
          </button>
          <button onClick={cancelEdit} style={{ padding: '12px 20px', background: 'transparent', border: '0.5px solid #D3D1C7', borderRadius: 10, fontSize: 14, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
        </div>
      )}

      {/* Bulk delete confirm modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Delete {selectedScans.size} scan{selectedScans.size !== 1 ? 's' : ''}?</div>
            <div style={{ fontSize: 14, color: '#888', lineHeight: 1.5, marginBottom: 20 }}>This cannot be undone. Photos will also be permanently deleted.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} style={{ flex: 1, padding: 11, background: 'transparent', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>Cancel</button>
              <button onClick={handleBulkDelete} disabled={deleting} style={{ flex: 1, padding: 11, background: FAIL_RED, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', color: '#fff', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
