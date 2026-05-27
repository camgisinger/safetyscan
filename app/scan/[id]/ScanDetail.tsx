'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../../lib/supabase'

const NAVY = '#0F1923'
const AMBER = '#F5A623'
const OFFWHITE = '#F1EFE8'
const PASS_GREEN = '#3B6D11'
const FAIL_RED = '#A32D2D'
const WARN_AMBER = '#854F0B'

const FINDING_CFG: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  ok:       { bg: '#EAF3DE', border: '#C0DD97', color: '#3B6D11', icon: '✓' },
  warning:  { bg: '#FAEEDA', border: '#FAC775', color: '#854F0B', icon: '⚠' },
  critical: { bg: '#FCEBEB', border: '#F7C1C1', color: '#A32D2D', icon: '✕' },
}

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
    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: c.bg, color: c.color, fontWeight: 600 }}>
      {c.label}
    </span>
  )
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const cfg: Record<string, { color: string }> = {
    high:   { color: PASS_GREEN },
    medium: { color: WARN_AMBER },
    low:    { color: FAIL_RED },
  }
  const c = cfg[confidence] || { color: '#888' }
  return (
    <span style={{ fontSize: 11, color: c.color, fontWeight: 600 }}>
      {confidence ? confidence.charAt(0).toUpperCase() + confidence.slice(1) : 'Unknown'} confidence
    </span>
  )
}

