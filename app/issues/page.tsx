'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../lib/UserContext'
import { useCount } from '../../lib/CountContext'
import AppHeader from '../../components/AppHeader'
import { Shield, Ruler, Leaf, Check, ChevronRight, CheckSquare } from 'lucide-react'

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

function OutstandingRow({ f, onMark, onView, selectMode, selected, onToggle }: {
  f: Finding
  onMark: (id: string, module: string, findingId: string, state: string) => void
  onView: () => void
  selectMode: boolean
  selected: boolean
  onToggle: () => void
}) {
  const isCritical = f.type === 'critical'
  const isAction = f.type === 'action'
  const d = new Date(f.created_at)
  const dateStr = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

  const handleMark = (state: 'done' | 'dismissed') => {
    onMark(f.scan_id, f.module, f.finding_id, state)
    fetch('/api/finding-state', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ scan_id: f.scan_id, module: f.module, finding_id: f.finding_id, state }),
    })
  }

  const borderColor = isCritical ? 'var(--issue)' : isAction ? 'var(--amber)' : 'var(--warning)'
  const badgeBg = isCritical ? 'var(--fail-tint)' : isAction ? 'var(--brand-tint)' : 'var(--warn-tint)'
  const badgeColor = isCritical ? 'var(--issue)' : isAction ? 'var(--amber)' : 'var(--warning)'
  const badgeLabel = isCritical ? 'Critical' : isAction ? 'Confirm on site' : 'Warning'

  return (
    <div onClick={selectMode ? onToggle : undefined} style={{
      display: 'flex', alignItems: 'stretch',
      background: selected ? 'var(--brand-tint)' : 'var(--surf)',
      border: `1.5px solid ${selected ? 'var(--amber)' : 'var(--border-card)'}`,
      borderRadius: 'var(--r-card)', overflow: 'hidden', marginBottom: 8,
      cursor: selectMode ? 'pointer' : 'default',
      transition: 'border-color 0.15s, background 0.15s',
    }}>
      {selectMode ? (
        <div style={{ width: 48, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            border: `1.5px solid ${selected ? 'var(--amber)' : 'var(--border-card)'}`,
            background: selected ? 'var(--amber)' : 'transparent',
            display: 'grid', placeItems: 'center', transition: 'all 0.15s',
          }}>
            {selected && <Check size={13} strokeWidth={2.5} color="#1B1A12" />}
          </div>
        </div>
      ) : (
        <div style={{ width: 4, flexShrink: 0, background: borderColor }} />
      )}
      <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ color: moduleColor(f.module), display: 'flex', alignItems: 'center' }}>
            <ModuleIcon module={f.module} />
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '2px 7px', borderRadius: 'var(--r-pill)',
            background: badgeBg, color: badgeColor,
          }}>
            {badgeLabel}
          </span>
          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 'auto' }}>{dateStr}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>{f.text}</div>
        <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>
          {[f.scan_name, f.site_name].filter(Boolean).join(' · ')}
        </div>
        {!selectMode && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => handleMark('done')} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 30, padding: '0 12px', borderRadius: 'var(--r-control-sm)',
              background: 'var(--pass-tint)', border: '1px solid var(--pass-border)',
              color: 'var(--pass-deep)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Check size={12} strokeWidth={2.5} /> Mark done
            </button>
            <button onClick={() => handleMark('dismissed')} style={{
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
        )}
      </div>
    </div>
  )
}

