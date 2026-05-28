/* global React, StatusBar, AppBar, BottomNav, FAB, SectionHead, MarkLoader */
// Screens part 1: Home, Scans list, Scan detail, Scan upload flow (3 states)

function HomeScreen({ theme }) {
  return (
    <>
      <StatusBar theme={theme} />
      <AppBar theme={theme} />
      <div className="screen-body">
        <div className="card">
          <div className="row-flex" style={{ justifyContent: 'space-between' }}>
            <div className="section-head__title">THIS MONTH</div>
            <div className="section-head__action">View all <span>→</span></div>
          </div>
          <div className="stats">
            <div><div className="stat__num">12</div><div className="stat__label">Scans</div></div>
            <div><div className="stat__num">3</div><div className="stat__label">Sites</div></div>
            <div><div className="stat__num is-amber">2</div><div className="stat__label">Issues</div></div>
          </div>
        </div>

        <div className="banner">
          <div className="banner__icon"><img src={theme === 'ink' ? 'assets/mark-ink-on-amber.svg' : 'assets/mark-ink-on-amber.svg'} alt="" /></div>
          <div className="banner__title">SafetyScan Guide</div>
          <div className="banner__arrow">→</div>
        </div>

        <SectionHead title="Recent activity" />

        <div className="col gap-2">
          <div className="activity">
            <div className="thumb" />
            <div className="activity__main">
              <div className="activity__title">Traffic Management</div>
              <div className="activity__meta">27 MAY · 2:14PM</div>
            </div>
            <div className="badge is-issues"><span className="dot" />2 issues</div>
          </div>
          <div className="activity">
            <div className="thumb" />
            <div className="activity__main">
              <div className="activity__title">Westgate Site B</div>
              <div className="activity__meta">27 MAY · 9:02AM</div>
            </div>
            <div className="badge is-clear"><span className="dot" />Clear</div>
          </div>
          <div className="activity">
            <div className="thumb" />
            <div className="activity__main">
              <div className="activity__title">Scaffold Inspection</div>
              <div className="activity__meta">26 MAY · 4:48PM</div>
            </div>
            <div className="badge is-clear"><span className="dot" />Clear</div>
          </div>
        </div>
      </div>
      <FAB />
      <BottomNav active="home" />
    </>
  );
}

function ScansListScreen({ theme }) {
  const rows = [
    { t: 'Traffic Management', s: 'Newstead Plaza', d: '27 MAY · 2:14PM', status: 'issues', count: '2 issues' },
    { t: 'Westgate Site B', s: 'Westgate Stage 2', d: '27 MAY · 9:02AM', status: 'clear', count: 'Clear' },
    { t: 'Scaffold Inspection', s: 'Newstead Plaza', d: '26 MAY · 4:48PM', status: 'clear', count: 'Clear' },
    { t: 'PPE Spot Check', s: 'Kelvin Grove', d: '26 MAY · 11:20AM', status: 'issues', count: '1 issue' },
    { t: 'Edge Protection', s: 'Westgate Stage 2', d: '25 MAY · 8:05AM', status: 'pending', count: 'Pending' },
    { t: 'Fire Egress', s: 'Newstead Plaza', d: '24 MAY · 3:36PM', status: 'clear', count: 'Clear' },
    { t: 'Trenching', s: 'Kelvin Grove', d: '24 MAY · 10:11AM', status: 'issues', count: '3 issues' },
  ];
  return (
    <>
      <StatusBar theme={theme} />
      <AppBar theme={theme} title="Scans" accent="" />
      <div className="screen-body">
        <div className="tabs">
          <div className="tabs__tab is-active">All</div>
          <div className="tabs__tab">Issues</div>
          <div className="tabs__tab">Clear</div>
          <div className="tabs__tab">Pending</div>
        </div>
        <div className="col gap-2">
          {rows.map((r, i) => (
            <div key={i} className="activity">
              <div className="thumb" />
              <div className="activity__main">
                <div className="activity__title">{r.t}</div>
                <div className="activity__meta">{r.s.toUpperCase()} · {r.d}</div>
              </div>
              <div className={`badge is-${r.status}`}><span className="dot" />{r.count}</div>
            </div>
          ))}
        </div>
      </div>
      <FAB />
      <BottomNav active="scans" />
    </>
  );
}

