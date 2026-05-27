'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../../lib/supabase'

const NAVY = '#0F1923'
const AMBER = '#F5A623'
const OFFWHITE = '#F1EFE8'
const PASS_GREEN = '#3B6D11'
const FAIL_RED = '#A32D2D'
const WARN_AMBER = '#854F0B'

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 32, height: 32, border: '3px solid #E0DDD6', borderTopColor: AMBER, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

function Header() {
  return (
    <header style={{ background: NAVY, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#fff' }}>Safety</span><span style={{ color: AMBER }}>Scan</span>
      </div>
    </header>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    pass: { bg: '#EAF3DE', color: PASS_GREEN, label: 'Compliant' },
    fail: { bg: '#FCEBEB', color: FAIL_RED, label: 'Issues found' },
    uncertain: { bg: '#FAEEDA', color: WARN_AMBER, label: 'Uncertain' },
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
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [siteRes, scansRes] = await Promise.all([
        supabase.from('sites').select('*').eq('id', id).single(),
        supabase.from('scans').select('id, work_type, status, confidence, created_at').eq('site_id', id).order('created_at', { ascending: false }),
      ])

      if (siteRes.error) {
        setError(`Could not load site: ${siteRes.error.message}`)
        setLoading(false)
        return
      }
      if (!siteRes.data) {
        setError('Site not found.')
        setLoading(false)
        return
      }

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

  if (loading) return <Spinner />

  if (error) return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>
      <Header />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 16px 0', fontFamily: 'inherit' }}>
          ‹ Dashboard
        </button>
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: FAIL_RED, marginBottom: 6 }}>Could not load site</div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{error}</div>
        </div>
      </main>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>
      <Header />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 16px 0', fontFamily: 'inherit' }}>
          ‹ Dashboard
        </button>

        {site && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {site.name}
                  {site.archived && (
                    <span style={{ fontSize: 11, padding: '2px 8px', background: '#F1EFE8', color: '#888', borderRadius: 6, fontWeight: 500 }}>Archived</span>
                  )}
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
                  style={{ fontSize: 12, padding: '6px 12px', background: site.archived ? '#EAF3DE' : 'transparent', border: '0.5px solid #D3D1C7', borderRadius: 8, color: site.archived ? '#3B6D11' : '#888', cursor: 'pointer', fontFamily: 'inherit' }}>
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
            <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
              Run a compliance scan to add it to this site.
            </div>
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

      </main>
    </div>
  )
}
