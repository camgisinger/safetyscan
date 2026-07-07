'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '../../components/AppHeader'

const FAQ_CATEGORIES = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I perform a scan?',
        a: 'Tap the amber + button on the home screen or the Scans tab. Upload one or more photos of your construction site — you can select up to 5 photos at once. Add any additional context about the work being done if needed, then tap Analyse. SiteSpotter will assess your photos against Queensland WHS legislation and return a compliance report within seconds.',
      },
      {
        q: 'What types of construction work can SiteSpotter assess?',
        a: 'SiteSpotter covers a wide range of construction work types including scaffolding, excavation, working at heights, traffic management, crane and rigging operations, electrical safety, formwork, confined spaces, asbestos management, demolition, plant and equipment, hot works, PPE compliance, fire safety, and general site housekeeping.',
      },
      {
        q: 'Do I need to be on site to use SiteSpotter?',
        a: 'No — SiteSpotter analyses photos, so you can review site photos taken by others. However, the more recent and site-specific the photos, the more useful the analysis will be.',
      },
    ],
  },
  {
    category: 'How the Scan Works',
    questions: [
      {
        q: 'What legislation does SiteSpotter reference?',
        a: 'SiteSpotter references Queensland-specific legislation including the Work Health and Safety Act 2011 (Qld), the Work Health and Safety Regulation 2011 (Qld), all relevant Queensland Codes of Practice, and the Queensland Manual of Uniform Traffic Control Devices (MUTCD). The legislation database is regularly updated.',
      },
      {
        q: 'How accurate is the AI analysis?',
        a: 'SiteSpotter is designed to flag clearly visible compliance issues and prompt you to verify items that cannot be confirmed from a photo alone. It performs best on clear, well-lit photos taken from appropriate angles. It will not flag things it cannot see, and it will not guess at compliance where the photo does not provide enough information. For definitive compliance advice, always consult a qualified WHS professional.',
      },
      {
        q: 'What is a Guide Prompt?',
        a: 'A Guide Prompt is a finding that SiteSpotter cannot confirm as compliant or non-compliant from the photo alone. Instead of flagging it as a warning, SiteSpotter gives you a specific action to confirm on site — for example, "Confirm excavation depth — if exceeding 1.5m, shoring or battering is required under WHS Regulation 2011 s.306." Guide Prompts are designed to direct your attention to the right things without making assumptions the photo cannot support.',
      },
      {
        q: 'What AI model does SiteSpotter use?',
        a: 'SiteSpotter uses Claude by Anthropic, one of the leading AI models for visual analysis and reasoning. Your photos are processed securely and are not used to train AI models.',
      },
    ],
  },
  {
    category: 'Understanding Results',
    questions: [
      {
        q: 'What do the different finding types mean?',
        a: 'SiteSpotter uses three finding types. A Critical finding (red) means a clear, unambiguous compliance violation is visible in the photo — this requires immediate attention. A Guide Prompt (amber) means something needs to be verified on site but cannot be confirmed from the photo. A Pass finding (green) means something is clearly visible and compliant.',
      },
      {
        q: 'What does the overall status mean?',
        a: 'The overall status reflects the worst finding across all photos in the scan. Fail means at least one critical violation is clearly visible. Uncertain means there are items that need on-site verification but no clear violations visible. Pass means everything visible appears compliant. Not Applicable means the photo does not show a construction site or has no compliance relevance.',
      },
      {
        q: 'Can I re-analyse a scan with more information?',
        a: 'Yes — on any scan result, tap Re-analyse. You can add additional context in text, or attach new photos of specific areas. If you are confirming that an issue has been rectified, just type that in — you do not need to re-upload the original photos.',
      },
      {
        q: 'Why does SiteSpotter say it cannot verify something?',
        a: 'SiteSpotter only flags what it can clearly see. If something cannot be confirmed from the photo — for example, whether an excavation is deeper than 1.5m — it will ask you to confirm on site rather than guessing. This is intentional. A compliance tool that guesses is more dangerous than one that asks.',
      },
    ],
  },
  {
    category: 'Photos',
    questions: [
      {
        q: 'What makes a good scan photo?',
        a: 'Good scan photos are clear, well-lit, and taken from an angle that shows the relevant work area. For scaffolding, a full elevation shot showing all levels works best. For excavations, a side-on view showing the full depth is most useful. For traffic management, a shot from the driver\'s approach showing the full signage sequence is ideal. SiteSpotter will ask for specific follow-up photos if it needs more information.',
      },
      {
        q: 'How many photos can I upload per scan?',
        a: 'You can upload up to 5 photos per scan. When multiple photos are uploaded, SiteSpotter treats them as a single site inspection and produces one unified report covering all photos.',
      },
      {
        q: 'What file types are supported?',
        a: 'SiteSpotter accepts JPG, PNG, HEIC, and WEBP files. Photos are automatically resized and optimised before analysis — you do not need to resize them manually.',
      },
      {
        q: 'Can I upload photos taken by someone else?',
        a: 'Yes — you can upload any photo you have the right to use. Make sure you have appropriate permission to share photos that may contain images of workers or identifiable individuals.',
      },
    ],
  },
  {
    category: 'Re-scanning and History',
    questions: [
      {
        q: 'Are my scans saved?',
        a: 'Yes — all scans are saved to your account and accessible from the Scans tab. You can view, re-analyse, share, or delete any previous scan at any time.',
      },
      {
        q: 'Can I organise scans by site?',
        a: 'Yes — you can create Sites in the Sites tab and assign scans to a specific site. This lets you track compliance history and trends across multiple locations.',
      },
      {
        q: 'How do I share a scan result?',
        a: 'On any scan result, tap the Share button. This generates a unique link that anyone can view without needing a SiteSpotter account — useful for sharing results with a principal contractor or safety officer.',
      },
      {
        q: 'Can I generate a checklist from a scan?',
        a: 'Yes — on any scan result, tap the Checklist tab. SiteSpotter generates a site-specific compliance checklist based on the work types identified in your scan.',
      },
    ],
  },
  {
    category: 'Data and Privacy',
    questions: [
      {
        q: 'Where is my data stored?',
        a: 'Your account data, scan results, and photos are stored in Supabase, hosted in Sydney, Australia (ap-southeast-2 region). For AI analysis, photos are transmitted to Anthropic\'s servers in the United States. Short text queries used for legislation search are transmitted to OpenAI in the United States. Full details are in our Privacy Policy.',
      },
      {
        q: 'Can other users see my scans?',
        a: 'No — your scans are private by default and only accessible to you. The only exception is if you choose to share a scan using the share link feature, in which case anyone with the link can view that specific scan result.',
      },
      {
        q: 'How do I delete my data?',
        a: 'You can delete individual scans from within the app. To delete your account and all associated data, contact us at support@sitespotter.com.au and we will action your request within 30 days.',
      },
      {
        q: 'Are my photos used to train AI?',
        a: 'No. Your photos are processed by Anthropic for the purpose of analysis only and are not used to train AI models. See our Privacy Policy for full details.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'What devices and browsers does SiteSpotter support?',
        a: 'SiteSpotter works on any modern browser on desktop, tablet, or mobile. For the best experience on mobile, use Chrome or Safari. The app is designed mobile-first and works best on a smartphone on site.',
      },
      {
        q: 'Do I need to install an app?',
        a: 'No — SiteSpotter runs in your browser. No download or installation is required. You can add it to your home screen from your browser for quick access.',
      },
      {
        q: 'What do I do if a scan fails or returns an error?',
        a: 'First check your internet connection. If the problem persists, try re-uploading the photos. If you continue to experience issues, contact us at support@sitespotter.com.au with a description of the problem and we will investigate.',
      },
      {
        q: 'Is SiteSpotter available offline?',
        a: 'No — SiteSpotter requires an internet connection to perform analysis. If you are in an area with poor coverage, take photos and upload them when you return to coverage.',
      },
    ],
  },
]