function IssuesContent({ selectModeFromParent, onExitSelect }: { selectModeFromParent: boolean; onExitSelect: () => void }) {
  const [outstanding, setOutstanding] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | 'critical' | 'warning' | 'action'>('all')
  const selectMode = selectModeFromParent
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const { adjustCount } = useCount()

  useEffect(() => { if (!selectModeFromParent) setSelected(new Set()) }, [selectModeFromParent])

  const selKey = (f: Finding) => `${f.scan_id}:${f.module}:${f.finding_id}`

  const toggleSelect = (f: Finding) => {
    const k = selKey(f)
    setSelected(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })
  }

  const filteredOutstanding = typeFilter === 'all'
    ? outstanding
    : outstanding.filter(f => f.type === typeFilter)

  const toggleAll = () => {
    if (selected.size === filteredOutstanding.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredOutstanding.map(selKey)))
    }
  }

  const exitSelect = () => { onExitSelect(); setSelected(new Set()) }

  const handleBulkMark = async (state: 'done' | 'dismissed') => {
    const targets = outstanding.filter(f => selected.has(selKey(f)))
    if (!targets.length) return
    setBulkWorking(true)
    setOutstanding(prev => prev.filter(f => !selected.has(selKey(f))))
    adjustCount(-targets.length)
    exitSelect()
    await Promise.all(targets.map(f =>
      fetch('/api/finding-state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ scan_id: f.scan_id, module: f.module, finding_id: f.finding_id, state }),
      })
    ))
    setBulkWorking(false)
  }

  useEffect(() => {
    if (userLoading) return
    if (!user) { router.push('/login'); return }
    setLoading(true)

    const init = async () => {
      const { data: modules } = await supabase
        .from('scan_modules')
        .select('id, scan_id, module, findings, findings_state, scans!inner(id, work_type, created_at, site_id, sites(name))')

      const outArr: Finding[] = []

      for (const mod of (modules || [])) {
        const scan = (mod as any).scans
        if (!scan) continue
        const findings: any[] = (mod as any).findings || []
        const state: Record<string, string> = (mod as any).findings_state || {}

        for (const f of findings) {
          const fState = state[f.id]
          if (fState === 'done' || fState === 'dismissed') continue

          const item: Finding = {
            finding_id: f.id,
            text: f.text || f.title || '',
            type: f.type,
            module: (mod as any).module,
            scan_id: (mod as any).scan_id,
            module_id: (mod as any).id,
            scan_name: scan.work_type || 'Unnamed scan',
            site_name: scan.sites?.name ?? null,
            created_at: scan.created_at,
          }

          if (f.type === 'critical' || f.type === 'warning' || f.type === 'action') {
            outArr.push(item)
          }
        }
      }

      setOutstanding(outArr)
      setLoading(false)
    }
    init()
  }, [user, userLoading, router])

  const removeOutstanding = useCallback((scanId: string, module: string, findingId: string) => {
    setOutstanding(prev => prev.filter(f => !(f.scan_id === scanId && f.module === module && f.finding_id === findingId)))
    adjustCount(-1)
  }, [adjustCount])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border-card)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  const allClearOutstanding = !loading && outstanding.length === 0
  const allSelected = selected.size === filteredOutstanding.length && filteredOutstanding.length > 0

  const FILTER_CHIPS = [
    { key: 'all' as const, label: 'All' },
    { key: 'critical' as const, label: 'Critical' },
    { key: 'warning' as const, label: 'Warning' },
    { key: 'action' as const, label: 'Confirm on site' },
  ].filter(chip => chip.key === 'all' || outstanding.some(f => f.type === chip.key))

  return (
    <>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 18px', paddingBottom: selectMode && selected.size > 0 ? 140 : 14 }}>
        {allClearOutstanding ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--pass-tint)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="var(--pass)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>All clear</div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-muted)' }}>No outstanding observations right now</div>
          </div>
        ) : (
          <>
            {!selectMode && FILTER_CHIPS.length > 1 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {FILTER_CHIPS.map(chip => {
                  const count = chip.key === 'all' ? outstanding.length : outstanding.filter(f => f.type === chip.key).length
                  const active = typeFilter === chip.key
                  return (
                    <button key={chip.key} onClick={() => setTypeFilter(chip.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        height: 32, padding: '0 12px', borderRadius: 999,
                        border: `1.5px solid ${active ? 'var(--amber)' : 'var(--border-card)'}`,
                        background: active ? 'var(--amber)' : 'var(--surf)',
                        color: active ? '#1B1A12' : 'var(--text-secondary)',
                        fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      {chip.label}
                      <span style={{
                        fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '1px 6px',
                        background: active ? 'rgba(0,0,0,0.15)' : 'var(--surf-inset)',
                        color: active ? '#1B1A12' : 'var(--text-muted)',
                      }}>{count}</span>
                    </button>
                  )
                })}
              </div>
            )}
            {selectMode && filteredOutstanding.length > 1 && (
              <button onClick={toggleAll} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, fontWeight: 600, color: 'var(--amber)', padding: '2px 0',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 5,
                  border: `1.5px solid ${allSelected ? 'var(--amber)' : 'var(--border-card)'}`,
                  background: allSelected ? 'var(--amber)' : 'transparent',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  {allSelected && <Check size={11} strokeWidth={2.5} color="#1B1A12" />}
                </div>
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
            {filteredOutstanding.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--text-muted)', fontSize: 13.5, fontWeight: 500 }}>
                No {typeFilter === 'action' ? 'confirm on site' : typeFilter} observations
              </div>
            ) : filteredOutstanding.map(f => (
              <OutstandingRow key={`${f.scan_id}-${f.module}-${f.finding_id}`} f={f}
                onMark={(scanId, module, findingId) => removeOutstanding(scanId, module, findingId)}
                onView={() => router.push(`/scan/${f.scan_id}`)}
                selectMode={selectMode}
                selected={selected.has(selKey(f))}
                onToggle={() => toggleSelect(f)}
              />
            ))}
          </>
        )}
      </div>

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 72, left: 0, right: 0, zIndex: 20,
          padding: '12px 18px', background: 'var(--surf)',
          borderTop: '1.5px solid var(--border-card)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <button onClick={() => handleBulkMark('done')} disabled={bulkWorking} style={{
            flex: 1, height: 46, background: 'var(--pass)', border: 'none',
            borderRadius: 'var(--r-control)', color: '#fff',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: bulkWorking ? 0.6 : 1,
          }}>
            <Check size={16} strokeWidth={2.5} />
            Mark {selected.size} done
          </button>
          <button onClick={() => handleBulkMark('dismissed')} disabled={bulkWorking} style={{
            flex: 1, height: 46, background: 'var(--surf-inset)', border: '1.5px solid var(--border-card)',
            borderRadius: 'var(--r-control)', color: 'var(--text-secondary)',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            opacity: bulkWorking ? 0.6 : 1,
          }}>
            Dismiss {selected.size}
          </button>
        </div>
      )}
    </>
  )
}

export default function IssuesPage() {
  const [selectMode, setSelectMode] = useState(false)

  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <AppHeader title="Observations" rightContent={
        <button onClick={() => setSelectMode(v => !v)} style={{
          height: 34, padding: '0 14px', borderRadius: 'var(--r-control-sm)',
          border: '1.5px solid var(--border-card)', background: 'var(--surf)',
          color: selectMode ? 'var(--amber)' : 'var(--text-secondary)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <CheckSquare size={14} strokeWidth={2} />
          {selectMode ? 'Done' : 'Select'}
        </button>
      } />
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}><div style={{ width: 28, height: 28, border: '2px solid var(--border-card)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} /></div>}>
        <IssuesContent selectModeFromParent={selectMode} onExitSelect={() => setSelectMode(false)} />
      </Suspense>
    </div>
  )
}