function ScanDetailScreen({ theme }) {
  return (
    <>
      <StatusBar theme={theme} />
      <AppBar theme={theme} title="Scan" accent="" back action="share" />
      <div className="screen-body">
        <div className="page-title" style={{ paddingTop: 0 }}>Traffic Management</div>
        <div className="row-flex gap-3" style={{ paddingLeft: 4, marginTop: -4, marginBottom: 12 }}>
          <span className="text-mono" style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme==='ink' ? 'var(--ink-text-mut)' : 'var(--paper-text-mut)' }}>NEWSTEAD PLAZA · 27 MAY · 2:14PM</span>
        </div>

        <div className="carousel">
          <div className="carousel__counter">1 / 4</div>
          <div className="carousel__placeholder">Site photo</div>
          <div className="carousel__pill"><span className="is-active" /><span /><span /><span /></div>
        </div>

        <div className="row-flex gap-3 mt-4" style={{ justifyContent: 'space-between' }}>
          <div className="badge is-issues" style={{ fontSize: 12, padding: '6px 12px 6px 10px' }}><span className="dot" />2 issues found</div>
          <div className="text-mono" style={{ fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.6 }}>AI · 94% confidence</div>
        </div>

        <div className="section-head" style={{ paddingTop: 22 }}>
          <div className="section-head__title">AI Analysis</div>
        </div>
        <div className="card-flat" style={{ fontSize: 13.2, lineHeight: 1.55 }}>
          Traffic control plan is partially in place. Witches hats and barriers cover the work zone, but signage is missing at the eastern approach. Worker high-vis is compliant.
        </div>

        <div className="section-head"><div className="section-head__title">Issues</div></div>
        <div className="col gap-2">
          <div className="issue">
            <span className="issue__sev is-high" />
            <div style={{ flex: 1 }}>
              <div className="issue__title">Missing approach signage</div>
              <div className="issue__desc">QLD MUTCD Pt 3 requires advance warning signs 50–80m before the work zone on the eastern approach.</div>
              <span className="issue__tag">MUTCD PT 3 · §3.4</span>
            </div>
          </div>
          <div className="issue">
            <span className="issue__sev is-med" />
            <div style={{ flex: 1 }}>
              <div className="issue__title">Cone spacing inconsistent</div>
              <div className="issue__desc">Taper cones placed roughly 8m apart — recommended max 6m at 40km/h zones.</div>
              <span className="issue__tag">MUTCD PT 3 · §4.6</span>
            </div>
          </div>
        </div>

        <div className="section-head"><div className="section-head__title">Checklist</div></div>
        <div className="card">
          <div className="check"><div className="check__box is-done" /><div className="check__label is-strike">High-vis PPE worn</div></div>
          <div className="check"><div className="check__box is-done" /><div className="check__label is-strike">Barriers in place</div></div>
          <div className="check"><div className="check__box is-fail" /><div className="check__label">Advance warning signs</div></div>
          <div className="check"><div className="check__box is-fail" /><div className="check__label">Taper cone spacing</div></div>
          <div className="check"><div className="check__box is-done" /><div className="check__label is-strike">Permit visible on site</div></div>
        </div>

        <div className="row-flex gap-2 mt-5">
          <div className="btn btn--ghost btn--block">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7a4 4 0 0 1 8 0M11 7a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M11 4v3h-3M3 10V7h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Re-analyse
          </div>
          <div className="btn btn--amber btn--block">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 9v2h8V9M7 2v7m0 0L4 6m3 3 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Export PDF
          </div>
        </div>
      </div>
    </>
  );
}

