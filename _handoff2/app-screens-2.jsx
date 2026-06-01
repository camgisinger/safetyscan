/* global React, AppHeader, AppNav, AppFab, AScreen, RadarLoader, SB, A_SITES, A_FEED */
// Capture, Processing, Results, Sites list, Site detail

function ACapture({ mode }) {
  return (
    <div className="scr">
      <SB />
      <div className="vf">
        <div className="vf__hazard" />
        <div className="vf__feed">
          <div className="vf__top">
            <div className="vf__x"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></div>
            <div className="vf__count">1 / 4</div>
          </div>
          <div className="vf__hint">Frame the work area · keep steady</div>
          <div className="vf__frame" />
          <div className="vf__corner tl" /><div className="vf__corner tr" /><div className="vf__corner bl" /><div className="vf__corner br" />
        </div>
        <div className="vf__bar">
          <div className="vf__chip"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="10" cy="10.5" r="3" stroke="currentColor" strokeWidth="1.4"/></svg></div>
          <div className="vf__shutter" />
          <div className="vf__chip"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 7h12M7 4v3M4 13l3-3 3 3 3-3 3 3v3H4v-3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        </div>
      </div>
    </div>
  );
}

function AProcessing({ mode }) {
  return (
    <div className="scr">
      <AppHeader title="Analysing" action="close" />
      <div className="scrollbody"><div className="scrollpad" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 30 }}>
          <RadarLoader mode={mode} />
          <div className="pg-title mt22" style={{ textAlign: 'center' }}>Reading your site</div>
          <div className="pg-sub" style={{ textAlign: 'center', maxWidth: 250 }}>Cross-checking against QLD MUTCD &amp; WHS regs</div>
        </div>
        <div className="col gap10 mt22">
          <div className="ss-step"><div className="ss-step__b done" /><div className="ss-step__t">Photos uploaded</div><div className="ss-step__s">4 / 4</div></div>
          <div className="ss-step"><div className="ss-step__b done" /><div className="ss-step__t">Detecting hazards</div><div className="ss-step__s">Done</div></div>
          <div className="ss-step"><div className="ss-spinner" /><div className="ss-step__t">Matching regulations</div><div className="ss-step__s" style={{ color: 'var(--amber)' }}>Now</div></div>
          <div className="ss-step" style={{ opacity: 0.5 }}><div className="ss-step__b" /><div className="ss-step__t">Compiling report</div></div>
        </div>
      </div></div>
    </div>
  );
}

