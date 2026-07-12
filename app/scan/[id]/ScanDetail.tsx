'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Scan } from '../../../lib/supabase'
import { useOrg } from '../../../lib/useOrg'
import { useCount } from '../../../lib/CountContext'
import { convertToJpeg } from '../../../components/PhotoResultCard'
import AppHeader from '../../../components/AppHeader'
import LegislationList from '../../../components/LegislationList'
import {
  Share2, Download, Trash2, ArrowLeft, Check, X,
  ChevronDown, RotateCcw, Pencil, Camera, Upload,
} from 'lucide-react'

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
  type RGB = [number, number, number]
  const NAVY: RGB = [22, 24, 28]; const AMBER: RGB = [243, 148, 16]; const CREAM: RGB = [241, 239, 232]
  const TEXT: RGB = [22, 24, 28]; const MUT: RGB = [120, 120, 120]; const LINE: RGB = [220, 218, 210]
  const WHITE: RGB = [255, 255, 255]; const GREEN: RGB = [26, 122, 69]; const RED: RGB = [225, 75, 61]
  const WARN: RGB = [163, 98, 0]; const GREY: RGB = [74, 77, 82]; const CARDBG: RGB = [248, 247, 244]
  const HDIM: RGB = [180, 180, 180]; const CBXLINE: RGB = [160, 160, 160]
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2])
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2])
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2])
  fill(NAVY); doc.rect(0, 0, pw, 22, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); color(WHITE)
  doc.text('Site', ml, 14.5); color(AMBER); doc.text('Spotter', ml + doc.getTextWidth('Site') + 0.8, 14.5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(HDIM)
  const hDate = new Date(scan.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  doc.text(siteName ? `${siteName}  ·  ${hDate}` : hDate, pw - mr, 14.5, { align: 'right' })
  y = 32
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); color(TEXT)
  const titleLines = doc.splitTextToSize(scan.work_type || 'Compliance Scan', cw)
  doc.text(titleLines, ml, y); y += titleLines.length * 8 + 3
  const STATUS: Record<string, { c: RGB; label: string }> = { pass: { c: GREEN, label: 'Compliant' }, fail: { c: RED, label: 'Issues Found' }, uncertain: { c: WARN, label: 'Uncertain' }, not_applicable: { c: GREY, label: 'N/A' } }
  const sc = STATUS[scan.status] || STATUS.uncertain
  fill(sc.c); doc.roundedRect(ml, y, 40, 7.5, 2, 2, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); color(WHITE)
  doc.text(sc.label, ml + 20, y + 5, { align: 'center' }); y += 14
  const allPhotoUrls = scan.photo_urls?.length ? scan.photo_urls : scan.photo_url ? [scan.photo_url] : []
  if (allPhotoUrls.length > 0) {
    const photos = (await Promise.all(allPhotoUrls.map(async u => {
      const d = await imageUrlToDataUrl(u); if (!d) return null
      const dims = await new Promise<{ w: number; h: number }>(res => { const img = new window.Image(); img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight }); img.onerror = () => res({ w: 4, h: 3 }); img.src = d })
      return { d, dims }
    }))).filter(Boolean) as { d: string; dims: { w: number; h: number } }[]
    if (photos.length > 0) {
      const n = photos.length; const cols = n === 1 ? 1 : 2; const gap = 3; const cellW = (cw - (cols - 1) * gap) / cols; const rowH = n === 1 ? 80 : 52
      for (let i = 0; i < n; i += cols) {
        const row = photos.slice(i, i + cols)
        row.forEach((p, j) => {
          const cellX = ml + j * (cellW + gap); const r = p.dims.w / p.dims.h
          let imgW: number, imgH: number, offX = 0, offY = 0
          if (r > cellW / rowH) { imgW = cellW; imgH = cellW / r; offY = (rowH - imgH) / 2 } else { imgH = rowH; imgW = rowH * r; offX = (cellW - imgW) / 2 }
          try { doc.addImage(p.d, 'JPEG', cellX + offX, y + offY, imgW, imgH) } catch (_) {}
        }); y += rowH + 3
      }; y += 4
    }
  }
  const section = (title: string, subtitle?: string) => {
    if (y > ph - 40) { doc.addPage(); y = 22 }
    fill(CREAM); doc.rect(ml - 2, y - 3, cw + 4, 8.5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); color(AMBER); doc.text(title.toUpperCase(), ml, y + 2.5)
    if (subtitle) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(MUT); doc.text(subtitle, pw - mr, y + 2.5, { align: 'right' }) }
    stroke(LINE); doc.line(ml - 2, y + 5.5, ml + cw + 2, y + 5.5); y += 12
  }
  const bodyText = (text: string, c: RGB = TEXT) => {
    if (y > ph - 30) { doc.addPage(); y = 22 }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); color(c)
    const lines = doc.splitTextToSize(text, cw); doc.text(lines, ml, y); y += lines.length * 5 + 2
  }
  if (scan.summary) { section('Summary'); bodyText(scan.summary); y += 4 }
  const legislation = scan.legislation || []
  if (legislation.length > 0) {
    section('Applicable Queensland Legislation')
    for (const leg of legislation) {
      if (y > ph - 30) { doc.addPage(); y = 22 }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); color(TEXT)
      const legTitle = doc.splitTextToSize(`${leg.code || ''}: ${leg.description || leg.name || ''}`, cw)
      doc.text(legTitle, ml, y); y += legTitle.length * 5 + 2
      if (leg.clauses?.length > 0) {
        const clauses = leg.clauses as { ref?: string; summary?: string }[]
        const pillH = 4.5, pillPadX = 2, pillFs = 7; let px = ml + 2
        doc.setFont('helvetica', 'bold'); doc.setFontSize(pillFs)
        for (const clause of clauses) {
          if (!clause.ref) continue
          const pillW = doc.getTextWidth(clause.ref) + pillPadX * 2 + 1
          if (px + pillW > ml + cw) { px = ml + 2; y += pillH + 2 }
          fill(NAVY); doc.roundedRect(px, y, pillW, pillH, 1, 1, 'F')
          color(AMBER); doc.text(clause.ref, px + pillPadX + 0.5, y + 3.3); px += pillW + 2
        }; y += pillH + 3
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(MUT)
        for (const clause of clauses) {
          if (!clause.summary) continue
          const sl = doc.splitTextToSize(`${clause.ref ? clause.ref + ' — ' : ''}${clause.summary}`, cw - 4)
          doc.text(sl, ml + 4, y); y += sl.length * 4 + 1
        }
      }; y += 4
    }; y += 2
  }
  const findings = scan.findings || []
  if (findings.length > 0) {
    section('Findings')
    const FC: Record<string, RGB> = { ok: GREEN, warning: WARN, critical: RED }
    for (const f of findings) {
      if (y > ph - 30) { doc.addPage(); y = 22 }
      const c = FC[f.type] || FC.warning
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
      const tl = doc.splitTextToSize(f.title || f.text || '', cw - 10)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
      const dl = f.detail ? doc.splitTextToSize(f.detail, cw - 10) : []
      const cardH = 4 + tl.length * 4.5 + (dl.length > 0 ? 2 + dl.length * 4 : 0) + 5
      fill(CARDBG); doc.roundedRect(ml, y, cw, cardH, 1.5, 1.5, 'F')
      fill(c); doc.roundedRect(ml, y, 3.5, cardH, 1, 1, 'F'); doc.rect(ml + 2, y, 1.5, cardH, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); color(TEXT); doc.text(tl, ml + 7, y + 5)
      let iy = y + 5 + tl.length * 4.5 + 1
      if (dl.length > 0) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(MUT); doc.text(dl, ml + 7, iy + 1) }
      y += cardH + 3
    }; y += 2
  }
  const visibleIndices = checklist.map((_, i) => i).filter(i => !checklistState[`d_${i}`])
  if (visibleIndices.length > 0) {
    const checkedCount = visibleIndices.filter(i => !!checklistState[`c_${i}`]).length
    section('Checklist', `${checkedCount} of ${visibleIndices.length} items checked`)
    for (const i of visibleIndices) {
      if (y > ph - 20) { doc.addPage(); y = 22 }
      const checked = !!checklistState[`c_${i}`]
      stroke(CBXLINE); fill(checked ? GREEN : WHITE); doc.roundedRect(ml, y - 0.5, 4, 4, 0.8, 0.8, checked ? 'FD' : 'S')
      if (checked) { doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); color(WHITE); doc.text('✓', ml + 0.7, y + 2.7) }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); color(checked ? MUT : TEXT)
      const il = doc.splitTextToSize(checklist[i].item || '', cw - 8); doc.text(il, ml + 7, y + 3); y += il.length * 5 + 2
    }; y += 4
  }
  if (notes.trim()) { section('Notes'); bodyText(notes); y += 4 }
  y += 6; stroke(LINE); doc.line(ml, y, ml + cw, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); color(MUT)
  const disclaimer = doc.splitTextToSize('This report is generated by SiteSpotter AI and is indicative only. Verify findings with a qualified WHS professional before sign-off.', cw)
  doc.text(disclaimer, ml, y); y += disclaimer.length * 4 + 3; color(HDIM)
  doc.text(`Generated by SiteSpotter  ·  sitespotter.com.au  ·  ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`, ml, y)
  doc.save(`SiteSpotter-${(scan.work_type || 'scan').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${new Date(scan.created_at).toISOString().slice(0, 10)}.pdf`)
}

