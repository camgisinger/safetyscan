'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../../lib/supabase'
import PhotoResultCard, { convertToJpeg, SYSTEM_PROMPT } from '../../../components/PhotoResultCard'

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

export default function ScanDetail({ id }: { id: string }) {
  const [scan, setScan] = useState<Scan | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checklistState, setChecklistState] = useState<Record<string, any>>({})
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [assignSiteId, setAssignSiteId] = useState('')
  const [assignSaving, setAssignSaving] = useState(false)
  const [generatingChecklist, setGeneratingChecklist] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [checklistError, setChecklistError] = useState<string | null>(null)
  const [continueContext, setContinueContext] = useState('')
  const [continuePhotos, setContinuePhotos] = useState<{ dataUrl: string; base64: string }[]>([])
  const [continueLoading, setContinueLoading] = useState(false)
  const [continueError, setContinueError] = useState<string | null>(null)
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

  const toggleCheck = useCallback(async (idx: number) => {
    const key = `c_${idx}`
    const newState = { ...checklistState, [key]: !checklistState[key] }
    setChecklistState(newState)
    await supabase.from('scans').update({ checklist_state: newState }).eq('id', id)
  }, [checklistState, id])

  const deleteItem = useCallback(async (idx: number) => {
    const newState = { ...checklistState, [`d_${idx}`]: true, [`c_${idx}`]: false }
    setChecklistState(newState)
    await supabase.from('scans').update({ checklist_state: newState }).eq('id', id)
  }, [checklistState, id])

  const generateChecklist = async () => {
    if (!scan) return
    setGeneratingChecklist(true)
    setChecklistError(null)
    setConfirmRegenerate(false)
    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: scan.work_type,
          findings: scan.findings,
          legislation: scan.legislation,
          summary: scan.summary,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const newChecklist = data.checklist
      const newState = {}
      setChecklistState(newState)
      await supabase.from('scans').update({ checklist: newChecklist, checklist_state: newState }).eq('id', id)
      setScan(prev => prev ? { ...prev, checklist: newChecklist, checklist_state: newState } : prev)
    } catch (e: any) {
      setChecklistError(e.message || 'Failed to generate checklist')
    } finally {
      setGeneratingChecklist(false)
    }
  }

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

  const reanalyseWithContext = async (additionalInfo: string, extraPhotos: { dataUrl: string; base64: string }[]) => {
    if (!scan) return
    setContinueLoading(true)
    setContinueError(null)
    try {
      const contextText = `Analyse these construction site photos for Queensland compliance, building on a previous assessment of the same site.

Previous assessment:
Work type: ${scan.work_type}
Status: ${scan.status} (${scan.confidence} confidence)
Summary: ${scan.summary}
Findings: ${JSON.stringify(scan.findings)}
Legislation: ${(scan.legislation || []).map((l: any) => l.code).join(', ')}${additionalInfo ? `\n\nAdditional context from site: ${additionalInfo}` : ''}`

      const userContent: any[] = [
        ...extraPhotos.map(p => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: p.base64 } })),
        { type: 'text', text: contextText },
      ]

      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userContent }],
        }),
      })

      const rawText = await res.text()
      const data = JSON.parse(rawText)

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || data.message || 'Analysis failed')
      }

      const raw = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text || '').join('').trim()
      const stripped = raw.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim()

      let parsed: any
      try { parsed = JSON.parse(stripped) } catch (_) {
        const match = stripped.match(/\{[\s\S]*\}/)
        if (match) parsed = JSON.parse(match[0])
        else throw new Error('Could not parse analysis response')
      }

      const updated = {
        status: parsed.status || 'uncertain',
        confidence: parsed.confidence || 'low',
        work_type: parsed.work_type || scan.work_type,
        legislation: (parsed.legislation || []).map((l: any) => ({ ...l, clauses: l.clauses || [] })),
        findings: parsed.findings || [],
        summary: parsed.summary || '',
        follow_up_questions: parsed.follow_up_questions || [],
      }

      await supabase.from('scans').update(updated).eq('id', id)
      setScan(prev => prev ? { ...prev, ...updated } : prev)
      setContinueContext('')
      setContinuePhotos([])
    } catch (e: any) {
      setContinueError(e.message || 'Analysis failed')
    } finally {
      setContinueLoading(false)
    }
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
  const currentSite = scan.site_id ? sites.find(s => s.id === scan.site_id) : null
  const visibleCount = checklist.filter((_, i) => !checklistState[`d_${i}`]).length

  const checklistContent = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: checklist.length > 0 || generatingChecklist ? 12 : 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>
          Site checklist{checklist.length > 0 ? ` (${visibleCount})` : ''}
        </div>
        {checklist.length > 0 && !generatingChecklist && (
          <button onClick={() => setConfirmRegenerate(true)}
            style={{ fontSize: 11, padding: '3px 9px', background: 'transparent', border: '0.5px solid #D3D1C7', borderRadius: 6, color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>
            Regenerate
          </button>
        )}
      </div>

      {confirmRegenerate && (
        <div style={{ marginBottom: 12, padding: '10px 12px', background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#854F0B', marginBottom: 8, lineHeight: 1.5 }}>
            This will reset your checklist progress. Are you sure?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={generateChecklist}
              style={{ padding: '6px 12px', background: '#854F0B', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Yes, regenerate
            </button>
            <button onClick={() => setConfirmRegenerate(false)}
              style={{ padding: '6px 12px', background: 'transparent', border: '0.5px solid #D3D1C7', borderRadius: 6, color: '#555', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {generatingChecklist ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
          <div style={{ width: 16, height: 16, border: '2px solid #E0DDD6', borderTopColor: AMBER, borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: '#888' }}>Generating checklist…</div>
        </div>
      ) : checklist.length === 0 ? (
        <div>
          <div style={{ fontSize: 13, color: '#999', lineHeight: 1.5, marginBottom: 12 }}>
            Generate a custom checklist based on this scan's findings and applicable legislation.
          </div>
          {checklistError && (
            <div style={{ marginBottom: 10, padding: '8px 10px', background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 7, fontSize: 12, color: FAIL_RED }}>
              {checklistError}
            </div>
          )}
          <button onClick={generateChecklist}
            style={{ padding: '10px 18px', background: AMBER, border: 'none', borderRadius: 9, color: NAVY, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Generate checklist →
          </button>
        </div>
      ) : (
        <div>
          {checklist.map((item, i) => {
            if (checklistState[`d_${i}`]) return null
            const checked = !!checklistState[`c_${i}`]
            const isLast = checklist.slice(i + 1).every((_, j) => checklistState[`d_${i + 1 + j}`])
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: isLast ? 'none' : '0.5px solid #F5F4F0' }}>
                <div onClick={() => toggleCheck(i)}
                  style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked ? PASS_GREEN : '#C8C5BE'}`, background: checked ? PASS_GREEN : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, cursor: 'pointer' }}>
                  {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleCheck(i)}>
                  <div style={{ fontSize: 13, color: checked ? '#aaa' : '#1a1a1a', lineHeight: 1.4, textDecoration: checked ? 'line-through' : 'none' }}>
                    {item.item}
                  </div>
                  {item.category && (
                    <div style={{ fontSize: 10, color: '#bbb', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.category}</div>
                  )}
                </div>
                <button onClick={() => deleteItem(i)}
                  style={{ background: 'transparent', border: 'none', color: '#D0CDC6', fontSize: 16, cursor: 'pointer', padding: '0 2px', lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; } textarea { outline: none; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Header />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

        <button
          onClick={() => scan.site_id ? router.push(`/sites/${scan.site_id}`) : router.push('/dashboard')}
          style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 16px 0', fontFamily: 'inherit' }}>
          ‹ {currentSite ? currentSite.name : 'Dashboard'}
        </button>

        <PhotoResultCard
          photo={{
            dataUrl: (scan as any).photo_url || null,
            result: {
              work_type: scan.work_type,
              status: scan.status,
              confidence: scan.confidence,
              legislation: scan.legislation || [],
              findings: scan.findings || [],
              summary: scan.summary || '',
              follow_up_questions: scan.follow_up_questions || [],
            },
          }}
          index={0}
          total={1}
          onReanalyse={(_: number, info: string, photos: { dataUrl: string; base64: string }[]) => reanalyseWithContext(info, photos)}
          checklistContent={checklistContent}
        />

        {/* Continue conversation */}
        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
            Continue conversation
          </div>
          <textarea
            value={continueContext}
            onChange={e => setContinueContext(e.target.value)}
            placeholder="Describe what's changed, additional context, or what you'd like re-assessed…"
            rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #C8C5BE', background: '#FAFAF8', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', color: '#1a1a1a', lineHeight: 1.5 }}
          />
          <div style={{ marginTop: 10 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#F8F7F3', border: '0.5px solid #D3D1C7', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#444', fontWeight: 500 }}>
              📷 Attach photos
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={async (e) => {
                const files = Array.from(e.target.files as FileList).slice(0, 3)
                const converted = await Promise.all(files.map((f: File) => convertToJpeg(f)))
                setContinuePhotos((converted as string[]).map((d: string) => ({ dataUrl: d, base64: d.split(',')[1] })))
                e.target.value = ''
              }} />
            </label>
            {continuePhotos.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {continuePhotos.map((p, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={p.dataUrl} style={{ width: 56, height: 56, borderRadius: 7, objectFit: 'cover', border: '0.5px solid #D3D1C7' }} alt="" />
                    <button onClick={() => setContinuePhotos(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#A32D2D', border: '1.5px solid #fff', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {continueError && (
            <div style={{ marginTop: 10, padding: '8px 10px', background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 7, fontSize: 12, color: FAIL_RED }}>
              {continueError}
            </div>
          )}
          <button
            onClick={() => reanalyseWithContext(continueContext, continuePhotos)}
            disabled={continueLoading || continuePhotos.length === 0}
            style={{ marginTop: 12, padding: '10px 20px', background: (continueLoading || continuePhotos.length === 0) ? '#E0DDD6' : NAVY, border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: (continueLoading || continuePhotos.length === 0) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {continueLoading ? 'Analysing…' : 'Re-analyse →'}
          </button>
          {continuePhotos.length === 0 && !continueLoading && (
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>Attach at least one photo to re-analyse</div>
          )}
        </div>

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
