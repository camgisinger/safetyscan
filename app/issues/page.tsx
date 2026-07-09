'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import AppHeader from '../../components/AppHeader'
import { Shield, Ruler, Leaf, Check, X, ChevronRight, TriangleAlert } from 'lucide-react'

type Tab = 'outstanding' | 'pending'

type Finding = {
  finding_id: string
  text: string
  type: string
  module: string
  scan_id: string
  module_id: string
  scan_name: string
  site_name: string | null
  created_at: string
}

function ModuleIcon({ module }: { module: string }) {
  const size = 14
  const sw = 1.75
  if (module === 'quality') return <Ruler size={size} strokeWidth={sw} />
  if (module === 'environmental') return <Leaf size={size} strokeWidth={sw} />
  return <Shield size={size} strokeWidth={sw} />
}

function moduleColor(module: string) {
  if (module === 'quality') return '#7C6FC9'
  if (module === 'environmental') return 'var(--pass)'
  return 'var(--amber)'
}

function OutstandingRow({ f, onMark, onView }: { f: Finding; onMark: (id: string, module: string, findingId: string, state: string) => void; onView: () => void }) {
  const [marking, setMarking] = useState(false)
  const isCritical = f.type === 'critical'
  const d = new Date(f.created_at)
  const dateStr = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

  const handleMark = async (state: 'done' | 'dismissed') => {
    setMarking(true)
    try {
      await fetch('/api/finding-state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_id: f.scan_id, module: f.module, finding_id: f.finding_id, state }),
      })
      onMark(f.scan_id, f.module, f.finding_id, state)
    } catch { setMarking(false) }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: 'var(--surf)', border: '1.5px solid var(--border-card)',
      borderRadius: 'var(--r-card)', overflow: 'hidden', marginBottom: 8,
    }}>
      <div style={{ width: 4, flexShrink: 0, background: isCritical ? 'var(--issue)' : 'var(--warning)' }} />
      <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ color: moduleColor(f.module), display: 'flex', alignItems: 'center' }}>
            <ModuleIcon module={f.module} />
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '2px 7px', borderRadius: 'var(--r-pill)',
            background: isCritical ? 'var(--fail-tint)' : 'var(--warn-tint)',
            color: isCritical ? 'var(--issue)' : 'var(--warning)',
          }}>
            {isCritical ? 'Critical' : 'Warning'}
          </span>
          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 'auto' }}>{dateStr}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>{f.text}</div>
        <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>
          {[f.scan_name, f.site_name].filter(Boolean).join(' · ')}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={() => handleMark('done')} disabled={marking} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 30, padding: '0 12px', borderRadius: 'var(--r-control-sm)',
            background: 'var(--pass-tint)', border: '1px solid var(--pass-border)',
            color: 'var(--pass-deep)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Check size={12} strokeWidth={2.5} /> Mark done
          </button>
          <button onClick={() => handleMark('dismissed')} disabled={marking} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 30, padding: '0 12px', borderRadius: 'var(--r-control-sm)',
            background: 'var(--surf-inset)', border: '1.5px solid var(--border-card)',
            color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Dismiss
          </button>
          <button onClick={onView} style={{
            height: 30, padding: '0 10px', borderRadius: 'var(--r-control-sm)',
            background: 'transparent', border: '1.5px solid var(--border-card)',
            color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            View <ChevronRight size={11} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  )
}

function PendingRow({ f, onAction, onView }: { f: Finding; onAction: (id: string, module: string, findingId: string, state: string) => void; onView: () => void }) {
  const [acting, setActing] = useState(false)
  const d = new Date(f.created_at)
  const dateStr = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

  const handleAction = async (state: 'confirm' | 'dismissed') => {
    setActing(true)
    try {
      await fetch('/api/finding-state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_id: f.scan_id, module: f.module, finding_id: f.finding_id, state }),
      })
      onAction(f.scan_id, f.module, f.finding_id, state)
    } catch { setActing(false) }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: 'var(--pending-card-bg)', border: '1.5px solid var(--pending-card-border)',
      borderRadius: 'var(--r-card)', overflow: 'hidden', marginBottom: 8,
    }}>
      <div style={{ width: 4, flexShrink: 0, background: 'var(--warning)' }} />
      <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ color: moduleColor(f.module), display: 'flex', alignItems: 'center' }}>
            <ModuleIcon module={f.module} />
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '2px 7px', borderRadius: 'var(--r-pill)',
            background: 'var(--pending-tag-bg)', color: 'var(--pending-tag-text)',
          }}>
            Needs review
          </span>
          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 'auto' }}>{dateStr}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>{f.text}</div>
        <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>
          {[f.scan_name, f.site_name].filter(Boolean).join(' · ')}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={() => handleAction('confirm')} disabled={acting} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 30, padding: '0 12px', borderRadius: 'var(--r-control-sm)',
            background: 'var(--issue)', border: 'none',
            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <TriangleAlert size={11} strokeWidth={2.5} /> Confirm issue
          </button>
          <button onClick={() => handleAction('dismissed')} disabled={acting} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 30, padding: '0 12px', borderRadius: 'var(--r-control-sm)',
            background: 'var(--surf-inset)', border: '1.5px solid var(--border-card)',
            color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <X size={12} strokeWidth={2.2} /> Not an issue
          </button>
          <button onClick={onView} style={{
            height: 30, padding: '0 10px', borderRadius: 'var(--r-control-sm)',
            background: 'transparent', border: '1.5px solid var(--border-card)',
            color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            View <ChevronRight size={11} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  )
}

