'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'

const sections = [
  {
    title: "Getting started",
    content: `SafetyScan is an AI-assisted Queensland construction compliance tool. It analyses site photos and checks them against relevant Queensland legislation and Australian Standards. It is designed to be used by site supervisors and foremen as a first-pass compliance check — not a replacement for professional advice.`
  },
  {
    title: "Running a scan",
    content: `Tap the + button or New scan to open the scan page. Upload up to 5 photos of your site installation or work area. Add context in the text field — include the location and type of work to improve accuracy. Tap Analyse for compliance to start the scan. SafetyScan will identify the work type, check applicable Queensland legislation, and return colour-coded findings.`
  },
  {
    title: "Understanding results",
    content: `Results are colour coded: green means likely compliant, amber means a warning or something that needs attention, red means a clear issue was identified. Each result shows the applicable Queensland legislation and specific clauses. Tap any legislation tag to expand it and see the relevant clauses. Confidence is shown as high, medium, or low — low confidence means the AI could not fully assess from the photo.`
  },
  {
    title: "Follow-up questions",
    content: `If SafetyScan needs more information to make a determination, it will ask follow-up questions. Answer these and optionally attach additional photos, then tap Re-analyse. The AI will build on its previous assessment rather than starting fresh.`
  },
  {
    title: "Checklists",
    content: `On any saved scan you can generate a site-specific checklist based on the findings and applicable legislation. Tap Generate checklist on the Checklist tab. Tick items off as you verify them on site. Delete items that are not relevant to your job. Checklist progress is tracked per scan and rolled up across all scans on a site.`
  },
  {
    title: "Sites",
    content: `Create sites to organise your scans by job site or project. Assign scans to a site during or after scanning. Each site shows a compliance rate, checklist progress, and a list of non-compliances across all scans. Archive sites when a project is complete to keep your dashboard tidy — archived sites are hidden by default but not deleted.`
  },
  {
    title: "Sharing scans",
    content: `You can generate a shareable link for any scan. Tap Share scan on the scan detail page. This creates a public link that can be viewed without logging in — useful for sending to a supervisor or client. You can disable sharing at any time from the same button.`
  },
  {
    title: "Exporting to PDF",
    content: `Tap Export PDF on any scan to generate a formatted compliance report. The PDF includes the scan photo, findings, legislation, checklist, notes, and a disclaimer. Save it to your device or share it directly.`
  },
  {
    title: "Important disclaimer",
    content: `SafetyScan is an AI-assisted first-pass tool only. Results are indicative and based on what is visible in the photo. Always verify findings with a qualified professional or certifier before sign-off. SafetyScan does not constitute legal or engineering advice. Legislation references are based on Queensland standards current at time of AI training — always check for the most current version of any standard or regulation.`
  },
  {
    title: "Tips for better scans",
    content: `Good lighting and a clear angle improves accuracy significantly. Add context in the text field — location and work type helps the AI identify the right legislation. Upload multiple photos for a more thorough assessment. If the AI asks follow-up questions, answer them — the more information provided the more accurate the result.`
  }
]

export default function GuidePage() {
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  const navigateBack = () => {
    setExiting(true)
    setTimeout(() => router.push('/dashboard'), 280)
  }

  return (
    <div className={exiting ? "page-slide-right-out" : "page-slide-right-in"} style={{ willChange: "transform, opacity" }}>
      <div style={{ minHeight: "100vh", background: "var(--ss-bg)", fontFamily: "Inter, system-ui, sans-serif" }}>
        <AppHeader onLogoClick={navigateBack} />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px 80px" }}>
          <button onClick={navigateBack}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--ss-surface)", border: "0.5px solid var(--ss-border-strong)", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, color: "var(--ss-text)", cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </button>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ss-text)", letterSpacing: "-0.02em", marginBottom: 4 }}>SafetyScan guide</h1>
            <p style={{ fontSize: 14, color: "var(--ss-text-mute)", lineHeight: 1.6 }}>Everything you need to know about using SafetyScan on site.</p>
          </div>
          {sections.map((s, i) => (
            <div key={i} style={{ background: "var(--ss-surface)", borderRadius: 12, padding: "16px 18px", marginBottom: 10, border: "0.5px solid var(--ss-border)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ss-text)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#F39410", color: "#16181C", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                {s.title}
              </div>
              <p style={{ fontSize: 13, color: "var(--ss-text-mute)", lineHeight: 1.7, margin: 0 }}>{s.content}</p>
            </div>
          ))}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "0.5px solid var(--ss-border)" }}>
            <button onClick={navigateBack}
              style={{ width: "100%", padding: "12px", background: "transparent", border: "0.5px solid var(--ss-border-strong)", borderRadius: 10, fontSize: 14, color: "var(--ss-text-mute)", cursor: "pointer", fontFamily: "inherit" }}>
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
