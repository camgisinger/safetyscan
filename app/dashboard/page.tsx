'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Site, Scan } from '../../lib/supabase'

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

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: OFFWHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ color: '#aaa', fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  // Compute scan counts and last scan date per site from full meta
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

  // Unassigned scans from recentScans for display
  const unassignedRecent = recentScans.filter(s => !s.site_id)

  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <header style={{ background: NAVY, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>
          <span style={{ color: '#EFEAE0' }}>Safety</span><span style={{ color: AMBER }}>Scan</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{user?.email}</div>
          <button onClick={signOut}
            style={{ fontSize: 12, padding: '5px 12px', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* New scan CTA */}
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
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Recent scans</div>

          {recentScans.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 4 }}>No scans yet</div>
              <div style={{ fontSize: 13, color: '#999' }}>Run your first compliance check to see results here.</div>
            </div>
          ) : (
            recentScans.map(scan => {
              const siteName = scan.site_id ? sites.find(s => s.id === scan.site_id)?.name : null
              return (
                <div key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)}
                  style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E0DDD6', marginBottom: 8, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  {(scan.photo_urls?.[0] || scan.photo_url) ? (
                    <img src={scan.photo_urls?.[0] || scan.photo_url!} alt="" style={{ width: 44, height: 44, borderRadius: 7, objectFit: 'cover', flexShrink: 0, border: '0.5px solid #E0DDD6' }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 7, background: '#EFEAE0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📷</div>
                  )}
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
                    <span style={{ fontSize: 14, color: '#ccc' }}>›</span>
                  </div>
                </div>
              )
            })
          )}
        </section>

        {/* Sites */}
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

              {/* Unassigned scans */}
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

      </main>
    </div>
  )
}
