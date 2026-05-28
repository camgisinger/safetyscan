'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'

const steps = [
  {
    title: 'Snap the site, head to toe.',
    body: 'Upload up to 5 photos of your site installation or work area. Add context — location and work type helps the AI identify the right legislation.',
  },
  {
    title: 'The AI flags what doesn\'t match QLD code.',
    body: 'Each issue is tagged with its source — MUTCD, AS 4576, WHS Reg — so your write-up is ready for the inspector.',
  },
  {
    title: 'Every issue, with its regulation.',
    body: 'Results are colour-coded by severity. Tap any legislation tag to expand it and see the specific clauses that apply.',
  },
  {
    title: 'Track sites, week over week.',
    body: 'Assign scans to sites to track compliance rates and checklist progress across your whole project portfolio.',
  },
  {
    title: 'Share the report. PDF or link.',
    body: 'Export a formatted PDF or generate a shareable link for a supervisor or client. No login required to view.',
  },
]

export default function GuideContent() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)

  const navigateBack = () => {
    setExiting(true)
    setTimeout(() => router.push('/dashboard'), 280)
  }

  const isDark = typeof window !== 'undefined' ? localStorage.getItem('theme') !== 'light' : true
  const strokeColor = isDark ? '#F39410' : '#16181C'

  return (
    <div className={exiting ? 'page-slide-right-out' : 'page-slide-right-in'} style={{ willChange: 'transform, opacity' }}>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff-sans)', display: 'flex', flexDirection: 'column' }}>
        <AppHeader variant="modal" title="Guide" onClose={navigateBack} onLogoClick={navigateBack}/>

        <main style={{ flex: 1, maxWidth: 600, width: '100%', margin: '0 auto', padding: '0 18px 48px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 18px' }}>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)', opacity: 0.65 }}>Step {step + 1} / {steps.length}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {steps.map((_, i) => (
                <span key={i} onClick={() => setStep(i)} style={{ cursor: 'pointer', width: i === step ? 22 : 8, height: 8, borderRadius: 999, background: i === step ? 'var(--amber)' : 'var(--text-dim)', opacity: i === step ? 1 : 0.45, transition: 'all 0.2s' }}/>
              ))}
            </div>
          </div>

          {/* Hero art */}
          <div style={{ height: 280, borderRadius: 20, background: 'var(--card)', boxShadow: 'var(--shadow-card)', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: 180, height: 180 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--status-amber-bg)' }}/>
              <svg viewBox="0 0 240 240" width="180" height="180" style={{ position: 'absolute', inset: 0 }}>
                <g fill="none" strokeLinecap="butt" strokeWidth="14" stroke={strokeColor}>
                  <g opacity=".25">
                    <path d="M 210 120 A 90 90 0 0 1 48 174"/>
                    <path d="M 186 120 A 66 66 0 0 1 66 156"/>
                    <path d="M 162 120 A 42 42 0 0 1 84 138"/>
                  </g>
                  <path d="M 30 120 A 90 90 0 0 1 192 66"/>
                  <path d="M 54 120 A 66 66 0 0 1 174 84"/>
                  <path d="M 78 120 A 42 42 0 0 1 156 102"/>
                </g>
                <circle cx="120" cy="120" r="10" fill={strokeColor}/>
              </svg>
              {/* Sticker tags */}
              <div style={{ position: 'absolute', top: -6, right: -28, padding: '6px 10px', borderRadius: 999, background: 'var(--status-red)', color: '#fff', fontSize: 11, fontWeight: 600, transform: 'rotate(8deg)', boxShadow: '0 6px 16px -6px rgba(0,0,0,0.35)' }}>Missing sign</div>
              <div style={{ position: 'absolute', bottom: 8, left: -34, padding: '6px 10px', borderRadius: 999, background: 'var(--amber)', color: '#fff', fontSize: 11, fontWeight: 600, transform: 'rotate(-6deg)', boxShadow: '0 6px 16px -6px rgba(0,0,0,0.35)' }}>Cone gap 8m</div>
            </div>
          </div>

          {/* Content */}
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.18, marginTop: 28, padding: '0 2px', color: 'var(--text)' }}>
            {steps[step].title}
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-mut)', padding: '10px 2px 0' }}>
            {steps[step].body}
          </div>

          {/* Nav */}
          <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 28 }}>
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)}
                style={{ flex: '0 0 90px', height: 44, background: 'var(--card)', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)', color: 'var(--text)', boxShadow: '0 0 0 1px var(--border)' }}>
                Back
              </button>
            ) : (
              <button onClick={navigateBack}
                style={{ flex: '0 0 90px', height: 44, background: 'var(--card)', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)', color: 'var(--text)', boxShadow: '0 0 0 1px var(--border)' }}>
                Close
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                style={{ flex: 1, height: 44, background: 'var(--amber)', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)', color: '#fff', boxShadow: 'var(--shadow-btn-amber)' }}>
                Next
              </button>
            ) : (
              <button onClick={navigateBack}
                style={{ flex: 1, height: 44, background: 'var(--amber)', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)', color: '#fff', boxShadow: 'var(--shadow-btn-amber)' }}>
                Done
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
