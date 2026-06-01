/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, AScreen,
   AHome, AScans, AScanDetail, ACapture, AProcessing, AResults,
   ASites, ASiteDetail, AProfile, ALogin, AShared, AGuide */

const PW = 375 * 2 + 56;

// Per-screen artboard heights (phones grow to content; card must fit).
const H = {
  home: 952, scans: 1012, sites: 874, profile: 1044,
  scanDetail: 1434, siteDetail: 882,
  capture: 874, processing: 888, results: 892, login: 880, guide: 892, shared: 1104,
};

function Pair({ Comp }) {
  return (
    <div style={{ display: 'flex', gap: 56, alignItems: 'flex-start', padding: '0 4px' }}>
      <div>
        <div className="row-label" style={{ marginBottom: 12, paddingLeft: 6 }}>LIGHT · PAPER</div>
        <AScreen mode="light"><Comp mode="light" /></AScreen>
      </div>
      <div>
        <div className="row-label" style={{ marginBottom: 12, paddingLeft: 6 }}>DARK · INK</div>
        <AScreen mode="dark"><Comp mode="dark" /></AScreen>
      </div>
    </div>
  );
}

function App() {
  return (
    <DesignCanvas docTitle="SafetyScan — Full App">
      <DCSection id="core" title="Core tabs" subtitle="Bottom-nav surfaces · Concrete · Schibsted Grotesk · Worklog Ticket.">
        <DCArtboard id="home" label="Home / Dashboard" width={PW} height={H.home}><Pair Comp={AHome} /></DCArtboard>
        <DCArtboard id="scans" label="Scans list" width={PW} height={H.scans}><Pair Comp={AScans} /></DCArtboard>
        <DCArtboard id="sites" label="Sites list" width={PW} height={H.sites}><Pair Comp={ASites} /></DCArtboard>
        <DCArtboard id="profile" label="Profile" width={PW} height={H.profile}><Pair Comp={AProfile} /></DCArtboard>
      </DCSection>

      <DCSection id="detail" title="Detail views" subtitle="Drilled-in records — full report + site analytics.">
        <DCArtboard id="scan-detail" label="Scan detail" width={PW} height={H.scanDetail}><Pair Comp={AScanDetail} /></DCArtboard>
        <DCArtboard id="site-detail" label="Site detail" width={PW} height={H.siteDetail}><Pair Comp={ASiteDetail} /></DCArtboard>
      </DCSection>

      <DCSection id="flow" title="New-scan flow" subtitle="Capture → analyse (radar loader) → results reveal.">
        <DCArtboard id="capture" label="01 · Capture" width={PW} height={H.capture}><Pair Comp={ACapture} /></DCArtboard>
        <DCArtboard id="processing" label="02 · Analysing" width={PW} height={H.processing}><Pair Comp={AProcessing} /></DCArtboard>
        <DCArtboard id="results" label="03 · Results" width={PW} height={H.results}><Pair Comp={AResults} /></DCArtboard>
      </DCSection>

      <DCSection id="entry" title="Entry & shared" subtitle="Out-of-app surfaces — auth, public link, onboarding.">
        <DCArtboard id="login" label="Login / Sign up" width={PW} height={H.login}><Pair Comp={ALogin} /></DCArtboard>
        <DCArtboard id="shared" label="Shared scan · public" width={PW} height={H.shared}><Pair Comp={AShared} /></DCArtboard>
        <DCArtboard id="guide" label="Guide · onboarding" width={PW} height={H.guide}><Pair Comp={AGuide} /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