// ─── Accordion ───────────────────────────────────────────────────────────────

function Accordion({ label, count, children, defaultOpen = false }: { label: string; count: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  if (count === 0) return null
  return (
    <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', overflow: 'hidden', marginBottom: 8 }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 999, background: 'var(--surf-inset)', color: 'var(--text-muted)', display: 'grid', placeItems: 'center', padding: '0 5px' }}>{count}</span>
        </div>
        <ChevronDown size={15} strokeWidth={2} color="var(--text-muted)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && <div style={{ borderTop: '1.5px solid var(--border-card)' }}>{children}</div>}
    </div>
  )
}

// ─── Finding row ─────────────────────────────────────────────────────────────

function FindingRow({ f, state, onMark, onUndo, isLegacy }: {
  f: any; state?: 'done' | 'dismissed' | null;
  onMark?: (id: string, s: 'done' | 'dismissed') => void;
  onUndo?: (id: string) => void;
  isLegacy?: boolean;
}) {
  const isCritical = f.type === 'critical'
  const isAction = f.type === 'action'
  const borderColor = state === 'done' ? 'var(--pass)' : state === 'dismissed' ? 'var(--border-card)' : isCritical ? 'var(--issue)' : f.type === 'ok' ? 'var(--pass)' : isAction ? 'var(--amber)' : 'var(--warning)'

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1.5px solid var(--border-card)' }}>
      <div style={{ width: 4, flexShrink: 0, background: borderColor }} />
      <div style={{ flex: 1, padding: '11px 14px', minWidth: 0 }}>
        {isAction && !state && (
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 4 }}>
            CONFIRM ON SITE
          </div>
        )}
        <div style={{
          fontSize: 13.5, fontWeight: 600, color: state ? 'var(--text-muted)' : 'var(--text)',
          lineHeight: 1.4, textDecoration: state === 'dismissed' ? 'line-through' : 'none',
          opacity: state ? 0.7 : 1,
        }}>
          {f.text || f.title}
        </div>
        {f.detail && !state && (
          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.45, marginTop: 4 }}>{f.detail}</div>
        )}
        {f.legislation && !state && (
          <span style={{ display: 'inline-block', marginTop: 6, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, border: '1.5px solid var(--border-card)', color: 'var(--text-muted)' }}>{f.legislation}</span>
        )}
        {!isLegacy && !state && onMark && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => onMark(f.id, 'done')} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 28, padding: '0 10px', borderRadius: 'var(--r-control-sm)',
              background: 'var(--pass-tint)', border: '1px solid var(--pass-border)',
              color: 'var(--pass-deep)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Check size={11} strokeWidth={2.5} /> Done
            </button>
            <button onClick={() => onMark(f.id, 'dismissed')} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 28, padding: '0 10px', borderRadius: 'var(--r-control-sm)',
              background: 'var(--surf-inset)', border: '1.5px solid var(--border-card)',
              color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Dismiss
            </button>
          </div>
        )}
        {!isLegacy && state && onUndo && (
          <button onClick={() => onUndo(f.id)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 26, padding: '0 10px', marginTop: 8, borderRadius: 'var(--r-control-sm)',
            background: 'var(--surf-inset)', border: '1.5px solid var(--border-card)',
            color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <RotateCcw size={10} strokeWidth={2} /> Undo
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ScanDetail({ id }: { id: string }) {
  const [scan, setScan] = useState<Scan | null>(null)
  const [sites, setSites] = useState<{ id: string; name: string }[]>([])
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
  const photoStripRef = useRef<HTMLDivElement>(null)
  const { orgId } = useOrg()
  const { adjustCount } = useCount()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [scanRes, sitesRes, modulesRes] = await Promise.all([
        supabase.from('scans').select('*').eq('id', id).single(),
        supabase.from('sites').select('id, name').eq('archived', false).order('name', { ascending: true }),
        supabase.from('scan_modules').select('*').eq('scan_id', id),
      ])
      if (scanRes.error) { setError(`Could not load scan: ${scanRes.error.message}`); setLoading(false); return }
      if (!scanRes.data) { setError('Scan not found.'); setLoading(false); return }
      const s = scanRes.data as Scan
      setScan(s); setPhotoUrls(s.photo_urls?.length ? s.photo_urls : s.photo_url ? [s.photo_url] : [])
      setScanName(s.work_type || ''); setNotes(s.notes || ''); setChecklistState(s.checklist_state || {})
      setSelectedSiteId(s.site_id || null); setShareToken(s.share_token || null); setShareEnabled(s.share_enabled || false)
      if (s.checklist && Array.isArray(s.checklist) && s.checklist.length > 0) setChecklist(s.checklist)
      setSites(sitesRes.data || [])
      const modOrder = ['safety', 'quality', 'environmental']
      const sorted = (modulesRes.data || []).sort((a: any, b: any) => modOrder.indexOf(a.module) - modOrder.indexOf(b.module))
      setScanModules(sorted)
      if (sorted.length > 0) setActiveModule(sorted[0].module)
      setLoading(false)
    }
    init()
  }, [id, router])

  const handleChecklistChange = async (newState: Record<string, any>, module?: string) => {
    const targetModule = module ?? activeModule
    if (scanModules.length === 0) {
      setChecklistState(newState)
      await supabase.from('scans').update({ checklist_state: newState }).eq('id', id)
    } else {
      setScanModules(prev => prev.map((m: any) => m.module === targetModule ? { ...m, checklist_state: newState } : m))
      await supabase.from('scan_modules').update({ checklist_state: newState }).eq('scan_id', id).eq('module', targetModule)
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
    setScan(prev => prev ? { ...prev, work_type: scanName } : prev); setEditingName(false)
  }

  const handleSiteChange = async (value: string) => {
    if (value === '__new__') { setCreatingNewSite(true); return }
    const siteId = value || null; setSelectedSiteId(siteId)
    await supabase.from('scans').update({ site_id: siteId }).eq('id', id)
    setScan(prev => prev ? { ...prev, site_id: siteId } : prev)
  }

  const handleCreateAndAssign = async () => {
    if (!newSiteName.trim()) return; setSavingSite(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: newSite, error } = await supabase.from('sites').insert({ name: newSiteName.trim(), created_by: user?.id, org_id: orgId, archived: false }).select().single()
    if (!error && newSite) {
      await supabase.from('scans').update({ site_id: newSite.id }).eq('id', id)
      setSites(prev => [...prev, newSite].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedSiteId(newSite.id); setScan(prev => prev ? { ...prev, site_id: newSite.id } : prev)
      setCreatingNewSite(false); setNewSiteName('')
    }; setSavingSite(false)
  }

  const handleDelete = async () => {
    if (!scan) return
    const urls = scan.photo_urls || (scan.photo_url ? [scan.photo_url] : [])
    for (const url of urls) { const path = url.split('/scan-photos/')[1]; if (path) await supabase.storage.from('scan-photos').remove([path]) }
    await supabase.from('scans').delete().eq('id', id); router.push('/dashboard')
  }

  const handleShare = async () => {
    setGeneratingShare(true); let token = shareToken
    if (!token) {
      token = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
      await supabase.from('scans').update({ share_token: token, share_enabled: true }).eq('id', id)
      setShareToken(token); setShareEnabled(true)
    } else if (!shareEnabled) {
      await supabase.from('scans').update({ share_enabled: true }).eq('id', id); setShareEnabled(true)
    }
    setGeneratingShare(false)
    const link = `https://sitespotter.com.au/shared/${token}`
    await navigator.clipboard.writeText(link).catch(() => {})
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 3000)
  }

  const handleToggleShare = async () => {
    const newVal = !shareEnabled
    await supabase.from('scans').update({ share_enabled: newVal }).eq('id', id); setShareEnabled(newVal)
  }

  const handleExportPDF = async () => {
    if (!scan) return; setExportingPDF(true)
    const siteName = scan.site_id ? sites.find(s => s.id === scan.site_id)?.name || null : null
    try { await exportScanPDF(scan, siteName, checklist, checklistState, notes) } catch (e) { console.error('[PDF]', e) } finally { setExportingPDF(false) }
  }

  const reanalyseWithContext = async (additionalInfo: string, extraPhotos: { dataUrl: string; base64: string }[], module: string) => {
    if (!scan) return; setContinueLoading(true); setContinueError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser(); const newUrls: string[] = []
      if (user && extraPhotos.length > 0) {
        for (let i = 0; i < extraPhotos.length; i++) {
          const blob = await fetch(extraPhotos[i].dataUrl).then(r => r.blob())
          const fileName = `${user.id}/${Date.now()}-extra-${i}.jpg`
          const { error: uploadError } = await supabase.storage.from('scan-photos').upload(fileName, blob, { contentType: 'image/jpeg', upsert: false })
          if (!uploadError) { const { data: urlData } = supabase.storage.from('scan-photos').getPublicUrl(fileName); newUrls.push(urlData.publicUrl) }
        }
      }
      const updatedUrls = newUrls.length > 0 ? [...photoUrls, ...newUrls] : photoUrls
      if (newUrls.length > 0) { await supabase.from('scans').update({ photo_urls: updatedUrls }).eq('id', id); setPhotoUrls(updatedUrls) }
      const contextText = `Analyse these construction site photos for Queensland compliance, building on a previous assessment.\n\nPrevious: Work type: ${scan.work_type}, Status: ${scan.status}${additionalInfo ? `\n\nAdditional context: ${additionalInfo}` : ''}`
      const userContent: any[] = [...extraPhotos.map(p => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: p.base64 } })), { type: 'text', text: contextText }]
      const activeModData = scanModules.find((m: any) => m.module === module)
      const res = await fetch('/api/analyse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ scan_id: id, modules: [module], messages: [{ role: 'user', content: userContent }], searchQuery: [scan.work_type, additionalInfo].filter(Boolean).join(' '), existing_findings: activeModData?.findings || [], findings_state: activeModData?.findings_state || {} }) })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Analysis failed')
      const { data: freshModules } = await supabase.from('scan_modules').select('*').eq('scan_id', id)
      if (freshModules) {
        const modOrder = ['safety', 'quality', 'environmental']
        setScanModules(freshModules.sort((a: any, b: any) => modOrder.indexOf(a.module) - modOrder.indexOf(b.module)))
      }
      setContinueContext(''); setContinuePhotos([])
    } catch (e: any) { setContinueError(e.message || 'Analysis failed') } finally { setContinueLoading(false) }
  }

  const calcModuleStatus = (findings: any[], newFs: Record<string, string>) => {
    const hasOpenIssues = findings.some(f => {
      const s = newFs[f.id]
      return s !== 'done' && s !== 'dismissed' && (f.type === 'critical' || f.type === 'warning')
    })
    return hasOpenIssues ? 'fail' : 'pass'
  }

  const markFinding = (findingId: string, state: 'done' | 'dismissed') => {
    setScanModules(prev => prev.map((m: any) => {
      if (m.module !== activeModule) return m
      const newFs = { ...(m.findings_state || {}), [findingId]: state }
      return { ...m, findings_state: newFs, status: calcModuleStatus(m.findings || [], newFs) }
    }))
    adjustCount(-1)
    fetch('/api/finding-state', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ scan_id: id, module: activeModule, finding_id: findingId, state }),
    })
  }

  const undoFinding = (findingId: string) => {
    setScanModules(prev => prev.map((m: any) => {
      if (m.module !== activeModule) return m
      const newFs = { ...(m.findings_state || {}) }; delete newFs[findingId]
      return { ...m, findings_state: newFs, status: calcModuleStatus(m.findings || [], newFs) }
    }))
    adjustCount(+1)
    fetch('/api/finding-state', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ scan_id: id, module: activeModule, finding_id: findingId, state: null }),
    })
  }

  const handleStripScroll = () => {
    if (!photoStripRef.current) return
    const el = photoStripRef.current
    const idx = Math.round(el.scrollLeft / el.offsetWidth)
    setActivePhoto(Math.min(Math.max(0, idx), photoUrls.length - 1))
  }

  if (loading) return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border-card)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <AppHeader variant="detail" onBack={() => router.back()} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ background: 'var(--fail-tint)', border: '1.5px solid var(--issue)', borderRadius: 'var(--r-card)', padding: '16px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--issue)', marginBottom: 4 }}>Could not load scan</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{error}</div>
        </div>
      </div>
    </div>
  )

  if (!scan) return null

  const d = new Date(scan.created_at)
  const siteName = scan.site_id ? sites.find(s => s.id === scan.site_id)?.name : null
  const isLegacy = scanModules.length === 0
  const activeModuleData = isLegacy ? null : scanModules.find((m: any) => m.module === activeModule) ?? null
  const isErrorTab = !isLegacy && activeModuleData?.status === 'error'

  const displayFindings: any[] = isLegacy ? (scan.findings || []) : (activeModuleData?.findings || [])
  const displayLegislation: any[] = isLegacy ? (scan.legislation || []) : (activeModuleData?.legislation || [])
  const displaySummary: string = isLegacy ? (scan.summary || '') : (activeModuleData?.summary || '')
  const displayStatus: string = isLegacy ? scan.status : (activeModuleData?.status || 'uncertain')
  const displayChecklist: any[] = isLegacy ? checklist : (activeModuleData?.checklist || [])
  const displayChecklistState: Record<string, any> = isLegacy ? checklistState : (activeModuleData?.checklist_state || {})
  const displayFindingsState: Record<string, string> = isLegacy ? {} : (activeModuleData?.findings_state || {})
  const visibleCount = displayChecklist.filter((_: any, i: number) => !displayChecklistState[`d_${i}`]).length

  const openFindings = displayFindings.filter(f => (f.type === 'critical' || f.type === 'warning') && !displayFindingsState[f.id])
  const actionFindings = displayFindings.filter(f => f.type === 'action' && !displayFindingsState[f.id])
  const compliantFindings = displayFindings.filter(f => f.type === 'ok' && !displayFindingsState[f.id])
  const doneFindings = displayFindings.filter(f => displayFindingsState[f.id] === 'done')
  const dismissedFindings = displayFindings.filter(f => displayFindingsState[f.id] === 'dismissed')

  const totalIssues = openFindings.length
  const pillStyle = displayStatus === 'pass'
    ? { label: 'Compliant', bg: 'var(--pass-tint)', color: 'var(--pass-deep)' }
    : displayStatus === 'fail'
    ? { label: `${totalIssues} issue${totalIssues !== 1 ? 's' : ''}`, bg: 'var(--fail-tint)', color: 'var(--issue)' }
    : { label: 'Pending', bg: 'var(--warn-tint)', color: 'var(--warning)' }

  const inp: React.CSSProperties = { display: 'block', width: '100%', border: '1.5px solid var(--border-card)', background: 'var(--surf-inset)', fontSize: 14, color: 'var(--text)', boxSizing: 'border-box' }
  const btn = (amber?: boolean): React.CSSProperties => ({ height: 46, borderRadius: 'var(--r-control)', border: `1.5px solid ${amber ? 'transparent' : 'var(--border-card)'}`, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: amber ? 'var(--amber)' : 'var(--surf)', color: amber ? '#1B1A12' : 'var(--text)', boxShadow: amber ? 'var(--shadow-btn)' : 'none' })

  return (
    <>
      <div className="page-slide-right-in" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
        <AppHeader variant="detail" onBack={() => router.back()} rightContent={
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleShare} style={{ width: 38, height: 38, borderRadius: 'var(--r-control-sm)', border: '1.5px solid var(--border-card)', background: 'var(--surf)', color: 'var(--text)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <Share2 size={16} strokeWidth={2} />
            </button>
            <button onClick={handleExportPDF} disabled={exportingPDF} style={{ width: 38, height: 38, borderRadius: 'var(--r-control-sm)', border: '1.5px solid var(--border-card)', background: 'var(--surf)', color: 'var(--text)', display: 'grid', placeItems: 'center', cursor: 'pointer', opacity: exportingPDF ? 0.5 : 1 }}>
              <Download size={16} strokeWidth={2} />
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} style={{ width: 38, height: 38, borderRadius: 'var(--r-control-sm)', border: '1.5px solid var(--issue)', background: 'var(--fail-tint)', color: 'var(--issue)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </div>
        } />

        <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 18px 48px' }}>

          {/* Photo strip */}
          {photoUrls.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div
                ref={photoStripRef}
                onScroll={handleStripScroll}
                style={{
                  display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
                  height: 168, borderRadius: 'var(--r-card)', scrollbarWidth: 'none',
                }}
              >
                {photoUrls.map((url, i) => (
                  <div key={i} onClick={() => setPhotoEnlarged(i)} style={{ minWidth: '100%', height: 168, flexShrink: 0, scrollSnapAlign: 'start', cursor: 'pointer', overflow: 'hidden' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              {photoUrls.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8 }}>
                  {photoUrls.map((_, i) => (
                    <div key={i} style={{ width: i === activePhoto ? 18 : 6, height: 6, borderRadius: 3, background: i === activePhoto ? 'var(--amber)' : 'var(--border-card)', transition: 'width 0.2s, background 0.2s' }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Identity */}
          <div style={{ marginBottom: 14 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input value={scanName} onChange={e => setScanName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus
                  style={{ ...inp, flex: 1, height: 42, padding: '0 14px', borderRadius: 'var(--r-input)', fontSize: 17, fontWeight: 700 }} />
                <button onClick={saveName} style={{ ...btn(true), height: 42, padding: '0 14px', flexShrink: 0, fontSize: 13 }}>Save</button>
                <button onClick={() => { setScanName(scan.work_type || ''); setEditingName(false) }} style={{ ...btn(), height: 42, padding: '0 12px', flexShrink: 0, fontSize: 13 }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: 0, flex: 1 }}>
                  {scanName || 'Unnamed scan'}
                </h1>
                <button onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}>
                  <Pencil size={14} strokeWidth={2} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--r-pill)',
                background: pillStyle.bg, color: pillStyle.color,
              }}>
                {isErrorTab ? 'Error' : pillStyle.label}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>
                {d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                {siteName && ` · ${siteName}`}
              </span>
            </div>
          </div>

          {/* View toggle */}
          {!isLegacy && (
            <div style={{ display: 'flex', gap: 3, marginBottom: 12, padding: 3, background: 'var(--surf-toggle)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-control)', width: 'fit-content' }}>
              {(['detail', 'overview'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  height: 32, padding: '0 16px', borderRadius: 'calc(var(--r-control) - 4px)', border: 'none',
                  background: view === v ? 'var(--surf)' : 'transparent',
                  color: view === v ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: view === v ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: view === v ? 'var(--shadow-toggle)' : 'none',
                }}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Overview */}
          {!isLegacy && view === 'overview' && (
            <div>
              {scanModules.map((m: any) => {
                const modIssues = (m.findings || []).filter((f: any) => (f.type === 'critical' || f.type === 'warning') && !(m.findings_state || {})[f.id]).length
                const modLabel = m.module === 'safety' ? 'Safety' : m.module === 'quality' ? 'Quality' : 'Environmental'
                const statusColor = m.status === 'pass' ? 'var(--pass-deep)' : m.status === 'fail' ? 'var(--issue)' : m.status === 'error' ? 'var(--issue)' : 'var(--warning)'
                const modChecklist: any[] = m.checklist || []
                const modChecklistState: Record<string, any> = m.checklist_state || {}
                const modVisibleCount = modChecklist.filter((_: any, i: number) => !modChecklistState[`d_${i}`]).length
                const isChecklistOpen = openOverviewChecklist === m.module
                return (
                  <div key={m.module} style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1.5px solid var(--border-card)' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{modLabel}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: statusColor }}>
                        {m.status === 'error' ? 'Error' : modIssues > 0 ? `${modIssues} issue${modIssues !== 1 ? 's' : ''}` : 'No issues'}
                      </span>
                    </div>
                    {m.summary && (
                      <div style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, lineHeight: 1.55, color: 'var(--text-muted)', borderBottom: modChecklist.length > 0 ? '1.5px solid var(--border-card)' : 'none', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                        {m.summary}
                      </div>
                    )}
                    {modChecklist.length > 0 && (
                      <div>
                        <button onClick={() => setOpenOverviewChecklist(isChecklistOpen ? null : m.module)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: isChecklistOpen ? '1.5px solid var(--border-card)' : 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                          <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Checklist ({modVisibleCount})</span>
                          <ChevronDown size={14} strokeWidth={2} color="var(--text-muted)" style={{ transform: isChecklistOpen ? 'rotate(180deg)' : 'none' }} />
                        </button>
                        {isChecklistOpen && modChecklist.map((item: any, i: number) => {
                          if (modChecklistState[`d_${i}`]) return null
                          const checked = !!modChecklistState[`c_${i}`]
                          const isLast = modChecklist.slice(i + 1).every((_: any, j: number) => modChecklistState[`d_${i + 1 + j}`])
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: isLast ? 'none' : '1.5px solid var(--border-subtle)' }}>
                              <div onClick={() => handleChecklistChange({ ...modChecklistState, [`c_${i}`]: !modChecklistState[`c_${i}`] }, m.module)}
                                style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer', border: `1.5px solid ${checked ? 'var(--amber)' : 'var(--border-card)'}`, background: checked ? 'var(--amber)' : 'transparent' }}>
                                {checked && <Check size={11} strokeWidth={2.5} color="#1B1A12" />}
                              </div>
                              <div style={{ flex: 1, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: checked ? 'var(--text-muted)' : 'var(--text)', textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.55 : 1 }} onClick={() => handleChecklistChange({ ...modChecklistState, [`c_${i}`]: !modChecklistState[`c_${i}`] }, m.module)}>
                                {item.item}
                              </div>
                              <button onClick={() => handleChecklistChange({ ...modChecklistState, [`d_${i}`]: true, [`c_${i}`]: false }, m.module)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
                                <X size={14} strokeWidth={2} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => { setView('detail'); setReanalyseExpanded(true) }} style={{ ...btn(), flex: 1 }}>Re-analyse</button>
                <button onClick={handleExportPDF} disabled={exportingPDF} style={{ ...btn(true), flex: 1, opacity: exportingPDF ? 0.6 : 1 }}>
                  {exportingPDF ? 'Exporting…' : 'Export PDF'}
                </button>
              </div>
            </div>
          )}

          {/* Detail view */}
          {(isLegacy || view === 'detail') && (
            <>
              {/* Module tabs */}
              {!isLegacy && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {scanModules.map((m: any) => {
                    const isActive = m.module === activeModule
                    const tabStatusColor = m.status === 'pass' ? 'var(--pass)' : m.status === 'fail' ? 'var(--issue)' : m.status === 'error' ? 'var(--issue)' : 'var(--warning)'
                    const label = m.module === 'safety' ? 'Safety' : m.module === 'quality' ? 'Quality' : 'Environmental'
                    return (
                      <button key={m.module} onClick={() => setActiveModule(m.module)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px',
                        borderRadius: 'var(--r-pill)',
                        border: `1.5px solid ${isActive ? 'transparent' : 'var(--border-card)'}`,
                        background: isActive ? 'var(--amber)' : 'var(--surf)',
                        color: isActive ? '#1B1A12' : 'var(--text-secondary)',
                        fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? '#1B1A12' : tabStatusColor, flexShrink: 0 }} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Error tab */}
              {isErrorTab && (
                <div style={{ background: 'var(--fail-tint)', border: '1.5px solid var(--issue)', borderRadius: 'var(--r-card)', padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--issue)', marginBottom: 4 }}>Analysis failed for this module</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>An error occurred while processing. You can re-run below.</div>
                  <button onClick={() => reanalyseWithContext('', [], activeModule)} disabled={continueLoading}
                    style={{ ...btn(true), height: 40, padding: '0 18px', opacity: continueLoading ? 0.6 : 1 }}>
                    {continueLoading ? 'Re-analysing…' : `Re-analyse ${activeModule}`}
                  </button>
                </div>
              )}

              {/* Summary */}
              {!isErrorTab && displaySummary && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px 10px' }}>
                    <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Summary</span>
                  </div>
                  <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', padding: '14px 15px', fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--text)', marginBottom: 14 }}>
                    {displaySummary}
                  </div>
                </>
              )}

              {/* Open findings */}
              {!isErrorTab && openFindings.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px 10px' }}>
                    <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Issues ({openFindings.length})
                    </span>
                  </div>
                  <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', overflow: 'hidden', marginBottom: 14 }}>
                    {openFindings.map((f: any, i: number) => (
                      <FindingRow key={f.id || i} f={f} onMark={markFinding} isLegacy={isLegacy} />
                    ))}
                    {/* remove last row border */}
                    <style>{`.scan-finding-last{border-bottom:none!important}`}</style>
                  </div>
                </>
              )}

              {/* Action findings */}
              {!isErrorTab && actionFindings.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px 10px' }}>
                    <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Confirm on site ({actionFindings.length})
                    </span>
                  </div>
                  <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', overflow: 'hidden', marginBottom: 14 }}>
                    {actionFindings.map((f: any, i: number) => (
                      <FindingRow key={f.id || i} f={f} onMark={markFinding} isLegacy={isLegacy} />
                    ))}
                  </div>
                </>
              )}

              {/* Accordions */}
              {!isErrorTab && (
                <div style={{ marginBottom: 14 }}>
                  <Accordion label="Compliant" count={compliantFindings.length}>
                    {compliantFindings.map((f: any, i: number) => (
                      <FindingRow key={f.id || i} f={f} isLegacy={isLegacy} />
                    ))}
                  </Accordion>
                  <Accordion label="Done" count={doneFindings.length}>
                    {doneFindings.map((f: any, i: number) => (
                      <FindingRow key={f.id || i} f={f} state="done" onUndo={undoFinding} isLegacy={isLegacy} />
                    ))}
                  </Accordion>
                  <Accordion label="Dismissed" count={dismissedFindings.length}>
                    {dismissedFindings.map((f: any, i: number) => (
                      <FindingRow key={f.id || i} f={f} state="dismissed" onUndo={undoFinding} isLegacy={isLegacy} />
                    ))}
                  </Accordion>
                  {displayLegislation.length > 0 && (
                    <Accordion label="Legislation" count={displayLegislation.length}>
                      <div style={{ padding: '12px 14px' }}>
                        <LegislationList legislation={displayLegislation} openLeg={openLeg} setOpenLeg={setOpenLeg} />
                      </div>
                    </Accordion>
                  )}
                </div>
              )}

              {/* Checklist */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px 10px' }}>
                <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Checklist{displayChecklist.length > 0 ? ` (${visibleCount})` : ''}
                </span>
              </div>
              {displayChecklist.length === 0 ? (
                <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', padding: '12px 15px', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 14 }}>
                  Checklist included in next re-analysis.
                </div>
              ) : (
                <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', overflow: 'hidden', marginBottom: 14 }}>
                  {displayChecklist.map((item: any, i: number) => {
                    if (displayChecklistState[`d_${i}`]) return null
                    const checked = !!displayChecklistState[`c_${i}`]
                    const isLast = displayChecklist.slice(i + 1).every((_: any, j: number) => displayChecklistState[`d_${i + 1 + j}`])
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: isLast ? 'none' : '1.5px solid var(--border-subtle)' }}>
                        <div onClick={() => handleChecklistChange({ ...displayChecklistState, [`c_${i}`]: !displayChecklistState[`c_${i}`] })}
                          style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer', border: `1.5px solid ${checked ? 'var(--amber)' : 'var(--border-card)'}`, background: checked ? 'var(--amber)' : 'transparent' }}>
                          {checked && <Check size={11} strokeWidth={2.5} color="#1B1A12" />}
                        </div>
                        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleChecklistChange({ ...displayChecklistState, [`c_${i}`]: !displayChecklistState[`c_${i}`] })}>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: checked ? 'var(--text-muted)' : 'var(--text)', textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.55 : 1 }}>{item.item}</div>
                          {item.category && <div style={{ fontWeight: 600, fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.category}</div>}
                        </div>
                        <button onClick={() => handleChecklistChange({ ...displayChecklistState, [`d_${i}`]: true, [`c_${i}`]: false })}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                          <X size={14} strokeWidth={2} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Re-analyse + Export */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button onClick={() => setReanalyseExpanded(v => !v)} disabled={continueLoading}
                  style={{ ...btn(), flex: 1, opacity: continueLoading ? 0.6 : 1 }}>
                  {continueLoading ? <>
                    <span style={{ width: 14, height: 14, border: '2px solid var(--border-card)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Re-analysing…
                  </> : 'Re-analyse'}
                </button>
                <button onClick={handleExportPDF} disabled={exportingPDF} style={{ ...btn(true), flex: 1, opacity: exportingPDF ? 0.6 : 1 }}>
                  {exportingPDF ? 'Exporting…' : 'Export PDF'}
                </button>
              </div>
            </>
          )}

          {/* Assign to site */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px 10px' }}>
            <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Assign to site</span>
          </div>
          <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', padding: '14px 16px', marginBottom: 14 }}>
            <select value={selectedSiteId || ''} onChange={e => handleSiteChange(e.target.value)}
              style={{ display: 'block', width: '100%', height: 46, padding: '0 14px', borderRadius: 'var(--r-input)', border: '1.5px solid var(--border-card)', background: 'var(--surf-inset)', fontSize: 14, fontWeight: 500, color: 'var(--text)', cursor: 'pointer', boxSizing: 'border-box', fontFamily: 'inherit' }}>
              <option value="">No site</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              <option value="__new__">＋ Create new site</option>
            </select>
            {creatingNewSite && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <input autoFocus value={newSiteName} onChange={e => setNewSiteName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateAndAssign()}
                  placeholder="Site name"
                  style={{ flex: 1, height: 46, padding: '0 14px', border: '1.5px solid var(--amber)', background: 'var(--surf-inset)', fontSize: 14, color: 'var(--text)', borderRadius: 'var(--r-input)', fontFamily: 'inherit' }} />
                <button onClick={handleCreateAndAssign} disabled={!newSiteName.trim() || savingSite} style={{ ...btn(true), height: 46, padding: '0 16px', opacity: newSiteName.trim() ? 1 : 0.5 }}>{savingSite ? '…' : 'Create'}</button>
                <button onClick={() => { setCreatingNewSite(false); setNewSiteName('') }} style={{ ...btn(), height: 46, padding: '0 14px' }}>Cancel</button>
              </div>
            )}
          </div>

          {/* Share */}
          <button onClick={() => setShareMenuOpen(v => !v)} style={{ ...btn(shareMenuOpen), width: '100%', marginBottom: shareMenuOpen ? 8 : 0 }}>
            Share scan {shareEnabled ? '(on)' : ''}
          </button>
          {shareMenuOpen && (
            <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', padding: '14px 16px', marginBottom: 14 }}>
              {shareEnabled && shareToken ? (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-input)', fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all', fontFamily: 'var(--ff-mono)', background: 'var(--surf-inset)' }}>
                      {`https://sitespotter.com.au/shared/${shareToken}`}
                    </div>
                    <button onClick={handleShare} style={{ ...btn(), height: 40, padding: '0 14px', fontSize: 12, flexShrink: 0 }}>{linkCopied ? '✓ Copied' : 'Copy'}</button>
                  </div>
                  <button onClick={handleToggleShare} style={{ fontSize: 12, fontWeight: 600, color: 'var(--issue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Disable sharing</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>Generate a link anyone can view without logging in.</div>
                  <button onClick={handleShare} disabled={generatingShare} style={{ ...btn(true), padding: '0 18px', opacity: generatingShare ? 0.6 : 1 }}>
                    {generatingShare ? 'Generating…' : 'Enable sharing & copy link'}
                  </button>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Re-analyse bottom sheet */}
      {reanalyseExpanded && (
        <>
          <div onClick={() => setReanalyseExpanded(false)} style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', zIndex: 40 }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: 'var(--surf-sheet)', borderRadius: 'var(--r-sheet) var(--r-sheet) 0 0',
            boxShadow: 'var(--shadow-sheet)', padding: '0 20px 40px',
            animation: 'slideUpIn 0.28s cubic-bezier(0.2,0.7,0.3,1) forwards',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 14px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                Re-analyse{!isLegacy && activeModule ? ` — ${activeModule}` : ''}
              </div>
              <button onClick={() => setReanalyseExpanded(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Additional context</div>
            <textarea value={continueContext} onChange={e => setContinueContext(e.target.value)} rows={3} autoFocus
              placeholder="Describe what's changed or what you'd like re-assessed…"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border-card)', background: 'var(--surf-inset)', fontSize: 13, fontWeight: 500, resize: 'vertical', color: 'var(--text)', lineHeight: 1.5, borderRadius: 'var(--r-input)', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-control-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0, background: 'var(--surf-inset)' }}>
                <Upload size={13} strokeWidth={2} />
                Add photos
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={async (e) => {
                  const files = Array.from(e.target.files as FileList).slice(0, 3)
                  const converted = await Promise.all(files.map((f: File) => convertToJpeg(f)))
                  setContinuePhotos(prev => [...prev, ...(converted as string[]).map((d: string) => ({ dataUrl: d, base64: d.split(',')[1] }))].slice(0, 5))
                  e.target.value = ''
                }} />
              </label>
              {continuePhotos.length > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)' }}>{continuePhotos.length} added</span>}
            </div>
            {continueError && <div style={{ marginTop: 10, padding: '8px 12px', border: '1.5px solid var(--issue)', borderRadius: 'var(--r-input)', fontSize: 12, fontWeight: 500, color: 'var(--issue)' }}>{continueError}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={async () => { setReanalyseExpanded(false); await reanalyseWithContext(continueContext, continuePhotos, activeModule || 'safety') }}
                disabled={continueLoading || (continuePhotos.length === 0 && !continueContext.trim())}
                style={{ ...btn(true), flex: 1, opacity: (continueLoading || (!continuePhotos.length && !continueContext.trim())) ? 0.4 : 1 }}>
                {continueLoading ? 'Re-analysing…' : 'Re-analyse →'}
              </button>
              <button onClick={() => { setReanalyseExpanded(false); setContinueContext(''); setContinuePhotos([]) }}
                style={{ ...btn(), height: 46, padding: '0 16px' }}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* Photo enlarge modal */}
      {photoEnlarged !== false && (
        <div onClick={() => setPhotoEnlarged(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'pointer' }}>
          {photoUrls.length > 1 && photoEnlarged > 0 && (
            <button onClick={e => { e.stopPropagation(); setPhotoEnlarged((photoEnlarged as number) - 1) }}
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 6, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>‹</button>
          )}
          {photoUrls.length > 1 && (photoEnlarged as number) < photoUrls.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setPhotoEnlarged((photoEnlarged as number) + 1) }}
              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 6, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>›</button>
          )}
          <img src={photoUrls[photoEnlarged as number]} alt="Enlarged"
            style={{ maxWidth: photoUrls.length > 1 ? 'calc(95vw - 120px)' : '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 6 }} />
          {photoUrls.length > 1 && (
            <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', fontWeight: 600, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.5)', padding: '5px 12px', borderRadius: 4 }}>
              {(photoEnlarged as number) + 1} / {photoUrls.length}
            </div>
          )}
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', padding: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete this scan?</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>This will permanently delete the scan and all associated photos.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ ...btn(), flex: 1 }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, height: 46, background: 'var(--issue)', border: 'none', borderRadius: 'var(--r-control)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
