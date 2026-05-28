'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../../lib/supabase'
import { convertToJpeg, SYSTEM_PROMPT } from '../../../components/PhotoResultCard'
import AppHeader from '../../../components/AppHeader'

async function imageUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

async function exportScanPDF(scan: Scan, siteName: string | null, checklist: any[], checklistState: Record<string, any>, notes: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pw = 210, ph = 297, ml = 20, mr = 20, cw = pw - ml - mr
  let y = 0
  doc.setFillColor(22, 24, 28); doc.rect(0, 0, pw, 20, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(239, 234, 224)
  doc.text('Safety', ml, 13); doc.setTextColor(243, 148, 16); doc.text('Scan', ml + doc.getTextWidth('Safety') + 1, 13)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(180, 180, 180)
  doc.text('Queensland Construction Compliance', pw - mr, 13, { align: 'right' }); y = 30
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(22, 24, 28)
  const titleLines = doc.splitTextToSize(scan.work_type || 'Compliance Scan', cw)
  doc.text(titleLines, ml, y); y += titleLines.length * 7 + 3
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120)
  doc.text(`Date: ${new Date(scan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}${siteName ? `  ·  Site: ${siteName}` : ''}`, ml, y); y += 8
  const statusCfg: Record<string, { r: number; g: number; b: number; label: string }> = { pass: { r: 26, g: 122, b: 69, label: 'Compliant' }, fail: { r: 225, g: 75, b: 61, label: 'Issues Found' }, uncertain: { r: 163, g: 98, b: 0, label: 'Uncertain' }, not_applicable: { r: 74, g: 77, b: 82, label: 'N/A' } }
  const sc = statusCfg[scan.status] || statusCfg.uncertain
  doc.setFillColor(sc.r, sc.g, sc.b); doc.roundedRect(ml, y, 36, 7, 2, 2, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255)
  doc.text(sc.label, ml + 18, y + 4.5, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120)
  doc.text(`Confidence: ${scan.confidence || 'low'}`, ml + 40, y + 4.5); y += 14
  const photoUrl = scan.photo_urls?.[0] || scan.photo_url
  if (photoUrl) { const dataUrl = await imageUrlToDataUrl(photoUrl); if (dataUrl) { const imgW = cw, imgH = Math.min(70, imgW * 0.55); try { doc.addImage(dataUrl, 'JPEG', ml, y, imgW, imgH) } catch (_) {}; y += imgH + 6 } }
  const section = (title: string) => { if (y > ph - 40) { doc.addPage(); y = 20 }; doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(100, 100, 100); doc.text(title.toUpperCase(), ml, y); doc.setDrawColor(220, 220, 220); doc.line(ml, y + 2, ml + cw, y + 2); y += 8 }
  const bodyText = (text: string, color = [40, 40, 40]) => { if (y > ph - 30) { doc.addPage(); y = 20 }; doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(color[0], color[1], color[2]); const lines = doc.splitTextToSize(text, cw); doc.text(lines, ml, y); y += lines.length * 5 + 2 }
  if (scan.summary) { section('Summary'); bodyText(scan.summary); y += 4 }
  const legislation = scan.legislation || []
  if (legislation.length > 0) { section('Applicable Queensland Legislation'); for (const leg of legislation) { if (y > ph - 30) { doc.addPage(); y = 20 }; doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(22, 24, 28); doc.text(`${leg.code || ''}: ${leg.name || ''}`, ml, y); y += 5; if (leg.clauses?.length > 0) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.text(leg.clauses.join(', '), ml + 4, y); y += 5 }; y += 2 }; y += 2 }
  const findings = scan.findings || []
  if (findings.length > 0) { section('Findings'); const fc: Record<string, { r: number; g: number; b: number }> = { ok: { r: 26, g: 122, b: 69 }, warning: { r: 163, g: 98, b: 0 }, critical: { r: 225, g: 75, b: 61 } }; for (const f of findings) { if (y > ph - 30) { doc.addPage(); y = 20 }; const c = fc[f.type] || fc.warning; doc.setFillColor(c.r, c.g, c.b); doc.rect(ml, y - 1, 3, 10, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(22, 24, 28); const tl = doc.splitTextToSize(f.title || f.text || '', cw - 8); doc.text(tl, ml + 6, y + 3); y += tl.length * 5 + 1; if (f.detail) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80); const dl = doc.splitTextToSize(f.detail, cw - 8); doc.text(dl, ml + 6, y + 1); y += dl.length * 4.5 + 1 }; y += 4 } }
  const visibleChecklist = checklist.filter((_, i) => !checklistState[`d_${i}`])
  if (visibleChecklist.length > 0) { section('Checklist'); for (let i = 0; i < checklist.length; i++) { if (checklistState[`d_${i}`]) continue; if (y > ph - 20) { doc.addPage(); y = 20 }; const checked = !!checklistState[`c_${i}`]; doc.setDrawColor(150, 150, 150); doc.setFillColor(checked ? 26 : 255, checked ? 122 : 255, checked ? 69 : 255); doc.roundedRect(ml, y - 1, 4, 4, 0.5, 0.5, checked ? 'F' : 'S'); if (checked) { doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(255, 255, 255); doc.text('✓', ml + 0.7, y + 2.3) }; doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(checked ? 150 : 40, checked ? 150 : 40, checked ? 150 : 40); const il = doc.splitTextToSize(checklist[i].item || '', cw - 8); doc.text(il, ml + 7, y + 2.5); y += il.length * 5 + 2 }; y += 4 }
  if (notes.trim()) { section('Notes'); bodyText(notes); y += 4 }
  if (y > ph - 40) { doc.addPage(); y = 20 }
  doc.setDrawColor(220, 220, 220); doc.line(ml, y, ml + cw, y); y += 6
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(140, 140, 140)
  const disclaimerLines = doc.splitTextToSize('This report was generated by SafetyScan AI. Results are indicative only and should be verified by a qualified professional before sign-off.', cw)
  doc.text(disclaimerLines, ml, y); y += disclaimerLines.length * 4.5 + 4
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(160, 160, 160)
  doc.text(`SafetyScan · safetyscan.com.au · Generated ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`, ml, y)
  doc.save(`SafetyScan-${(scan.work_type || 'scan').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${new Date(scan.created_at).toISOString().slice(0, 10)}.pdf`)
}