export default function ScanDetail({ id }: { id: string }) {
  const [scan, setScan] = useState<Scan | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [openLeg, setOpenLeg] = useState<number | null>(null)
  const [assignSiteId, setAssignSiteId] = useState('')
  const [assignSaving, setAssignSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [scanRes, sitesRes] = await Promise.all([
        supabase.from('scans').select('*').eq('id', id).single(),
        supabase.from('sites').select('*').eq('archived', false).order('name', { ascending: true }),
      ])

      if (scanRes.error) {
        setError(`Could not load scan: ${scanRes.error.message}`)
        setLoading(false)
        return
      }
      if (!scanRes.data) {
        setError('Scan not found.')
        setLoading(false)
        return
      }

      const s = scanRes.data as Scan
      setScan(s)
      setNotes(s.notes || '')
      setChecklistState(s.checklist_state || {})
      setAssignSiteId(s.site_id || '')
      setSites(sitesRes.data || [])
      setLoading(false)
    }
    init()
  }, [id, router])

  const toggleChecklist = useCallback(async (idx: number) => {
    const newState = { ...checklistState, [idx]: !checklistState[idx] }
    setChecklistState(newState)
    await supabase.from('scans').update({ checklist_state: newState }).eq('id', id)
  }, [checklistState, id])

  const saveNotes = async () => {
    if (!scan) return
    setNotesSaving(true)
    await supabase.from('scans').update({ notes }).eq('id', id)
    setNotesSaving(false)
  }

  const saveSiteAssignment = async (siteId: string) => {
    setAssignSaving(true)
    await supabase.from('scans').update({ site_id: siteId || null }).eq('id', id)
    setAssignSiteId(siteId)
    setScan(prev => prev ? { ...prev, site_id: siteId || null } : prev)
    setAssignSaving(false)
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
          <div style={{ fontSize: 14, fontWeight: 700, color: FAIL_RED, marginBottom: 6 }}>Could not load scan</div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{error}</div>
        </div>
      </main>
    </div>
  )

  if (!scan) return null

  const checklist: { item: string; category: string }[] = scan.checklist || []
  const findings: { type: string; text: string }[] = scan.findings || []
  const legislation: { code: string; description: string; clauses: { ref: string; summary: string }[] }[] = scan.legislation || []
  const currentSite = scan.site_id ? sites.find(s => s.id === scan.site_id) : null

  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; } textarea { outline: none; }`}</style>
      <Header />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

        <button
          onClick={() => scan.site_id ? router.push(`/sites/${scan.site_id}`) : router.push('/dashboard')}
          style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 16px 0', fontFamily: 'inherit' }}>
          ‹ {currentSite ? currentSite.name : 'Dashboard'}
        </button>

        {/* Header card */}
        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '16px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>
            {scan.work_type || 'Unknown work type'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <StatusBadge status={scan.status} />
            <ConfidenceBadge confidence={scan.confidence} />
          </div>
          <div style={{ fontSize: 11, color: '#aaa' }}>
            {new Date(scan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Summary */}
        {scan.summary && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Summary</div>
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{scan.summary}</div>
          </div>
        )}

        {/* Findings */}
        {findings.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Findings</div>
            {findings.map((f, i) => {
              const c = FINDING_CFG[f.type] || FINDING_CFG.warning
              return (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '9px 11px', borderRadius: 8, background: c.bg, border: `0.5px solid ${c.border}`, marginBottom: 6 }}>
                  <div style={{ color: c.color, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{c.icon}</div>
                  <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.5 }}>{f.text}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legislation */}
        {legislation.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Legislation</div>
            {legislation.map((leg, i) => {
              const isOpen = openLeg === i
              return (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div
                    onClick={() => setOpenLeg(isOpen ? null : i)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: isOpen ? '8px 8px 0 0' : 8, background: isOpen ? NAVY : '#F8F7F3', border: `0.5px solid ${isOpen ? NAVY : '#E0DDD6'}`, cursor: 'pointer' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isOpen ? AMBER : NAVY }}>{leg.code}</div>
                    <div style={{ fontSize: 11, color: isOpen ? 'rgba(255,255,255,0.5)' : '#aaa' }}>{isOpen ? '▲' : '▼'}</div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '10px 12px', background: '#F0EEE8', border: `0.5px solid ${NAVY}`, borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                      <div style={{ fontSize: 12, color: '#444', lineHeight: 1.5, marginBottom: leg.clauses?.length ? 8 : 0 }}>{leg.description}</div>
                      {leg.clauses?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {leg.clauses.map((cl, j) => (
                            <div key={j} title={cl.summary}
                              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: '#fff', border: '0.5px solid #C8C5BE', color: NAVY, fontWeight: 600, cursor: 'default' }}>
                              {cl.ref}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Checklist */}
        {checklist.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Site checklist</div>
            {checklist.map((item, i) => {
              const checked = !!checklistState[i]
              return (
                <div key={i} onClick={() => toggleChecklist(i)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < checklist.length - 1 ? '0.5px solid #F5F4F0' : 'none', cursor: 'pointer' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked ? PASS_GREEN : '#C8C5BE'}`, background: checked ? PASS_GREEN : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: checked ? '#aaa' : '#1a1a1a', lineHeight: 1.4, textDecoration: checked ? 'line-through' : 'none' }}>
                      {item.item}
                    </div>
                    {item.category && (
                      <div style={{ fontSize: 10, color: '#bbb', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.category}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Notes */}
        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Notes</div>
            {notesSaving && <div style={{ fontSize: 11, color: '#bbb' }}>Saving…</div>}
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Add notes about this scan…"
            rows={4}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #C8C5BE', background: '#FAFAF8', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', color: '#1a1a1a', lineHeight: 1.5 }}
          />
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>Auto-saves when you click away</div>
        </div>

        {/* Assign to site */}
        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
            {scan.site_id ? 'Move to different site' : 'Assign to site'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={assignSiteId}
              onChange={e => setAssignSiteId(e.target.value)}
              style={{ flex: 1, padding: '9px 11px', borderRadius: 8, border: '0.5px solid #C8C5BE', background: '#FAFAF8', fontSize: 13, fontFamily: 'inherit', color: '#1a1a1a', cursor: 'pointer' }}>
              <option value="">No site</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={() => saveSiteAssignment(assignSiteId)}
              disabled={assignSaving || assignSiteId === (scan.site_id || '')}
              style={{ padding: '9px 16px', background: (assignSaving || assignSiteId === (scan.site_id || '')) ? '#E0DDD6' : NAVY, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: (assignSaving || assignSiteId === (scan.site_id || '')) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              {assignSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}
