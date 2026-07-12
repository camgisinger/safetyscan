'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Scan } from '../../lib/supabase'
import { useUser } from '../../lib/UserContext'
import { useCount } from '../../lib/CountContext'
import AppHeader from '../../components/AppHeader'
import { Camera, ChevronRight, TriangleAlert } from 'lucide-react'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function statusPill(status: string, issueCount?: number) {
  if (status === 'pass') return { label: 'Compliant', bg: 'var(--pass-tint)', color: 'var(--pass-deep)', border: 'var(--pass-border)' }
  if (status === 'fail') return { label: issueCount ? `${issueCount} issue${issueCount !== 1 ? 's' : ''}` : 'Issues', bg: 'var(--fail-tint)', color: 'var(--issue)', border: 'transparent' }
  return { label: 'Pending', bg: 'var(--warn-tint)', color: 'var(--warning)', border: 'transparent' }
}

function scanLeftColor(status: string) {
  if (status === 'pass') return 'var(--pass)'
  if (status === 'fail') return 'var(--issue)'
  return 'var(--warning)'
}

function ScanRow({ scan, siteName, onClick }: { scan: Scan; siteName?: string; onClick: () => void }) {
  const photoUrl = scan.photo_urls?.[0] || scan.photo_url
  const issueCount = (scan.findings || []).filter((f: any) => f.type === 'critical').length
  const pill = statusPill(scan.status, issueCount || undefined)
  const d = new Date(scan.created_at)
  const dateStr = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  const timeStr = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'stretch',
      background: 'var(--surf)', border: '1.5px solid var(--border-card)',
      borderRadius: 'var(--r-card)', overflow: 'hidden', cursor: 'pointer', marginBottom: 8,
    }}>
      <div style={{ width: 4, flexShrink: 0, background: scanLeftColor(scan.status) }} />
      {photoUrl ? (
        <img src={photoUrl} alt="" style={{ width: 52, alignSelf: 'stretch', objectFit: 'cover', display: 'block', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 52, alignSelf: 'stretch', flexShrink: 0, background: 'var(--surf-inset)', display: 'grid', placeItems: 'center' }}>
          <Camera size={18} strokeWidth={1.5} color="var(--text-muted)" />
        </div>
      )}
      <div style={{ flex: 1, padding: '11px 13px', minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {scan.work_type || 'Unnamed scan'}
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 3 }}>
          {[siteName, dateStr, timeStr].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div style={{ alignSelf: 'center', paddingRight: 13, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.01em',
          padding: '3px 9px', borderRadius: 'var(--r-pill)',
          background: pill.bg, color: pill.color,
          border: `1px solid ${pill.border}`,
          whiteSpace: 'nowrap',
        }}>
          {pill.label}
        </span>
        <ChevronRight size={14} strokeWidth={2} color="var(--text-muted)" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [sites, setSites] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { outstandingCount, scansWithIssues } = useCount()

  const userName = user?.user_metadata?.full_name?.split(' ')[0] ?? null

  useEffect(() => {
    if (userLoading) return
    if (!user) { router.push('/login'); return }

    const init = async () => {
      const [scansRes, sitesRes] = await Promise.all([
        supabase.from('scans').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('sites').select('id, name').order('name'),
      ])
      setScans(scansRes.data || [])
      setSites((sitesRes.data || []) as { id: string; name: string }[])
      setLoading(false)
    }
    init()
  }, [user, userLoading, router])

  if (loading) return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border-card)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  const recent = scans.slice(0, 8)
  const allClear = scans.length > 0 && outstandingCount === 0
  const isEmpty = scans.length === 0

  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 18px' }}>

        {/* Greeting */}
        <div style={{ padding: '20px 0 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 3 }}>
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: 0 }}>
            {greeting()}{userName ? `, ${userName}` : ''}
          </h1>
        </div>

        {/* All-clear banner */}
        {allClear && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', marginBottom: 14,
            background: 'var(--pass-tint)', border: '1.5px solid var(--pass-border)',
            borderRadius: 'var(--r-card)',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--pass)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--pass-deep)', letterSpacing: '-0.01em' }}>All clear</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--pass-deep)', opacity: 0.75, marginTop: 1 }}>No outstanding issues across all scans</div>
            </div>
          </div>
        )}

        {/* New scan hero */}
        <button onClick={() => router.push('/scan/new')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 18,
          padding: '20px 22px',
          background: 'var(--amber)', borderRadius: 'var(--r-card-hero)',
          boxShadow: 'var(--shadow-hero)', border: 'none', cursor: 'pointer',
          textAlign: 'left', marginBottom: 12, fontFamily: 'inherit',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(0,0,0,0.15)', display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Camera size={26} strokeWidth={2.2} color="#1B1A12" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: '#1B1A12', lineHeight: 1.1 }}>New Scan</div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(27,26,18,0.65)', marginTop: 4 }}>Upload site photos to check compliance</div>
          </div>
          <ChevronRight size={22} strokeWidth={2.5} color="rgba(27,26,18,0.5)" />
        </button>

        {/* Stat cards */}
        {!isEmpty && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 20 }}>
            <button onClick={() => router.push('/issues')} style={{
              padding: '16px', background: 'var(--surf)', border: '1.5px solid var(--border-card)',
              borderRadius: 'var(--r-card)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <TriangleAlert size={13} strokeWidth={2} color="var(--issue)" />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Outstanding</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: (outstandingCount ?? 0) > 0 ? 'var(--issue)' : 'var(--text)', lineHeight: 1 }}>{outstandingCount ?? '—'}</div>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 4 }}>
                {outstandingCount === null ? 'Loading…'
                  : outstandingCount === 0 ? 'No outstanding issues'
                  : `Issue${outstandingCount !== 1 ? 's' : ''} across ${scansWithIssues ?? '…'} scan${scansWithIssues !== 1 ? 's' : ''}`}
              </div>
            </button>
          </div>
        )}

        {/* Empty state */}
        {isEmpty ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            background: 'var(--surf)', border: '1.5px solid var(--border-card)',
            borderRadius: 'var(--r-card)',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18, background: 'var(--brand-tint)',
              display: 'grid', placeItems: 'center', margin: '0 auto 18px',
            }}>
              <Camera size={28} strokeWidth={1.75} color="var(--amber)" />
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', marginBottom: 8 }}>Start your first scan</div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto 24px' }}>
              Upload a photo of your construction site to instantly identify compliance issues.
            </div>
            <button onClick={() => router.push('/scan/new')} style={{
              height: 46, padding: '0 28px',
              background: 'var(--amber)', border: 'none',
              borderRadius: 'var(--r-control)', fontFamily: 'inherit',
              fontSize: 14, fontWeight: 700, color: '#1B1A12',
              cursor: 'pointer', boxShadow: 'var(--shadow-btn)',
            }}>
              New scan
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px 12px' }}>
              <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Recent activity</span>
              <button onClick={() => router.push('/scans')} style={{
                marginLeft: 'auto', fontWeight: 600, fontSize: 12,
                color: 'var(--amber)', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                View all
              </button>
            </div>
            {recent.map(scan => (
              <ScanRow key={scan.id} scan={scan}
                siteName={sites.find(s => s.id === scan.site_id)?.name}
                onClick={() => router.push(`/scan/${scan.id}`)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
