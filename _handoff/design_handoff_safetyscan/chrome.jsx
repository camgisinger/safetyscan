/* global React */
// Shared chrome: status bar, app bar, bottom nav, FAB, phone frame, mark variants.

const { useState } = React;

function StatusBar({ theme }) {
  const ink = theme === 'ink';
  const color = ink ? 'var(--ink-text)' : 'var(--paper-text)';
  return (
    <div className="statusbar" style={{ color }}>
      <span>9:41</span>
      <div style={{ width: 110 }} />
      <div className="statusbar__icons">
        <span className="statusbar__bar b1" style={{ background: color }} />
        <span className="statusbar__bar b2" style={{ background: color }} />
        <span className="statusbar__bar b3" style={{ background: color }} />
        <span className="statusbar__bar b4" style={{ background: color }} />
        <span className="statusbar__wifi" style={{ color, marginLeft: 6 }} />
        <span className="statusbar__battery" style={{ color, marginLeft: 6 }} />
      </div>
    </div>
  );
}

function AppBar({ theme, title = 'SafetyScan', accent = 'Scan', back = false, action = 'menu' }) {
  const markSrc = theme === 'ink' ? 'assets/mark-amber.svg' : 'assets/mark-ink.svg';
  return (
    <div className="appbar">
      <div className="appbar__brand">
        {back ? (
          <div className="appbar__back">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div className="appbar__logo">
            <img src={markSrc} alt="" />
          </div>
        )}
        <div className="appbar__title">
          {accent ? <>{title.replace(accent, '')}<span className="accent">{accent}</span></> : title}
        </div>
      </div>
      {action === 'menu' && (
        <div className="appbar__menu"><i /><i /><i /></div>
      )}
      {action === 'share' && (
        <div className="appbar__menu" style={{ width: 32, height: 32 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="4.5" cy="9" r="1.6" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="13.5" cy="4.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="13.5" cy="13.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M6 8L12 5M6 10L12 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
      )}
      {action === 'close' && (
        <div className="appbar__menu" style={{ width: 32, height: 32 }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </div>
      )}
      {action === 'none' && <span />}
    </div>
  );
}

const NavIcon = {
  home: (
    <svg className="bottomnav__icon" viewBox="0 0 24 24" fill="none">
      <path d="M4 11.5L12 4.5l8 7V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  scans: (
    <svg className="bottomnav__icon" viewBox="0 0 24 24" fill="none">
      <path d="M5 8V6a2 2 0 0 1 2-2h2M19 8V6a2 2 0 0 0-2-2h-2M5 16v2a2 2 0 0 0 2 2h2M19 16v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  sites: (
    <svg className="bottomnav__icon" viewBox="0 0 24 24" fill="none">
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  profile: (
    <svg className="bottomnav__icon" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

function BottomNav({ active = 'home' }) {
  const items = [
    { id: 'home', label: 'HOME' },
    { id: 'scans', label: 'SCANS' },
    { id: 'sites', label: 'SITES' },
    { id: 'profile', label: 'PROFILE' },
  ];
  return (
    <div className="bottomnav">
      {items.map(it => (
        <div key={it.id} className={`bottomnav__item ${active === it.id ? 'is-active' : ''}`}>
          {NavIcon[it.id]}
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function FAB() {
  return (
    <div className="fab">
      <svg viewBox="0 0 22 22" fill="none">
        <path d="M11 3v16M3 11h16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Phone({ theme = 'paper', children }) {
  return (
    <div className="phone">
      <div className={`phone__screen theme-${theme}`}>
        <div className="phone__island" />
        {children}
      </div>
    </div>
  );
}

function Pair({ light, dark }) {
  return (
    <div style={{ display: 'flex', gap: 40, padding: '6px 0' }}>
      <div>
        <div className="row-label" style={{ marginBottom: 14 }}>LIGHT · PAPER</div>
        <Phone theme="paper">{light}</Phone>
      </div>
      <div>
        <div className="row-label" style={{ marginBottom: 14 }}>DARK · INK</div>
        <Phone theme="ink">{dark}</Phone>
      </div>
    </div>
  );
}

// ---- shared section header ----
function SectionHead({ title, action = 'View all' }) {
  return (
    <div className="section-head">
      <div className="section-head__title">{title}</div>
      {action && <div className="section-head__action">{action} <span>→</span></div>}
    </div>
  );
}

// ---- shield/mark loader ----
function MarkLoader({ theme }) {
  const stroke = theme === 'ink' ? '#F39410' : '#16181C';
  return (
    <div style={{ position: 'relative', width: 160, height: 160 }}>
      <svg className="mark-spin" viewBox="0 0 240 240" width="160" height="160" style={{ position: 'absolute', inset: 0 }}>
        <g fill="none" strokeLinecap="butt" strokeWidth="14" stroke={stroke}>
          <g opacity=".25">
            <path d="M 210 120 A 90 90 0 0 1 48 174" />
            <path d="M 186 120 A 66 66 0 0 1 66 156" />
            <path d="M 162 120 A 42 42 0 0 1 84 138" />
          </g>
          <path d="M 30 120 A 90 90 0 0 1 192 66" />
          <path d="M 54 120 A 66 66 0 0 1 174 84" />
          <path d="M 78 120 A 42 42 0 0 1 156 102" />
        </g>
      </svg>
      <svg viewBox="0 0 240 240" width="160" height="160" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="120" cy="120" r="10" fill={stroke} />
        <circle className="mark-ping" cx="120" cy="120" r="60" fill="none" stroke={stroke} strokeWidth="3" opacity="0.5" />
      </svg>
    </div>
  );
}

Object.assign(window, { StatusBar, AppBar, BottomNav, FAB, Phone, Pair, SectionHead, MarkLoader });
