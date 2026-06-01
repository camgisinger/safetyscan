/* global React */
// Shared bits for the concept exploration: status bar, nav icons, content data.

const SB = ({ light }) => (
  <div className="statusbar" style={{ color: light ? 'inherit' : 'inherit' }}>
    <span>9:41</span>
    <span style={{ width: 108 }} />
    <div className="sb-right">
      <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
        <rect x="0" y="7" width="3" height="4" rx="1" fill="currentColor"/>
        <rect x="4.5" y="5" width="3" height="6" rx="1" fill="currentColor"/>
        <rect x="9" y="2.5" width="3" height="8.5" rx="1" fill="currentColor"/>
        <rect x="13.5" y="0" width="3" height="11" rx="1" fill="currentColor"/>
      </svg>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
        <path d="M8 10.5C5.8 8 2.6 6.2 0 5.9 2 2.4 4.8 0.5 8 0.5s6 1.9 8 5.4c-2.6.3-5.8 2.1-8 4.6z" fill="currentColor" opacity="0.9"/>
      </svg>
      <span className="sb-batt" />
    </div>
  </div>
);

const navItems = [
  { id: 'home', label: 'HOME' },
  { id: 'scans', label: 'SCANS' },
  { id: 'sites', label: 'SITES' },
  { id: 'profile', label: 'PROFILE' },
];

const NavGlyph = {
  home: <svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5L12 4.5l8 7V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  scans: <svg viewBox="0 0 24 24" fill="none"><path d="M5 8V6a2 2 0 0 1 2-2h2M19 8V6a2 2 0 0 0-2-2h-2M5 16v2a2 2 0 0 0 2 2h2M19 16v2a2 2 0 0 1-2 2h-2M4 12h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  sites: <svg viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6"/></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6"/><path d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
};

function Nav() {
  return (
    <div className="nav">
      {navItems.map(it => (
        <div key={it.id} className={`nav__i ${it.id === 'home' ? 'on' : ''}`}>
          {NavGlyph[it.id]}
          <span className="nav__lbl">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>
);

// Shared content (matches the user's current screenshot)
const STATS = [
  { n: '5', l: 'Scans' },
  { n: '0', l: 'Sites' },
  { n: '4', l: 'Issues', amber: true },
];
const FEED = [
  { t: 'Scaffolding + Working at Heights', d: '28 MAY · 10:08PM', status: 'issues', label: '3 issues' },
  { t: 'Excavator Operations + Earthworks', d: '28 MAY · 10:03PM', status: 'pending', label: 'Pending' },
  { t: 'Scaffolding + Working at Heights', d: '28 MAY · 6:07PM', status: 'issues', label: '2 issues' },
  { t: 'Traffic Management', d: '28 MAY · 5:29PM', status: 'issues', label: '2 issues' },
  { t: 'Traffic Management', d: '27 MAY · 10:41PM', status: 'issues', label: '2 issues' },
];

// mark chooser: light bg -> ink mark, dark bg -> amber mark
const markFor = (light) => light ? 'assets/mark-ink.svg' : 'assets/mark-amber.svg';

function Phone({ concept, mode, children }) {
  return (
    <div className="phone">
      <div className={`phone__screen k-${concept} is-${mode}`}>
        <div className="phone__island" />
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { SB, Nav, Plus, STATS, FEED, markFor, Phone, navItems, NavGlyph });
