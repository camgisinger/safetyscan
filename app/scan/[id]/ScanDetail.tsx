'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../../lib/supabase'
import PhotoResultCard, { convertToJpeg, SYSTEM_PROMPT } from '../../../components/PhotoResultCard'
import AppHeader from '../../../components/AppHeader'

const NAVY = '#16181C'
const AMBER = '#F39410'
const OFFWHITE = '#EFEAE0'
const PASS_GREEN = '#1a7a45'
const FAIL_RED = '#E14B3D'
const WARN_AMBER = '#a36200'

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 32, height: 32, border: '3px solid #E0DDD6', borderTopColor: AMBER, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

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

  // Header bar
  doc.setFillColor(22, 24, 28)
  doc.rect(0, 0, pw, 20, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(239, 234, 224)
  doc.text('Safety', ml, 13)
  doc.setTextColor(243, 148, 16)
  doc.text('Scan', ml + doc.getTextWidth('Safety') + 1, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(180, 180, 180)
  doc.text('Queensland Construction Compliance', pw - mr, 13, { align: 'right' })
  y = 30

  // Scan title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(22, 24, 28)
  const titleLines = doc.splitTextToSize(scan.work_type || 'Compliance Scan', cw)
  doc.text(titleLines, ml, y)
  y += titleLines.length * 7 + 3

  // Meta
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  const dateStr = new Date(scan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  doc.text(`Date: ${dateStr}${siteName ? `  ·  Site: ${siteName}` : ''}`, ml, y)
  y += 8

  // Status badge
  const statusCfg: Record<string, { r: number; g: number; b: number; label: string }> = {
    pass: { r: 26, g: 122, b: 69, label: 'Compliant' },
    fail: { r: 225, g: 75, b: 61, label: 'Issues Found' },
    uncertain: { r: 163, g: 98, b: 0, label: 'Uncertain' },
    not_applicable: { r: 74, g: 77, b: 82, label: 'N/A' },
  }
  const sc = statusCfg[scan.status] || statusCfg.uncertain
  doc.setFillColor(sc.r, sc.g, sc.b)
  doc.roundedRect(ml, y, 36, 7, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(sc.label, ml + 18, y + 4.5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Confidence: ${scan.confidence || 'low'}`, ml + 40, y + 4.5)
  y += 14

  // Photo
  const photoUrl = scan.photo_urls?.[0] || scan.photo_url
  if (photoUrl) {
    const dataUrl = await imageUrlToDataUrl(photoUrl)
    if (dataUrl) {
      const imgW = cw, imgH = Math.min(70, imgW * 0.55)
      try { doc.addImage(dataUrl, 'JPEG', ml, y, imgW, imgH) } catch (_) {}
      y += imgH + 6
    }
  }

  const section = (title: string) => {
    if (y > ph - 40) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(title.toUpperCase(), ml, y)
    doc.setDrawColor(220, 220, 220)
    doc.line(ml, y + 2, ml + cw, y + 2)
    y += 8
  }

  const bodyText = (text: string, color = [40, 40, 40]) => {
    if (y > ph - 30) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(color[0], color[1], color[2])
    const lines = doc.splitTextToSize(text, cw)
    doc.text(lines, ml, y)
    y += lines.length * 5 + 2
  }

  // Summary
  if (scan.summary) {
    section('Summary')
    bodyText(scan.summary)
    y += 4
  }

  // Legislation
  const legislation = scan.legislation || []
  if (legislation.length > 0) {
    section('Applicable Queensland Legislation')
    for (const leg of legislation) {
      if (y > ph - 30) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(22, 24, 28)
      doc.text(`${leg.code || ''}: ${leg.name || ''}`, ml, y)
      y += 5
      if (leg.clauses && leg.clauses.length > 0) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(leg.clauses.join(', '), ml + 4, y)
        y += 5
      }
      y += 2
    }
    y += 2
  }

  // Findings
  const findings = scan.findings || []
  if (findings.length > 0) {
    section('Findings')
    const findingColors: Record<string, { r: number; g: number; b: number }> = {
      ok: { r: 26, g: 122, b: 69 },
      warning: { r: 163, g: 98, b: 0 },
      critical: { r: 225, g: 75, b: 61 },
    }
    for (const f of findings) {
      if (y > ph - 30) { doc.addPage(); y = 20 }
      const fc = findingColors[f.type] || findingColors.warning
      doc.setFillColor(fc.r, fc.g, fc.b)
      doc.rect(ml, y - 1, 3, 10, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(22, 24, 28)
      const titleLines = doc.splitTextToSize(f.title || '', cw - 8)
      doc.text(titleLines, ml + 6, y + 3)
      y += titleLines.length * 5 + 1
      if (f.detail) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(80, 80, 80)
        const detailLines = doc.splitTextToSize(f.detail, cw - 8)
        doc.text(detailLines, ml + 6, y + 1)
        y += detailLines.length * 4.5 + 1
      }
      y += 4
    }
  }

  // Checklist
  const visibleChecklist = checklist.filter((_, i) => !checklistState[`d_${i}`])
  if (visibleChecklist.length > 0) {
    section('Checklist')
    for (let i = 0; i < checklist.length; i++) {
      if (checklistState[`d_${i}`]) continue
      if (y > ph - 20) { doc.addPage(); y = 20 }
      const checked = !!checklistState[`c_${i}`]
      doc.setDrawColor(150, 150, 150)
      doc.setFillColor(checked ? 26 : 255, checked ? 122 : 255, checked ? 69 : 255)
      doc.roundedRect(ml, y - 1, 4, 4, 0.5, 0.5, checked ? 'F' : 'S')
      if (checked) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6)
        doc.setTextColor(255, 255, 255)
        doc.text('✓', ml + 0.7, y + 2.3)
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(checked ? 150 : 40, checked ? 150 : 40, checked ? 150 : 40)
      const itemLines = doc.splitTextToSize(checklist[i].item || '', cw - 8)
      doc.text(itemLines, ml + 7, y + 2.5)
      y += itemLines.length * 5 + 2
    }
    y += 4
  }

  // Notes
  if (notes.trim()) {
    section('Notes')
    bodyText(notes)
    y += 4
  }

  // Disclaimer
  if (y > ph - 40) { doc.addPage(); y = 20 }
  doc.setDrawColor(220, 220, 220)
  doc.line(ml, y, ml + cw, y)
  y += 6
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(140, 140, 140)
  const disclaimer = 'This report was generated by SafetyScan AI. Results are indicative only and should be verified by a qualified professional before sign-off.'
  const disclaimerLines = doc.splitTextToSize(disclaimer, cw)
  doc.text(disclaimerLines, ml, y)
  y += disclaimerLines.length * 4.5 + 4

  // Footer
  const genDate = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(160, 160, 160)
  doc.text(`SafetyScan · safetyscan.com.au · Generated ${genDate}`, ml, y)

  const slug = (scan.work_type || 'scan').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  const dateSlug = new Date(scan.created_at).toISOString().slice(0, 10)
  doc.save(`SafetyScan-${slug}-${dateSlug}.pdf`)
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
  const [assignSiteId, setAssignSiteId] = useState('')
  const [assignSaving, setAssignSaving] = useState(false)
  const [generatingChecklist, setGeneratingChecklist] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [checklistError, setChecklistError] = useState<string | null>(null)
  const [continueContext, setContinueContext] = useState('')
  const [continuePhotos, setContinuePhotos] = useState<{ dataUrl: string; base64: string }[]>([])
  const [continueLoading, setContinueLoading] = useState(false)
  const [continueError, setContinueError] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [photoEnlarged, setPhotoEnlarged] = useState<number | false>(false)
  const [editingName, setEditingName] = useState(false)
  const [scanName, setScanName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [shareEnabled, setShareEnabled] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [generatingShare, setGeneratingShare] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  console.log('[scan detail] id:', id, 'type:', typeof id)

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
      console.log('[ScanDetail] loaded scan id:', s.id, 'photo_url:', s.photo_url)
      setScan(s)
      setPhotoUrls(s.photo_urls?.length ? s.photo_urls : s.photo_url ? [s.photo_url] : [])
      setScanName(s.work_type || '')
      setNotes(s.notes || '')
      setChecklistState(s.checklist_state || {})
      setAssignSiteId(s.site_id || '')
      setShareToken(s.share_token || null)
      setShareEnabled(s.share_enabled || false)
      if (s.checklist && Array.isArray(s.checklist) && s.checklist.length > 0) {
        setChecklist(s.checklist)
        console.log('[checklist] loaded from db:', s.checklist.length, 'items')
      } else {
        console.log('[checklist] none saved for this scan')
      }
      setSites(sitesRes.data || [])
      setLoading(false)
    }
    init()
  }, [id, router])

  const handleChecklistChange = useCallback(async (newState: Record<string, any>) => {
    setChecklistState(newState)
    const { error } = await supabase.from('scans').update({ checklist_state: newState }).eq('id', id)
    if (error) console.error('[checklist_state] save error:', error)
  }, [id])

  const toggleCheck = useCallback((idx: number) => {
    const key = `c_${idx}`
    handleChecklistChange({ ...checklistState, [key]: !checklistState[key] })
  }, [checklistState, handleChecklistChange])

  const deleteItem = useCallback((idx: number) => {
    handleChecklistChange({ ...checklistState, [`d_${idx}`]: true, [`c_${idx}`]: false })
  }, [checklistState, handleChecklistChange])

  const handleGenerateChecklist = async () => {
    if (!scan) return
    setGeneratingChecklist(true)
    setChecklistError(null)
    setConfirmRegenerate(false)
    try {
      console.log('[checklist] generating for scan:', id)
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
      const generated = data.checklist
      if (!generated || !Array.isArray(generated)) throw new Error('No checklist returned from API')
      console.log('[checklist] generated:', generated.length, 'items — saving to scanId:', id)
      const newState = {}
      const { data: updatedRows, error: saveErr } = await supabase.from('scans').update({ checklist: generated, checklist_state: newState }).eq('id', id).select()
      console.log('[checklist] rows updated:', updatedRows, 'error:', saveErr)
      if (saveErr) throw new Error('Failed to save checklist')
      console.log('[checklist] saved successfully, rows affected:', updatedRows?.length)
      setChecklist(generated)
      setChecklistState(newState)
      setScan(prev => prev ? { ...prev, checklist: generated, checklist_state: newState } : prev)
    } catch (e: any) {
      setChecklistError(e.message || 'Failed to generate checklist')
    } finally {
      setGeneratingChecklist(false)
    }
  }

  const saveNotes = async (value: string) => {
    if (!value && !scan?.notes) return
    setNotesSaving(true)
    const { error } = await supabase.from('scans').update({ notes: value }).eq('id', id)
    setNotesSaving(false)
    if (!error) { setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000) }
    else console.error('[notes] save error:', error)
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    setNotesSaved(false)
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => saveNotes(value), 2000)
  }

  const saveName = async () => {
    if (!scan) return
    await supabase.from('scans').update({ work_type: scanName }).eq('id', id)
    setScan(prev => prev ? { ...prev, work_type: scanName } : prev)
    setEditingName(false)
  }

  const saveSiteAssignment = async (siteId: string) => {
    setAssignSaving(true)
    await supabase.from('scans').update({ site_id: siteId || null }).eq('id', id)
    setAssignSiteId(siteId)
    setScan(prev => prev ? { ...prev, site_id: siteId || null } : prev)
    setAssignSaving(false)
  }

  const handleDelete = async () => {
    if (!scan) return
    const urls = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
    for (const url of urls) {
      const path = url.split('/scan-photos/')[1]
      if (path) await supabase.storage.from('scan-photos').remove([path])
    }
    await supabase.from('scans').delete().eq('id', id)
    router.push('/dashboard')
  }

  const handleShare = async () => {
    setGeneratingShare(true)
    let token = shareToken
    if (!token) {
      token = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36)
      await supabase.from('scans').update({ share_token: token, share_enabled: true }).eq('id', id)
      setShareToken(token)
      setShareEnabled(true)
    } else if (!shareEnabled) {
      await supabase.from('scans').update({ share_enabled: true }).eq('id', id)
      setShareEnabled(true)
    }
    setGeneratingShare(false)
    const link = `https://safetyscan.com.au/shared/${token}`
    await navigator.clipboard.writeText(link).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 3000)
  }

  const handleToggleShare = async () => {
    const newVal = !shareEnabled
    await supabase.from('scans').update({ share_enabled: newVal }).eq('id', id)
    setShareEnabled(newVal)
  }

  const handleExportPDF = async () => {
    if (!scan) return
    setExportingPDF(true)
    const siteName = scan.site_id ? sites.find(s => s.id === scan.site_id)?.name || null : null
    try {
      await exportScanPDF(scan, siteName, checklist, checklistState, notes)
    } catch (e) {
      console.error('[PDF] export error:', e)
    } finally {
      setExportingPDF(false)
    }
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
Findings: ${(scan.findings || []).map((f: any) => f.text || f.title || '').filter(Boolean).join(', ')}
Legislation: ${(scan.legislation || []).map((l: any) => l.code).join(', ')}${additionalInfo ? `\n\nAdditional context from site: ${additionalInfo}` : ''}`

      const originalPhotoContent: any[] = (scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])).map((url: string) => ({
        type: 'image', source: { type: 'url', url },
      }))

      const userContent: any[] = [
        ...originalPhotoContent,
        ...extraPhotos.map(p => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: p.base64 } })),
        { type: 'text', text: contextText },
      ]

      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 2000, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: userContent }] }),
      })

      const rawText = await res.text()
      const data = JSON.parse(rawText)
      if (!res.ok || data.error) throw new Error(data.error?.message || data.message || 'Analysis failed')

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

      const { data: { user } } = await supabase.auth.getUser()
      const newlyUploadedUrls: string[] = []
      if (user && extraPhotos.length > 0) {
        for (let i = 0; i < extraPhotos.length; i++) {
          const blob = await fetch(extraPhotos[i].dataUrl).then(r => r.blob())
          const fileName = `${user.id}/${Date.now()}-extra-${i}.jpg`
          const { error: uploadError } = await supabase.storage.from('scan-photos').upload(fileName, blob, { contentType: 'image/jpeg', upsert: false })
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('scan-photos').getPublicUrl(fileName)
            newlyUploadedUrls.push(urlData.publicUrl)
          }
        }
      }

      const updatedUrls = newlyUploadedUrls.length > 0 ? [...photoUrls, ...newlyUploadedUrls] : photoUrls
      if (newlyUploadedUrls.length > 0) {
        await supabase.from('scans').update({ ...updated, photo_urls: updatedUrls }).eq('id', id)
        setPhotoUrls(updatedUrls)
      } else {
        await supabase.from('scans').update(updated).eq('id', id)
      }
      setScan(prev => prev ? { ...prev, ...updated, photo_urls: updatedUrls } : prev)
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
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; }`}</style>
      <AppHeader />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 16px 0', fontFamily: 'inherit' }}>‹ Dashboard</button>
        <div style={{ background: 'rgba(225,75,61,0.1)', border: '0.5px solid #F09595', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: FAIL_RED, marginBottom: 6 }}>Could not load scan</div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{error}</div>
        </div>
      </main>
    </div>
  )

  if (!scan) return null

  const photoCount = photoUrls.length
  const photoLabel = photoCount > 1 ? `${photoCount} photos analysed` : '1 photo analysed'
  const currentSite = scan.site_id ? sites.find(s => s.id === scan.site_id) : null
  const visibleCount = checklist.filter((_, i) => !checklistState[`d_${i}`]).length
  const hasFollowUp = (scan.follow_up_questions || []).length > 0
  const shareLink = shareToken ? `https://safetyscan.com.au/shared/${shareToken}` : null

  const checklistContent = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: checklist.length > 0 || generatingChecklist ? 12 : 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>
          Site checklist{checklist.length > 0 ? ` (${visibleCount})` : ''}
        </div>
        {checklist.length > 0 && !generatingChecklist && (
          <button onClick={() => setConfirmRegenerate(true)} style={{ fontSize: 11, padding: '3px 9px', background: 'transparent', border: '0.5px solid #D3D1C7', borderRadius: 6, color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>Regenerate</button>
        )}
      </div>

      {confirmRegenerate && (
        <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(243,148,16,0.1)', border: '0.5px solid #FAC775', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#854F0B', marginBottom: 8, lineHeight: 1.5 }}>This will reset your checklist progress. Are you sure?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleGenerateChecklist} style={{ padding: '6px 12px', background: '#854F0B', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, regenerate</button>
            <button onClick={() => setConfirmRegenerate(false)} style={{ padding: '6px 12px', background: 'transparent', border: '0.5px solid #D3D1C7', borderRadius: 6, color: '#555', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
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
          <div style={{ fontSize: 13, color: '#999', lineHeight: 1.5, marginBottom: 12 }}>Generate a custom checklist based on this scan's findings and applicable legislation.</div>
          {checklistError && (
            <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(225,75,61,0.1)', border: '0.5px solid #F09595', borderRadius: 7, fontSize: 12, color: FAIL_RED }}>{checklistError}</div>
          )}
          <button onClick={handleGenerateChecklist} style={{ padding: '10px 18px', background: AMBER, border: 'none', borderRadius: 9, color: NAVY, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Generate checklist →</button>
        </div>
      ) : (
        <div>
          {checklist.map((item, i) => {
            if (checklistState[`d_${i}`]) return null
            const checked = !!checklistState[`c_${i}`]
            const isLast = checklist.slice(i + 1).every((_, j) => checklistState[`d_${i + 1 + j}`])
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: isLast ? 'none' : '0.5px solid #F5F4F0' }}>
                <div onClick={() => toggleCheck(i)} style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked ? PASS_GREEN : '#C8C5BE'}`, background: checked ? PASS_GREEN : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, cursor: 'pointer' }}>
                  {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleCheck(i)}>
                  <div style={{ fontSize: 13, color: checked ? '#aaa' : '#1a1a1a', lineHeight: 1.4, textDecoration: checked ? 'line-through' : 'none' }}>{item.item}</div>
                  {item.category && <div style={{ fontSize: 10, color: '#bbb', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.category}</div>}
                </div>
                <button onClick={() => deleteItem(i)} style={{ background: 'transparent', border: 'none', color: '#D0CDC6', fontSize: 16, cursor: 'pointer', padding: '0 2px', lineHeight: 1, flexShrink: 0, marginTop: 1 }}>×</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; } textarea, input { outline: none; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppHeader />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 48px' }}>

        <button onClick={() => scan.site_id ? router.push(`/sites/${scan.site_id}`) : router.push('/dashboard')}
          style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 16px 0', fontFamily: 'inherit' }}>
          ‹ {currentSite ? currentSite.name : 'Dashboard'}
        </button>

        {/* Inline rename */}
        {editingName ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <input value={scanName} onChange={e => setScanName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #F5A623', fontSize: 16, fontWeight: 600, fontFamily: 'inherit', color: NAVY }} />
            <button onClick={saveName} style={{ padding: '8px 14px', background: NAVY, border: 'none', borderRadius: 8, color: AMBER, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
            <button onClick={() => { setScanName(scan.work_type || ''); setEditingName(false) }} style={{ padding: '8px 14px', background: 'transparent', border: '0.5px solid #C8C5BE', borderRadius: 8, color: '#888', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>{scanName}</h1>
            <button onClick={() => setEditingName(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 16, padding: '2px 4px', lineHeight: 1 }}>✎</button>
          </div>
        )}

        {/* Photo strip */}
        {photoUrls.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {photoUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPhotoEnlarged(i)}>
                  <img src={url} alt={`Site photo ${i + 1}`}
                    style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.08)', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 4 }}>{i + 1}</div>
                </div>
              ))}
            </div>
            {photoEnlarged !== false && (
              <div onClick={() => setPhotoEnlarged(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'pointer' }}>
                <img src={photoUrls[photoEnlarged]} alt="Site photo enlarged" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: 8 }} />
              </div>
            )}
          </>
        )}

        <PhotoResultCard
          photo={{ dataUrl: photoUrls[0] || null, result: { work_type: scan.work_type, status: scan.status, confidence: scan.confidence, legislation: scan.legislation || [], findings: scan.findings || [], summary: scan.summary || '', follow_up_questions: scan.follow_up_questions || [] } }}
          index={0}
          total={1}
          photoLabel={photoLabel}
          onReanalyse={(_: number, info: string, photos: { dataUrl: string; base64: string }[]) => reanalyseWithContext(info, photos)}
          checklistContent={checklistContent}
        />

        {/* Continue conversation */}
        {!hasFollowUp && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Continue conversation</div>
            <textarea value={continueContext} onChange={e => setContinueContext(e.target.value)} placeholder="Describe what's changed, additional context, or what you'd like re-assessed…" rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #C8C5BE', background: '#FAFAF8', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', color: '#1a1a1a', lineHeight: 1.5 }} />
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
                      <button onClick={() => setContinuePhotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#A32D2D', border: '1.5px solid #fff', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {continueError && <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(225,75,61,0.1)', border: '0.5px solid #F09595', borderRadius: 7, fontSize: 12, color: FAIL_RED }}>{continueError}</div>}
            <button
              onClick={() => {
                console.log('[reanalyse] button clicked, notes:', continueContext, 'photos:', continuePhotos.length)
                reanalyseWithContext(continueContext, continuePhotos)
              }}
              disabled={continueLoading || (continuePhotos.length === 0 && !continueContext.trim())}
              style={{ marginTop: 12, padding: '10px 20px', background: (continueLoading || (continuePhotos.length === 0 && !continueContext.trim())) ? '#E0DDD6' : NAVY, border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: (continueLoading || (continuePhotos.length === 0 && !continueContext.trim())) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {continueLoading ? 'Analysing…' : 'Re-analyse →'}
            </button>
            {continuePhotos.length === 0 && !continueContext.trim() && !continueLoading && <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>Add context or attach photos to re-analyse</div>}
          </div>
        )}

        {/* Notes */}
        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Notes</div>
          <textarea value={notes} onChange={e => handleNotesChange(e.target.value)} placeholder="Add notes about this scan…" rows={4}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #C8C5BE', background: '#FAFAF8', fontSize: 14, fontFamily: 'inherit', resize: 'none', color: '#1a1a1a', lineHeight: 1.5, boxSizing: 'border-box' as const }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <button onClick={() => saveNotes(notes)} disabled={notesSaving}
              style={{ padding: '8px 16px', background: NAVY, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: notesSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: notesSaving ? 0.6 : 1 }}>
              {notesSaving ? 'Saving…' : 'Save notes'}
            </button>
            {notesSaved && <span style={{ fontSize: 12, color: PASS_GREEN }}>✓ Saved</span>}
          </div>
        </div>

        {/* Assign to site */}
        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #E0DDD6', padding: '14px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
            {scan.site_id ? 'Move to different site' : 'Assign to site'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={assignSiteId} onChange={e => setAssignSiteId(e.target.value)}
              style={{ flex: 1, padding: '9px 11px', borderRadius: 8, border: '0.5px solid #C8C5BE', background: '#FAFAF8', fontSize: 13, fontFamily: 'inherit', color: '#1a1a1a', cursor: 'pointer' }}>
              <option value="">No site</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => saveSiteAssignment(assignSiteId)} disabled={assignSaving || assignSiteId === (scan.site_id || '')}
              style={{ padding: '9px 16px', background: (assignSaving || assignSiteId === (scan.site_id || '')) ? '#E0DDD6' : NAVY, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: (assignSaving || assignSiteId === (scan.site_id || '')) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              {assignSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Share + PDF */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 8 }}>
          <button onClick={() => setShareMenuOpen(v => !v)}
            style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #D3D1C7', borderRadius: 8, color: NAVY, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {shareEnabled ? '🔗 Sharing on' : '🔗 Share scan'}
          </button>
          <button onClick={handleExportPDF} disabled={exportingPDF}
            style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #D3D1C7', borderRadius: 8, color: NAVY, fontSize: 13, fontWeight: 600, cursor: exportingPDF ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: exportingPDF ? 0.6 : 1 }}>
            {exportingPDF ? 'Exporting…' : '↓ Export PDF'}
          </button>
        </div>

        {/* Share panel */}
        {shareMenuOpen && (
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #E0DDD6', padding: '14px 16px', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Share scan</div>
            {shareEnabled && shareLink ? (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, padding: '8px 10px', background: '#F8F7F3', borderRadius: 7, border: '0.5px solid #E0DDD6', fontSize: 11, color: '#555', wordBreak: 'break-all', fontFamily: 'monospace' }}>{shareLink}</div>
                  <button onClick={handleShare} style={{ padding: '8px 12px', background: NAVY, border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {linkCopied ? '✓ Copied' : 'Copy link'}
                  </button>
                </div>
                <button onClick={handleToggleShare} style={{ fontSize: 12, color: FAIL_RED, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                  Disable sharing
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 12 }}>
                  Generate a link anyone can view without logging in.
                </div>
                <button onClick={handleShare} disabled={generatingShare}
                  style={{ padding: '9px 18px', background: AMBER, border: 'none', borderRadius: 8, color: NAVY, fontSize: 13, fontWeight: 700, cursor: generatingShare ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: generatingShare ? 0.6 : 1 }}>
                  {generatingShare ? 'Generating…' : 'Enable sharing & copy link'}
                </button>
                {shareToken && !shareEnabled && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>Sharing is currently disabled for this scan.</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Delete */}
        <button onClick={() => setShowDeleteConfirm(true)}
          style={{ width: '100%', padding: 11, background: 'transparent', border: '1px solid #E14B3D', borderRadius: 8, color: '#E14B3D', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
          Delete scan
        </button>

      </main>

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Delete this scan?</div>
            <div style={{ fontSize: 14, color: '#888', lineHeight: 1.5, marginBottom: 20 }}>This will permanently delete the scan and all associated photos. This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: 11, background: 'transparent', border: '1px solid #D3D1C7', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: 11, background: '#E14B3D', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
