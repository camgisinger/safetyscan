/* global React, AppHeader, AppNav, SB, A_STATS */
// Profile, Login, Shared scan, Guide

function AProfile({ mode }) {
  return (
    <div className="scr">
      <AppHeader title="Profile" action="menu" />
      <div className="scrollbody"><div className="scrollpad">
        <div className="ss-site rowx gap12" style={{ alignItems: 'center', padding: 16, marginTop: 4 }}>
          <div className="ss-avatar">EM</div>
          <div style={{ flex: 1 }}>
            <div className="ss-site__t" style={{ fontSize: 16 }}>Ellie Marsden</div>
            <div className="ss-site__m" style={{ marginTop: 5 }}>Site Supervisor · QBCC 14821</div>
          </div>
        </div>

        <div className="ss-sec"><span className="tk" /><span className="lbl">This month</span></div>
        <div className="strip">
          {A_STATS.map((s, i) => (
            <div key={i} className="cell"><div className={`s-num ${s.amber ? 'amber' : ''}`}>{s.n}</div><div className="s-lbl">{s.l}</div></div>
          ))}
        </div>

        <div className="ss-sec"><span className="tk" /><span className="lbl">Subscription</span><span className="link act">Manage</span></div>
        <div className="ss-site">
          <div className="ss-site__head">
            <div>
              <div className="ss-site__t">Pro · Annual</div>
              <div className="ss-site__m" style={{ marginTop: 5 }}>Renews 14 Aug 2026</div>
            </div>
            <div className="ss-flag clear"><span className="sq" />Active</div>
          </div>
          <div className="rowx between" style={{ marginTop: 14 }}>
            <span className="meta-line">12 / 50 scans</span>
            <span className="meta-line">24%</span>
          </div>
          <div className="ss-bar"><div className="ss-bar__f amber" style={{ width: '24%' }} /></div>
        </div>

        <div className="ss-sec"><span className="tk" /><span className="lbl">Settings</span></div>
        <div className="ss-list">
          <div className="ss-li">
            <div className="ss-li__ic"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg></div>
            <div className="ss-li__t">Appearance</div><div className="ss-li__h">System</div><span className="ss-li__chev">›</span>
          </div>
          <div className="ss-li">
            <div className="ss-li__ic"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5l5 4 5-4M3 5v6h10V5M3 5h10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg></div>
            <div className="ss-li__t">Email notifications</div><div className="ss-tog on" />
          </div>
          <div className="ss-li">
            <div className="ss-li__ic"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l5.5 2v4.2C13.5 11 11 13.5 8 14.5 5 13.5 2.5 11 2.5 7.7V3.5L8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg></div>
            <div className="ss-li__t">Privacy &amp; data</div><span className="ss-li__chev">›</span>
          </div>
          <div className="ss-li">
            <div className="ss-li__ic"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M6.5 6.5a1.5 1.5 0 1 1 2.5 1.2c-.6.4-1 .7-1 1.3M8 11v.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg></div>
            <div className="ss-li__t">Help &amp; support</div><span className="ss-li__chev">›</span>
          </div>
          <div className="ss-li">
            <div className="ss-li__ic" style={{ color: '#D63A26', borderColor: 'rgba(214,58,38,0.4)' }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 3H4v10h5M11 5l3 3-3 3M14 8H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <div className="ss-li__t" style={{ color: '#D63A26' }}>Log out</div>
          </div>
        </div>
      </div></div>
      <AppNav active="profile" />
    </div>
  );
}

function ALogin({ mode }) {
  return (
    <div className="scr">
      <SB />
      <div className="hazard2" />
      <div className="scrollbody"><div className="scrollpad" style={{ padding: '34px 26px 28px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="rowx gap12" style={{ alignItems: 'center', marginBottom: 22 }}>
          <span className="st-logo" style={{ width: 40, height: 40 }}>
            <img className="mk-light" src="assets/mark-duo-light.svg" alt="" style={{ width: 40, height: 40 }} />
            <img className="mk-dark" src="assets/mark-amber.svg" alt="" style={{ width: 40, height: 40 }} />
          </span>
          <div className="st-word" style={{ fontSize: 23 }}>Safety<b>Scan</b></div>
        </div>
        <div className="pg-title" style={{ fontSize: 27, lineHeight: 1.12 }}>Walk the site.<br/>Catch the gap.</div>
        <div className="pg-sub" style={{ marginBottom: 22 }}>QLD construction compliance in your pocket.</div>

        <div className="ss-seg" style={{ marginBottom: 22 }}>
          <div className="ss-seg__o on">Sign in</div>
          <div className="ss-seg__o">Create account</div>
        </div>

        <div className="ss-field">
          <div className="ss-ilabel">Email</div>
          <input className="ss-input" defaultValue="ellie@marsden.build" />
        </div>
        <div className="ss-field">
          <div className="ss-ilabel">Password</div>
          <input className="ss-input" type="password" defaultValue="••••••••••" />
        </div>

        <div className="rowx between" style={{ marginBottom: 20 }}>
          <div className="rowx gap8">
            <div className="ss-check__box done" style={{ width: 17, height: 17 }} />
            <span style={{ fontSize: 12.5, fontWeight: 500 }}>Keep me signed in</span>
          </div>
          <span className="link" style={{ textTransform: 'none' }}>Forgot?</span>
        </div>

        <div className="ss-btn ss-btn--amber ss-btn--block" style={{ height: 50 }}>Sign in</div>

        <div className="ss-or" style={{ margin: '20px 0' }}>
          <span className="ln" /><span className="tx">or</span><span className="ln" />
        </div>

        <div className="ss-btn ss-btn--ghost ss-btn--block" style={{ height: 50 }}>
          <svg width="16" height="16" viewBox="0 0 18 18"><path d="M17.5 9.2c0-.7-.06-1.2-.15-1.7H9v3.4h4.7c-.1.9-.6 2.2-1.9 3l2.76 2.17c1.8-1.66 2.84-4.1 2.84-6.87z" fill="#4285F4"/><path d="M9 18c2.5 0 4.6-.83 6.16-2.26l-2.94-2.28c-.8.55-1.84.94-3.22.94-2.5 0-4.6-1.62-5.35-3.86l-3 2.32A9 9 0 0 0 9 18z" fill="#34A853"/><path d="M3.65 10.5A5.5 5.5 0 0 1 3.35 9c0-.53.1-1.04.28-1.5L.7 5.13A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.05l2.68-2.55z" fill="#FBBC05"/><path d="M9 3.6c1.77 0 2.96.77 3.64 1.4l2.66-2.6C13.6.84 11.5 0 9 0A9 9 0 0 0 .97 4.95L3.65 7.5C4.4 5.26 6.5 3.6 9 3.6z" fill="#EB4335"/></svg>
          Continue with Google
        </div>

        <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 11, color: 'var(--mut)', paddingTop: 22 }}>
          By signing in you agree to our Terms · Privacy
        </div>
      </div></div>
    </div>
  );
}

function AShared({ mode }) {
  return (
    <div className="scr">
      <SB />
      <div className="hazard2" />
      <div className="st-head">
        <div className="st-brand">
          <div className="st-logo">
            <img className="mk-light" src="assets/mark-duo-light.svg" alt="" />
            <img className="mk-dark" src="assets/mark-amber.svg" alt="" />
          </div>
          <div className="st-word">Safety<b>Scan</b></div>
        </div>
        <span className="meta-line">Shared report</span>
      </div>
      <div className="scrollbody"><div className="scrollpad" style={{ paddingBottom: 30 }}>
        <div className="ss-shared">
          <span className="d" />Read-only · shared 28 May by Ellie M.
        </div>

        <div className="pg-title mt14">Traffic Management</div>
        <div className="meta-line mt10">Newstead Plaza · 28 May 2026, 5:29PM</div>

        <div className="ss-carousel mt14">
          <div className="ct">1 / 4</div>
          <div className="ph">Site photo</div>
          <div className="dots"><span className="on" /><span /><span /><span /></div>
        </div>

        <div className="ss-summary">
          <div className="ss-flag issues"><span className="sq" />2 issues found</div>
          <div className="meta-line">AI · 94%</div>
        </div>

        <div className="ss-sec"><span className="tk" /><span className="lbl">Summary</span></div>
        <div className="ss-analysis">
          Traffic control plan is partially in place. <span className="q">Signage missing</span> on the eastern approach; cone taper spacing exceeds the 6m recommendation for 40km/h zones.
        </div>

        <div className="ss-sec"><span className="tk" /><span className="lbl">Issues</span></div>
        <div className="col gap10">
          <div className="ss-issue">
            <div className="ss-issue__bar high" />
            <div className="ss-issue__b">
              <div className="ss-issue__t">Missing approach signage</div>
              <div className="ss-issue__d">QLD MUTCD Pt 3 requires advance warning signs 50–80m before the work zone.</div>
              <span className="ss-issue__tag">MUTCD PT 3 · §3.4</span>
            </div>
            <div className="ss-issue__sev high">High</div>
          </div>
          <div className="ss-issue">
            <div className="ss-issue__bar med" />
            <div className="ss-issue__b">
              <div className="ss-issue__t">Cone spacing inconsistent</div>
              <div className="ss-issue__d">Taper cones placed roughly 8m apart — recommended max 6m at 40km/h.</div>
              <span className="ss-issue__tag">MUTCD PT 3 · §4.6</span>
            </div>
            <div className="ss-issue__sev med">Med</div>
          </div>
        </div>

        <div className="ss-btn ss-btn--amber ss-btn--block mt18" style={{ height: 48 }}>Open in SafetyScan</div>
        <div className="meta-line" style={{ textAlign: 'center', marginTop: 12, textTransform: 'none', letterSpacing: '0.04em' }}>safetyscan.app/r/8K2J-VQ4M</div>
      </div></div>
    </div>
  );
}

function AGuide({ mode }) {
  const c = mode === 'dark' ? '#F58A22' : '#1B1A12';
  const a = '#EE801A';
  return (
    <div className="scr">
      <AppHeader title="Guide" action="close" />
      <div className="scrollbody"><div className="scrollpad" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="rowx between" style={{ padding: '4px 2px 18px' }}>
          <span className="meta-line">Step 2 / 5</span>
          <div className="ss-progress"><span /><span className="on" /><span /><span /><span /></div>
        </div>

        <div className="ss-guide-art">
          <div className="halo" />
          <svg viewBox="0 0 240 240" width="172" height="172" style={{ position: 'relative' }}>
            <g fill="none" strokeLinecap="butt" strokeWidth="14">
              <g opacity=".25" stroke={c}>
                <path d="M 210 120 A 90 90 0 0 1 48 174" />
                <path d="M 186 120 A 66 66 0 0 1 66 156" />
                <path d="M 162 120 A 42 42 0 0 1 84 138" />
              </g>
              <g stroke={a}>
                <path d="M 30 120 A 90 90 0 0 1 192 66" />
                <path d="M 54 120 A 66 66 0 0 1 174 84" />
                <path d="M 78 120 A 42 42 0 0 1 156 102" />
              </g>
            </g>
            <circle cx="120" cy="120" r="10" fill={a} />
          </svg>
          <div className="ss-sticker red" style={{ top: 26, right: 24, transform: 'rotate(7deg)' }}>Missing sign</div>
          <div className="ss-sticker amber" style={{ bottom: 34, left: 22, transform: 'rotate(-6deg)' }}>Cone gap 8m</div>
        </div>

        <div className="pg-title mt22" style={{ fontSize: 25, lineHeight: 1.18 }}>The AI flags what doesn't match QLD code.</div>
        <div className="pg-sub" style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 10 }}>Each issue is tagged with its source — MUTCD, AS 4576, WHS Reg — so your write-up is ready for the inspector.</div>

        <div className="rowx gap12" style={{ marginTop: 'auto', paddingTop: 20 }}>
          <div className="ss-btn ss-btn--ghost" style={{ flex: '0 0 92px' }}>Back</div>
          <div className="ss-btn ss-btn--amber" style={{ flex: 1 }}>Next</div>
        </div>
      </div></div>
    </div>
  );
}

Object.assign(window, { AProfile, ALogin, AShared, AGuide });