const SUBJECTS = [
  'General Enquiry',
  'Technical Issue',
  'Billing Enquiry',
  'Feature Request',
  'Other',
]

const sectionLabel = (text: string) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '28px 0 14px' }}>
    <span style={{ width: 13, height: 3, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} />
    <span style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--mut)' }}>
      {text}
    </span>
  </div>
)

export default function HelpContent() {
  const router = useRouter()
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Enquiry', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const toggle = (key: string) => setOpenKey(prev => prev === key ? null : key)

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.message.trim().length < 20) {
      setErrorMsg('Message must be at least 20 characters.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: '11px 14px',
    background: 'var(--bg)', border: '1.5px solid var(--div)',
    borderRadius: 6, fontSize: 14, color: 'var(--text)',
    fontFamily: 'var(--ff)', boxSizing: 'border-box',
    marginBottom: 12,
  }

  return (
    <>
      <style>{`
        .ss-field:focus { border-color: var(--amber) !important; outline: none; }
        .ss-field::placeholder { color: var(--mut); opacity: 0.7; }
        .ss-field option { background: var(--surf); color: var(--text); }
      `}</style>

      <AppHeader variant="detail" onBack={() => router.back()} />

      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <main style={{
          maxWidth: 720, margin: '0 auto',
          padding: '32px 20px 96px',
          fontFamily: 'var(--ff)', color: 'var(--text)',
        }}>

          {/* Page title */}
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            Help & Support
          </h1>
          <p style={{ fontSize: 14, color: 'var(--mut)', margin: '0 0 8px' }}>
            SiteSpotter · Queensland construction compliance
          </p>

          {/* ── FAQ ── */}
          {sectionLabel('Frequently Asked Questions')}

          {FAQ_CATEGORIES.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--amber)', margin: '0 0 8px' }}>
                {cat.category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cat.questions.map((item, qi) => {
                  const key = `${ci}-${qi}`
                  const isOpen = openKey === key
                  return (
                    <div key={qi} style={{
                      background: 'var(--surf)', border: '1.5px solid var(--line)',
                      borderRadius: 6, overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => toggle(key)}
                        style={{
                          width: '100%', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', padding: '13px 16px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          textAlign: 'left', fontFamily: 'var(--ff)',
                        }}
                      >
                        <span style={{
                          fontSize: 14, fontWeight: 600, color: 'var(--text)',
                          flex: 1, paddingRight: 12, lineHeight: 1.5,
                        }}>
                          {item.q}
                        </span>
                        <svg
                          width="16" height="16" viewBox="0 0 16 16" fill="none"
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.22s ease',
                            flexShrink: 0, color: 'var(--amber)',
                          }}
                        >
                          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <div style={{
                        maxHeight: isOpen ? '800px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease',
                      }}>
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--div)' }}>
                          <p style={{
                            fontSize: 14, lineHeight: 1.75,
                            color: 'var(--mut)', margin: '14px 0 0',
                          }}>
                            {item.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* ── Contact ── */}
          {sectionLabel('Contact Us')}

          {status === 'success' ? (
            <div style={{
              background: 'rgba(103, 176, 131, 0.1)',
              border: '1.5px solid rgba(103, 176, 131, 0.4)',
              borderRadius: 8, padding: '20px 20px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="10" cy="10" r="9" stroke="var(--clear-tx)" strokeWidth="1.5" />
                <path d="M6 10l3 3 5-5" stroke="var(--clear-tx)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--clear-tx)', marginBottom: 4 }}>Message sent</div>
                <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
                  Your message has been sent.
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--surf)', border: '1.5px solid var(--line)',
              borderRadius: 8, padding: '22px 20px',
            }}>
              <p style={{ fontSize: 14, color: 'var(--mut)', margin: '0 0 20px', lineHeight: 1.6 }}>
                Can't find what you're looking for? Send us a message and we'll get back to you within 2 business days.
              </p>
              <form onSubmit={handleSubmit}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mut)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                  Name
                </label>
                <input
                  className="ss-field"
                  type="text"
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  style={inputStyle}
                />

                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mut)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                  Email
                </label>
                <input
                  className="ss-field"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  style={inputStyle}
                />

                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mut)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                  Subject
                </label>
                <select
                  className="ss-field"
                  required
                  value={form.subject}
                  onChange={e => set('subject', e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--mut)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                  Message
                </label>
                <textarea
                  className="ss-field"
                  required
                  placeholder="Describe your issue or question…"
                  rows={5}
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />

                {status === 'error' && errorMsg && (
                  <div style={{
                    fontSize: 13, color: 'var(--issue-tx-theme)',
                    marginBottom: 12, fontWeight: 500,
                  }}>
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    display: 'block', width: '100%', padding: '13px',
                    background: 'var(--amber)', border: 'none', borderRadius: 6,
                    fontSize: 14, fontWeight: 700, color: '#1B1A12',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    opacity: status === 'loading' ? 0.6 : 1,
                    fontFamily: 'var(--ff)',
                  }}
                >
                  {status === 'loading' ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            </div>
          )}

          {/* Footer */}
          <footer style={{
            marginTop: 56, paddingTop: 24,
            borderTop: '1.5px solid var(--div)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <p style={{ fontSize: 13, color: 'var(--mut)', margin: 0 }}>
              SiteSpotter · Queensland, Australia ·{' '}
              <a href="mailto:support@sitespotter.com.au" style={{ color: 'var(--amber)', textDecoration: 'none' }}>
                support@sitespotter.com.au
              </a>
            </p>
            <p style={{ fontSize: 13, color: 'var(--mut)', margin: 0 }}>
              <Link href="/privacy" style={{ color: 'var(--amber)', textDecoration: 'none' }}>Privacy Policy</Link>
              {' · '}
              <Link href="/terms" style={{ color: 'var(--amber)', textDecoration: 'none' }}>Terms & Conditions</Link>
            </p>
          </footer>

        </main>
      </div>
    </>
  )
}
