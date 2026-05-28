/* global React, StatusBar, AppBar, BottomNav, FAB, SectionHead */
// Screens part 2: Sites list, Site detail, Profile, Auth, Shared scan, Guide

function SitesListScreen({ theme }) {
  const sites = [
    { name: 'Newstead Plaza', meta: 'BRISBANE · 8 scans this month', score: 78, breakdown: [60, 18, 22] },
    { name: 'Westgate Stage 2', meta: 'IPSWICH · 5 scans this month', score: 96, breakdown: [92, 4, 4] },
    { name: 'Kelvin Grove Lots', meta: 'BRISBANE · 6 scans this month', score: 64, breakdown: [50, 18, 32] },
    { name: 'Northgate Depot', meta: 'BRISBANE · 2 scans this month', score: 100, breakdown: [100, 0, 0] },
  ];
  return (
    <>
      <StatusBar theme={theme} />
      <AppBar theme={theme} title="Sites" accent="" />
      <div className="screen-body">
        <div className="row-flex gap-3" style={{ paddingLeft: 4, paddingBottom: 8, justifyContent: 'space-between' }}>
          <div className="page-sub" style={{ padding: 0 }}>4 active sites · 21 scans this month</div>
          <div className="section-head__action">Sort <span>↕</span></div>
        </div>
        <div className="col gap-2">
          {sites.map((s, i) => (
            <div key={i} className="site-row">
              <div className="site-row__head">
                <div>
                  <div className="site-row__title">{s.name}</div>
                  <div className="site-row__meta">{s.meta.toUpperCase()}</div>
                </div>
                <div className="minisstat" style={{ alignItems: 'flex-end' }}>
                  <div className={`minisstat__num ${s.score >= 90 ? '' : s.score >= 70 ? 'is-amber' : ''}`} style={{ color: s.score < 70 ? 'var(--status-red)' : undefined }}>{s.score}%</div>
                  <div className="minisstat__label">Compliance</div>
                </div>
              </div>
              <div className="site-row__bar">
                <div className="site-bar">
                  <div className="site-bar__fill green" style={{ width: `${s.breakdown[0]}%` }} />
                  <div className="site-bar__fill amber" style={{ width: `${s.breakdown[1]}%` }} />
                  <div className="site-bar__fill red"   style={{ width: `${s.breakdown[2]}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <FAB />
      <BottomNav active="sites" />
    </>
  );
}

function SiteDetailScreen({ theme }) {
  const rows = [
    { t: 'Traffic Management', d: '27 MAY · 2:14PM', status: 'issues', count: '2 issues' },
    { t: 'PPE Spot Check', d: '24 MAY · 11:20AM', status: 'clear', count: 'Clear' },
    { t: 'Fire Egress', d: '24 MAY · 3:36PM', status: 'clear', count: 'Clear' },
    { t: 'Scaffold Inspection', d: '21 MAY · 8:48AM', status: 'issues', count: '1 issue' },
    { t: 'Edge Protection', d: '20 MAY · 9:11AM', status: 'clear', count: 'Clear' },
  ];
  return (
    <>
      <StatusBar theme={theme} />
      <AppBar theme={theme} title="Site" accent="" back action="menu" />
      <div className="screen-body">
        <div className="page-title" style={{ paddingTop: 0 }}>Newstead Plaza</div>
        <div className="page-sub" style={{ paddingBottom: 14 }}>
          12 Skyring Tce, Brisbane QLD · Tier 2 build · 38 weeks remaining
        </div>

        <div className="card">
          <div className="row-flex" style={{ justifyContent: 'space-between' }}>
            <div className="section-head__title">COMPLIANCE</div>
            <div className="text-mono" style={{ fontSize: 10, letterSpacing: '0.16em', opacity: 0.6, textTransform: 'uppercase' }}>Last 30 days</div>
          </div>
          <div className="row-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--amber)' }}>78<span style={{ fontSize: 22, opacity: 0.6 }}>%</span></div>
              <div className="minisstat__label" style={{ marginTop: 8 }}>Site score</div>
            </div>
            <div className="col gap-2" style={{ textAlign: 'right' }}>
              <div className="row-flex gap-2" style={{ justifyContent: 'flex-end' }}><span className="dot" style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--status-green)' }} /><span style={{ fontSize: 12 }}>6 clear</span></div>
              <div className="row-flex gap-2" style={{ justifyContent: 'flex-end' }}><span className="dot" style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--amber)' }} /><span style={{ fontSize: 12 }}>1 pending</span></div>
              <div className="row-flex gap-2" style={{ justifyContent: 'flex-end' }}><span className="dot" style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--status-red)' }} /><span style={{ fontSize: 12 }}>1 issue</span></div>
            </div>
          </div>
          {/* mini sparkline / bar histogram */}
          <div className="row-flex gap-2" style={{ marginTop: 16, alignItems: 'flex-end', height: 44 }}>
            {[18, 22, 32, 28, 36, 30, 38, 36, 40, 28, 34, 38, 30, 36, 42, 40, 36, 30, 38, 42, 36, 38, 28, 34, 40, 38, 42, 30, 32, 38].map((h, i) => (
              <div key={i} style={{ flex: 1, height: h, borderRadius: 2, background: i === 22 ? 'var(--status-red)' : i % 7 === 3 ? 'var(--amber)' : (theme === 'ink' ? '#3A3D44' : '#D8C9AD') }} />
            ))}
          </div>
        </div>

        <SectionHead title="Recent scans" />
        <div className="col gap-2">
          {rows.map((r, i) => (
            <div key={i} className="activity">
              <div className="thumb" />
              <div className="activity__main">
                <div className="activity__title">{r.t}</div>
                <div className="activity__meta">{r.d}</div>
              </div>
              <div className={`badge is-${r.status}`}><span className="dot" />{r.count}</div>
            </div>
          ))}
        </div>
      </div>
      <FAB />
      <BottomNav active="sites" />
    </>
  );
}

function ProfileScreen({ theme }) {
  return (
    <>
      <StatusBar theme={theme} />
      <AppBar theme={theme} title="Profile" accent="" action="menu" />
      <div className="screen-body">
        <div className="card row-flex gap-4" style={{ padding: 18, alignItems: 'center' }}>
          <div className="avatar">EM</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Ellie Marsden</div>
            <div className="text-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65, marginTop: 4 }}>SITE SUPERVISOR · QBCC 14821</div>
          </div>
        </div>

        <SectionHead title="This month" />
        <div className="card">
          <div className="stats">
            <div><div className="stat__num">12</div><div className="stat__label">Scans</div></div>
            <div><div className="stat__num">3</div><div className="stat__label">Sites</div></div>
            <div><div className="stat__num is-amber">2</div><div className="stat__label">Issues</div></div>
          </div>
        </div>

        <SectionHead title="Subscription" action="Manage" />
        <div className="card">
          <div className="row-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Pro · Annual</div>
              <div className="text-mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65, marginTop: 4 }}>Renews 14 Aug 2026</div>
            </div>
            <div className="badge is-clear"><span className="dot" />Active</div>
          </div>
          <div className="row-flex" style={{ marginTop: 16, justifyContent: 'space-between' }}>
            <div className="text-mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', opacity: 0.65 }}>12 / 50 SCANS</div>
            <div className="text-mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', opacity: 0.65 }}>24%</div>
          </div>
          <div className="site-bar" style={{ marginTop: 8 }}>
            <div className="site-bar__fill amber" style={{ width: '24%' }} />
          </div>
        </div>

        <SectionHead title="Settings" action={null} />
        <div className="card" style={{ padding: '4px 4px' }}>
          <div className="list-row">
            <div className="list-row__icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>
            </div>
            <div className="list-row__title">Appearance</div>
            <div className="list-row__hint">SYSTEM</div>
            <span style={{ opacity: 0.4 }}>›</span>
          </div>
          <div className="list-row">
            <div className="list-row__icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5l5 4 5-4M3 5v6h10V5M3 5h10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
            </div>
            <div className="list-row__title">Email notifications</div>
            <div className="toggle is-on" />
          </div>
          <div className="list-row">
            <div className="list-row__icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l5.5 2v4.2C13.5 11 11 13.5 8 14.5 5 13.5 2.5 11 2.5 7.7V3.5L8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
            </div>
            <div className="list-row__title">Privacy</div>
            <span style={{ opacity: 0.4 }}>›</span>
          </div>
          <div className="list-row">
            <div className="list-row__icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M6.5 6.5a1.5 1.5 0 1 1 2.5 1.2c-.6.4-1 .7-1 1.3M8 11v.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </div>
            <div className="list-row__title">Help &amp; support</div>
            <span style={{ opacity: 0.4 }}>›</span>
          </div>
          <div className="list-row">
            <div className="list-row__icon" style={{ background: 'var(--status-red-bg)', color: 'var(--status-red)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 3H4v10h5M11 5l3 3-3 3M14 8H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="list-row__title" style={{ color: 'var(--status-red)' }}>Log out</div>
          </div>
        </div>
      </div>
      <BottomNav active="profile" />
    </>
  );
}

function AuthScreen({ theme }) {
  const markSrc = theme === 'ink' ? 'assets/mark-amber.svg' : 'assets/mark-ink.svg';
  return (
    <>
      <StatusBar theme={theme} />
      <div className="screen-body" style={{ padding: '40px 26px 32px', display: 'flex', flexDirection: 'column' }}>
        <div className="row-flex gap-3" style={{ alignItems: 'center', marginBottom: 22 }}>
          <div className="appbar__logo" style={{ width: 44, height: 44, borderRadius: 14 }}>
            <img src={markSrc} alt="" style={{ width: 32, height: 32 }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Safety<span style={{ color: 'var(--amber)' }}>Scan</span>
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 6 }}>
          Walk the site.<br/>Catch the gap.
        </div>
        <div className="page-sub" style={{ padding: '0 0 18px' }}>QLD construction compliance in your pocket.</div>

        <div className="auth-toggle">
          <div className="auth-toggle__opt is-active">Sign in</div>
          <div className="auth-toggle__opt">Create account</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="input-label">Email</div>
          <input className="input" placeholder="you@company.com.au" defaultValue="ellie@marsden.build" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <div className="input-label">Password</div>
          <input className="input" type="password" defaultValue="••••••••" />
        </div>

        <div className="row-flex" style={{ justifyContent: 'space-between', marginBottom: 22 }}>
          <div className="row-flex gap-2">
            <div className="check__box is-done" style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 12 }}>Keep me signed in</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--amber)', fontWeight: 500 }}>Forgot?</div>
        </div>

        <div className="btn btn--amber btn--block" style={{ height: 50 }}>Sign in</div>

        <div className="row-flex gap-3" style={{ margin: '22px 0', alignItems: 'center' }}>
          <div className="divider" style={{ flex: 1 }} />
          <span className="text-mono" style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.55 }}>OR</span>
          <div className="divider" style={{ flex: 1 }} />
        </div>

        <div className="btn btn--ghost btn--block" style={{ height: 50 }}>
          <svg width="16" height="16" viewBox="0 0 18 18">
            <path d="M17.5 9.2c0-.7-.06-1.2-.15-1.7H9v3.4h4.7c-.1.9-.6 2.2-1.9 3l-.02.12 2.78 2.15.2.02c1.8-1.66 2.74-4.1 2.74-7z" fill="#4285F4"/>
            <path d="M9 18c2.5 0 4.6-.83 6.16-2.26l-2.94-2.28c-.8.55-1.84.94-3.22.94-2.5 0-4.6-1.62-5.35-3.86l-.11.01-2.9 2.24-.04.1A9 9 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.65 10.5A5.5 5.5 0 0 1 3.35 9c0-.53.1-1.04.28-1.5l-.01-.1L.7 5.13l-.1.05A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.05L3.65 10.5z" fill="#FBBC05"/>
            <path d="M9 3.6c1.77 0 2.96.77 3.64 1.4l2.66-2.6C13.6.84 11.5 0 9 0A9 9 0 0 0 .97 4.95L3.65 7.5C4.4 5.26 6.5 3.6 9 3.6z" fill="#EB4335"/>
          </svg>
          Continue with Google
        </div>

        <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 11.5, opacity: 0.55, paddingTop: 24 }}>
          By signing in you agree to our Terms · Privacy
        </div>
      </div>
    </>
  );
}

function SharedScanScreen({ theme }) {
  return (
    <>
      <StatusBar theme={theme} />
      <div className="appbar" style={{ paddingBottom: 6 }}>
        <div className="appbar__brand">
          <div className="appbar__logo"><img src={theme === 'ink' ? 'assets/mark-amber.svg' : 'assets/mark-ink.svg'} alt="" /></div>
          <div className="appbar__title">Safety<span className="accent">Scan</span></div>
        </div>
        <div className="text-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55 }}>SHARED REPORT</div>
      </div>
      <div className="screen-body" style={{ paddingBottom: 32 }}>
        <div className="shared-banner">
          <span className="shared-banner__dot" />
          <span>Read-only · shared 27 May by Ellie M.</span>
        </div>

        <div className="page-title" style={{ paddingTop: 0, paddingBottom: 4 }}>Traffic Management</div>
        <div className="page-sub" style={{ paddingBottom: 12 }}>Newstead Plaza · 27 May 2026, 2:14 PM</div>

        <div className="carousel">
          <div className="carousel__counter">1 / 4</div>
          <div className="carousel__placeholder">Site photo</div>
          <div className="carousel__pill"><span className="is-active" /><span /><span /><span /></div>
        </div>

        <div className="row-flex gap-3 mt-4" style={{ justifyContent: 'space-between' }}>
          <div className="badge is-issues" style={{ fontSize: 12, padding: '6px 12px 6px 10px' }}><span className="dot" />2 issues found</div>
          <div className="text-mono" style={{ fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55 }}>AI · 94%</div>
        </div>

        <div className="section-head"><div className="section-head__title">Summary</div></div>
        <div className="card-flat" style={{ fontSize: 13, lineHeight: 1.55 }}>
          Traffic control plan is partially in place. Signage missing on eastern approach; cone taper spacing exceeds the 6m recommendation for 40km/h zones.
        </div>

        <div className="section-head"><div className="section-head__title">Issues</div></div>
        <div className="col gap-2">
          <div className="issue">
            <span className="issue__sev is-high" />
            <div style={{ flex: 1 }}>
              <div className="issue__title">Missing approach signage</div>
              <div className="issue__desc">QLD MUTCD Pt 3 requires advance warning signs 50–80m before the work zone.</div>
              <span className="issue__tag">MUTCD PT 3 · §3.4</span>
            </div>
          </div>
          <div className="issue">
            <span className="issue__sev is-med" />
            <div style={{ flex: 1 }}>
              <div className="issue__title">Cone spacing inconsistent</div>
              <div className="issue__desc">Taper cones placed roughly 8m apart — recommended max 6m at 40km/h.</div>
              <span className="issue__tag">MUTCD PT 3 · §4.6</span>
            </div>
          </div>
        </div>

        <div className="btn btn--amber btn--block mt-5" style={{ height: 48 }}>
          Open in SafetyScan
        </div>
        <div className="text-mono mt-3" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.5, textAlign: 'center' }}>
          safetyscan.app/r/8K2J-VQ4M
        </div>
      </div>
    </>
  );
}

function GuideScreen({ theme }) {
  return (
    <>
      <StatusBar theme={theme} />
      <AppBar theme={theme} title="Guide" accent="" action="close" />
      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="row-flex" style={{ justifyContent: 'space-between', padding: '4px 4px 18px' }}>
          <div className="text-mono" style={{ fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.65 }}>Step 2 / 5</div>
          <div className="dots">
            <span /><span className="is-active" /><span /><span /><span />
          </div>
        </div>

        <div className="guide-art">
          {/* Stylised art: animated mark in a frame, with a couple "hazard" tags */}
          <div style={{ position: 'relative', width: 180, height: 180 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--status-amber-bg)' }} />
            <svg viewBox="0 0 240 240" width="180" height="180" style={{ position: 'absolute', inset: 0 }}>
              <g fill="none" strokeLinecap="butt" strokeWidth="14" stroke={theme === 'ink' ? '#F39410' : '#16181C'}>
                <g opacity=".25">
                  <path d="M 210 120 A 90 90 0 0 1 48 174" />
                  <path d="M 186 120 A 66 66 0 0 1 66 156" />
                  <path d="M 162 120 A 42 42 0 0 1 84 138" />
                </g>
                <path d="M 30 120 A 90 90 0 0 1 192 66" />
                <path d="M 54 120 A 66 66 0 0 1 174 84" />
                <path d="M 78 120 A 42 42 0 0 1 156 102" />
              </g>
              <circle cx="120" cy="120" r="10" fill={theme === 'ink' ? '#F39410' : '#16181C'} />
            </svg>
            {/* tag stickers */}
            <div style={{ position: 'absolute', top: -6, right: -28, padding: '6px 10px', borderRadius: 999, background: 'var(--status-red)', color: '#fff', fontSize: 11, fontWeight: 600, transform: 'rotate(8deg)', boxShadow: '0 6px 16px -6px rgba(0,0,0,0.35)' }}>
              Missing sign
            </div>
            <div style={{ position: 'absolute', bottom: 8, left: -34, padding: '6px 10px', borderRadius: 999, background: 'var(--amber)', color: '#fff', fontSize: 11, fontWeight: 600, transform: 'rotate(-6deg)', boxShadow: '0 6px 16px -6px rgba(0,0,0,0.35)' }}>
              Cone gap 8m
            </div>
          </div>
        </div>

        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.18, marginTop: 28, padding: '0 2px' }}>
          The AI flags what doesn't match QLD code.
        </div>
        <div className="page-sub" style={{ padding: '10px 2px 0', fontSize: 13.5, lineHeight: 1.5 }}>
          Each issue is tagged with its source — MUTCD, AS 4576, WHS Reg — so your write-up is ready for the inspector.
        </div>

        <div className="row-flex gap-3" style={{ marginTop: 'auto', paddingTop: 20 }}>
          <div className="btn btn--ghost" style={{ flex: '0 0 90px' }}>Back</div>
          <div className="btn btn--amber" style={{ flex: 1 }}>Next</div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { SitesListScreen, SiteDetailScreen, ProfileScreen, AuthScreen, SharedScanScreen, GuideScreen });
