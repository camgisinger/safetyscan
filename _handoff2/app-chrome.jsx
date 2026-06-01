/* global React, SB, Plus, NavGlyph */
// SafetyScan production app — shared chrome + data. Locked system: k-st v-ticket f-schibsted.

// ---------- data ----------
const A_STATS = [
  { n: '12', l: 'Scans' },
  { n: '3', l: 'Sites' },
  { n: '4', l: 'Issues', amber: true },
];

const A_FEED = [
  { t: 'Scaffolding + Working at Heights', s: 'Newstead Plaza', d: '28 MAY · 10:08PM', status: 'issues', label: '3 issues' },
  { t: 'Excavator Operations + Earthworks', s: 'Westgate Stage 2', d: '28 MAY · 10:03PM', status: 'pending', label: 'Pending' },
  { t: 'Scaffolding + Working at Heights', s: 'Kelvin Grove', d: '28 MAY · 6:07PM', status: 'issues', label: '2 issues' },
  { t: 'Traffic Management', s: 'Newstead Plaza', d: '28 MAY · 5:29PM', status: 'issues', label: '2 issues' },
  { t: 'PPE Spot Check', s: 'Westgate Stage 2', d: '27 MAY · 2:14PM', status: 'clear', label: 'Clear' },
];

const A_SITES = [
  { name: 'Newstead Plaza', meta: 'Brisbane · 8 scans', score: 78, scoreCls: 'amber', bd: [60, 18, 22] },
  { name: 'Westgate Stage 2', meta: 'Ipswich · 5 scans', score: 96, scoreCls: 'green', bd: [92, 4, 4] },
  { name: 'Kelvin Grove Lots', meta: 'Brisbane · 6 scans', score: 64, scoreCls: 'red', bd: [50, 18, 32] },
];

// ---------- chrome ----------
function AppHeader({ back, title, action }) {
  return (
    <>
      <SB />
      <div className="hazard2" />
      <div className="st-head">
        <div className="st-brand">
          {back ? (
            <div className="st-back">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M9.5 2L4 7.5 9.5 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          ) : (
            <div className="st-logo">
              <img className="mk-light" src="assets/mark-duo-light.svg" alt="" />
              <img className="mk-dark" src="assets/mark-amber.svg" alt="" />
            </div>
          )}
          {title
            ? <div className="st-htitle">{title}</div>
            : <div className="st-word">Safety<b>Scan</b></div>}
        </div>
        {action === 'menu' && <div className="st-burger"><div><i /><i /><i /></div></div>}
        {action === 'share' && (
          <div className="st-actions">
            <div className="st-iconbtn">
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><circle cx="4.5" cy="9" r="1.7" stroke="currentColor" strokeWidth="1.5"/><circle cx="13.5" cy="4.5" r="1.7" stroke="currentColor" strokeWidth="1.5"/><circle cx="13.5" cy="13.5" r="1.7" stroke="currentColor" strokeWidth="1.5"/><path d="M6 8L12 5M6 10L12 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </div>
        )}
        {action === 'close' && (
          <div className="st-iconbtn">
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
        )}
        {!action && <span />}
      </div>
    </>
  );
}

const A_NAV = [
  { id: 'home', label: 'HOME' },
  { id: 'scans', label: 'SCANS' },
  { id: 'sites', label: 'SITES' },
  { id: 'profile', label: 'PROFILE' },
];

function AppNav({ active = 'home' }) {
  return (
    <div className="nav">
      {A_NAV.map(it => (
        <div key={it.id} className={`nav__i ${it.id === active ? 'on' : ''}`}>
          {NavGlyph[it.id]}
          <span className="nav__lbl">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function AppFab() {
  return <div className="fab"><Plus /></div>;
}

function AScreen({ mode, children }) {
  return (
    <div className="phone">
      <div className={`phone__screen k-st v-ticket f-schibsted is-${mode}`}>
        <div className="phone__island" />
        {children}
      </div>
    </div>
  );
}

// radar loader (matches the brand mark)
function RadarLoader({ mode }) {
  const c = mode === 'dark' ? '#F58A22' : '#1B1A12';
  const a = '#EE801A';
  return (
    <div className="ss-loader">
      <svg className="sp" viewBox="0 0 240 240" width="150" height="150">
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
      </svg>
      <svg className="pg" viewBox="0 0 240 240" width="150" height="150">
        <circle cx="120" cy="120" r="10" fill={a} />
        <circle cx="120" cy="120" r="56" fill="none" stroke={a} strokeWidth="3" opacity="0.5" style={{ transformOrigin: '50% 50%', animation: 'ss-ping 1.8s ease-out infinite' }} />
      </svg>
    </div>
  );
}

Object.assign(window, { A_STATS, A_FEED, A_SITES, AppHeader, AppNav, AppFab, AScreen, RadarLoader });
