'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

const FINDING_CFG: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  ok:       { bg: '#EAF3DE', border: '#C0DD97', color: '#3B6D11', icon: '✓' },
  warning:  { bg: '#FAEEDA', border: '#FAC775', color: '#854F0B', icon: '⚠' },
  critical: { bg: '#FCEBEB', border: '#F7C1C1', color: '#A32D2D', icon: '✕' },
}

function ScanDetail({ scan }: { scan: any }) {
  const findings: any[] = scan.findings || []
  const statusColors: Record<string, string> = { pass: '#3B6D11', fail: '#A32D2D', uncertain: '#854F0B' }
  const statusColor = statusColors[scan.status] || '#854F0B'
  return (
    <div style={{ borderTop: '0.5px solid #F0EDE6', marginTop: 10, paddingTop: 12 }}>
      {scan.summary && (
        <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6, marginBottom: 10, padding: '10px 12px', background: '#F8F7F3', borderRadius: 8 }}>
          {scan.summary}
        </div>
      )}
      {findings.length > 0 && (
        <div>
          {findings.map((f: any, i: number) => {
            const c = FINDING_CFG[f.type] || FINDING_CFG.warning
            return (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 7, background: c.bg, border: `0.5px solid ${c.border}`, marginBottom: 5 }}>
                <div style={{ color: c.color, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{c.icon}</div>
                <div style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.5 }}>{f.text}</div>
              </div>
            )
          })}
        </div>
      )}
      {findings.length === 0 && !scan.summary && (
        <div style={{ fontSize: 12, color: '#aaa' }}>No details saved for this scan.</div>
      )}
    </div>
  )
}

const NAVY = '#0F1923'
const AMBER = '#F5A623'
const OFFWHITE = '#F1EFE8'
const PASS_GREEN = '#3B6D11'
const FAIL_RED = '#A32D2D'
const WARN_AMBER = '#854F0B'

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [scans, setScans] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openScan, setOpenScan] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const [scansRes, projectsRes] = await Promise.all([
        supabase.from('scans').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
      ])
      setScans(scansRes.data || [])
      setProjects(projectsRes.data || [])
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

  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <header style={{ background: NAVY, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
          <span style={{ color: '#fff' }}>Safety</span><span style={{ color: AMBER }}>Scan</span>
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

          {scans.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 4 }}>No scans yet</div>
              <div style={{ fontSize: 13, color: '#999' }}>Run your first compliance check to see results here.</div>
            </div>
          ) : (
            scans.map(scan => {
              const isOpen = openScan === scan.id
              const statusColors: Record<string, string> = { pass: '#3B6D11', fail: '#A32D2D', uncertain: '#854F0B' }
              const statusColor = statusColors[scan.status] || '#854F0B'
              return (
                <div key={scan.id} style={{ background: '#fff', borderRadius: 12, border: `0.5px solid ${isOpen ? NAVY : '#E0DDD6'}`, marginBottom: 8, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                  <div onClick={() => setOpenScan(isOpen ? null : scan.id)}
                    style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {scan.work_type || 'Unknown work type'}
                      </div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{formatDate(scan.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusBadge status={scan.status} />
                      <span style={{ fontSize: 12, color: '#ccc' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 16px 14px' }}>
                      <ScanDetail scan={scan} />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>

        {/* Projects */}
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Projects</div>

          {projects.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#999', lineHeight: 1.6 }}>No projects yet. Projects help you organise scans by site or client.</div>
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E0DDD6', padding: '13px 16px', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: project.location ? 2 : 0 }}>{project.name}</div>
                {project.location && <div style={{ fontSize: 11, color: '#aaa' }}>{project.location}</div>}
              </div>
            ))
          )}
        </section>

      </main>
    </div>
  )
}