function AResults({ mode }) {
  return (
    <div className="scr">
      <AppHeader back title="Result" action="share" />
      <div className="scrollbody"><div className="scrollpad" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={{ display: 'grid', placeItems: 'center', padding: '24px 0 16px' }}>
          <div style={{ width: 92, height: 92, borderRadius: 8, background: 'var(--issbg)', display: 'grid', placeItems: 'center', border: '1.5px solid var(--line)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16v.4" stroke="#D63A26" strokeWidth="2.4" strokeLinecap="round"/><path d="M12 3L2 20h20L12 3z" stroke="#D63A26" strokeWidth="1.8" strokeLinejoin="round"/></svg>
          </div>
        </div>
        <div className="pg-title" style={{ textAlign: 'center', fontSize: 26 }}>2 issues found</div>
        <div className="pg-sub" style={{ textAlign: 'center', maxWidth: 280, alignSelf: 'center' }}>Two compliance gaps detected in Traffic Management. Review and resolve before the next walk.</div>

        <div className="col gap10 mt22">
          <div className="ticket">
            <div className="ticket__bar issues" />
            <div className="ticket__b"><div className="ticket__t">Missing approach signage</div></div>
            <div className="ticket__r"><div className="ticket__c issues">High</div></div>
          </div>
          <div className="ticket">
            <div className="ticket__bar pending" />
            <div className="ticket__b"><div className="ticket__t">Cone spacing inconsistent</div></div>
            <div className="ticket__r"><div className="ticket__c pending">Med</div></div>
          </div>
        </div>

        <div className="rowx gap8" style={{ marginTop: 'auto', paddingTop: 22 }}>
          <div className="ss-btn ss-btn--ghost ss-btn--block">Save draft</div>
          <div className="ss-btn ss-btn--amber ss-btn--block">Open report</div>
        </div>
      </div></div>
    </div>
  );
}

function ASites({ mode }) {
  return (
    <div className="scr">
      <AppHeader title="Sites" action="menu" />
      <div className="scrollbody"><div className="scrollpad">
        <div className="rowx between" style={{ padding: '6px 2px 12px' }}>
          <span className="pg-sub" style={{ marginTop: 0 }}>3 active sites · 19 scans this month</span>
          <span className="link">Sort ↕</span>
        </div>
        <div className="col gap10">
          {A_SITES.map((s, i) => (
            <div key={i} className="ss-site">
              <div className="ss-site__head">
                <div>
                  <div className="ss-site__t">{s.name}</div>
                  <div className="ss-site__m">{s.meta}</div>
                </div>
                <div>
                  <div className="ss-site__score" style={{ color: s.scoreCls === 'red' ? '#D63A26' : s.scoreCls === 'green' ? 'var(--green)' : 'var(--amber)' }}>{s.score}%</div>
                  <div className="ss-site__sl">Compliance</div>
                </div>
              </div>
              <div className="ss-bar">
                <div className="ss-bar__f green" style={{ width: `${s.bd[0]}%` }} />
                <div className="ss-bar__f amber" style={{ width: `${s.bd[1]}%` }} />
                <div className="ss-bar__f red" style={{ width: `${s.bd[2]}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div></div>
      <AppFab />
      <AppNav active="sites" />
    </div>
  );
}

function ASiteDetail({ mode }) {
  const rows = [
    { t: 'Traffic Management', d: '28 MAY · 5:29PM', status: 'issues', label: '2 issues' },
    { t: 'PPE Spot Check', d: '24 MAY · 11:20AM', status: 'clear', label: 'Clear' },
    { t: 'Fire Egress Check', d: '24 MAY · 3:36PM', status: 'clear', label: 'Clear' },
    { t: 'Scaffold Inspection', d: '21 MAY · 8:48AM', status: 'issues', label: '1 issue' },
  ];
  const bars = [18,22,32,28,36,30,38,36,40,28,34,38,30,36,42,40,36,30,38,42,36,38,28,34,40,38,42,30,32,38];
  return (
    <div className="scr">
      <AppHeader back title="Site" action="menu" />
      <div className="scrollbody"><div className="scrollpad" style={{ paddingTop: 6 }}>
        <div className="pg-title">Newstead Plaza</div>
        <div className="pg-sub">12 Skyring Tce, Brisbane QLD · Tier 2 build · 38 weeks remaining</div>

        <div className="ss-score mt14">
          <div className="rowx between">
            <span className="eyebrow">Compliance</span>
            <span className="meta-line">Last 30 days</span>
          </div>
          <div className="rowx between" style={{ alignItems: 'flex-end', marginTop: 10 }}>
            <div>
              <div className="ss-score__big">78<small>%</small></div>
              <div className="s-lbl" style={{ marginTop: 8 }}>Site score</div>
            </div>
            <div className="ss-legend">
              <div className="r"><span style={{ fontSize: 12 }}>6 clear</span><span className="d" style={{ background: 'var(--green)' }} /></div>
              <div className="r"><span style={{ fontSize: 12 }}>1 pending</span><span className="d" style={{ background: 'var(--amber)' }} /></div>
              <div className="r"><span style={{ fontSize: 12 }}>1 issue</span><span className="d" style={{ background: '#D63A26' }} /></div>
            </div>
          </div>
          <div className="ss-hist">
            {bars.map((h, i) => (
              <span key={i} style={{ height: h, background: i === 22 ? '#D63A26' : i % 7 === 3 ? 'var(--amber)' : undefined }} />
            ))}
          </div>
        </div>

        <div className="ss-sec"><span className="tk" /><span className="lbl">Recent scans</span><span className="link act">View all →</span></div>
        <div className="col gap10">
          {rows.map((f, i) => (
            <div key={i} className="ticket">
              <div className={`ticket__bar ${f.status}`} />
              <div className="thumb" />
              <div className="ticket__b"><div className="ticket__t">{f.t}</div><div className="ticket__m">{f.d}</div></div>
              <div className="ticket__r"><div className={`ticket__c ${f.status}`}>{f.label}</div></div>
            </div>
          ))}
        </div>
      </div></div>
      <AppFab />
      <AppNav active="sites" />
    </div>
  );
}

Object.assign(window, { ACapture, AProcessing, AResults, ASites, ASiteDetail });