export default function ScanDetail({ id }: { id: string }) {
  const [scan, setScan] = useState<Scan | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<any[]>([])
  const [checklistState, setChecklistState] = useState<Record<string, any>>({})
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [creatingNewSite, setCreatingNewSite] = useState(false)
  const [newSiteName, setNewSiteName] = useState('')
  const [savingSite, setSavingSite] = useState(false)
  const [generatingChecklist, setGeneratingChecklist] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [checklistError, setChecklistError] = useState<string | null>(null)
  const [continueContext, setContinueContext] = useState('')
  const [continuePhotos, setContinuePhotos] = useState<{ dataUrl: string; base64: string }[]>([])
  const [continueLoading, setContinueLoading] = useState(false)
  const [continueError, setContinueError] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [photoEnlarged, setPhotoEnlarged] = useState<number | false>(false)
  const [activePhoto, setActivePhoto] = useState(0)
  const [editingName, setEditingName] = useState(false)
  const [scanName, setScanName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [shareEnabled, setShareEnabled] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [generatingShare, setGeneratingShare] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [reanalysing, setReanalysing] = useState(false)
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [scanRes, sitesRes] = await Promise.all([
        supabase.from('scans').select('*').eq('id', id).single(),
        supabase.from('sites').select('*').eq('archived', false).order('name', { ascending: true }),
      ])
      if (scanRes.error) { setError(`Could not load scan: ${scanRes.error.message}`); setLoading(false); return }
      if (!scanRes.data) { setError('Scan not found.'); setLoading(false); return }
      const s = scanRes.data as Scan
      setScan(s)
      setPhotoUrls(s.photo_urls?.length ? s.photo_urls : s.photo_url ? [s.photo_url] : [])
      setScanName(s.work_type || '')
      setNotes(s.notes || '')
      setChecklistState(s.checklist_state || {})
      setSelectedSiteId(s.site_id || null)
      setShareToken(s.share_token || null)
      setShareEnabled(s.share_enabled || false)
      if (s.checklist && Array.isArray(s.checklist) && s.checklist.length > 0) setChecklist(s.checklist)
      setSites(sitesRes.data || [])
      setLoading(false)
    }
    init()
  }, [id, router])

  const handleChecklistChange = useCallback(async (newState: Record<string, any>) => {
    setChecklistState(newState)
    await supabase.from('scans').update({ checklist_state: newState }).eq('id', id)
  }, [id])

  const toggleCheck = useCallback((idx: number) => {
    handleChecklistChange({ ...checklistState, [`c_${idx}`]: !checklistState[`c_${idx}`] })
  }, [checklistState, handleChecklistChange])

  const deleteItem = useCallback((idx: number) => {
    handleChecklistChange({ ...checklistState, [`d_${idx}`]: true, [`c_${idx}`]: false })
  }, [checklistState, handleChecklistChange])

  const handleGenerateChecklist = async () => {
    if (!scan) return
    setGeneratingChecklist(true); setChecklistError(null); setConfirmRegenerate(false)
    try {
      const res = await fetch('/api/checklist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ work_type: scan.work_type, findings: scan.findings, legislation: scan.legislation, summary: scan.summary }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const generated = data.checklist
      if (!generated || !Array.isArray(generated)) throw new Error('No checklist returned')
      const newState = {}
      const { error: saveErr } = await supabase.from('scans').update({ checklist: generated, checklist_state: newState }).eq('id', id)
      if (saveErr) throw new Error('Failed to save checklist')
      setChecklist(generated); setChecklistState(newState)
      setScan(prev => prev ? { ...prev, checklist: generated, checklist_state: newState } : prev)
    } catch (e: any) { setChecklistError(e.message || 'Failed to generate checklist') }
    finally { setGeneratingChecklist(false) }
  }

  const saveNotes = async (value: string) => {
    if (!value && !scan?.notes) return
    setNotesSaving(true)
    const { error } = await supabase.from('scans').update({ notes: value }).eq('id', id)
    setNotesSaving(false)
    if (!error) { setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000) }
  }

  const handleNotesChange = (value: string) => {
    setNotes(value); setNotesSaved(false)
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => saveNotes(value), 2000)
  }

  const saveName = async () => {
    if (!scan) return
    await supabase.from('scans').update({ work_type: scanName }).eq('id', id)
    setScan(prev => prev ? { ...prev, work_type: scanName } : prev)
    setEditingName(false)
  }

  const handleSiteChange = async (value: string) => {
    if (value === '__new__') { setCreatingNewSite(true); return }
    const siteId = value || null
    setSelectedSiteId(siteId)
    await supabase.from('scans').update({ site_id: siteId }).eq('id', id)
    setScan(prev => prev ? { ...prev, site_id: siteId } : prev)
  }

  const handleCreateAndAssign = async () => {
    if (!newSiteName.trim()) return
    setSavingSite(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: newSite, error } = await supabase.from('sites').insert({ name: newSiteName.trim(), user_id: user?.id, archived: false }).select().single()
    if (!error && newSite) {
      await supabase.from('scans').update({ site_id: newSite.id }).eq('id', id)
      setSites(prev => [...prev, newSite].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedSiteId(newSite.id)
      setScan(prev => prev ? { ...prev, site_id: newSite.id } : prev)
      setCreatingNewSite(false); setNewSiteName('')
    }
    setSavingSite(false)
  }

  const handleDelete = async () => {
    if (!scan) return
    const urls = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
    for (const url of urls) { const path = url.split('/scan-photos/')[1]; if (path) await supabase.storage.from('scan-photos').remove([path]) }
    await supabase.from('scans').delete().eq('id', id)
    router.push('/dashboard')
  }

  const handleShare = async () => {
    setGeneratingShare(true)
    let token = shareToken
    if (!token) {
      token = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
      await supabase.from('scans').update({ share_token: token, share_enabled: true }).eq('id', id)
      setShareToken(token); setShareEnabled(true)
    } else if (!shareEnabled) {
      await supabase.from('scans').update({ share_enabled: true }).eq('id', id); setShareEnabled(true)
    }
    setGeneratingShare(false)
    const link = `https://safetyscan.com.au/shared/${token}`
    await navigator.clipboard.writeText(link).catch(() => {})
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 3000)
  }

  const handleToggleShare = async () => {
    const newVal = !shareEnabled
    await supabase.from('scans').update({ share_enabled: newVal }).eq('id', id); setShareEnabled(newVal)
  }

  const handleExportPDF = async () => {
    if (!scan) return
    setExportingPDF(true)
    const siteName = scan.site_id ? sites.find(s => s.id === scan.site_id)?.name || null : null
    try { await exportScanPDF(scan, siteName, checklist, checklistState, notes) } catch (e) { console.error('[PDF]', e) } finally { setExportingPDF(false) }
  }

  const reanalyseWithContext = async (additionalInfo: string, extraPhotos: { dataUrl: string; base64: string }[]) => {
    if (!scan) return
    setContinueLoading(true); setContinueError(null)
    try {
      const contextText = `Analyse these construction site photos for Queensland compliance, building on a previous assessment.\n\nPrevious assessment:\nWork type: ${scan.work_type}\nStatus: ${scan.status} (${scan.confidence} confidence)\nSummary: ${scan.summary}\nFindings: ${(scan.findings || []).map((f: any) => f.text || f.title || '').filter(Boolean).join(', ')}\nLegislation: ${(scan.legislation || []).map((l: any) => l.code).join(', ')}${additionalInfo ? `\n\nAdditional context: ${additionalInfo}` : ''}`
      const originalPhotoContent: any[] = (scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])).map((url: string) => ({ type: 'image', source: { type: 'url', url } }))
      const userContent: any[] = [...originalPhotoContent, ...extraPhotos.map(p => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: p.base64 } })), { type: 'text', text: contextText }]
      const res = await fetch('/api/analyse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 2000, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userContent }] }) })
      const data = JSON.parse(await res.text())
      if (!res.ok || data.error) throw new Error(data.error?.message || 'Analysis failed')
      const raw = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text || '').join('').trim()
      const stripped = raw.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim()
      let parsed: any
      try { parsed = JSON.parse(stripped) } catch (_) { const match = stripped.match(/\{[\s\S]*\}/); if (match) parsed = JSON.parse(match[0]); else throw new Error('Could not parse response') }
      const updated = { status: parsed.status || 'uncertain', confidence: parsed.confidence || 'low', work_type: parsed.work_type || scan.work_type, legislation: (parsed.legislation || []).map((l: any) => ({ ...l, clauses: l.clauses || [] })), findings: parsed.findings || [], summary: parsed.summary || '', follow_up_questions: parsed.follow_up_questions || [] }
      const { data: { user } } = await supabase.auth.getUser()
      const newUrls: string[] = []
      if (user && extraPhotos.length > 0) {
        for (let i = 0; i < extraPhotos.length; i++) {
          const blob = await fetch(extraPhotos[i].dataUrl).then(r => r.blob())
          const fileName = `${user.id}/${Date.now()}-extra-${i}.jpg`
          const { error: uploadError } = await supabase.storage.from('scan-photos').upload(fileName, blob, { contentType: 'image/jpeg', upsert: false })
          if (!uploadError) { const { data: urlData } = supabase.storage.from('scan-photos').getPublicUrl(fileName); newUrls.push(urlData.publicUrl) }
        }
      }
      const updatedUrls = newUrls.length > 0 ? [...photoUrls, ...newUrls] : photoUrls
      if (newUrls.length > 0) { await supabase.from('scans').update({ ...updated, photo_urls: updatedUrls }).eq('id', id); setPhotoUrls(updatedUrls) } else { await supabase.from('scans').update(updated).eq('id', id) }
      setScan(prev => prev ? { ...prev, ...updated, photo_urls: updatedUrls } : prev)
      setContinueContext(''); setContinuePhotos([])
    } catch (e: any) { setContinueError(e.message || 'Analysis failed') }
    finally { setContinueLoading(false) }
  }

  const handleReanalyse = async () => {
    if (reanalysing) return
    setReanalysing(true)
    await reanalyseWithContext(continueContext, continuePhotos)
    setReanalysing(false)
  }

  // ── UI ──────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-sans)' }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff-sans)' }}>
      <AppHeader variant="detail" title="Scan" onBack={() => router.push('/dashboard')}/>
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 48px' }}>
        <div style={{ background: 'var(--status-red-bg)', border: '0.5px solid var(--status-red)', borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-red)', marginBottom: 6 }}>Could not load scan</div>
          <div style={{ fontSize: 13, color: 'var(--text-mut)', lineHeight: 1.5 }}>{error}</div>
        </div>
      </main>
    </div>
  )

  if (!scan) return null

  const findings: any[] = scan.findings || []
  const legislation: any[] = scan.legislation || []
  const hasFollowUp = (scan.follow_up_questions || []).length > 0
  const shareLink = shareToken ? `https://safetyscan.com.au/shared/${shareToken}` : null
  const visibleCount = checklist.filter((_, i) => !checklistState[`d_${i}`]).length
  const d = new Date(scan.created_at)
  const siteName = scan.site_id ? sites.find(s => s.id === scan.site_id)?.name : null
  const meta = [siteName?.toUpperCase(), d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(), d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase().replace(' ', '')].filter(Boolean).join(' · ')

  const issueFindings = findings.filter(f => f.type === 'critical' || f.type === 'warning')
  const issueCount = issueFindings.length
  const statusBadge = scan.status === 'pass'
    ? { bg: 'var(--status-green-bg)', color: 'var(--status-green)', dot: 'var(--status-green)', label: 'Clear' }
    : scan.status === 'fail'
    ? { bg: 'var(--status-red-bg)', color: 'var(--status-red)', dot: 'var(--status-red)', label: `${issueCount} issue${issueCount !== 1 ? 's' : ''} found` }
    : { bg: 'var(--status-amber-bg)', color: 'var(--amber)', dot: 'var(--amber)', label: 'Pending review' }

  const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '0 14px', borderRadius: 12, border: 'none', background: 'var(--card-2)', fontSize: 14, fontFamily: 'var(--ff-sans)', color: 'var(--text)', boxSizing: 'border-box', outline: 'none', boxShadow: 'inset 0 0 0 1px var(--border)' }

  return (
    <div className="page-slide-right-in" style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff-sans)', willChange: 'transform, opacity' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} textarea,input{outline:none}`}</style>
      <AppHeader variant="detail" title="Scan" rightAction="share" onBack={() => router.push('/dashboard')}/>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 48px' }}>

        {/* Page title + inline rename */}
        {editingName ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0 12px' }}>
            <input value={scanName} onChange={e => setScanName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus
              style={{ ...inputStyle, flex: 1, height: 44, fontSize: 18, fontWeight: 600 }}/>
            <button onClick={saveName} style={{ height: 44, padding: '0 16px', background: 'var(--amber)', border: 'none', borderRadius: 999, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)', flexShrink: 0 }}>Save</button>
            <button onClick={() => { setScanName(scan.work_type || ''); setEditingName(false) }} style={{ height: 44, padding: '0 14px', background: 'var(--card-2)', border: 'none', borderRadius: 999, color: 'var(--text-mut)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ff-sans)', flexShrink: 0 }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px 4px' }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>{scanName || 'Unnamed scan'}</h1>
            <button onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mut)', fontSize: 15, padding: '2px 4px', lineHeight: 1 }}>✎</button>
          </div>
        )}

        {/* Meta line */}
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-mut)', padding: '0 4px 14px', marginTop: -2 }}>
          {meta}
        </div>

        {/* Photo carousel */}
        {photoUrls.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 220, cursor: 'pointer', backgroundColor: 'var(--card-2)', backgroundImage: 'repeating-linear-gradient(135deg, var(--thumb-2) 0 1.5px, transparent 1.5px 14px)' }}
              onClick={() => setPhotoEnlarged(activePhoto)}>
              <img src={photoUrls[activePhoto]} alt={`Photo ${activePhoto + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
              {photoUrls.length > 1 && (
                <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', color: '#fff', fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.08em' }}>
                  {activePhoto + 1} / {photoUrls.length}
                </div>
              )}
              {photoUrls.length > 1 && activePhoto > 0 && (
                <button onClick={e => { e.stopPropagation(); setActivePhoto(activePhoto - 1) }}
                  style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>‹</button>
              )}
              {photoUrls.length > 1 && activePhoto < photoUrls.length - 1 && (
                <button onClick={e => { e.stopPropagation(); setActivePhoto(activePhoto + 1) }}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>›</button>
              )}
              {photoUrls.length > 1 && (
                <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                  {photoUrls.map((_: string, i: number) => (
                    <button key={i} onClick={e => { e.stopPropagation(); setActivePhoto(i) }}
                      style={{ width: i === activePhoto ? 18 : 6, height: 6, borderRadius: 999, background: i === activePhoto ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }}/>
                  ))}
                </div>
              )}
            </div>
            {photoEnlarged !== false && (
              <div onClick={() => setPhotoEnlarged(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'pointer' }}>
                <img src={photoUrls[photoEnlarged]} alt="Enlarged" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: 12 }}/>
              </div>
            )}
          </div>
        )}

        {/* Status + confidence row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, padding: '6px 12px 6px 10px', borderRadius: 999, background: statusBadge.bg, color: statusBadge.color }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusBadge.dot }}/>
            {statusBadge.label}
          </div>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-mut)', opacity: 0.6 }}>
            AI · {scan.confidence?.toUpperCase() || 'LOW'} CONFIDENCE
          </span>
        </div>

        {/* AI Analysis */}
        {scan.summary && (
          <>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-mut)', padding: '4px 4px 10px' }}>AI Analysis</div>
            <div style={{ background: 'var(--card-2)', borderRadius: 16, padding: '14px 16px', fontSize: 13.2, lineHeight: 1.55, color: 'var(--text)', marginBottom: 4 }}>
              {scan.summary}
            </div>
            {legislation.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 4px' }}>
                {legislation.map((l: any, i: number) => (
                  <span key={i} style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, background: 'var(--card-2)', color: 'var(--text-mut)' }}>{l.code}</span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Issues */}
        {issueFindings.length > 0 && (
          <>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-mut)', padding: '14px 4px 10px' }}>Issues</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {issueFindings.map((f: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'var(--card)', boxShadow: 'var(--shadow-card)', alignItems: 'flex-start' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 7, flexShrink: 0, background: f.type === 'critical' ? 'var(--status-red)' : 'var(--amber)' }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)', marginBottom: 3 }}>{f.title || f.text}</div>
                    {f.detail && <div style={{ fontSize: 12.5, color: 'var(--text-mut)', lineHeight: 1.45, marginBottom: 6 }}>{f.detail}</div>}
                    {f.legislation && <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, background: 'var(--card-2)', color: 'var(--text-mut)' }}>{f.legislation}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* OK findings */}
        {findings.filter(f => f.type === 'ok').length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {findings.filter(f => f.type === 'ok').map((f: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--card)', boxShadow: 'var(--shadow-card)', alignItems: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: 'var(--status-green)' }}/>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{f.text || f.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Checklist */}
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-mut)', padding: '18px 4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Checklist{checklist.length > 0 ? ` (${visibleCount})` : ''}</span>
          {checklist.length > 0 && !generatingChecklist && (
            <button onClick={() => setConfirmRegenerate(true)} style={{ fontFamily: 'var(--ff-sans)', fontSize: 12, padding: '4px 10px', background: 'var(--card-2)', border: 'none', borderRadius: 999, color: 'var(--text-mut)', cursor: 'pointer' }}>Regenerate</button>
          )}
        </div>

        {confirmRegenerate && (
          <div style={{ marginBottom: 10, padding: '12px 14px', background: 'var(--status-amber-bg)', borderRadius: 12, fontSize: 13, color: 'var(--text)' }}>
            This will reset your checklist progress. Are you sure?
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={handleGenerateChecklist} style={{ height: 36, padding: '0 14px', background: 'var(--amber)', border: 'none', borderRadius: 999, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)' }}>Yes, regenerate</button>
              <button onClick={() => setConfirmRegenerate(false)} style={{ height: 36, padding: '0 14px', background: 'var(--card-2)', border: 'none', borderRadius: 999, color: 'var(--text-mut)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ff-sans)' }}>Cancel</button>
            </div>
          </div>
        )}

        {generatingChecklist ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
            <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
            <span style={{ fontSize: 13, color: 'var(--text-mut)' }}>Generating checklist…</span>
          </div>
        ) : checklist.length === 0 ? (
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: 16, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-mut)', lineHeight: 1.5, marginBottom: 14 }}>Generate a custom checklist based on this scan's findings and applicable legislation.</div>
            {checklistError && <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--status-red-bg)', borderRadius: 10, fontSize: 12, color: 'var(--status-red)', fontFamily: 'var(--ff-mono)' }}>{checklistError}</div>}
            <button onClick={handleGenerateChecklist} style={{ height: 44, padding: '0 18px', background: 'var(--amber)', border: 'none', borderRadius: 999, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)', boxShadow: 'var(--shadow-btn-amber)' }}>
              Generate checklist →
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '4px 16px', boxShadow: 'var(--shadow-card)' }}>
            {checklist.map((item: any, i: number) => {
              if (checklistState[`d_${i}`]) return null
              const checked = !!checklistState[`c_${i}`]
              const isLast = checklist.slice(i + 1).every((_: any, j: number) => checklistState[`d_${i + 1 + j}`])
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid var(--divider)' }}>
                  <div onClick={() => toggleCheck(i)} style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer', background: checked ? 'var(--amber)' : 'transparent', boxShadow: checked ? 'none' : 'inset 0 0 0 1.5px var(--border)' }}>
                    {checked && (
                      <span style={{ display: 'block', width: 10, height: 6, borderLeft: '1.8px solid #fff', borderBottom: '1.8px solid #fff', transform: 'rotate(-45deg) translate(1px,-1px)' }}/>
                    )}
                  </div>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleCheck(i)}>
                    <div style={{ fontSize: 13.5, color: checked ? 'var(--text-mut)' : 'var(--text)', textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.55 : 1 }}>{item.item}</div>
                    {item.category && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2, fontFamily: 'var(--ff-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.category}</div>}
                  </div>
                  <button onClick={() => deleteItem(i)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 18, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Re-analyse + Export PDF */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={handleReanalyse} disabled={reanalysing}
            style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--card)', border: 'none', borderRadius: 999, color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: reanalysing ? 'not-allowed' : 'pointer', fontFamily: 'var(--ff-sans)', boxShadow: '0 0 0 1px var(--border)', opacity: reanalysing ? 0.6 : 1 }}>
            {reanalysing ? <><span style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>Re-analysing…</> : <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7a4 4 0 0 1 8 0M11 7a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M11 4v3h-3M3 10V7h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Re-analyse
            </>}
          </button>
          <button onClick={handleExportPDF} disabled={exportingPDF}
            style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--amber)', border: 'none', borderRadius: 999, color: '#fff', fontSize: 14, fontWeight: 600, cursor: exportingPDF ? 'not-allowed' : 'pointer', fontFamily: 'var(--ff-sans)', boxShadow: 'var(--shadow-btn-amber)', opacity: exportingPDF ? 0.6 : 1 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 9v2h8V9M7 2v7m0 0L4 6m3 3 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {exportingPDF ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>

        {/* Continue conversation (re-analyse with context) */}
        {!hasFollowUp && (
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)', marginTop: 14 }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)', marginBottom: 12 }}>Continue conversation</div>
            <textarea value={continueContext} onChange={e => setContinueContext(e.target.value)} placeholder="Describe what's changed, additional context, or what you'd like re-assessed…" rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: 'none', background: 'var(--card-2)', fontSize: 13, fontFamily: 'var(--ff-sans)', resize: 'vertical', color: 'var(--text)', lineHeight: 1.5, boxSizing: 'border-box', boxShadow: 'inset 0 0 0 1px var(--border)' }}/>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', background: 'var(--card-2)', borderRadius: 999, cursor: 'pointer', fontSize: 13, color: 'var(--text-mut)', fontWeight: 500, boxShadow: '0 0 0 1px var(--border)' }}>
                📷 Attach photos
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={async (e) => {
                  const files = Array.from(e.target.files as FileList).slice(0, 3)
                  const converted = await Promise.all(files.map((f: File) => convertToJpeg(f)))
                  setContinuePhotos((converted as string[]).map((d: string) => ({ dataUrl: d, base64: d.split(',')[1] })))
                  e.target.value = ''
                }}/>
              </label>
              {continuePhotos.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {continuePhotos.map((p, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={p.dataUrl} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} alt=""/>
                      <button onClick={() => setContinuePhotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--status-red)', border: '1.5px solid var(--bg)', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {continueError && <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--status-red-bg)', borderRadius: 10, fontSize: 12, color: 'var(--status-red)' }}>{continueError}</div>}
            <button onClick={handleReanalyse} disabled={reanalysing || (continuePhotos.length === 0 && !continueContext.trim())}
              style={{ marginTop: 12, height: 44, padding: '0 20px', background: reanalysing ? 'rgba(243,148,16,0.5)' : 'var(--amber)', border: 'none', borderRadius: 999, color: '#fff', fontSize: 14, fontWeight: 600, cursor: (reanalysing || (!continuePhotos.length && !continueContext.trim())) ? 'not-allowed' : 'pointer', fontFamily: 'var(--ff-sans)', display: 'flex', alignItems: 'center', gap: 8, opacity: (!continuePhotos.length && !continueContext.trim()) ? 0.4 : 1, boxShadow: 'var(--shadow-btn-amber)' }}>
              {reanalysing ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>Re-analysing…</> : 'Re-analyse →'}
            </button>
          </div>
        )}

        {/* Notes */}
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)', marginTop: 14 }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)', marginBottom: 10 }}>Notes</div>
          <textarea value={notes} onChange={e => handleNotesChange(e.target.value)} placeholder="Add notes about this scan…" rows={4}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: 'none', background: 'var(--card-2)', fontSize: 14, fontFamily: 'var(--ff-sans)', resize: 'none', color: 'var(--text)', lineHeight: 1.5, boxSizing: 'border-box', boxShadow: 'inset 0 0 0 1px var(--border)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <button onClick={() => saveNotes(notes)} disabled={notesSaving}
              style={{ height: 36, padding: '0 16px', background: 'var(--card-2)', border: 'none', borderRadius: 999, color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: notesSaving ? 'not-allowed' : 'pointer', fontFamily: 'var(--ff-sans)', boxShadow: '0 0 0 1px var(--border)', opacity: notesSaving ? 0.6 : 1 }}>
              {notesSaving ? 'Saving…' : 'Save notes'}
            </button>
            {notesSaved && <span style={{ fontSize: 12, color: 'var(--status-green)' }}>✓ Saved</span>}
          </div>
        </div>

        {/* Assign to site */}
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)', marginTop: 14 }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)', marginBottom: 10 }}>Assign to site</div>
          <select value={selectedSiteId || ''} onChange={e => handleSiteChange(e.target.value)}
            style={{ display: 'block', width: '100%', height: 50, padding: '0 14px', borderRadius: 12, border: 'none', background: 'var(--card-2)', fontSize: 14, fontFamily: 'var(--ff-sans)', color: 'var(--text)', cursor: 'pointer', boxShadow: 'inset 0 0 0 1px var(--border)', boxSizing: 'border-box' }}>
            <option value="">No site</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="__new__">＋ Create new site</option>
          </select>
          {creatingNewSite && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <input autoFocus value={newSiteName} onChange={e => setNewSiteName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateAndAssign()}
                placeholder="Site name e.g. Ipswich Motorway Upgrade"
                style={{ flex: 1, height: 50, padding: '0 14px', borderRadius: 12, border: '1.5px solid var(--amber)', background: 'var(--card-2)', fontSize: 14, fontFamily: 'var(--ff-sans)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}/>
              <button onClick={handleCreateAndAssign} disabled={!newSiteName.trim() || savingSite}
                style={{ height: 50, padding: '0 16px', background: 'var(--amber)', border: 'none', borderRadius: 999, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)', opacity: newSiteName.trim() ? 1 : 0.5 }}>
                {savingSite ? '…' : 'Create'}
              </button>
              <button onClick={() => { setCreatingNewSite(false); setNewSiteName('') }}
                style={{ height: 50, padding: '0 14px', background: 'var(--card-2)', border: 'none', borderRadius: 999, color: 'var(--text-mut)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ff-sans)', boxShadow: '0 0 0 1px var(--border)' }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Share + PDF alt */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={() => setShareMenuOpen(v => !v)}
            style={{ flex: 1, height: 44, background: 'var(--card)', border: 'none', borderRadius: 999, color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)', boxShadow: '0 0 0 1px var(--border)' }}>
            {shareEnabled ? '🔗 Sharing on' : '🔗 Share scan'}
          </button>
        </div>

        {shareMenuOpen && (
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '14px 16px', boxShadow: 'var(--shadow-card)', marginTop: 8 }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)', marginBottom: 12 }}>Share scan</div>
            {shareEnabled && shareLink ? (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, padding: '10px 12px', background: 'var(--card-2)', borderRadius: 10, fontSize: 11, color: 'var(--text-mut)', wordBreak: 'break-all', fontFamily: 'var(--ff-mono)' }}>{shareLink}</div>
                  <button onClick={handleShare} style={{ height: 40, padding: '0 14px', background: 'var(--card-2)', border: 'none', borderRadius: 10, color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)', flexShrink: 0 }}>
                    {linkCopied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <button onClick={handleToggleShare} style={{ fontSize: 12, color: 'var(--status-red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ff-sans)', padding: 0 }}>Disable sharing</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-mut)', lineHeight: 1.5, marginBottom: 14 }}>Generate a link anyone can view without logging in.</div>
                <button onClick={handleShare} disabled={generatingShare}
                  style={{ height: 44, padding: '0 18px', background: 'var(--amber)', border: 'none', borderRadius: 999, color: '#fff', fontSize: 14, fontWeight: 600, cursor: generatingShare ? 'not-allowed' : 'pointer', fontFamily: 'var(--ff-sans)', boxShadow: 'var(--shadow-btn-amber)', opacity: generatingShare ? 0.6 : 1 }}>
                  {generatingShare ? 'Generating…' : 'Enable sharing & copy link'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Delete */}
        <button onClick={() => setShowDeleteConfirm(true)}
          style={{ width: '100%', height: 44, background: 'transparent', border: '1px solid var(--status-red)', borderRadius: 12, color: 'var(--status-red)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ff-sans)', marginTop: 14 }}>
          Delete scan
        </button>
      </main>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Delete this scan?</div>
            <div style={{ fontSize: 14, color: 'var(--text-mut)', lineHeight: 1.5, marginBottom: 20 }}>This will permanently delete the scan and all associated photos.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, height: 44, background: 'var(--card-2)', border: 'none', borderRadius: 999, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--ff-sans)', color: 'var(--text-mut)' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, height: 44, background: 'var(--status-red)', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
