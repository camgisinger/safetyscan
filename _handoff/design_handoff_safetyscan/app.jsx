/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   HomeScreen, ScansListScreen, ScanDetailScreen, ScanCaptureScreen, ScanProcessingScreen, ScanResultsScreen,
   SitesListScreen, SiteDetailScreen, ProfileScreen, AuthScreen, SharedScanScreen, GuideScreen, TokenPanel */

// Each artboard wraps a Light + Dark phone pair side-by-side.
// We give artboards a fixed width that fits two 375px phones + 40px gap + a little padding.

const PAIR_W = 375 * 2 + 56;  // 806
const PAIR_H = 812 + 60;      // 872 (room for the LIGHT / DARK row label above)

function ScreenPair({ Comp }) {
  return (
    <div style={{ display: 'flex', gap: 56, alignItems: 'flex-start', padding: '0 4px' }}>
      <div>
        <div className="row-label" style={{ marginBottom: 14, paddingLeft: 6 }}>LIGHT · PAPER</div>
        <div className="phone">
          <div className="phone__screen theme-paper">
            <div className="phone__island" />
            <Comp theme="paper" />
          </div>
        </div>
      </div>
      <div>
        <div className="row-label" style={{ marginBottom: 14, paddingLeft: 6 }}>DARK · INK</div>
        <div className="phone">
          <div className="phone__screen theme-ink">
            <div className="phone__island" />
            <Comp theme="ink" />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <DesignCanvas docTitle="SafetyScan — Mobile">
      <DCSection id="dashboard" title="Dashboard & lists" subtitle="Entry surfaces with the bottom nav anchored.">
        <DCArtboard id="home"      label="Home · dashboard"  width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={HomeScreen} />
        </DCArtboard>
        <DCArtboard id="scans"     label="Scans · list"      width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={ScansListScreen} />
        </DCArtboard>
        <DCArtboard id="sites"     label="Sites · list"      width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={SitesListScreen} />
        </DCArtboard>
        <DCArtboard id="profile"   label="Profile · account" width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={ProfileScreen} />
        </DCArtboard>
      </DCSection>

      <DCSection id="detail" title="Detail views" subtitle="Drilled-in records with full report layout.">
        <DCArtboard id="scan-detail" label="Scan detail"  width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={ScanDetailScreen} />
        </DCArtboard>
        <DCArtboard id="site-detail" label="Site detail"  width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={SiteDetailScreen} />
        </DCArtboard>
      </DCSection>

      <DCSection id="scan-flow" title="New-scan flow" subtitle="Capture → analyse (shield loader) → results reveal.">
        <DCArtboard id="capture"    label="01 · Capture"     width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={ScanCaptureScreen} />
        </DCArtboard>
        <DCArtboard id="processing" label="02 · Analysing"   width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={ScanProcessingScreen} />
        </DCArtboard>
        <DCArtboard id="results"    label="03 · Results"     width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={ScanResultsScreen} />
        </DCArtboard>
      </DCSection>

      <DCSection id="entry-and-share" title="Entry & shared" subtitle="Out-of-app surfaces — auth, public link, onboarding.">
        <DCArtboard id="auth"       label="Login / sign up"  width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={AuthScreen} />
        </DCArtboard>
        <DCArtboard id="shared"     label="Shared scan · public" width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={SharedScanScreen} />
        </DCArtboard>
        <DCArtboard id="guide"      label="Guide · onboarding"   width={PAIR_W} height={PAIR_H}>
          <ScreenPair Comp={GuideScreen} />
        </DCArtboard>
      </DCSection>

      <DCSection id="tokens" title="Design tokens" subtitle="Hand-off spec — colours, type, radius, spacing, shadow.">
        <DCArtboard id="token-panel" label="Tokens" width={1260} height={620}>
          <TokenPanel />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
