/* global React, AppHeader, AppNav, AppFab, A_STATS, A_FEED */
// Home, Scans list, Scan detail

function AHome({ mode }) {
  return (
    <div className="scr">
      <AppHeader action="menu" />
      <div className="scrollbody"><div className="scrollpad">
        <div className="rowx between" style={{ padding: '4px 2px 10px' }}>
          <span className="eyebrow">This month</span><span className="link">View all →</span>
        </div>
        <div className="strip">
          {A_STATS.map((s, i) => (
            <div key={i} className="cell"><div className={`s-num ${s.amber ? 'amber' : ''}`}>{s.n}</div><div className="s-lbl">{s.l}</div></div>
          ))}
        </div>

        <div className="t-guide mt14">
          <div className="ic"><img src="assets/mark-ink.svg" alt="" /></div>
          <div className="t">SafetyScan Guide</div>
          <div className="ar">→</div>
        </div>

        <div className="ss-sec"><span className="tk" /><span className="lbl">Recent activity</span><span className="link act">View all →</span></div>

        <div className="col gap10">
          {A_FEED.map((f, i) => (
            <div key={i} className="ticket">
              <div className={`ticket__bar ${f.status}`} />
              <div className="thumb" />
              <div className="ticket__b">
                <div className="ticket__t">{f.t}</div>
                <div className="ticket__m">{f.s} · {f.d}</div>
              </div>
              <div className="ticket__r"><div className={`ticket__c ${f.status}`}>{f.label}</div></div>
            </div>
          ))}
        </div>
      </div></div>
      <AppFab />
      <AppNav active="home" />
    </div>
  );
}

function AScans({ mode }) {
  const rows = [
    ...A_FEED,
    { t: 'Edge Protection Audit', s: 'Westgate Stage 2', d: '27 MAY · 8:05AM', status: 'pending', label: 'Pending' },
    { t: 'Fire Egress Check', s: 'Newstead Plaza', d: '26 MAY · 3:36PM', status: 'clear', label: 'Clear' },
    { t: 'Trenching + Shoring', s: 'Kelvin Grove', d: '24 MAY · 10:11AM', status: 'issues', label: '3 issues' },
  ];
  return (
    <div className="scr">
      <AppHeader title="Scans" action="menu" />
      <div className="scrollbody"><div className="scrollpad">
        <div className="ss-tabs">
          <div className="ss-tab on">All</div>
          <div className="ss-tab">Issues</div>
          <div className="ss-tab">Clear</div>
          <div className="ss-tab">Pending</div>
        </div>
        <div className="col gap10 mt14">
          {rows.map((f, i) => (
            <div key={i} className="ticket">
              <div className={`ticket__bar ${f.status}`} />
              <div className="thumb" />
              <div className="ticket__b">
                <div className="ticket__t">{f.t}</div>
                <div className="ticket__m">{f.s} · {f.d}</div>
              </div>
              <div className="ticket__r"><div className={`ticket__c ${f.status}`}>{f.label}</div></div>
            </div>
          ))}
        </div>
      </div></div>
      <AppFab />
      <AppNav active="scans" />
    </div>
  );
}

function AScanDetail({ mode }) {
  return (
    <div className="scr">
      <AppHeader back title="Scan" action="share" />
      <div className="scrollbody"><div className="scrollpad" style={{ paddingTop: 6 }}>
        <div className="pg-title">Traffic Management</div>
        <div className="meta-line mt10">Newstead Plaza · 28 May · 5:29PM</div>

        <div className="ss-carousel mt14">
          <div className="ct">1 / 4</div>
          <div className="ph">Site photo</div>
          <div className="dots"><span className="on" /><span /><span /><span /></div>
        </div>

        <div className="ss-summary">
          <div className="ss-flag issues"><span className="sq" />2 issues found</div>
          <div className="meta-line">AI · 94% confidence</div>
        </div>

        <div className="ss-sec"><span className="tk" /><span className="lbl">AI analysis</span></div>
        <div className="ss-analysis">
          Traffic control plan is partially in place. Witches hats and barriers cover the work zone, but <span className="q">signage is missing</span> at the eastern approach. Worker high-vis is compliant.
        </div>

        <div className="ss-sec"><span className="tk" /><span className="lbl">Issues</span></div>
        <div className="col gap10">
          <div className="ss-issue">
            <div className="ss-issue__bar high" />
            <div className="ss-issue__b">
              <div className="ss-issue__t">Missing approach signage</div>
              <div className="ss-issue__d">QLD MUTCD Pt 3 requires advance warning signs 50–80m before the work zone on the eastern approach.</div>
              <span className="ss-issue__tag">MUTCD PT 3 · §3.4</span>
            </div>
            <div className="ss-issue__sev high">High</div>
          </div>
          <div className="ss-issue">
            <div className="ss-issue__bar med" />
            <div className="ss-issue__b">
              <div className="ss-issue__t">Cone spacing inconsistent</div>
              <div className="ss-issue__d">Taper cones placed roughly 8m apart — recommended max 6m at 40km/h zones.</div>
              <span className="ss-issue__tag">MUTCD PT 3 · §4.6</span>
            </div>
            <div className="ss-issue__sev med">Med</div>
          </div>
        </div>

        <div className="ss-sec"><span className="tk" /><span className="lbl">Checklist</span></div>
        <div className="ss-check-card">
          <div className="ss-check"><div className="ss-check__box done" /><div className="ss-check__lbl struck">High-vis PPE worn</div></div>
          <div className="ss-check"><div className="ss-check__box done" /><div className="ss-check__lbl struck">Barriers in place</div></div>
          <div className="ss-check"><div className="ss-check__box fail">×</div><div className="ss-check__lbl">Advance warning signs</div></div>
          <div className="ss-check"><div className="ss-check__box fail">×</div><div className="ss-check__lbl">Taper cone spacing</div></div>
          <div className="ss-check"><div className="ss-check__box done" /><div className="ss-check__lbl struck">Permit visible on site</div></div>
        </div>

        <div className="rowx gap8 mt18">
          <div className="ss-btn ss-btn--ghost ss-btn--block">
            <svg viewBox="0 0 14 14" fill="none"><path d="M3 7a4 4 0 0 1 8 0M11 7a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M11 4v3h-3M3 10V7h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Re-analyse
          </div>
          <div className="ss-btn ss-btn--amber ss-btn--block">
            <svg viewBox="0 0 14 14" fill="none"><path d="M3 9v2h8V9M7 2v7m0 0L4 6m3 3 3-3" stroke="#1B1A12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Export PDF
          </div>
        </div>
      </div></div>
    </div>
  );
}

Object.assign(window, { AHome, AScans, AScanDetail });
