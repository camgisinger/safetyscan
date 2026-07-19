'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Scan } from '../../../lib/supabase'
import { useUser } from '../../../lib/UserContext'
import { useCount } from '../../../lib/CountContext'
import { convertToJpeg } from '../../../components/PhotoResultCard'
import AppHeader from '../../../components/AppHeader'
import LegislationList from '../../../components/LegislationList'
import {
  Share2, Download, Trash2, ArrowLeft, Check, X,
  ChevronDown, RotateCcw, Pencil, Camera, Upload,
  Shield, Ruler, Leaf,
} from 'lucide-react'

type Branding = { company_name: string | null; logo_url: string | null; company_email: string | null; company_phone: string | null; company_website: string | null } | null

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

async function exportScanPDF(scan: Scan, siteName: string | null, notes: string, branding: Branding, scanModules: any[]) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR

  type RGB = [number, number, number]
  const NAVY: RGB = [22, 24, 28]
  const AMBER: RGB = [215, 105, 30]
  const RED: RGB = [196, 56, 44]
  const WARN_C: RGB = [165, 90, 15]
  const GREEN: RGB = [34, 130, 80]
  const TEXT: RGB = [22, 24, 28]
  const MUT: RGB = [110, 110, 110]
  const LIGHT: RGB = [165, 165, 165]
  const BORDER: RGB = [220, 218, 210]
  const BG_CARD: RGB = [248, 247, 244]
  const WHITE: RGB = [255, 255, 255]
  const RED_TINT: RGB = [255, 241, 239]
  const WARN_TINT: RGB = [255, 248, 234]
  const GREEN_TINT: RGB = [235, 248, 240]

  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2])
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2])
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2])
  const lw = (w: number) => doc.setLineWidth(w)

  // ── data prep ─────────────────────────────────────────────────────────────
  const scanDate = new Date(scan.created_at)
  const reportId = `SS-${scanDate.getFullYear()}-${scan.id.slice(-4).toUpperCase()}`
  const dateStr = scanDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  const dateTimeStr = dateStr + ',  ' + scanDate.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })

  const modOrder = ['safety', 'quality', 'environmental']
  const sortedMods = [...scanModules].sort((a: any, b: any) => modOrder.indexOf(a.module) - modOrder.indexOf(b.module))
  const isMultiModule = sortedMods.length > 0

  const computeModStatus = (mod: any): 'fail' | 'warning' | 'action' | 'pass' | 'not_applicable' => {
    if (mod.status === 'not_applicable') return 'not_applicable'
    const fs: Record<string, string> = mod.findings_state || {}
    const ff: any[] = mod.findings || []
    if (ff.some(f => fs[f.id] !== 'done' && fs[f.id] !== 'dismissed' && f.type === 'critical')) return 'fail'
    if (ff.some(f => fs[f.id] !== 'done' && fs[f.id] !== 'dismissed' && f.type === 'warning')) return 'warning'
    if (ff.some(f => fs[f.id] !== 'done' && fs[f.id] !== 'dismissed' && f.type === 'action')) return 'action'
    return 'pass'
  }

  const worstStatus = isMultiModule
    ? sortedMods.reduce((w: string, m: any) => {
        const s = computeModStatus(m)
        if (w === 'fail' || s === 'fail') return 'fail'
        if (w === 'warning' || s === 'warning') return 'warning'
        if (w === 'action' || s === 'action') return 'action'
        return 'pass'
      }, 'pass')
    : (scan.status || 'pass')

  // ── collect all findings ───────────────────────────────────────────────────
  const allOpen: any[] = isMultiModule
    ? sortedMods.flatMap((m: any) => {
        const fs: Record<string, string> = m.findings_state || {}
        return (m.findings || [])
          .filter((f: any) => fs[f.id] !== 'done' && fs[f.id] !== 'dismissed' && (f.type === 'critical' || f.type === 'warning' || f.type === 'action'))
          .map((f: any) => ({ ...f, _mod: m.module }))
      })
    : (scan.findings || []).filter((f: any) => f.type !== 'ok')

  const allCompliant: any[] = isMultiModule
    ? sortedMods.flatMap((m: any) => (m.findings || []).filter((f: any) => f.type === 'ok').map((f: any) => ({ ...f, _mod: m.module })))
    : (scan.findings || []).filter((f: any) => f.type === 'ok')

  // ── load assets ────────────────────────────────────────────────────────────
  let logoDataUrl: string | null = null
  if (branding?.logo_url) logoDataUrl = await imageUrlToDataUrl(branding.logo_url)

  const photoUrls = scan.photo_urls?.length ? scan.photo_urls : scan.photo_url ? [scan.photo_url] : []
  type PhotoEntry = { d: string; dims: { w: number; h: number } }
  const photos: PhotoEntry[] = (await Promise.all(photoUrls.map(async (url: string) => {
    const d = await imageUrlToDataUrl(url)
    if (!d) return null
    const dims = await new Promise<{ w: number; h: number }>(res => {
      const img = new window.Image()
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => res({ w: 4, h: 3 })
      img.src = d
    })
    return { d, dims }
  }))).filter(Boolean) as PhotoEntry[]

  // ── page layout constants ─────────────────────────────────────────────────
  const H1 = 32          // tall page-1 header height
  const H2 = 18          // compact continuation header height
  const FOOTER_TOP = PH - 17
  const CONTENT_BOT = FOOTER_TOP - 2
  let y = 0

  // ── header renderers ──────────────────────────────────────────────────────
  const drawHeader1 = () => {
    lw(0.3); stroke(BORDER)
    doc.line(ML, H1 - 0.5, PW - MR, H1 - 0.5)
    let lx = ML
    const cy = H1 / 2
    const logoSz = 18
    const logoY = cy - logoSz / 2
    if (logoDataUrl) {
      fill(NAVY); doc.roundedRect(lx, logoY, logoSz, logoSz, 2, 2, 'F')
      try { doc.addImage(logoDataUrl, logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG', lx, logoY, logoSz, logoSz) } catch {}
      lx += logoSz + 5
    } else {
      fill(NAVY); doc.roundedRect(lx, logoY, logoSz, logoSz, 2, 2, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); color(AMBER)
      doc.text('SS', lx + logoSz / 2, logoY + logoSz / 2 + 1.8, { align: 'center' })
      lx += logoSz + 5
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); color(TEXT)
    doc.text(branding?.company_name || 'SiteSpotter', lx, cy + 1.5)
    const rx = PW - MR
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); color(LIGHT)
    doc.text('REPORT ID', rx, cy - 5, { align: 'right' })
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); color(TEXT)
    doc.text(reportId, rx, cy + 1.5, { align: 'right' })
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); color(MUT)
    doc.text('VERIFIED BY SITESPOTTER', rx, cy + 7.5, { align: 'right' })
  }

  const drawHeader2 = () => {
    lw(0.3); stroke(BORDER)
    doc.line(ML, H2 - 0.5, PW - MR, H2 - 0.5)
    const cy = H2 / 2
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); color(TEXT)
    doc.text(branding?.company_name || 'SiteSpotter', ML, cy + 1)
    const rx = PW - MR
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(AMBER)
    doc.text('COMPLIANCE REPORT', rx, cy - 1.5, { align: 'right' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); color(MUT)
    const scanRef = [scan.work_type, dateStr, reportId].filter(Boolean).join('  ·  ')
    doc.text(scanRef, rx, cy + 5, { align: 'right' })
  }

  const needsPage = (requiredH: number) => {
    if (y + requiredH > CONTENT_BOT) {
      doc.addPage()
      drawHeader2()
      y = H2 + 8
    }
  }

  // ══════════════════ PAGE 1 ══════════════════════════════════════════════════
  drawHeader1()
  y = H1 + 8

  // "SITE COMPLIANCE REPORT" label
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(AMBER)
  doc.text('SITE COMPLIANCE REPORT', ML, y); y += 5

  // Status badge (top-right)
  const statusLabel = worstStatus === 'fail' ? 'ACTION REQUIRED'
    : worstStatus === 'warning' ? 'WARNING'
    : worstStatus === 'action' ? 'CONFIRM ON SITE'
    : 'COMPLIANT'
  const statusBg: RGB = worstStatus === 'fail' ? RED : (worstStatus === 'warning' || worstStatus === 'action') ? WARN_C : GREEN
  const sbW = Math.max(28, statusLabel.length * 1.55 + 8)
  fill(statusBg)
  doc.roundedRect(PW - MR - sbW, y - 2, sbW, 8, 2, 2, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(WHITE)
  doc.text(statusLabel, PW - MR - sbW / 2, y + 3.5, { align: 'center' })

  // Title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); color(TEXT)
  const titleL = doc.splitTextToSize(scan.work_type || 'Compliance Scan', CW - sbW - 6)
  doc.text(titleL, ML, y + 6); y += titleL.length * 8 + 2

  // Location subtext
  if (siteName) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); color(MUT)
    doc.text(siteName, ML, y); y += 5
  }
  y += 4

  // ── info grid ─────────────────────────────────────────────────────────────
  const modLabels = sortedMods.map((m: any) => {
    const l = m.module.charAt(0).toUpperCase() + m.module.slice(1)
    return l === 'Environmental' ? 'Env.' : l
  })
  const gridCells = [
    { label: 'SCANNED', value: dateTimeStr },
    { label: 'WORK TYPE', value: scan.work_type || '—' },
    { label: 'SITE', value: siteName || '—' },
    { label: 'MODULES RUN', value: isMultiModule ? modLabels.join(', ') : 'Standard' },
  ]
  const cellW = CW / 4
  const gridH = 16
  lw(0.3); stroke(BORDER); doc.rect(ML, y, CW, gridH, 'S')
  gridCells.forEach((cell, i) => {
    const cx = ML + i * cellW
    if (i > 0) { lw(0.3); stroke(BORDER); doc.line(cx, y, cx, y + gridH) }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); color(MUT)
    doc.text(cell.label, cx + 3, y + 5)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); color(TEXT)
    const vl = doc.splitTextToSize(cell.value, cellW - 5)
    doc.text(vl[0], cx + 3, y + 12)
  })
  y += gridH + 8

  // ── photos ────────────────────────────────────────────────────────────────
  if (photos.length > 0) {
    needsPage(8 + 40)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(MUT)
    doc.text(`PHOTOS ANALYSED  ·  ${photos.length}`, ML, y); y += 5
    const nCols = Math.min(photos.length, 3)
    const pGap = 3, pH = 38
    const pW = (CW - (nCols - 1) * pGap) / nCols
    photos.slice(0, nCols).forEach((p, i) => {
      const px = ML + i * (pW + pGap)
      fill(BG_CARD); lw(0.3); stroke(BORDER)
      doc.roundedRect(px, y, pW, pH, 2, 2, 'FD')
      try {
        const r = p.dims.w / p.dims.h, tr = pW / pH
        let iw: number, ih: number, ox = 0, oy = 0
        if (r > tr) { iw = pW; ih = pW / r; oy = (pH - ih) / 2 }
        else { ih = pH; iw = pH * r; ox = (pW - iw) / 2 }
        doc.addImage(p.d, 'JPEG', px + ox, y + oy, iw, ih)
      } catch {}
    })
    y += pH + 8
  }

  // ── results summary ───────────────────────────────────────────────────────
  if (isMultiModule) {
    needsPage(8 + 36)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(MUT)
    doc.text('RESULTS SUMMARY', ML, y); y += 5
    const N = sortedMods.length
    const mGap = 4
    const mW = (CW - (N - 1) * mGap) / N
    const mH = 36
    sortedMods.forEach((mod: any, i: number) => {
      const mx = ML + i * (mW + mGap)
      const mst = computeModStatus(mod)
      const ff: any[] = mod.findings || []
      const fs: Record<string, string> = mod.findings_state || {}
      const cardBg: RGB = mst === 'fail' ? RED_TINT : mst === 'warning' ? WARN_TINT : mst === 'pass' ? GREEN_TINT : BG_CARD
      const cardBd: RGB = mst === 'fail' ? [215, 185, 180] : mst === 'warning' ? [215, 195, 165] : mst === 'pass' ? [170, 215, 185] : BORDER
      fill(cardBg); lw(0.4); stroke(cardBd)
      doc.roundedRect(mx, y, mW, mH, 2, 2, 'FD')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); color(TEXT)
      doc.text(mod.module.charAt(0).toUpperCase() + mod.module.slice(1), mx + 4, y + 7)
      const bdgText = mst === 'fail' ? 'FAIL' : mst === 'warning' ? 'WARNING' : mst === 'action' ? 'CONFIRM' : mst === 'not_applicable' ? 'N/A' : 'PASS'
      const bdgBg: RGB = mst === 'fail' ? RED : (mst === 'warning' || mst === 'action') ? WARN_C : mst === 'pass' ? GREEN : LIGHT
      const bW = Math.max(12, bdgText.length * 1.6 + 6)
      fill(bdgBg)
      doc.roundedRect(mx + mW - bW - 3, y + 3, bW, 6.5, 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6); color(WHITE)
      doc.text(bdgText, mx + mW - bW / 2 - 3, y + 7.3, { align: 'center' })
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); color(MUT)
      const sl = doc.splitTextToSize(mod.summary || '', mW - 8)
      doc.text(sl.slice(0, 2), mx + 4, y + 15)
      const critN = ff.filter(f => f.type === 'critical' && fs[f.id] !== 'done' && fs[f.id] !== 'dismissed').length
      const warnN = ff.filter(f => f.type === 'warning' && fs[f.id] !== 'done' && fs[f.id] !== 'dismissed').length
      const actN = ff.filter(f => f.type === 'action' && fs[f.id] !== 'done' && fs[f.id] !== 'dismissed').length
      const okN = ff.filter(f => f.type === 'ok').length
      let tx = mx + 4
      const cy2 = y + mH - 4
      if (critN > 0) { doc.setFont('helvetica', 'bold'); doc.setFontSize(6); color(RED); const t = `${critN} CRITICAL`; doc.text(t, tx, cy2); tx += doc.getTextDimensions(t).w + 3 }
      if (warnN > 0) { doc.setFont('helvetica', 'bold'); doc.setFontSize(6); color(WARN_C); const t = `${warnN} WARNING`; doc.text(t, tx, cy2); tx += doc.getTextDimensions(t).w + 3 }
      if (actN > 0 && critN === 0 && warnN === 0) { doc.setFont('helvetica', 'bold'); doc.setFontSize(6); color(WARN_C); doc.text(`${actN} TO CONFIRM`, tx, cy2) }
      if (okN > 0 && critN === 0 && warnN === 0 && actN === 0) { doc.setFont('helvetica', 'bold'); doc.setFontSize(6); color(GREEN); doc.text(`${okN} COMPLIANT`, tx, cy2) }
    })
    y += mH + 8
  }

  // ── findings heading ──────────────────────────────────────────────────────
  if (allOpen.length + allCompliant.length > 0) {
    needsPage(14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); color(TEXT)
    doc.text('Findings', ML, y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); color(MUT)
    doc.text(`${allOpen.length} need action  ·  ${allCompliant.length} compliant`, PW - MR, y, { align: 'right' })
    y += 9
  }

  // ── finding card renderer ─────────────────────────────────────────────────
  const renderFinding = (f: any) => {
    const isCrit = f.type === 'critical'
    const isWarn = f.type === 'warning'
    const isAct = f.type === 'action'
    const accent: RGB = isCrit ? RED : (isWarn || isAct) ? WARN_C : GREEN
    const tint: RGB = isCrit ? RED_TINT : (isWarn || isAct) ? WARN_TINT : GREEN_TINT
    const sevLabel = isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : isAct ? 'CONFIRM ON SITE' : 'COMPLIANT'
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
    const tLines = doc.splitTextToSize(f.text || f.title || '', CW - 12)
    const legLine = f.legislation ? 1 : 0
    const cardH = 5 + 7 + 2 + tLines.length * 5.5 + legLine * 5 + 4
    needsPage(cardH + 3)
    fill(BG_CARD); lw(0.3); stroke(BORDER)
    doc.roundedRect(ML, y, CW, cardH, 2, 2, 'FD')
    fill(accent); doc.roundedRect(ML, y, 3.5, cardH, 1, 1, 'F'); doc.rect(ML + 2, y, 1.5, cardH, 'F')
    const sevW = Math.max(18, sevLabel.length * 1.5 + 6)
    fill(tint); lw(0.5); stroke(accent)
    doc.roundedRect(ML + 5, y + 3.5, sevW, 6, 1.5, 1.5, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); color(accent)
    doc.text(sevLabel, ML + 5 + sevW / 2, y + 7.5, { align: 'center' })
    if (f.category) {
      const catW = Math.max(12, f.category.toUpperCase().length * 1.4 + 6)
      const catX = ML + 5 + sevW + 2
      fill(WHITE); lw(0.3); stroke(BORDER)
      doc.roundedRect(catX, y + 3.5, catW, 6, 1.5, 1.5, 'FD')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); color(MUT)
      doc.text(f.category.toUpperCase(), catX + catW / 2, y + 7.5, { align: 'center' })
    }
    let fy = y + 14
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); color(TEXT)
    doc.text(tLines, ML + 6, fy); fy += tLines.length * 5.5
    if (f.legislation) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); color(MUT)
      doc.text(f.legislation, ML + 6, fy + 1)
    }
    y += cardH + 3
  }

  // ── render findings per module ─────────────────────────────────────────────
  if (isMultiModule) {
    for (const mod of sortedMods) {
      const fs: Record<string, string> = mod.findings_state || {}
      const ff: any[] = mod.findings || []
      const openF = ff.filter(f => fs[f.id] !== 'done' && fs[f.id] !== 'dismissed' && (f.type === 'critical' || f.type === 'warning' || f.type === 'action'))
      const compliantF = ff.filter(f => f.type === 'ok')
      const mst = computeModStatus(mod)
      if (openF.length === 0 && compliantF.length === 0 && mst !== 'pass' && mst !== 'not_applicable') continue
      const modLabel = mod.module.charAt(0).toUpperCase() + mod.module.slice(1)
      const sectionSuffix = mst === 'fail' || mst === 'warning'
        ? `${openF.length} ISSUE${openF.length !== 1 ? 'S' : ''}`
        : mst === 'action' ? 'CONFIRM ON SITE'
        : mst === 'not_applicable' ? 'NOT APPLICABLE'
        : 'PASS'
      needsPage(14)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); color(MUT)
      doc.text(`${modLabel.toUpperCase()}  ·  ${sectionSuffix}`, ML, y); y += 7
      for (const f of openF) renderFinding(f)
      if ((mst === 'pass' || mst === 'not_applicable') && openF.length === 0) {
        needsPage(14)
        fill(GREEN_TINT); lw(0.4); stroke([172, 215, 186] as RGB)
        doc.roundedRect(ML, y, CW, 12, 2, 2, 'FD')
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); color(GREEN)
        const pm = doc.splitTextToSize(mod.summary || `No issues found. ${modLabel} controls are compliant.`, CW - 10)
        doc.text(pm[0], ML + 5, y + 7.5)
        y += 15
      }
      if (compliantF.length > 0) {
        needsPage(10)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(MUT)
        doc.text(`COMPLIANT OBSERVATIONS  ·  ${compliantF.length}`, ML, y); y += 5
        lw(0.2); stroke(BORDER); doc.line(ML, y, PW - MR, y)
        for (const f of compliantF) {
          needsPage(11)
          fill(GREEN); doc.circle(ML + 3.5, y + 4.5, 3.5, 'F')
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(WHITE)
          doc.text('✓', ML + 1.9, y + 6.2)
          doc.setFont('helvetica', 'bold'); doc.setFontSize(9); color(TEXT)
          doc.text(f.text || f.title || '', ML + 10, y + 5.5)
          let tagX = PW - MR
          const modTag = mod.module === 'environmental' ? 'ENV' : mod.module === 'quality' ? 'QUALITY' : 'SAFETY'
          const tW = Math.max(12, modTag.length * 1.5 + 5)
          tagX -= tW
          fill(BG_CARD); lw(0.3); stroke(BORDER)
          doc.roundedRect(tagX, y + 1.5, tW, 5.5, 1.5, 1.5, 'FD')
          doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); color(MUT)
          doc.text(modTag, tagX + tW / 2, y + 5.6, { align: 'center' })
          y += 11
          lw(0.2); stroke(BORDER); doc.line(ML, y, PW - MR, y)
        }
        y += 6
      }
      y += 3
    }
  } else {
    for (const f of allOpen) renderFinding(f)
    if (allCompliant.length > 0) {
      needsPage(10)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(MUT)
      doc.text(`COMPLIANT OBSERVATIONS  ·  ${allCompliant.length}`, ML, y); y += 5
      lw(0.2); stroke(BORDER); doc.line(ML, y, PW - MR, y)
      for (const f of allCompliant) {
        needsPage(11)
        fill(GREEN); doc.circle(ML + 3.5, y + 4.5, 3.5, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(WHITE)
        doc.text('✓', ML + 1.9, y + 6.2)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); color(TEXT)
        doc.text(f.text || f.title || '', ML + 10, y + 5.5)
        y += 11
        lw(0.2); stroke(BORDER); doc.line(ML, y, PW - MR, y)
      }
      y += 6
    }
  }

  // ── legislation table ─────────────────────────────────────────────────────
  const allLeg: any[] = isMultiModule
    ? sortedMods.flatMap((m: any) => m.legislation || [])
    : (scan.legislation || [])
  const legSeen = new Set<string>()
  const dedupedLeg = allLeg.filter((l: any) => {
    const k = l.code || l.name || ''
    if (legSeen.has(k)) return false
    legSeen.add(k); return true
  })
  if (dedupedLeg.length > 0) {
    needsPage(16)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(MUT)
    doc.text('LEGISLATION REFERENCES CITED', ML, y); y += 5
    lw(0.2); stroke(BORDER); doc.line(ML, y, PW - MR, y)
    for (const leg of dedupedLeg) {
      const clauses = (leg.clauses || []).slice(0, 2)
      const clauseRef = clauses.map((c: any) => c.ref).filter(Boolean).join(', ')
      const desc = clauses[0]?.summary || leg.description || ''
      const rowH = 9
      needsPage(rowH + 1)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); color(TEXT)
      doc.text(leg.code || leg.name || '', ML + 2, y + 6)
      if (clauseRef) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); color(MUT); doc.text(clauseRef, ML + 66, y + 6) }
      if (desc) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); color(TEXT); const dl = doc.splitTextToSize(desc, CW - 86); doc.text(dl[0] || '', ML + 86, y + 6) }
      y += rowH
      lw(0.2); stroke(BORDER); doc.line(ML, y, PW - MR, y)
    }
    y += 8
  }

  // ── notes ─────────────────────────────────────────────────────────────────
  if (notes.trim()) {
    needsPage(14)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); color(MUT)
    doc.text('NOTES', ML, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); color(TEXT)
    const nl = doc.splitTextToSize(notes, CW)
    needsPage(nl.length * 5 + 4)
    doc.text(nl, ML, y); y += nl.length * 5 + 4
  }

  // ── end of report ─────────────────────────────────────────────────────────
  needsPage(12)
  lw(0.3); stroke(BORDER); doc.line(ML, y, PW - MR, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); color(MUT)
  doc.text(
    `End of report  —  ${allOpen.length} finding${allOpen.length !== 1 ? 's' : ''} need action, ${allCompliant.length} compliant observation${allCompliant.length !== 1 ? 's' : ''} recorded.`,
    ML + 2, y + 4
  )

  // ── footers (all pages) ───────────────────────────────────────────────────
  const total = doc.getNumberOfPages()
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  const disclaimerText = 'This report is an AI-assisted compliance guide generated by SiteSpotter. It is intended to support, not replace, professional judgment and formal inspection. Findings should be verified on site by a competent person. SiteSpotter accepts no liability for reliance on this document.'
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    lw(0.25); stroke(BORDER); doc.line(ML, FOOTER_TOP, PW - MR, FOOTER_TOP)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.8); color(LIGHT)
    const dl = doc.splitTextToSize(disclaimerText, CW * 0.68)
    doc.text(dl, ML, FOOTER_TOP + 3)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); color(MUT)
    doc.text(`Generated with SiteSpotter  ·  ${today}`, ML, PH - 8)
    doc.text(`Page ${p} of ${total}`, PW - MR, PH - 8, { align: 'right' })
  }

  const prefix = branding?.company_name
    ? branding.company_name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
    : 'sitespotter'
  doc.save(`${prefix}-${(scan.work_type || 'scan').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${new Date(scan.created_at).toISOString().slice(0, 10)}.pdf`)
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
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const photoStripRef = useRef<HTMLDivElement>(null)
  const { user: currentUser } = useUser()
  const { adjustCount } = useCount()
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) return
    const init = async () => {
      const [scanRes, sitesRes, modulesRes] = await Promise.all([
        supabase.from('scans').select('id, work_type, status, notes, site_id, share_token, share_enabled, created_at, photo_url, photo_urls').eq('id', id).single(),
        supabase.from('sites').select('id, name').eq('archived', false).order('name', { ascending: true }),
        supabase.from('scan_modules').select('id, module, status, findings, findings_state, legislation, summary, follow_up_questions').eq('scan_id', id),
      ])
      if (scanRes.error) { setError(`Could not load scan: ${scanRes.error.message}`); setLoading(false); return }
      if (!scanRes.data) { setError('Scan not found.'); setLoading(false); return }
      const s = scanRes.data as Scan
      setScan(s); setPhotoUrls(s.photo_urls?.length ? s.photo_urls : s.photo_url ? [s.photo_url] : [])
      setScanName(s.work_type || ''); setNotes(s.notes || '')
      setSelectedSiteId(s.site_id || null); setShareToken(s.share_token || null); setShareEnabled(s.share_enabled || false)
      setSites(sitesRes.data || [])
      const modOrder = ['safety', 'quality', 'environmental']
      const sorted = (modulesRes.data || []).sort((a: any, b: any) => modOrder.indexOf(a.module) - modOrder.indexOf(b.module))
      setScanModules(sorted)
      if (sorted.length > 0) setActiveModule(sorted[0].module)
      setLoading(false)
    }
    init()
  }, [id, currentUser, router])

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
    const { data: newSite, error } = await supabase.from('sites').insert({ name: newSiteName.trim(), created_by: currentUser?.id, archived: false }).select().single()
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
    const paths = urls.map((u: string) => u.split('/scan-photos/')[1]).filter(Boolean)
    if (paths.length) await supabase.storage.from('scan-photos').remove(paths)
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
    let branding: Branding = null
    if (currentUser) {
      const { data } = await supabase.from('profiles')
        .select('company_name, logo_url, company_email, company_phone, company_website')
        .eq('id', currentUser.id).single()
      branding = data as Branding
    }
    try { await exportScanPDF(scan, siteName, notes, branding, scanModules) } catch (e) { console.error('[PDF]', e) } finally { setExportingPDF(false) }
  }

  const reanalyseWithContext = async (additionalInfo: string, extraPhotos: { dataUrl: string; base64: string }[], module: string) => {
    if (!scan) return; setContinueLoading(true); setContinueError(null)
    try {
      const newUrls: string[] = []
      if (currentUser && extraPhotos.length > 0) {
        const uploaded = await Promise.all(extraPhotos.map(async (p, i) => {
          const blob = await fetch(p.dataUrl).then(r => r.blob())
          const fileName = `${currentUser.id}/extra-${id}-${i}-${Date.now()}.jpg`
          const { error } = await supabase.storage.from('scan-photos').upload(fileName, blob, { contentType: 'image/jpeg', upsert: false })
          if (error) return null
          const { data: urlData } = supabase.storage.from('scan-photos').getPublicUrl(fileName)
          return urlData.publicUrl
        }))
        newUrls.push(...(uploaded.filter(Boolean) as string[]))
      }
      const updatedUrls = newUrls.length > 0 ? [...photoUrls, ...newUrls] : photoUrls
      if (newUrls.length > 0) { await supabase.from('scans').update({ photo_urls: updatedUrls }).eq('id', id); setPhotoUrls(updatedUrls) }
      const contextText = `Analyse these construction site photos for Queensland compliance, building on a previous assessment.\n\nPrevious: Work type: ${scan.work_type}, Status: ${scan.status}${additionalInfo ? `\n\nAdditional context: ${additionalInfo}` : ''}`
      const userContent: any[] = [...extraPhotos.map(p => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: p.base64 } })), { type: 'text', text: contextText }]
      const activeModData = scanModules.find((m: any) => m.module === module)
      const res = await fetch('/api/analyse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ scan_id: id, modules: [module], messages: [{ role: 'user', content: userContent }], searchQuery: [scan.work_type, additionalInfo].filter(Boolean).join(' '), existing_findings: activeModData?.findings || [], findings_state: activeModData?.findings_state || {} }) })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Analysis failed')
      const { data: freshModules } = await supabase.from('scan_modules').select('id, module, status, findings, findings_state, legislation, summary, follow_up_questions').eq('scan_id', id)
      if (freshModules) {
        const modOrder = ['safety', 'quality', 'environmental']
        setScanModules(freshModules.sort((a: any, b: any) => modOrder.indexOf(a.module) - modOrder.indexOf(b.module)))
      }
      setContinueContext(''); setContinuePhotos([])
    } catch (e: any) { setContinueError(e.message || 'Analysis failed') } finally { setContinueLoading(false) }
  }

  const getModuleStatus = (mod: any): 'fail' | 'action' | 'pass' | 'not_applicable' | 'error' => {
    if (mod.status === 'not_applicable') return 'not_applicable'
    if (mod.status === 'error') return 'error'
    const findings: any[] = mod.findings || []
    const state: Record<string, string> = mod.findings_state || {}
    if (findings.some((f: any) => state[f.id] !== 'done' && state[f.id] !== 'dismissed' && (f.type === 'critical' || f.type === 'warning'))) return 'fail'
    if (findings.some((f: any) => state[f.id] !== 'done' && state[f.id] !== 'dismissed' && f.type === 'action')) return 'action'
    return 'pass'
  }

  const calcModuleStatus = (findings: any[], newFs: Record<string, string>) => {
    if (findings.some(f => newFs[f.id] !== 'done' && newFs[f.id] !== 'dismissed' && (f.type === 'critical' || f.type === 'warning'))) return 'fail'
    if (findings.some(f => newFs[f.id] !== 'done' && newFs[f.id] !== 'dismissed' && f.type === 'action')) return 'uncertain'
    return 'pass'
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
  const isErrorTab = !isLegacy && activeModuleData ? getModuleStatus(activeModuleData) === 'error' : false

  const displayFindings: any[] = isLegacy ? (scan.findings || []) : (activeModuleData?.findings || [])
  const displayLegislation: any[] = isLegacy ? (scan.legislation || []) : (activeModuleData?.legislation || [])
  const displaySummary: string = isLegacy ? (scan.summary || '') : (activeModuleData?.summary || '')
  const displayStatus: string = isLegacy ? scan.status : (activeModuleData?.status || 'uncertain')
  const displayFindingsState: Record<string, string> = isLegacy ? {} : (activeModuleData?.findings_state || {})

  const openFindings = displayFindings.filter(f => (f.type === 'critical' || f.type === 'warning') && !displayFindingsState[f.id])
  const actionFindings = displayFindings.filter(f => f.type === 'action' && !displayFindingsState[f.id])
  const compliantFindings = displayFindings.filter(f => f.type === 'ok' && !displayFindingsState[f.id])
  const doneFindings = displayFindings.filter(f => displayFindingsState[f.id] === 'done')
  const dismissedFindings = displayFindings.filter(f => displayFindingsState[f.id] === 'dismissed')

  const totalIssues = openFindings.length
  const activeModStatus = !isLegacy && activeModuleData ? getModuleStatus(activeModuleData) : null
  const pillStatus = isLegacy ? displayStatus : (activeModStatus ?? 'uncertain')
  const pillStyle = pillStatus === 'pass'
    ? { label: 'Compliant', bg: 'var(--pass-tint)', color: 'var(--pass-deep)' }
    : pillStatus === 'fail'
    ? { label: totalIssues ? `${totalIssues} observation${totalIssues !== 1 ? 's' : ''}` : 'Observations', bg: 'var(--fail-tint)', color: 'var(--issue)' }
    : pillStatus === 'not_applicable'
    ? { label: 'Not applicable', bg: 'var(--surf-inset)', color: 'var(--text-muted)' }
    : pillStatus === 'action'
    ? { label: `${actionFindings.length} to confirm`, bg: 'var(--warn-tint)', color: 'var(--warning)' }
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

          {/* Detail view */}
          {true && (
            <>
              {/* Module tabs */}
              {!isLegacy && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {scanModules.map((m: any) => {
                    const isActive = m.module === activeModule
                    const mst = getModuleStatus(m)
                    const tabStatusColor = mst === 'pass' ? 'var(--pass)' : mst === 'fail' || mst === 'error' ? 'var(--issue)' : mst === 'not_applicable' ? 'var(--text-muted)' : 'var(--warning)'
                    const label = m.module === 'safety' ? 'Safety' : m.module === 'quality' ? 'Quality' : 'Environmental'
                    const ModIcon = m.module === 'safety' ? Shield : m.module === 'quality' ? Ruler : Leaf
                    return (
                      <button key={m.module} onClick={() => setActiveModule(m.module)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px',
                        borderRadius: 'var(--r-pill)',
                        border: `1.5px solid ${isActive ? 'transparent' : 'var(--border-card)'}`,
                        background: isActive ? 'var(--amber)' : 'var(--surf)',
                        color: isActive ? '#1B1A12' : 'var(--text-secondary)',
                        fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        <ModIcon size={13} strokeWidth={isActive ? 2.2 : 1.75} color={isActive ? '#1B1A12' : tabStatusColor} />
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

          {/* Notes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px 10px' }}>
            <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', flex: 1 }}>Notes</span>
            {notesSaving && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>Saving…</span>}
            {notesSaved && !notesSaving && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--pass)' }}>Saved</span>}
          </div>
          <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', marginBottom: 14 }}>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Add notes, observations, or feedback about this scan…"
              rows={4}
              style={{
                display: 'block', width: '100%', padding: '12px 14px',
                background: 'transparent', border: 'none', resize: 'vertical',
                fontSize: 13.5, fontWeight: 500, color: 'var(--text)',
                fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box',
                outline: 'none', minHeight: 100,
              }}
            />
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
