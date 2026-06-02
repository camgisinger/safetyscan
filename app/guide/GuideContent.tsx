'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'

const steps = [
  { title: 'Snap the site, head to toe.', body: 'Upload up to 5 photos of your site installation or work area. Add context — location and work type helps the AI identify the right legislation.' },
  { title: "The AI flags what doesn't match QLD code.", body: 'Each issue is tagged with its source — MUTCD, AS 4576, WHS Reg — so your write-up is ready for the inspector.' },
  { title: 'Every issue, with its regulation.', body: 'Results are colour-coded by severity. Tap any legislation tag to expand it and see the specific clauses that apply.' },
  { title: 'Track sites, week over week.', body: 'Assign scans to sites to track compliance rates and checklist progress across your whole project portfolio.' },
  { title: 'Share the report. PDF or link.', body: 'Export a formatted PDF or generate a shareable link for a supervisor or client. No login required to view.' },
]

export default function GuideContent() {
  const router = useRouter()
  const [step, setStep]     = useState(0)
  const [exiting, setExiting] = useState(false)

  const navigateBack = () => {
    setExiting(true)
    setTimeout(() => router.push('/dashboard'), 280)
  }

  return (
    <div className={exiting ? 'page-slide-right-out' : 'page-slide-right-in'} style={{ willChange: 'transform, opacity' }}>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <AppHeader variant="modal" title="Guide" onClose={navigateBack} onLogoClick={navigateBack}/>
        <main style={{ flex: 1, maxWidth: 600, width: '100%', margin: '0 auto', padding: '0 18px 48px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px 18px' }}>
            <span style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)' }}>Step {step + 1} / {steps.length}</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {steps.map((_, i) => (
                <button key={i} onClick={() => setStep(i)}
                  style={{ cursor: 'pointer', border: 'none', padding: 0, height: 8, width: i === step ? 22 : 8, borderRadius: 999, background: i === step ? 'var(--amber)' : 'var(--mut)', opacity: i === step ? 1 : 0.45, transition: 'all 0.2s' }}/>
              ))}
            </div>
          </div>

          {/* Hero art — unique per step */}
          <div style={{ height: 280, borderRadius: 6, background: 'var(--surf)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>

            {/* Step 1 — Capture: camera viewfinder frame */}
            {step === 0 && (
              <div style={{ position: 'relative', width: 200, height: 200 }}>
                {/* Frame */}
                <div style={{ position: 'absolute', inset: 0, border: '1.5px solid var(--amber)', borderRadius: 6, opacity: 0.9 }}/>
                {/* Rule-of-thirds grid */}
                {[33, 66].map(p => (
                  <div key={p}>
                    <div style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, width: 1, background: 'rgba(238,128,26,0.3)' }}/>
                    <div style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, height: 1, background: 'rgba(238,128,26,0.3)' }}/>
                  </div>
                ))}
                {/* Corner anchors */}
                {[['top:0;left:0', '0 0 8px 8px'], ['top:0;right:0', '0 8px 8px 0'], ['bottom:0;left:0', '8px 0 0 8px'], ['bottom:0;right:0', '8px 8px 0 0']].map(([pos, r], i) => (
                  <div key={i} style={{ position: 'absolute', ...Object.fromEntries(pos.split(';').map(p => p.split(':'))), width: 22, height: 22, border: '2.5px solid var(--amber)', borderRadius: r as any }} />
                ))}
                {/* Counter pill */}
                <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 9px', borderRadius: 4, background: 'rgba(238,128,26,0.9)', color: '#1B1A12', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em' }}>1 / 4</div>
                {/* Hint pill */}
                <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', padding: '5px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>Frame the work area</div>
              </div>
            )}

            {/* Step 2 — AI flags: radar mark with hazard stickers */}
            {step === 1 && (
              <div style={{ position: 'relative', width: 180, height: 180 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(238,128,26,0.14)' }}/>
                <svg viewBox="0 0 240 240" width="180" height="180" style={{ position: 'absolute', inset: 0 }}>
                  <g fill="none" strokeLinecap="butt" strokeWidth="14" stroke="var(--amber)">
                    <g opacity=".25"><path d="M 210 120 A 90 90 0 0 1 48 174"/><path d="M 186 120 A 66 66 0 0 1 66 156"/><path d="M 162 120 A 42 42 0 0 1 84 138"/></g>
                    <path d="M 30 120 A 90 90 0 0 1 192 66"/><path d="M 54 120 A 66 66 0 0 1 174 84"/><path d="M 78 120 A 42 42 0 0 1 156 102"/>
                  </g>
                  <circle cx="120" cy="120" r="10" fill="var(--amber)"/>
                </svg>
                <div style={{ position: 'absolute', top: -6, right: -28, padding: '5px 10px', borderRadius: 4, background: '#D63A26', color: '#fff', fontSize: 11, fontWeight: 600, transform: 'rotate(8deg)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>Missing sign</div>
                <div style={{ position: 'absolute', bottom: 8, left: -30, padding: '5px 10px', borderRadius: 4, background: 'var(--amber)', color: '#1B1A12', fontSize: 11, fontWeight: 600, transform: 'rotate(-6deg)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>Cone gap 8m</div>
              </div>
            )}

            {/* Step 3 — Issues + regulation tags */}
            {step === 2 && (
              <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { sev: '#D63A26', title: 'Missing approach signage', tag: 'MUTCD PT 3 · §3.4', high: true },
                  { sev: 'var(--amber)', title: 'Cone spacing inconsistent', tag: 'MUTCD PT 3 · §4.6', high: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'stretch', background: 'var(--bg)', border: '1.5px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: 5, background: item.sev, flexShrink: 0 }}/>
                    <div style={{ flex: 1, padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>{item.title}</div>
                      <span style={{ fontWeight: 600, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, border: '1.5px solid var(--line)', background: 'var(--surf)', color: 'var(--mut)' }}>{item.tag}</span>
                    </div>
                    <div style={{ alignSelf: 'center', paddingRight: 12, fontWeight: 700, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: item.sev }}>{item.high ? 'HIGH' : 'MED'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4 — Sites / compliance tracking */}
            {step === 3 && (
              <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: 'Newstead Plaza', score: 78, color: 'var(--amber)', bd: [60, 18, 22] },
                  { name: 'Westgate Stage 2', score: 96, color: 'var(--clear-tx)', bd: [92, 4, 4] },
                  { name: 'Kelvin Grove Lots', score: 64, color: '#D63A26', bd: [50, 18, 32] },
                ].map((site, i) => (
                  <div key={i} style={{ background: 'var(--bg)', border: '1.5px solid var(--line)', borderRadius: 4, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{site.name}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: site.color }}>{site.score}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', display: 'flex', background: 'var(--div)' }}>
                      <div style={{ width: `${site.bd[0]}%`, background: 'var(--clear-tx)' }}/>
                      <div style={{ width: `${site.bd[1]}%`, background: 'var(--amber)' }}/>
                      <div style={{ width: `${site.bd[2]}%`, background: '#D63A26' }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 5 — Share / export */}
            {step === 4 && (
              <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Read-only banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg)', border: '1.5px solid var(--line)', borderRadius: 4, fontSize: 12, fontWeight: 500, color: 'var(--mut)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }}/>
                  Read-only · shared by Ellie M.
                </div>
                {/* Link */}
                <div style={{ padding: '10px 14px', background: 'var(--bg)', border: '1.5px solid var(--line)', borderRadius: 4, fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--mut)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  safetyscan.com.au/shared/8K2J-VQ4M
                </div>
                {/* CTA */}
                <div style={{ height: 44, background: 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13.5, color: '#1B1A12' }}>
                  Open in SafetyScan
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.18, marginTop: 28, color: 'var(--text)' }}>{steps[step].title}</div>
          <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.55, marginTop: 10, color: 'var(--mut)' }}>{steps[step].body}</div>

          {/* Nav */}
          <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 28 }}>
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)}
                style={{ flex: '0 0 90px', height: 46, background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)' }}>
                Back
              </button>
            ) : (
              <button onClick={navigateBack}
                style={{ flex: '0 0 90px', height: 46, background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)' }}>
                Close
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                style={{ flex: 1, height: 46, background: 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#1B1A12' }}>
                Next
              </button>
            ) : (
              <button onClick={navigateBack}
                style={{ flex: 1, height: 46, background: 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#1B1A12' }}>
                Done
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
