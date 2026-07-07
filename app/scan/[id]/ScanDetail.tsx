'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Site, Scan } from '../../../lib/supabase'
import { convertToJpeg } from '../../../components/PhotoResultCard'
import AppHeader from '../../../components/AppHeader'
import LegislationList from '../../../components/LegislationList'

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

  const pw = 210, ph = 297, ml = 18, mr = 18, cw = pw - ml - mr
  let y = 0

  // ── Design tokens ────────────────────────────────────────────────────────────
  type RGB = [number, number, number]
  const NAVY:    RGB = [22,  24,  28]
  const AMBER:   RGB = [243, 148, 16]
  const CREAM:   RGB = [241, 239, 232]
  const TEXT:    RGB = [22,  24,  28]
  const MUT:     RGB = [120, 120, 120]
  const LINE:    RGB = [220, 218, 210]
  const WHITE:   RGB = [255, 255, 255]
  const GREEN:   RGB = [26,  122, 69]
  const RED:     RGB = [225, 75,  61]
  const WARN:    RGB = [163, 98,  0]
  const GREY:    RGB = [74,  77,  82]
  const CARDBG:  RGB = [248, 247, 244]
  const HDIM:    RGB = [180, 180, 180]
  const CBXLINE: RGB = [160, 160, 160]

  const fill   = (c: RGB) => doc.setFillColor(c[0], c[1], c[2])
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2])
  const color  = (c: RGB) => doc.setTextColor(c[0], c[1], c[2])

  // ── Header bar ───────────────────────────────────────────────────────────────
  fill(NAVY); doc.rect(0, 0, pw, 22, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); color(WHITE)
  doc.text('Safety', ml, 14.5)
  color(AMBER); doc.text('Scan', ml + doc.getTextWidth('Safety') + 0.8, 14.5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(HDIM)
  const hDate = new Date(scan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  doc.text(siteName ? `${siteName}  ·  ${hDate}` : hDate, pw - mr, 14.5, { align: 'right' })
  y = 32

  // ── Title ────────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); color(TEXT)
  const titleLines = doc.splitTextToSize(scan.work_type || 'Compliance Scan', cw)
  doc.text(titleLines, ml, y); y += titleLines.length * 8 + 3

  // ── Status badge ─────────────────────────────────────────────────────────────
  const STATUS: Record<string, { c: RGB; label: string }> = {
    pass:           { c: GREEN, label: 'Compliant' },
    fail:           { c: RED,   label: 'Issues Found' },
    uncertain:      { c: WARN,  label: 'Uncertain' },
    not_applicable: { c: GREY,  label: 'N/A' },
  }
  const sc = STATUS[scan.status] || STATUS.uncertain
  fill(sc.c); doc.roundedRect(ml, y, 40, 7.5, 2, 2, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); color(WHITE)
  doc.text(sc.label, ml + 20, y + 5, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); color(MUT)
  doc.text(`Confidence: ${scan.confidence || 'low'}`, ml + 44, y + 5)
  y += 14

  // ── Photos ───────────────────────────────────────────────────────────────────
  const allPhotoUrls = scan.photo_urls?.length ? scan.photo_urls : scan.photo_url ? [scan.photo_url] : []
  if (allPhotoUrls.length > 0) {
    const photos = (await Promise.all(
      allPhotoUrls.map(async u => {
        const d = await imageUrlToDataUrl(u)
        if (!d) return null
        const dims = await new Promise<{ w: number; h: number }>(res => {
          const img = new window.Image()
          img.onload  = () => res({ w: img.naturalWidth, h: img.naturalHeight })
          img.onerror = () => res({ w: 4, h: 3 })
          img.src = d
        })
        return { d, dims }
      })
    )).filter(Boolean) as { d: string; dims: { w: number; h: number } }[]

    if (photos.length > 0) {
      const n     = photos.length
      const cols  = n === 1 ? 1 : 2
      const gap   = 3
      const cellW = (cw - (cols - 1) * gap) / cols
      const rowH  = n === 1 ? 80 : 52

      for (let i = 0; i < n; i += cols) {
        const row = photos.slice(i, i + cols)
        row.forEach((p, j) => {
          const cellX = ml + j * (cellW + gap)
          const r = p.dims.w / p.dims.h
          // contain-fit: scale to fill cellW×rowH while preserving aspect ratio
          let imgW: number, imgH: number, offX = 0, offY = 0
          if (r > cellW / rowH) {
            imgW = cellW; imgH = cellW / r; offY = (rowH - imgH) / 2
          } else {
            imgH = rowH; imgW = rowH * r; offX = (cellW - imgW) / 2
          }
          try { doc.addImage(p.d, 'JPEG', cellX + offX, y + offY, imgW, imgH) } catch (_) {}
        })
        y += rowH + 3
      }
      y += 4
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const section = (title: string, subtitle?: string) => {
    if (y > ph - 40) { doc.addPage(); y = 22 }
    fill(CREAM); doc.rect(ml - 2, y - 3, cw + 4, 8.5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); color(AMBER)
    doc.text(title.toUpperCase(), ml, y + 2.5)
    if (subtitle) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(MUT)
      doc.text(subtitle, pw - mr, y + 2.5, { align: 'right' })
    }
    stroke(LINE); doc.line(ml - 2, y + 5.5, ml + cw + 2, y + 5.5)
    y += 12
  }

  const bodyText = (text: string, c: RGB = TEXT) => {
    if (y > ph - 30) { doc.addPage(); y = 22 }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); color(c)
    const lines = doc.splitTextToSize(text, cw)
    doc.text(lines, ml, y); y += lines.length * 5 + 2
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  if (scan.summary) { section('Summary'); bodyText(scan.summary); y += 4 }

  // ── Legislation ──────────────────────────────────────────────────────────────
  const legislation = scan.legislation || []
  if (legislation.length > 0) {
    section('Applicable Queensland Legislation')
    for (const leg of legislation) {
      if (y > ph - 30) { doc.addPage(); y = 22 }

      // Legislation name
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); color(TEXT)
      const legTitle = doc.splitTextToSize(`${leg.code || ''}: ${leg.description || leg.name || ''}`, cw)
      doc.text(legTitle, ml, y); y += legTitle.length * 5 + 2

      if (leg.clauses?.length > 0) {
        const clauses = leg.clauses as { ref?: string; summary?: string }[]

        // Row of clause ref pills (navy bg, amber text)
        const pillH = 4.5, pillPadX = 2, pillFs = 7
        let px = ml + 2
        doc.setFont('helvetica', 'bold'); doc.setFontSize(pillFs)
        for (const clause of clauses) {
          if (!clause.ref) continue
          const pillW = doc.getTextWidth(clause.ref) + pillPadX * 2 + 1
          if (px + pillW > ml + cw) { px = ml + 2; y += pillH + 2 }
          fill(NAVY); doc.roundedRect(px, y, pillW, pillH, 1, 1, 'F')
          color(AMBER); doc.text(clause.ref, px + pillPadX + 0.5, y + 3.3)
          px += pillW + 2
        }
        y += pillH + 3

        // Clause summaries
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(MUT)
        for (const clause of clauses) {
          if (!clause.summary) continue
          const sl = doc.splitTextToSize(`${clause.ref ? clause.ref + ' — ' : ''}${clause.summary}`, cw - 4)
          doc.text(sl, ml + 4, y); y += sl.length * 4 + 1
        }
      }
      y += 4
    }
    y += 2
  }

  // ── Findings ─────────────────────────────────────────────────────────────────
  const findings = scan.findings || []
  if (findings.length > 0) {
    section('Findings')
    const FC: Record<string, RGB> = { ok: GREEN, warning: WARN, critical: RED }
    for (const f of findings) {
      if (y > ph - 30) { doc.addPage(); y = 22 }
      const c = FC[f.type] || FC.warning
      // Pre-measure to size the card correctly before drawing it
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
      const tl = doc.splitTextToSize(f.title || f.text || '', cw - 10)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
      const dl = f.detail ? doc.splitTextToSize(f.detail, cw - 10) : []
      const cardH = 4 + tl.length * 4.5 + (dl.length > 0 ? 2 + dl.length * 4 : 0) + 5
      // Card background
      fill(CARDBG); doc.roundedRect(ml, y, cw, cardH, 1.5, 1.5, 'F')
      // Coloured left border (plain rect squares off the right edge of the pill)
      fill(c)
      doc.roundedRect(ml, y, 3.5, cardH, 1, 1, 'F')
      doc.rect(ml + 2, y, 1.5, cardH, 'F')
      // Title
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); color(TEXT)
      doc.text(tl, ml + 7, y + 5)
      let iy = y + 5 + tl.length * 4.5 + 1
      // Detail
      if (dl.length > 0) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(MUT)
        doc.text(dl, ml + 7, iy + 1)
      }
      y += cardH + 3
    }
    y += 2
  }

  // ── Checklist ────────────────────────────────────────────────────────────────
  const visibleIndices = checklist.map((_, i) => i).filter(i => !checklistState[`d_${i}`])
  if (visibleIndices.length > 0) {
    const totalVisible  = visibleIndices.length
    const checkedCount  = visibleIndices.filter(i => !!checklistState[`c_${i}`]).length
    section('Checklist', `${checkedCount} of ${totalVisible} items checked`)
    for (const i of visibleIndices) {
      if (y > ph - 20) { doc.addPage(); y = 22 }
      const checked = !!checklistState[`c_${i}`]
      stroke(CBXLINE)
      fill(checked ? GREEN : WHITE)
      doc.roundedRect(ml, y - 0.5, 4, 4, 0.8, 0.8, checked ? 'FD' : 'S')
      if (checked) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); color(WHITE)
        doc.text('✓', ml + 0.7, y + 2.7)
      }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      color(checked ? MUT : TEXT)
      const il = doc.splitTextToSize(checklist[i].item || '', cw - 8)
      doc.text(il, ml + 7, y + 3); y += il.length * 5 + 2
    }
    y += 4
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  if (notes.trim()) { section('Notes'); bodyText(notes); y += 4 }

  // ── Footer ───────────────────────────────────────────────────────────────────
  y += 6
  stroke(LINE); doc.line(ml, y, ml + cw, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); color(MUT)
  const disclaimer = doc.splitTextToSize('This report is generated by SafetyScan AI and is indicative only. Verify findings with a qualified WHS professional before sign-off.', cw)
  doc.text(disclaimer, ml, y); y += disclaimer.length * 4 + 3
  color(HDIM)
  doc.text(`Generated by SafetyScan  ·  safetyscan.com.au  ·  ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`, ml, y)

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
  const [reanalyseExpanded, setReanalyseExpanded] = useState(false)
  const [openLeg, setOpenLeg] = useState<number | null>(null)
  const [scanModules, setScanModules] = useState<any[]>([])
  const [activeModule, setActiveModule] = useState<string>('')
  const [view, setView] = useState<'detail' | 'overview'>('detail')
  const [openOverviewChecklist, setOpenOverviewChecklist] = useState<string | null>(null)
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [scanRes, sitesRes, modulesRes] = await Promise.all([
        supabase.from('scans').select('*').eq('id', id).single(),
        supabase.from('sites').select('*').eq('archived', false).order('name', { ascending: true }),
        supabase.from('scan_modules').select('*').eq('scan_id', id),
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
      const modOrder = ['safety', 'quality', 'environmental']
      const sorted = (modulesRes.data || []).sort(
        (a: any, b: any) => modOrder.indexOf(a.module) - modOrder.indexOf(b.module)
      )
      setScanModules(sorted)
      if (sorted.length > 0) setActiveModule(sorted[0].module)
      setLoading(false)
    }
    init()
  }, [id, router])

  const handleChecklistChange = async (newState: Record<string, any>, module?: string) => {
    const targetModule = module ?? activeModule
    if (scanModules.length === 0) {
      // Legacy: persist to scans table
      setChecklistState(newState)
      await supabase.from('scans').update({ checklist_state: newState }).eq('id', id)
    } else {
      // Multi-module: persist to scan_modules for the target module; derive-in-render picks it up
      setScanModules(prev => prev.map((m: any) =>
        m.module === targetModule ? { ...m, checklist_state: newState } : m
      ))
      await supabase.from('scan_modules').update({ checklist_state: newState })
        .eq('scan_id', id).eq('module', targetModule)
    }
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

  const reanalyseWithContext = async (additionalInfo: string, extraPhotos: { dataUrl: string; base64: string }[], module: string) => {
    if (!scan) return
    setContinueLoading(true); setContinueError(null)
    try {
      // Upload any new photos client-side first — route doesn't update photo_urls on re-analysis path
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
      if (newUrls.length > 0) {
        await supabase.from('scans').update({ photo_urls: updatedUrls }).eq('id', id)
        setPhotoUrls(updatedUrls)
      }

      const contextText = `Analyse these construction site photos for Queensland compliance, building on a previous assessment.\n\nPrevious assessment:\nWork type: ${scan.work_type}\nStatus: ${scan.status} (${scan.confidence} confidence)\nSummary: ${scan.summary}\nFindings: ${(scan.findings || []).map((f: any) => f.text || f.title || '').filter(Boolean).join(', ')}\nLegislation: ${(scan.legislation || []).map((l: any) => l.code).join(', ')}${additionalInfo ? `\n\nAdditional context: ${additionalInfo}` : ''}`
      const userContent: any[] = [
        ...extraPhotos.map(p => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: p.base64 } })),
        { type: 'text', text: contextText },
      ]
      const searchQuery = [scan.work_type, additionalInfo].filter(Boolean).join(' ')

      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scan_id: id,
          modules: [module],
          messages: [{ role: 'user', content: userContent }],
          searchQuery,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Analysis failed')

      // Refresh scan_modules from DB so tab data is current
      const { data: freshModules } = await supabase.from('scan_modules').select('*').eq('scan_id', id)
      if (freshModules) {
        const modOrder = ['safety', 'quality', 'environmental']
        const sorted = freshModules.sort((a: any, b: any) => modOrder.indexOf(a.module) - modOrder.indexOf(b.module))
        setScanModules(sorted)
      }
      if (updatedUrls !== photoUrls) setPhotoUrls(updatedUrls)
      setContinueContext(''); setContinuePhotos([])
    } catch (e: any) { setContinueError(e.message || 'Analysis failed') }
    finally { setContinueLoading(false) }
  }

  const handleReanalyse = async () => {
    if (reanalysing) return
    setReanalysing(true)
    await reanalyseWithContext(continueContext, continuePhotos, activeModule || 'safety')
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
      <AppHeader variant="detail" onBack={() => router.back()}/>
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 48px' }}>
        <div style={{ background: 'var(--status-red-bg)', border: '0.5px solid var(--status-red)', borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-red)', marginBottom: 6 }}>Could not load scan</div>
          <div style={{ fontSize: 13, color: 'var(--text-mut)', lineHeight: 1.5 }}>{error}</div>
        </div>
      </main>
    </div>
  )

  if (!scan) return null

  const shareLink = shareToken ? `https://safetyscan.com.au/shared/${shareToken}` : null
  const d = new Date(scan.created_at)
  const siteName = scan.site_id ? sites.find(s => s.id === scan.site_id)?.name : null
  const meta = [siteName?.toUpperCase(), d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(), d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase().replace(' ', '')].filter(Boolean).join(' · ')

  const isLegacy = scanModules.length === 0
  const activeModuleData = isLegacy ? null : scanModules.find((m: any) => m.module === activeModule) ?? null
  const isErrorTab = !isLegacy && activeModuleData?.status === 'error'

  const displayFindings: any[] = isLegacy ? (scan.findings || []) : (activeModuleData?.findings || [])
  const displayLegislation: any[] = isLegacy ? (scan.legislation || []) : (activeModuleData?.legislation || [])
  const displaySummary: string = isLegacy ? (scan.summary || '') : (activeModuleData?.summary || '')
  const displayStatus: string = isLegacy ? scan.status : (activeModuleData?.status || 'uncertain')
  const displayChecklist: any[] = isLegacy ? checklist : (activeModuleData?.checklist || [])
  const displayChecklistState: Record<string, any> = isLegacy ? checklistState : (activeModuleData?.checklist_state || {})
  const visibleCount = displayChecklist.filter((_: any, i: number) => !displayChecklistState[`d_${i}`]).length

  const issueFindings = displayFindings.filter((f: any) => f.type === 'critical' || f.type === 'warning')
  const issueCount = issueFindings.length
  const statusBarColor = displayStatus === 'pass' ? '#3E8E5A' : displayStatus === 'fail' ? '#D63A26' : 'var(--amber)'
  const statusColor    = displayStatus === 'pass' ? 'var(--clear-tx)' : displayStatus === 'fail' ? 'var(--issue-tx-theme)' : 'var(--amber)'
  const statusLbl      = displayStatus === 'pass' ? 'Compliant' : displayStatus === 'fail' ? `${issueCount} issue${issueCount !== 1 ? 's' : ''} found` : 'Pending review'

  const inp: React.CSSProperties = { display: 'block', width: '100%', border: '1.5px solid var(--line)', background: 'var(--surf)', fontSize: 14, color: 'var(--text)', boxSizing: 'border-box', outline: 'none' }
  const secHead = (label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '18px 2px 11px' }}>
      <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }}/>
      <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--mut)' }}>{label}</span>
    </div>
  )

  const card: React.CSSProperties = { background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4 }
  const btn = (amber?: boolean): React.CSSProperties => ({ height: 46, borderRadius: 8, border: '1.5px solid var(--line)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: amber ? 'var(--amber)' : 'var(--surf)', color: amber ? '#1B1A12' : 'var(--text)' })

  return (
    <>
    <div className="page-slide-right-in" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} textarea,input{outline:none;box-sizing:border-box}`}</style>
      <AppHeader variant="detail" onBack={() => router.back()} rightContent={
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Share */}
          <button onClick={handleShare} title="Share scan"
            style={{ width: 38, height: 38, borderRadius: 8, border: '1.5px solid var(--line)', background: 'var(--surf)', color: 'var(--text)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
          {/* Export PDF */}
          <button onClick={handleExportPDF} disabled={exportingPDF} title="Export PDF"
            style={{ width: 38, height: 38, borderRadius: 8, border: '1.5px solid var(--line)', background: 'var(--surf)', color: 'var(--text)', display: 'grid', placeItems: 'center', cursor: exportingPDF ? 'not-allowed' : 'pointer', opacity: exportingPDF ? 0.5 : 1, flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          {/* Delete */}
          <button onClick={() => setShowDeleteConfirm(true)} title="Delete scan"
            style={{ width: 38, height: 38, borderRadius: 8, border: '1.5px solid var(--issue)', background: 'var(--issue-bg)', color: 'var(--issue-tx-theme)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      }/>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 48px' }}>

        {/* Page title + inline rename */}
        {editingName ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0 12px' }}>
            <input value={scanName} onChange={e => setScanName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus
              style={{ ...inp, flex: 1, height: 44, padding: '0 14px', borderRadius: 8, fontSize: 18, fontWeight: 600 }}/>
            <button onClick={saveName} style={{ ...btn(true), height: 44, padding: '0 16px', flexShrink: 0 }}>Save</button>
            <button onClick={() => { setScanName(scan.work_type || ''); setEditingName(false) }} style={{ ...btn(), height: 44, padding: '0 14px', flexShrink: 0 }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
            <h1 style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--text)', margin: 0 }}>{scanName || 'Unnamed scan'}</h1>
            <button onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mut)', fontSize: 14, padding: '2px 4px', lineHeight: 1 }}>✎</button>
          </div>
        )}
        <div style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mut)', paddingTop: 4, paddingBottom: 14 }}>{meta}</div>

        {/* Photos — compact thumbnail strip */}
        {(photoUrls.length > 0 || continuePhotos.length > 0) && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {/* Pending new photos (amber border, shown first) */}
              {continuePhotos.map((p, i) => (
                <div key={`pending-${i}`} style={{ position: 'relative' }}>
                  <img src={p.dataUrl} alt="" onClick={() => {}} style={{ width: 72, height: 72, borderRadius: 4, objectFit: 'cover', border: '1.5px dashed var(--amber)', display: 'block', cursor: 'default' }}/>
                  <button onClick={() => setContinuePhotos(prev => prev.filter((_, idx) => idx !== i))}
                    style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: '#D63A26', border: '2px solid var(--bg)', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}>✕</button>
                  <div style={{ position: 'absolute', bottom: 3, left: 4, fontWeight: 600, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', background: 'rgba(0,0,0,0.6)', borderRadius: 2, padding: '1px 4px' }}>New</div>
                </div>
              ))}
              {/* Saved photos */}
              {photoUrls.map((url: string, i: number) => (
                <div key={`photo-${i}`} onClick={() => setPhotoEnlarged(i)}
                  style={{ width: 72, height: 72, borderRadius: 4, overflow: 'hidden', border: '1.5px solid var(--line)', cursor: 'pointer', flexShrink: 0 }}>
                  <img src={url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                </div>
              ))}
            </div>
            {/* Label */}
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mut)', marginTop: 8 }}>
              {photoUrls.length} photo{photoUrls.length !== 1 ? 's' : ''} analysed
              {continuePhotos.length > 0 && <span style={{ color: 'var(--amber)', marginLeft: 8 }}>+ {continuePhotos.length} pending</span>}
            </div>
          </div>
        )}

        {/* photo enlarged modal moved outside animated wrapper — see below */}

        {/* Overview / Detail toggle — only for multi-module scans */}
        {!isLegacy && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, padding: 3, background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 8, width: 'fit-content' }}>
            <button onClick={() => setView('detail')} style={{ height: 32, padding: '0 16px', borderRadius: 6, border: 'none', background: view === 'detail' ? 'var(--amber)' : 'transparent', color: view === 'detail' ? '#1B1A12' : 'var(--mut)', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>Detail</button>
            <button onClick={() => setView('overview')} style={{ height: 32, padding: '0 16px', borderRadius: 6, border: 'none', background: view === 'overview' ? 'var(--amber)' : 'transparent', color: view === 'overview' ? '#1B1A12' : 'var(--mut)', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>Overview</button>
          </div>
        )}

        {/* Overview block — per-module summary cards */}
        {!isLegacy && view === 'overview' && (
          <div>
            {scanModules.map((m: any) => {
              const modIssues = (m.findings || []).filter((f: any) => f.type === 'critical' || f.type === 'warning').length
              const modStatusColor = m.status === 'pass' ? '#3E8E5A' : m.status === 'fail' ? '#D63A26' : 'var(--amber)'
              const modLabel = m.module === 'safety' ? 'Safety' : m.module === 'quality' ? 'Quality' : 'Environmental'
              const modChecklist: any[] = m.checklist || []
              const modChecklistState: Record<string, any> = m.checklist_state || {}
              const modVisibleCount = modChecklist.filter((_: any, i: number) => !modChecklistState[`d_${i}`]).length
              const isChecklistOpen = openOverviewChecklist === m.module
              return (
                <div key={m.module} style={{ ...card, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1.5px solid var(--div)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: modStatusColor, flexShrink: 0 }}/>
                      <span style={{ fontWeight: 700, fontSize: 12.5, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text)' }}>{modLabel}</span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 12, color: m.status === 'pass' ? 'var(--clear-tx)' : m.status === 'fail' ? 'var(--issue-tx-theme)' : 'var(--mut)' }}>
                      {m.status === 'pass' ? 'Compliant' : m.status === 'fail' ? `${modIssues} issue${modIssues !== 1 ? 's' : ''}` : m.status === 'error' ? 'Error' : 'Pending'}
                    </span>
                  </div>
                  {m.summary && (
                    <div style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500, lineHeight: 1.55, color: 'var(--mut)', borderBottom: modChecklist.length > 0 ? '1.5px solid var(--div)' : 'none' }}>
                      {m.summary}
                    </div>
                  )}
                  {modChecklist.length > 0 && (
                    <div>
                      <button onClick={() => setOpenOverviewChecklist(isChecklistOpen ? null : m.module)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: isChecklistOpen ? '1.5px solid var(--div)' : 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--mut)' }}>Checklist ({modVisibleCount})</span>
                        <span style={{ fontSize: 10, color: 'var(--mut)' }}>{isChecklistOpen ? '▲' : '▼'}</span>
                      </button>
                      {isChecklistOpen && (
                        <div>
                          {modChecklist.map((item: any, i: number) => {
                            if (modChecklistState[`d_${i}`]) return null
                            const checked = !!modChecklistState[`c_${i}`]
                            const isLast = modChecklist.slice(i + 1).every((_: any, j: number) => modChecklistState[`d_${i + 1 + j}`])
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: isLast ? 'none' : '1.5px solid var(--div)' }}>
                                <div onClick={() => handleChecklistChange({ ...modChecklistState, [`c_${i}`]: !modChecklistState[`c_${i}`] }, m.module)}
                                  style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer', border: `1.5px solid ${checked ? 'var(--amber)' : 'var(--line)'}`, background: checked ? 'var(--amber)' : 'transparent' }}>
                                  {checked && <span style={{ display: 'block', width: 10, height: 6, borderLeft: '1.8px solid #1B1A12', borderBottom: '1.8px solid #1B1A12', transform: 'rotate(-45deg) translate(1px,-1px)' }}/>}
                                </div>
                                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleChecklistChange({ ...modChecklistState, [`c_${i}`]: !modChecklistState[`c_${i}`] }, m.module)}>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: checked ? 'var(--mut)' : 'var(--text)', textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.55 : 1 }}>{item.item}</div>
                                  {item.category && <div style={{ fontWeight: 600, fontSize: 9.5, color: 'var(--mut)', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{item.category}</div>}
                                </div>
                                <button onClick={() => handleChecklistChange({ ...modChecklistState, [`d_${i}`]: true, [`c_${i}`]: false }, m.module)}
                                  style={{ background: 'none', border: 'none', color: 'var(--mut)', fontSize: 18, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => { setView('detail'); setReanalyseExpanded(true) }}
                style={{ ...btn(), flex: 1 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7a4 4 0 0 1 8 0M11 7a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M11 4v3h-3M3 10V7h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Re-analyse
              </button>
              <button onClick={handleExportPDF} disabled={exportingPDF} style={{ ...btn(true), flex: 1, opacity: exportingPDF ? 0.6 : 1, cursor: exportingPDF ? 'not-allowed' : 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 9v2h8V9M7 2v7m0 0L4 6m3 3 3-3" stroke="#1B1A12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {exportingPDF ? 'Exporting…' : 'Export PDF'}
              </button>
            </div>
          </div>
        )}

        {/* Detail view */}
        {(isLegacy || view === 'detail') && (<>

        {/* Module tabs — only for multi-module scans */}
        {!isLegacy && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {scanModules.map((m: any) => {
              const isActive = m.module === activeModule
              const tabStatusColor = m.status === 'pass' ? '#3E8E5A' : m.status === 'fail' ? '#D63A26' : m.status === 'error' ? '#D63A26' : 'var(--amber)'
              const label = m.module === 'safety' ? 'Safety' : m.module === 'quality' ? 'Quality' : 'Environmental'
              return (
                <button key={m.module} onClick={() => setActiveModule(m.module)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 6, border: `1.5px solid ${isActive ? 'var(--amber)' : 'var(--line)'}`, background: isActive ? 'var(--amber)' : 'var(--surf)', color: isActive ? '#1B1A12' : 'var(--text)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: isActive ? '#1B1A12' : tabStatusColor, flexShrink: 0 }}/>
                  {label}
                </button>
              )
            })}
          </div>
        )}

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: statusBarColor, flexShrink: 0 }}/>
          <span style={{ fontWeight: 600, fontSize: 13, color: statusColor }}>{isErrorTab ? 'Analysis failed for this module' : statusLbl}</span>
        </div>

        {/* Error tab state */}
        {isErrorTab && (
          <div style={{ ...card, padding: '14px 15px', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--issue-tx-theme)', marginBottom: 6 }}>Analysis failed for this module</div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.5, marginBottom: 14 }}>An error occurred while processing this module. You can re-run it below.</div>
            <button onClick={() => { reanalyseWithContext(continueContext, continuePhotos, activeModule); }}
              disabled={reanalysing}
              style={{ ...btn(true), padding: '0 18px', flex: 'none', opacity: reanalysing ? 0.6 : 1 }}>
              {reanalysing ? 'Re-analysing…' : `Re-analyse ${activeModule} →`}
            </button>
          </div>
        )}

        {/* AI Analysis */}
        {!isErrorTab && displaySummary && (
          <>
            {secHead('Summary')}
            <div style={{ ...card, padding: '14px 15px', fontSize: 13, fontWeight: 500, lineHeight: 1.55, color: 'var(--text)', marginBottom: 4 }}>
              {displaySummary}
            </div>
            <LegislationList legislation={displayLegislation} openLeg={openLeg} setOpenLeg={setOpenLeg} />
          </>
        )}

        {/* Issues */}
        {!isErrorTab && issueFindings.length > 0 && (
          <>
            {secHead('Issues')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {issueFindings.map((f: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'stretch', ...card, overflow: 'hidden' }}>
                  <div style={{ width: 5, flexShrink: 0, background: f.type === 'critical' ? '#D63A26' : 'var(--amber)' }} />
                  <div style={{ flex: 1, padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em', color: 'var(--text)', marginBottom: f.detail ? 4 : 0 }}>{f.title || f.text}</div>
                    {f.detail && <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.45, marginBottom: f.legislation ? 8 : 0 }}>{f.detail}</div>}
                    {f.legislation && <span style={{ fontWeight: 600, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, border: '1.5px solid var(--line)', background: 'var(--bg)', color: 'var(--mut)' }}>{f.legislation}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* OK findings */}
        {!isErrorTab && displayFindings.filter((f: any) => f.type === 'ok').length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayFindings.filter((f: any) => f.type === 'ok').map((f: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'stretch', ...card, overflow: 'hidden' }}>
                <div style={{ width: 5, flexShrink: 0, background: '#3E8E5A' }} />
                <div style={{ flex: 1, padding: '11px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{f.text || f.title}</div>
              </div>
            ))}
          </div>
        )}

        {/* Checklist */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '18px 2px 11px' }}>
          <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }}/>
          <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)' }}>Checklist{displayChecklist.length > 0 ? ` (${visibleCount})` : ''}</span>
        </div>

        {displayChecklist.length === 0 ? (
          <div style={{ ...card, padding: '12px 15px', fontSize: 13, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.5 }}>
            Checklist will be included in the next re-analysis.
          </div>
        ) : (
          <div style={{ ...card, overflow: 'hidden' }}>
            {displayChecklist.map((item: any, i: number) => {
              if (displayChecklistState[`d_${i}`]) return null
              const checked = !!displayChecklistState[`c_${i}`]
              const isLast = displayChecklist.slice(i + 1).every((_: any, j: number) => displayChecklistState[`d_${i + 1 + j}`])
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: isLast ? 'none' : '1.5px solid var(--div)' }}>
                  <div onClick={() => handleChecklistChange({ ...displayChecklistState, [`c_${i}`]: !displayChecklistState[`c_${i}`] })}
                    style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer', border: `1.5px solid ${checked ? 'var(--amber)' : 'var(--line)'}`, background: checked ? 'var(--amber)' : 'transparent' }}>
                    {checked && <span style={{ display: 'block', width: 10, height: 6, borderLeft: '1.8px solid #1B1A12', borderBottom: '1.8px solid #1B1A12', transform: 'rotate(-45deg) translate(1px,-1px)' }}/>}
                  </div>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleChecklistChange({ ...displayChecklistState, [`c_${i}`]: !displayChecklistState[`c_${i}`] })}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: checked ? 'var(--mut)' : 'var(--text)', textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.55 : 1 }}>{item.item}</div>
                    {item.category && <div style={{ fontWeight: 600, fontSize: 9.5, color: 'var(--mut)', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.category}</div>}
                  </div>
                  <button onClick={() => handleChecklistChange({ ...displayChecklistState, [`d_${i}`]: true, [`c_${i}`]: false })}
                    style={{ background: 'none', border: 'none', color: 'var(--mut)', fontSize: 18, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Re-analyse + Export PDF */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={() => { if (!reanalysing) setReanalyseExpanded(v => !v) }} disabled={reanalysing}
            style={{ ...btn(reanalyseExpanded), flex: 1, opacity: reanalysing ? 0.6 : 1, cursor: reanalysing ? 'not-allowed' : 'pointer' }}>
            {reanalysing
              ? <><span style={{ width: 14, height: 14, border: '2px solid var(--div)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>Re-analysing…</>
              : <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7a4 4 0 0 1 8 0M11 7a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M11 4v3h-3M3 10V7h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>{!isLegacy && activeModule ? `Re-analyse ${activeModule}` : 'Re-analyse'} {reanalyseExpanded ? '▲' : '▼'}</>}
          </button>
          <button onClick={handleExportPDF} disabled={exportingPDF} style={{ ...btn(true), flex: 1, opacity: exportingPDF ? 0.6 : 1, cursor: exportingPDF ? 'not-allowed' : 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 9v2h8V9M7 2v7m0 0L4 6m3 3 3-3" stroke="#1B1A12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {exportingPDF ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>

        {/* Re-analyse expanded panel */}
        {reanalyseExpanded && (
          <div style={{ ...card, padding: '14px 16px', marginTop: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 12 }}>Additional context</div>
            <textarea value={continueContext} onChange={e => setContinueContext(e.target.value)} rows={3} autoFocus
              placeholder="Describe what's changed, add context, or what you'd like re-assessed…"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--line)', background: 'var(--bg)', fontSize: 13, fontWeight: 500, resize: 'vertical', color: 'var(--text)', lineHeight: 1.5, borderRadius: 4 }}/>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', border: '1.5px solid var(--line)', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--mut)', flexShrink: 0, background: 'var(--bg)' }}>
                📷 Add photos
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={async (e) => {
                  const files = Array.from(e.target.files as FileList).slice(0, 3)
                  const converted = await Promise.all(files.map((f: File) => convertToJpeg(f)))
                  setContinuePhotos(prev => [...prev, ...(converted as string[]).map((d: string) => ({ dataUrl: d, base64: d.split(',')[1] }))].slice(0, 5))
                  e.target.value = ''
                }}/>
              </label>
              {continuePhotos.length > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', letterSpacing: '0.06em' }}>{continuePhotos.length} photo{continuePhotos.length !== 1 ? 's' : ''} added ↑</span>}
            </div>
            {continueError && <div style={{ marginTop: 10, padding: '8px 12px', border: '1.5px solid var(--issue)', borderRadius: 4, fontSize: 12, fontWeight: 500, color: 'var(--issue-tx-theme)' }}>{continueError}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={async () => { setReanalyseExpanded(false); await reanalyseWithContext(continueContext, continuePhotos, activeModule || 'safety') }}
                disabled={reanalysing || (continuePhotos.length === 0 && !continueContext.trim())}
                style={{ ...btn(true), flex: 1, opacity: (reanalysing || (!continuePhotos.length && !continueContext.trim())) ? 0.4 : 1, cursor: (reanalysing || (!continuePhotos.length && !continueContext.trim())) ? 'not-allowed' : 'pointer' }}>
                {reanalysing ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(27,26,18,0.3)', borderTopColor: '#1B1A12', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>Re-analysing…</> : 'Re-analyse →'}
              </button>
              <button onClick={() => { setReanalyseExpanded(false); setContinueContext(''); setContinuePhotos([]) }}
                style={{ ...btn(), height: 46, padding: '0 16px', flex: 'none' }}>Cancel</button>
            </div>
          </div>
        )}

        </>}

        {/* Notes */}
        {secHead('Notes')}
        <div style={{ ...card, padding: '14px 16px' }}>
          <textarea value={notes} onChange={e => handleNotesChange(e.target.value)} placeholder="Add notes about this scan…" rows={4}
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--line)', background: 'var(--bg)', fontSize: 14, fontWeight: 500, resize: 'none', color: 'var(--text)', lineHeight: 1.5, borderRadius: 4 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <button onClick={() => saveNotes(notes)} disabled={notesSaving} style={{ ...btn(), height: 36, padding: '0 16px', fontSize: 13, opacity: notesSaving ? 0.6 : 1 }}>
              {notesSaving ? 'Saving…' : 'Save notes'}
            </button>
            {notesSaved && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--clear-tx)' }}>✓ Saved</span>}
          </div>
        </div>

        {/* Assign to site */}
        {secHead('Assign to site')}
        <div style={{ ...card, padding: '14px 16px' }}>
          <select value={selectedSiteId || ''} onChange={e => handleSiteChange(e.target.value)}
            style={{ display: 'block', width: '100%', height: 46, padding: '0 14px', borderRadius: 6, border: '1.5px solid var(--line)', background: 'var(--bg)', fontSize: 14, fontWeight: 500, color: 'var(--text)', cursor: 'pointer', boxSizing: 'border-box', fontFamily: 'inherit' }}>
            <option value="">No site</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="__new__">＋ Create new site</option>
          </select>
          {creatingNewSite && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <input autoFocus value={newSiteName} onChange={e => setNewSiteName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateAndAssign()}
                placeholder="Site name e.g. Ipswich Motorway Upgrade"
                style={{ flex: 1, height: 46, padding: '0 14px', border: '1.5px solid var(--amber)', background: 'var(--bg)', fontSize: 14, color: 'var(--text)', borderRadius: 6, boxSizing: 'border-box', fontFamily: 'inherit' }}/>
              <button onClick={handleCreateAndAssign} disabled={!newSiteName.trim() || savingSite} style={{ ...btn(true), height: 46, padding: '0 16px', opacity: newSiteName.trim() ? 1 : 0.5 }}>{savingSite ? '…' : 'Create'}</button>
              <button onClick={() => { setCreatingNewSite(false); setNewSiteName('') }} style={{ ...btn(), height: 46, padding: '0 14px' }}>Cancel</button>
            </div>
          )}
        </div>

        {/* Share */}
        <div style={{ marginTop: 14 }}>
          <button onClick={() => setShareMenuOpen(v => !v)} style={{ ...btn(shareMenuOpen), width: '100%' }}>
            {shareEnabled ? '🔗 Sharing on' : '🔗 Share scan'}
          </button>
          {shareMenuOpen && (
            <div style={{ ...card, padding: '14px 16px', marginTop: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 12 }}>Share scan</div>
              {shareEnabled && shareLink ? (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: 4, fontSize: 11, color: 'var(--mut)', wordBreak: 'break-all', fontFamily: 'var(--ff-mono)', background: 'var(--bg)' }}>{shareLink}</div>
                    <button onClick={handleShare} style={{ ...btn(), height: 40, padding: '0 14px', fontSize: 12, flexShrink: 0 }}>{linkCopied ? '✓ Copied' : 'Copy'}</button>
                  </div>
                  <button onClick={handleToggleShare} style={{ fontSize: 12, fontWeight: 600, color: 'var(--issue-tx-theme)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Disable sharing</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.5, marginBottom: 14 }}>Generate a link anyone can view without logging in.</div>
                  <button onClick={handleShare} disabled={generatingShare} style={{ ...btn(true), padding: '0 18px', opacity: generatingShare ? 0.6 : 1 }}>
                    {generatingShare ? 'Generating…' : 'Enable sharing & copy link'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </main>

    </div>

    {/* Photo enlarge modal — outside animated wrapper so position:fixed works correctly */}
    {photoEnlarged !== false && (
      <div onClick={() => setPhotoEnlarged(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'pointer' }}>
        {/* Prev arrow */}
        {photoUrls.length > 1 && photoEnlarged > 0 && (
          <button onClick={e => { e.stopPropagation(); setPhotoEnlarged((photoEnlarged as number) - 1) }}
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 6, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'grid', placeItems: 'center', zIndex: 1 }}>‹</button>
        )}
        {/* Next arrow */}
        {photoUrls.length > 1 && (photoEnlarged as number) < photoUrls.length - 1 && (
          <button onClick={e => { e.stopPropagation(); setPhotoEnlarged((photoEnlarged as number) + 1) }}
            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 6, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'grid', placeItems: 'center', zIndex: 1 }}>›</button>
        )}
        <img src={photoUrls[photoEnlarged as number]} alt="Enlarged"
          style={{ maxWidth: photoUrls.length > 1 ? 'calc(95vw - 120px)' : '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 6 }}/>
        {photoUrls.length > 1 && (
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', fontWeight: 600, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.5)', padding: '5px 12px', borderRadius: 4 }}>
            {(photoEnlarged as number) + 1} / {photoUrls.length}
          </div>
        )}
      </div>
    )}

    {/* Delete confirm modal — also outside animated wrapper */}
    {showDeleteConfirm && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
        <div style={{ ...card, padding: 24, maxWidth: 320, width: '100%' }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Delete this scan?</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.5, marginBottom: 20 }}>This will permanently delete the scan and all associated photos.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowDeleteConfirm(false)} style={{ ...btn(), flex: 1 }}>Cancel</button>
            <button onClick={handleDelete} style={{ flex: 1, height: 46, background: '#D63A26', border: '1.5px solid var(--issue)', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#fff' }}>Delete</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
