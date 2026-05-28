/* global React */

function Swatch({ name, hex, isLight }) {
  return (
    <div className="swatch-row">
      <span className="swatch" style={{ background: hex }} />
      <span className="swatch-name">{name}</span>
      <span className="swatch-hex">{hex.toUpperCase()}</span>
    </div>
  );
}

function TokenPanel() {
  return (
    <div className="token-panel">
      <h2>Design tokens</h2>
      <div className="sub">Ready for hand-off — paste into your CSS vars or design system.</div>

      <div className="token-grid">

        <div className="token-group">
          <h3>Brand</h3>
          <Swatch name="Amber"        hex="#F39410" />
          <Swatch name="Amber soft"   hex="#FFB552" />
          <Swatch name="Amber deep"   hex="#C7770B" />
        </div>

        <div className="token-group">
          <h3>Paper · light</h3>
          <Swatch name="Background"   hex="#F1E7D3" />
          <Swatch name="Surface"      hex="#FBF4E4" />
          <Swatch name="Surface alt"  hex="#F7EFDC" />
          <Swatch name="Text"         hex="#1B1D22" />
          <Swatch name="Text muted"   hex="#7A7263" />
          <Swatch name="Border"       hex="#1C19140F" />
        </div>

        <div className="token-group">
          <h3>Ink · dark</h3>
          <Swatch name="Background"   hex="#16181C" />
          <Swatch name="Surface"      hex="#1E2025" />
          <Swatch name="Surface alt"  hex="#25272C" />
          <Swatch name="Text"         hex="#ECE7DD" />
          <Swatch name="Text muted"   hex="#847B6D" />
          <Swatch name="Border"       hex="#FFFAF012" />
        </div>

        <div className="token-group">
          <h3>Status</h3>
          <Swatch name="Issues (red)" hex="#E15A4E" />
          <Swatch name="Clear (green)" hex="#4FB07A" />
          <Swatch name="Pending (amber)" hex="#F39410" />
        </div>

        <div className="token-group">
          <h3>Typography</h3>
          <div className="type-sample">
            <div className="type-meta">Geist · Display 26 / 600 / -2%</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Walk the site.</div>
          </div>
          <div className="type-sample">
            <div className="type-meta">Geist · Title 18 / 700</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>SafetyScan</div>
          </div>
          <div className="type-sample">
            <div className="type-meta">Geist · Body 14 / 500</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Traffic Management</div>
          </div>
          <div className="type-sample">
            <div className="type-meta">Geist · Stat 32 / 600 / -2%</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>12</div>
          </div>
          <div className="type-sample">
            <div className="type-meta">Geist Mono · Label 10 / 500 / +22%</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase' }}>This month</div>
          </div>
          <div className="type-sample">
            <div className="type-meta">Geist Mono · Meta 10.5 / 400 / +6%</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '0.06em' }}>27 MAY · 2:14PM</div>
          </div>
        </div>

        <div className="token-group">
          <h3>Radius</h3>
          <div className="token-row"><span className="key">Card</span><span className="val">16px</span></div>
          <div className="token-row"><span className="key">Card large</span><span className="val">20px</span></div>
          <div className="token-row"><span className="key">Input</span><span className="val">12px</span></div>
          <div className="token-row"><span className="key">Thumb / image</span><span className="val">10px</span></div>
          <div className="token-row"><span className="key">Pill / button</span><span className="val">999px</span></div>
          <div className="token-row"><span className="key">Phone frame</span><span className="val">50px</span></div>
        </div>

        <div className="token-group">
          <h3>Spacing scale</h3>
          <div className="token-row"><span className="key">s-1</span><span className="val">4px</span></div>
          <div className="token-row"><span className="key">s-2</span><span className="val">8px</span></div>
          <div className="token-row"><span className="key">s-3</span><span className="val">12px</span></div>
          <div className="token-row"><span className="key">s-4</span><span className="val">16px</span></div>
          <div className="token-row"><span className="key">s-5</span><span className="val">20px</span></div>
          <div className="token-row"><span className="key">s-6</span><span className="val">24px</span></div>
          <div className="token-row"><span className="key">s-7</span><span className="val">32px</span></div>
          <div className="token-row"><span className="key">s-8</span><span className="val">40px</span></div>
        </div>

        <div className="token-group">
          <h3>Shadow</h3>
          <div className="token-row"><span className="key">Card (paper)</span><span className="val">0 1px 0 rgba(28,25,20,.08), 0 6px 14px -10px rgba(28,25,20,.18)</span></div>
          <div className="token-row"><span className="key">Card (ink)</span><span className="val">inset 0 0 0 1px rgba(255,250,240,.07)</span></div>
          <div className="token-row"><span className="key">FAB</span><span className="val">0 12px 28px -8px rgba(243,148,16,.35)</span></div>
          <div className="token-row"><span className="key">Phone</span><span className="val">0 30px 60px -30px rgba(0,0,0,.6)</span></div>
        </div>

        <div className="token-group">
          <h3>Component sizes</h3>
          <div className="token-row"><span className="key">Bottom nav height</span><span className="val">76px</span></div>
          <div className="token-row"><span className="key">FAB</span><span className="val">56px circle</span></div>
          <div className="token-row"><span className="key">Button (primary)</span><span className="val">44px · pill</span></div>
          <div className="token-row"><span className="key">Input</span><span className="val">50px · 12px radius</span></div>
          <div className="token-row"><span className="key">Avatar</span><span className="val">56px circle</span></div>
          <div className="token-row"><span className="key">Thumb</span><span className="val">44 / 200px · 10px radius</span></div>
          <div className="token-row"><span className="key">Status badge</span><span className="val">26px pill</span></div>
        </div>

      </div>
    </div>
  );
}

window.TokenPanel = TokenPanel;
