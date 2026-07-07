'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import '../app/landing.css'

// ---------- Icons (inline SVG, 1.7 stroke, round caps) ----------
const S = { fill: 'none' as const, stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const Icons = {
  camera:   <svg viewBox="0 0 24 24" {...S}><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.4"/></svg>,
  cpu:      <svg viewBox="0 0 24 24" {...S}><rect x="6.5" y="6.5" width="11" height="11" rx="2.2"/><path d="M9.5 2.5v2M14.5 2.5v2M9.5 19.5v2M14.5 19.5v2M2.5 9.5h2M2.5 14.5h2M19.5 9.5h2M19.5 14.5h2"/><rect x="10" y="10" width="4" height="4" rx="0.8"/></svg>,
  report:   <svg viewBox="0 0 24 24" {...S}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 15.5h6M9 8.5h2"/></svg>,
  bolt:     <svg viewBox="0 0 24 24" {...S}><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>,
  scales:   <svg viewBox="0 0 24 24" {...S}><path d="M12 3v18M7 21h10M5 7h14M5 7l-2.5 6h5zM19 7l-2.5 6h5z"/><path d="M12 4.4a1 1 0 1 0 0-.01"/></svg>,
  clause:   <svg viewBox="0 0 24 24" {...S}><path d="M7 3h7l4 4v14H6V4"/><path d="M14 3v4h4"/><path d="M9.5 13l1.7 1.7 3.3-3.4"/></svg>,
  devices:  <svg viewBox="0 0 24 24" {...S}><rect x="2.5" y="5" width="13" height="10" rx="1.4"/><path d="M2.5 18h13"/><rect x="16.5" y="9" width="5" height="11" rx="1.2"/></svg>,
  grid:     <svg viewBox="0 0 24 24" {...S}><rect x="3.5" y="3.5" width="7" height="7" rx="1.3"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.3"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.3"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.3"/></svg>,
  database: <svg viewBox="0 0 24 24" {...S}><ellipse cx="12" cy="5.5" rx="7" ry="2.6"/><path d="M5 5.5v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6"/><path d="M5 11.5v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6"/></svg>,
  sites:    <svg viewBox="0 0 24 24" {...S}><rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><path d="M13.5 5.5h7M13.5 8.5h4.5M13.5 16.5h7M13.5 19.5h4.5"/></svg>,
  checklist:<svg viewBox="0 0 24 24" {...S}><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6l1.2 1.2L8 4M4.5 12l1.2 1.2L8 10M4.5 18l1.2 1.2L8 16"/></svg>,
  export:   <svg viewBox="0 0 24 24" {...S}><path d="M14 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5"/><path d="M14 3v5h5"/><path d="M3 12h9M8.5 7.5 3 12l5.5 4.5"/></svg>,
  hardhat:  <svg viewBox="0 0 24 24" {...S}><path d="M3 16a9 9 0 0 1 18 0"/><path d="M2 16h20v2.4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/><path d="M9.5 8.2V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5v2.7"/></svg>,
  shield:   <svg viewBox="0 0 24 24" {...S}><path d="M12 3 5 5.6v5.2c0 4.4 3 7.6 7 9.2 4-1.6 7-4.8 7-9.2V5.6z"/><path d="M9 12l2 2 4-4.2"/></svg>,
  building: <svg viewBox="0 0 24 24" {...S}><path d="M4 21V5.5L13 3v18M13 21h7V9l-7-2.2"/><path d="M7 8.5h2.5M7 12h2.5M7 15.5h2.5M16 12h1.5M16 15.5h1.5"/></svg>,
  users:    <svg viewBox="0 0 24 24" {...S}><circle cx="8.5" cy="8" r="3"/><path d="M3 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3 3 0 0 1 0 5.6M16.5 14.2A5.5 5.5 0 0 1 21 19.4"/></svg>,
  arrow:    <svg viewBox="0 0 24 24" {...S}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  play:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none"/></svg>,
  tick:     <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.5l3 3 6-6.5"/></svg>,
  pin:      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M7 1.5a4 4 0 0 1 4 4c0 3-4 7-4 7s-4-4-4-7a4 4 0 0 1 4-4z" strokeLinejoin="round"/><circle cx="7" cy="5.5" r="1.4"/></svg>,
}

// ---------- Brand mark SVG ----------
function Mark({ size = 26, variant = 'duo' }: { size?: number; variant?: 'duo' | 'amber' }) {
  if (variant === 'amber') {
    return (
      <svg width={size} height={size} viewBox="0 0 240 240" aria-label="SiteSpotter">
        <g fill="none" strokeLinecap="butt" strokeWidth="14" stroke="#F39410">
          <g opacity="0.3">
            <path d="M 210 120 A 90 90 0 0 1 48 174" />
            <path d="M 186 120 A 66 66 0 0 1 66 156" />
            <path d="M 162 120 A 42 42 0 0 1 84 138" />
          </g>
          <path d="M 30 120 A 90 90 0 0 1 192 66" />
          <path d="M 54 120 A 66 66 0 0 1 174 84" />
          <path d="M 78 120 A 42 42 0 0 1 156 102" />
        </g>
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-label="SiteSpotter">
      <g fill="none" strokeLinecap="butt" strokeWidth="14">
        <g stroke="#1B1A12">
          <path d="M 210 120 A 90 90 0 0 1 48 174" />
          <path d="M 186 120 A 66 66 0 0 1 66 156" />
          <path d="M 162 120 A 42 42 0 0 1 84 138" />
        </g>
        <g stroke="#F39410">
          <path d="M 30 120 A 90 90 0 0 1 192 66" />
          <path d="M 54 120 A 66 66 0 0 1 174 84" />
          <path d="M 78 120 A 42 42 0 0 1 156 102" />
        </g>
      </g>
    </svg>
  )
}

// ---------- Finding row ----------
function Finding({ sev, title, sevLabel, desc, clause }: {
  sev: 'high' | 'med' | 'pass'; title: string; sevLabel: string; desc: string; clause: string
}) {
  return (
    <div className="finding">
      <span className={`finding__sev is-${sev}`} />
      <div className="finding__main">
        <div className="finding__top">
          <span className="finding__title">{title}</span>
          <span className={`finding__sevlabel is-${sev}`}>{sevLabel}</span>
        </div>
        <p className="finding__desc">{desc}</p>
        <span className="finding__clause">{Icons.clause}{clause}</span>
      </div>
    </div>
  )
}

// ---------- Hero mockup ----------
function HeroMock() {
  return (
    <div className="mock">
      <div className="mock__bar">
        <span className="mock__dot" /><span className="mock__dot" /><span className="mock__dot" />
        <span className="mock__bar-title">Scan Result · Newstead Plaza</span>
      </div>
      <div className="mock__body">
        <div className="mock__photo">
          <span className="mock__photo-tag">Scaffolding · Working at Heights</span>
          <div className="mock__scan-line" />
        </div>
        <div className="mock__scoreline">
          <div>
            <div className="mock__score-l">Compliance score</div>
            <div className="mock__score-v">64<span className="unit">/100</span></div>
          </div>
          <span className="mock__badge is-issues"><span className="dot" />3 issues found</span>
        </div>
        <Finding sev="high" title="Edge protection missing" sevLabel="Critical"
          desc="Open edge above 2m without guardrail on the north scaffold bay."
          clause="WHS Reg 2011 s.306" />
        <Finding sev="med" title="Incomplete scaffold tag" sevLabel="Warning"
          desc="Scaffold tag not signed off by competent person for current shift."
          clause="Scaffolding CoP 2021" />
      </div>
    </div>
  )
}

// ---------- Nav ----------
function Nav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [stuck, setStuck] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`nav${stuck ? ' is-stuck' : ''}`}>
      <div className="nav__inner">
        <a className="brand" href="#top" aria-label="SiteSpotter home">
          <span className="brand__mk"><Mark size={26} variant="duo" /></span>
          <span className="brand__word">Safety<b>Scan</b></span>
        </a>
        <div className="nav__links">
          <a className="nav__link" href="#how">How It Works</a>
          <a className="nav__link" href="#features">Features</a>
          <a className="nav__link" href="#example">Live Scan</a>
          <a className="nav__link" href="#pricing">Pricing</a>
        </div>
        <div className="nav__cta">
          {isLoggedIn ? (
            <button className="btn btn--amber btn--sm" onClick={() => router.push('/dashboard')}>Go to App</button>
          ) : (
            <>
              <button className="btn btn--ghost btn--sm" onClick={() => router.push('/login')}>Sign In</button>
              <a className="btn btn--amber btn--sm" href="#demo">Start Free Trial</a>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

// ---------- Hero ----------
function Hero() {
  return (
    <header className="hero" id="top">
      <div className="hero__bg" />
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <h1>The Construction Compliance Scanner Built for <span className="amber">Queensland Sites</span></h1>
          <p className="hero__sub">
            Powered by AI, SiteSpotter checks your site against Queensland WHS legislation and Australian Standards in seconds.
            The construction safety inspection app that catches the gap before the regulator does.
          </p>
          <div className="hero__actions">
            <a className="btn btn--amber" href="#demo">Request a Demo {Icons.arrow}</a>
            <a className="btn btn--ghost" href="#how">{Icons.play} See How It Works</a>
          </div>
          <div className="hero__trust">
            <span className="dot" />
            Walk the site. Catch the gap.
          </div>
        </div>
        <div className="hero__mock-shell">
          <HeroMock />
        </div>
      </div>
    </header>
  )
}

// ---------- How It Works ----------
const STEPS = [
  { icon: Icons.camera, title: 'Take a photo of your site',       desc: 'Point your phone at the work area — scaffolding, an excavation, a traffic setup — and capture it. No forms, no checklists to dig through.' },
  { icon: Icons.cpu,    title: 'AI analyses it instantly',         desc: 'SiteSpotter reads the scene against the Queensland WHS Act, WHS Regulation 2011, relevant Codes of Practice and the Australian Standards they reference — in seconds.' },
  { icon: Icons.report, title: 'Get a detailed compliance report', desc: 'Receive specific findings with exact clause and standard references — what\'s compliant, what\'s a risk, and the regulation or standard behind every call.' },
]

function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="wrap">
        <div className="section-head-c">
          <span className="eyebrow eyebrow--center">How it works</span>
          <h2 className="sec-title">From photo to compliance report in three steps</h2>
          <p className="sec-lead">SiteSpotter turns a quick site walk into a documented WHS compliance check — no safety degree required.</p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step" key={i}>
              <div className="step__num">STEP {String(i + 1).padStart(2, '0')}</div>
              <div className="step__icon">{s.icon}</div>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__desc">{s.desc}</p>
              <div className="step__connector">{Icons.arrow}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- Features ----------
const FEATURES = [
  { icon: Icons.bolt,     title: 'Instant AI analysis',               desc: 'Results in seconds, not hours. The AI safety scanner reviews each photo on the spot so you can fix issues while you\'re still standing on site.' },
  { icon: Icons.scales,   title: 'Legislation & standards built in',   desc: 'WHS Act 2011, the WHS Regulation, every relevant Code of Practice and the Australian Standards they reference are baked in — no manual lookups.' },
  { icon: Icons.clause,   title: 'Specific clause references',         desc: 'Not vague advice. Each finding cites the exact regulation clause or Australian Standard so you know precisely what applies and where to act.' },
  { icon: Icons.devices,  title: 'Works on any device',                desc: 'Phone, tablet or desktop. Run a safety scan of a construction site from the field or review reports back in the site office.' },
  { icon: Icons.grid,      title: 'Multiple work types',                desc: 'Scaffolding, excavation, traffic management, cranes, electrical, asbestos and more — covering the high-risk work you actually do.' },
  { icon: Icons.database,  title: 'RAG-powered accuracy',               desc: 'Analysis is grounded in real regulatory documents through retrieval, not just AI training data — so findings reflect current law.' },
  { icon: Icons.sites,     title: 'Site management',                    desc: 'See every site at a glance with a full history of scans for each one — so nothing slips through and your paper trail is always there.' },
  { icon: Icons.checklist, title: 'Checklist creation',                 desc: 'Turn scan findings into a ready-to-use site checklist in one tap. Hand it to the crew or file it as documented evidence of your pre-start.' },
  { icon: Icons.export,    title: 'PDF export & shareable links',       desc: 'Export any scan result as a formatted PDF or share a link directly with subcontractors, principal contractors, or your safety team.' },
]

function Features() {
  return (
    <section className="section" id="features">
      <div className="wrap">
        <div className="section-head-c">
          <span className="eyebrow eyebrow--center">Features</span>
          <h2 className="sec-title">A WHS compliance scanner for Queensland, end to end</h2>
          <p className="sec-lead">Everything a site supervisor compliance tool should do — built around how construction crews actually work.</p>
        </div>
        <div className="features">
          {FEATURES.map((f, i) => (
            <div className="feature" key={i}>
              <div className="feature__icon">{f.icon}</div>
              <h3 className="feature__title">{f.title}</h3>
              <p className="feature__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- Scan Example ----------
function ScanExample() {
  return (
    <section className="section example" id="example">
      <div className="example__bg" />
      <div className="wrap">
        <div className="section-head-c">
          <span className="eyebrow eyebrow--center eyebrow--ink">Real scan example</span>
          <h2 className="sec-title">See exactly what a SiteSpotter result looks like</h2>
          <p className="sec-lead">One photo of a scaffold bay, analysed against Queensland WHS legislation and Australian Standards. Here&apos;s the kind of report your crew gets back.</p>
        </div>
        <div className="example__grid">
          <div className="example__photo">
            <div className="example__reticle" data-label="No guardrail" style={{ top: '16%', left: '12%', width: '40%', height: '30%' }} />
            <div className="example__reticle" data-label="Scaffold tag" style={{ top: '58%', right: '14%', width: '26%', height: '22%' }} />
            <div className="example__photo-overlay">
              <div className="example__photo-top">
                <span className="example__chip">Site Photo · 28 May 10:08PM</span>
                <span className="example__chip">Newstead Plaza</span>
              </div>
              <div className="example__photo-top">
                <span className="example__chip">Scaffolding · Working at Heights</span>
                <span />
              </div>
            </div>
          </div>
          <div className="example__panel">
            <div className="example__panel-head">
              <div>
                <div className="example__panel-meta">Compliance findings</div>
                <div className="example__panel-title">3 items · 1 critical</div>
              </div>
              <span className="mock__badge is-issues"><span className="dot" />Action required</span>
            </div>
            <Finding sev="high" title="Edge protection missing above 2m" sevLabel="Critical"
              desc="North bay has an open edge with a fall risk over 2m and no guardrail or edge protection in place. Rectify before work continues."
              clause="WHS Regulation 2011 s.306" />
            <Finding sev="med" title="Scaffold tag not signed off" sevLabel="Warning"
              desc="Scaffold inspection tag is present but not signed by a competent person for the current shift. Complete the handover inspection."
              clause="Scaffolding Code of Practice 2021" />
            <Finding sev="pass" title="Hard hats & hi-vis correctly worn" sevLabel="Pass"
              desc="All workers in frame are wearing compliant head protection and high-visibility clothing for the work zone."
              clause="WHS Regulation 2011 s.44" />
            <div className="example__panel-foot">
              {Icons.shield}
              Every finding links back to the regulation or standard it&apos;s based on.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------- Who It's For ----------
const PERSONAS = [
  { icon: Icons.hardhat,  title: 'Site Supervisors & Foremen',     desc: 'Run a quick compliance check on your walk-around and fix issues before they hold up the job.' },
  { icon: Icons.shield,   title: 'Safety Officers',                 desc: 'Standardise inspections across crews and back every call with the exact WHS clause.' },
  { icon: Icons.building, title: 'Principal Contractors',           desc: 'Keep oversight of subbies and sites, with documented evidence of due diligence.' },
  { icon: Icons.users,    title: 'Construction Companies',          desc: 'Roll out consistent WHS compliance across every project and reduce safety risk at scale.' },
]

function WhoFor() {
  return (
    <section className="section" id="who">
      <div className="wrap">
        <div className="section-head-c">
          <span className="eyebrow eyebrow--center">Who it&apos;s for</span>
          <h2 className="sec-title">Built for the people running the site</h2>
          <p className="sec-lead">From the foreman on the tools to the company managing twenty projects — SiteSpotter fits the way you already work.</p>
        </div>
        <div className="who">
          {PERSONAS.map((p, i) => (
            <div className="persona" key={i}>
              <div className="persona__icon">{p.icon}</div>
              <h3 className="persona__title">{p.title}</h3>
              <p className="persona__desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- Pricing ----------
type TierFeat = string | React.ReactNode
const TIERS: { name: string; tag: string; price: string; soon: boolean; note: string; cta: string; ctaCls: string; pro?: boolean; feats: TierFeat[] }[] = [
  {
    name: 'Starter', tag: 'For individuals and small teams',
    price: 'Coming Soon', soon: true, note: 'Early access pricing to be announced',
    cta: 'Start Free Trial', ctaCls: 'btn--ghost',
    feats: [
      'AI compliance scanning',
      'Queensland WHS legislation & Australian Standards built in',
      <span key="scans"><b>Up to 20 scans</b> per month</span>,
      'Scan history',
      'Share reports',
    ],
  },
  {
    name: 'Pro', tag: 'For site supervisors and safety officers',
    price: 'Coming Soon', soon: true, note: 'Early access pricing to be announced',
    cta: 'Start Free Trial', ctaCls: 'btn--amber', pro: true,
    feats: [
      <span key="everything">Everything in <b>Starter</b></span>,
      <span key="unlimited"><b>Unlimited</b> scans</span>,
      'Sites & project management',
      'Checklist generation',
      'PDF export',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise', tag: 'For construction companies and principal contractors',
    price: 'Contact Us', soon: false, note: 'Volume pricing tailored to your business',
    cta: 'Contact Us', ctaCls: 'btn--ghost',
    feats: [
      <span key="everything">Everything in <b>Pro</b></span>,
      'Multiple users & teams',
      'Custom onboarding',
      'Dedicated support',
      'Volume pricing',
    ],
  },
]

function Pricing() {
  return (
    <section className="section pricing" id="pricing">
      <div className="wrap">
        <div className="section-head-c">
          <span className="eyebrow eyebrow--center">Pricing</span>
          <h2 className="sec-title">Simple plans for every crew</h2>
          <p className="sec-lead">Start free and scale up as you bring more sites and people onto SiteSpotter.</p>
        </div>
        <div className="tiers">
          {TIERS.map((t, i) => (
            <div className={`tier${t.pro ? ' tier--pro' : ''}`} key={i}>
              {t.pro && <div className="tier__flag">Recommended</div>}
              <p className="tier__name">{t.name}</p>
              <p className="tier__tag">{t.tag}</p>
              <div className={`tier__price${t.soon ? ' is-soon' : ''}`}>{t.price}</div>
              <p className="tier__price-note">{t.note}</p>
              <div className="tier__divider" />
              <ul className="tier__feats">
                {t.feats.map((f, j) => (
                  <li className="tier__feat" key={j}>
                    <span className="tick">{Icons.tick}</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a className={`btn ${t.ctaCls} btn--block`} href="#demo">{t.cta}</a>
            </div>
          ))}
        </div>
        <p className="pricing__note">All plans include a <b>7-day free trial</b>. No credit card required.</p>
      </div>
    </section>
  )
}

// ---------- Demo form ----------
type DemoStatus = 'idle' | 'submitting' | 'success' | 'error'

function Demo() {
  const [status, setStatus] = useState<DemoStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setStatus('submitting')
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fd.get('firstName'),
          lastName:  fd.get('lastName'),
          company:   fd.get('company'),
          role:      fd.get('role'),
          email:     fd.get('email'),
          phone:     fd.get('phone') || '',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error || 'Failed to send. Please try again.'); setStatus('error'); return }
      setStatus('success')
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.')
      setStatus('error')
    }
  }

  const DEMO_POINTS = [
    'Currently in limited beta — demos available now',
    'See a live scan against Queensland WHS legislation and Australian Standards',
    'No obligation, no credit card',
  ]

  return (
    <section className="section demo" id="demo">
      <div className="demo__bg" />
      <div className="wrap demo__grid">
        <div>
          <span className="eyebrow eyebrow--ink">Request a demo</span>
          <h2 className="sec-title">See SiteSpotter in action</h2>
          <p className="demo__lead">
            SiteSpotter is currently in limited beta with demos available for Queensland construction teams.
            Book a walk-through and we&apos;ll show you a real compliance scan on your kind of site.
          </p>
          <ul className="demo__points">
            {DEMO_POINTS.map((p, i) => (
              <li className="demo__point" key={i}>
                <span className="tick">{Icons.tick}</span>{p}
              </li>
            ))}
          </ul>
        </div>

        <form className="demo__form" onSubmit={handleSubmit} ref={formRef}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '40px 8px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 999, margin: '0 auto 18px', display: 'grid', placeItems: 'center', background: 'var(--status-amber-bg)', color: 'var(--amber)' }}>
                <Mark size={34} variant="amber" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--ink-text)' }}>Demo requested</h3>
              <p style={{ color: 'var(--ink-text-mut)', fontSize: 14.5, margin: 0, lineHeight: 1.6 }}>
                Thanks — we&apos;ll be in touch shortly to lock in a time that suits your site.
              </p>
            </div>
          ) : (
            <>
              <div className="form__row">
                <div className="field">
                  <label className="field__label" htmlFor="fn">First name</label>
                  <input className="field__input" id="fn" name="firstName" type="text" placeholder="Jordan" required />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="ln">Last name</label>
                  <input className="field__input" id="ln" name="lastName" type="text" placeholder="Reyes" required />
                </div>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="co">Company</label>
                <input className="field__input" id="co" name="company" type="text" placeholder="Riverline Constructions" required />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="role">Role</label>
                <select className="field__input" id="role" name="role" defaultValue="" required>
                  <option value="" disabled>Select your role</option>
                  <option>Site Supervisor / Foreman</option>
                  <option>Safety Officer</option>
                  <option>Principal Contractor</option>
                  <option>Construction Company / Owner</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form__row">
                <div className="field">
                  <label className="field__label" htmlFor="em">Email</label>
                  <input className="field__input" id="em" name="email" type="email" placeholder="jordan@company.com.au" required />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="ph">Phone <span className="opt">(optional)</span></label>
                  <input className="field__input" id="ph" name="phone" type="tel" placeholder="0400 000 000" />
                </div>
              </div>
              {status === 'error' && (
                <p style={{ color: 'var(--status-red)', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>{errorMsg}</p>
              )}
              <button className="btn btn--amber btn--block form__submit" type="submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending…' : <>Request Your Demo {Icons.arrow}</>}
              </button>
              <p className="form__fineprint">We&apos;ll only use your details to arrange your SiteSpotter demo.</p>
            </>
          )}
        </form>
      </div>
    </section>
  )
}

// ---------- Footer ----------
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__brand-block">
            <a className="brand" href="#top" aria-label="SiteSpotter home">
              <span className="brand__mk"><Mark size={26} variant="duo" /></span>
              <span className="brand__word">Safety<b>Scan</b></span>
            </a>
            <p className="footer__tagline">Walk the site. Catch the gap. The AI construction compliance scanner built for Queensland WHS.</p>
          </div>
          <div className="footer__links">
            <div className="footer__col">
              <h4>Product</h4>
              <a href="#top">Home</a>
              <a href="#how">How It Works</a>
              <a href="#demo">Request Demo</a>
            </div>
            <div className="footer__col">
              <h4>Legal</h4>
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms</a>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <div className="footer__copy">© 2026 SiteSpotter. All rights reserved.</div>
          <div className="footer__disclaimer">
            SiteSpotter is a compliance assistance tool. Always consult a qualified WHS professional for definitive compliance advice.
          </div>
        </div>
      </div>
    </footer>
  )
}

// ---------- Root ----------
export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  return (
    <div className="lp">
      <Nav isLoggedIn={isLoggedIn} />
      <Hero />
      <HowItWorks />
      <Features />
      <ScanExample />
      <WhoFor />
      <Pricing />
      <Demo />
      <Footer />
    </div>
  )
}