// Capture state
function ScanCaptureScreen({ theme }) {
  return (
    <>
      <StatusBar theme="ink" />
      <div className="viewfinder">
        <div className="viewfinder__hint">Frame the work area · keep steady</div>
        <div className="viewfinder__feed">
          <div className="viewfinder__grid" />
          <div className="viewfinder__corner tl" />
          <div className="viewfinder__corner tr" />
          <div className="viewfinder__corner bl" />
          <div className="viewfinder__corner br" />
        </div>
        <div className="viewfinder__bar">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="10" cy="10.5" r="3" stroke="currentColor" strokeWidth="1.4"/></svg>
          </div>
          <div className="shutter" />
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 7h12M7 4v3M4 13l3-3 3 3 3-3 3 3v3H4v-3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
        {/* themed top buttons */}
        <div style={{ position: 'absolute', top: 60, left: 20, width: 36, height: 36, borderRadius: 12, background: 'rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center', color: '#fff' }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </div>
        <div style={{ position: 'absolute', top: 60, right: 20, padding: '8px 12px', borderRadius: 999, background: 'rgba(243,148,16,0.95)', color: '#fff', fontSize: 11, fontFamily: 'var(--ff-mono)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          1 / 4
        </div>
      </div>
    </>
  );
}

// Processing state
function ScanProcessingScreen({ theme }) {
  const mutedBg = theme === 'ink' ? 'var(--ink-card-2)' : 'var(--paper-card-2)';
  return (
    <>
      <StatusBar theme={theme} />
      <AppBar theme={theme} title="Analysing" accent="" action="close" />
      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ marginTop: -40 }}>
          <MarkLoader theme={theme} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 28, textAlign: 'center' }}>
          Reading your site
        </div>
        <div style={{ fontSize: 13, marginTop: 8, opacity: 0.65, textAlign: 'center', maxWidth: 260 }}>
          Cross-checking against QLD MUTCD &amp; WHS regs
        </div>

        <div style={{ width: '100%', marginTop: 36, padding: '0 18px' }}>
          <div className="col gap-2">
            <div className="card-flat row-flex gap-3" style={{ padding: '12px 14px' }}>
              <div className="check__box is-done" />
              <div style={{ flex: 1, fontSize: 13 }}>Photos uploaded</div>
              <div className="text-mono" style={{ fontSize: 10, letterSpacing: '0.16em', opacity: 0.55 }}>4 / 4</div>
            </div>
            <div className="card-flat row-flex gap-3" style={{ padding: '12px 14px' }}>
              <div className="check__box is-done" />
              <div style={{ flex: 1, fontSize: 13 }}>Detecting hazards</div>
              <div className="text-mono" style={{ fontSize: 10, letterSpacing: '0.16em', opacity: 0.55 }}>DONE</div>
            </div>
            <div className="card-flat row-flex gap-3" style={{ padding: '12px 14px' }}>
              <div style={{ width: 20, height: 20, borderRadius: 999, border: '2px solid var(--amber)', borderTopColor: 'transparent', animation: 'spin 0.9s linear infinite' }} />
              <div style={{ flex: 1, fontSize: 13 }}>Matching regulations</div>
              <div className="text-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--amber)' }}>NOW</div>
            </div>
            <div className="card-flat row-flex gap-3" style={{ padding: '12px 14px', opacity: 0.5 }}>
              <div className="check__box" />
              <div style={{ flex: 1, fontSize: 13 }}>Compiling report</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Results transition state (fresh result reveal)
function ScanResultsScreen({ theme }) {
  return (
    <>
      <StatusBar theme={theme} />
      <AppBar theme={theme} title="Result" accent="" back action="share" />
      <div className="screen-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', placeItems: 'center', padding: '20px 0 18px' }}>
          <div style={{ width: 96, height: 96, borderRadius: 999, background: 'var(--status-red-bg)', display: 'grid', placeItems: 'center' }}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5M12 16v0.5" stroke="var(--status-red)" strokeWidth="2.4" strokeLinecap="round"/>
              <path d="M12 3L2 20h20L12 3z" stroke="var(--status-red)" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', textAlign: 'center' }}>2 issues found</div>
        <div style={{ fontSize: 13.5, textAlign: 'center', opacity: 0.7, marginTop: 6, maxWidth: 280, alignSelf: 'center' }}>
          Two compliance gaps detected in Traffic Management. Review and resolve before the next walk.
        </div>

        <div className="col gap-2 mt-6">
          <div className="card-flat row-flex gap-3" style={{ padding: '14px 14px' }}>
            <span className="issue__sev is-high" />
            <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>Missing approach signage</div>
            <span className="text-mono" style={{ fontSize: 10, letterSpacing: '0.16em', opacity: 0.55 }}>HIGH</span>
          </div>
          <div className="card-flat row-flex gap-3" style={{ padding: '14px 14px' }}>
            <span className="issue__sev is-med" />
            <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>Cone spacing inconsistent</div>
            <span className="text-mono" style={{ fontSize: 10, letterSpacing: '0.16em', opacity: 0.55 }}>MED</span>
          </div>
        </div>

        <div className="row-flex gap-2 mt-6">
          <div className="btn btn--ghost btn--block">Save draft</div>
          <div className="btn btn--amber btn--block">Open report</div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { HomeScreen, ScansListScreen, ScanDetailScreen, ScanCaptureScreen, ScanProcessingScreen, ScanResultsScreen });