function IssuesContent() {
  const [tab, setTab] = useState<Tab>('outstanding')
  const [outstanding, setOutstanding] = useState<Finding[]>([])
  const [pending, setPending] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam === 'pending') setTab('pending')
  }, [searchParams])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const res = await fetch('/api/issues')
      if (res.ok) {
        const data = await res.json()
        setOutstanding(data.outstanding || [])
        setPending(data.pending || [])
      }
      setLoading(false)
    }
    init()
  }, [router])

  const removeOutstanding = useCallback((scanId: string, module: string, findingId: string) => {
    setOutstanding(prev => prev.filter(f => !(f.scan_id === scanId && f.module === module && f.finding_id === findingId)))
  }, [])

  const removePending = useCallback((scanId: string, module: string, findingId: string, state: string) => {
    setPending(prev => prev.filter(f => !(f.scan_id === scanId && f.module === module && f.finding_id === findingId)))
    if (state === 'confirm') {
      setOutstanding(prev => [...prev])
    }
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border-card)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  const allClearOutstanding = !loading && outstanding.length === 0
  const allClearPending = !loading && pending.length === 0

  return (
    <>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '12px 18px 0', borderBottom: '1.5px solid var(--border-card)', marginBottom: 0 }}>
        {([['outstanding', 'Outstanding', outstanding.length], ['pending', 'Pending', pending.length]] as const).map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '10px 16px',
            background: 'none', border: 'none', borderBottom: `2.5px solid ${tab === key ? 'var(--amber)' : 'transparent'}`,
            color: tab === key ? 'var(--text)' : 'var(--text-muted)',
            fontWeight: tab === key ? 700 : 500, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 7, paddingBottom: 11,
          }}>
            {label}
            {count > 0 && (
              <span style={{
                minWidth: 18, height: 18, borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                background: key === 'outstanding' ? 'var(--issue)' : 'var(--pending-tag-bg)',
                color: key === 'outstanding' ? '#fff' : 'var(--pending-tag-text)',
                display: 'grid', placeItems: 'center', padding: '0 4px',
              }}>{count}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 18px' }}>
        {tab === 'outstanding' && (
          allClearOutstanding ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--pass-tint)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="var(--pass)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>All clear</div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-muted)' }}>No outstanding issues right now</div>
            </div>
          ) : (
            outstanding.map(f => (
              <OutstandingRow key={`${f.scan_id}-${f.module}-${f.finding_id}`} f={f}
                onMark={(scanId, module, findingId) => removeOutstanding(scanId, module, findingId)}
                onView={() => router.push(`/scan/${f.scan_id}`)}
              />
            ))
          )
        )}

        {tab === 'pending' && (
          allClearPending ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--pass-tint)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="var(--pass)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Nothing to review</div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-muted)' }}>No findings awaiting confirmation</div>
            </div>
          ) : (
            pending.map(f => (
              <PendingRow key={`${f.scan_id}-${f.module}-${f.finding_id}`} f={f}
                onAction={(scanId, module, findingId, state) => removePending(scanId, module, findingId, state)}
                onView={() => router.push(`/scan/${f.scan_id}`)}
              />
            ))
          )
        )}
      </div>
    </>
  )
}

export default function IssuesPage() {
  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader title="Issues" />
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 28, height: 28, border: '2px solid var(--border-card)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} /></div>}>
        <IssuesContent />
      </Suspense>
    </div>
  )
}
