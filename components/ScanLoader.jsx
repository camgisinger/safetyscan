/**
 * SafetyScan — Scan Beam Loader (Trail variant)
 *
 * Drop-in React component. Drive it with the `state` prop:
 *   <ScanLoader state="idle" | "scanning" | "complete" />
 *
 * Sizes via the `size` prop (px). Optional `showBrackets` to hide
 * the viewfinder corners (useful for compact button spinners).
 *
 * Palette: --ss-bg #16181C · --ss-base #EFEAE0 · --ss-accent #F39410
 */

import React from "react";

const SCAN_LOADER_CSS = `
.scan-loader{display:inline-block;line-height:0;color:var(--ss-accent,#F39410)}
.scan-loader svg{width:100%;height:100%;display:block;overflow:visible}
.scan-loader.on-amber{--ss-base:#16181C;--ss-accent:#16181C}
.scan-loader .ss-shield{fill:none;stroke:var(--ss-base,#EFEAE0);stroke-width:8;stroke-linejoin:miter}
.scan-loader.complete .ss-shield{stroke:var(--ss-accent,#F39410)}
.scan-loader .ss-brackets{fill:var(--ss-base,#EFEAE0);opacity:1}
.scan-loader.scanning .ss-brackets{opacity:.7}
.scan-loader .ss-beam-bar{fill:var(--ss-accent,#F39410)}
.scan-loader .ss-beam-bar.faint{opacity:.4}
.scan-loader.scanning .ss-beam-group{
  animation:ss-beam-sweep var(--ss-cycle,2.8s) cubic-bezier(.45,0,.55,1) infinite;
}
.scan-loader.complete .ss-beam-group,
.scan-loader.idle .ss-beam-group{display:none}
@keyframes ss-beam-sweep{
  0%   { transform:translateY(-70px); opacity:0; }
  12%  { opacity:1; }
  50%  { transform:translateY(90px);  opacity:1; }
  88%  { opacity:1; }
  100% { transform:translateY(-70px); opacity:0; }
}
.scan-loader .ss-tick{
  fill:none;stroke:var(--ss-accent,#F39410);stroke-width:16;
  stroke-linecap:square;stroke-linejoin:miter;
  stroke-dasharray:95;stroke-dashoffset:95;
}
.scan-loader.complete .ss-tick{
  animation:ss-tick-draw .55s cubic-bezier(.2,.7,.3,1.1) forwards;
}
@keyframes ss-tick-draw{ to { stroke-dashoffset:0; } }
`;

let cssInjected = false;
function useScanLoaderCSS() {
  React.useEffect(() => {
    if (cssInjected) return;
    const style = document.createElement("style");
    style.setAttribute("data-scan-loader", "");
    style.textContent = SCAN_LOADER_CSS;
    document.head.appendChild(style);
    cssInjected = true;
  }, []);
}

export function ScanLoader({
  state = "scanning",          // "idle" | "scanning" | "complete"
  size = 80,
  showBrackets = true,
  onAmber = false,             // true when placed on an amber/orange surface
  cycle,                       // e.g. "2.8s" — override sweep duration
  className = "",
  style: styleProp,
}) {
  useScanLoaderCSS();
  const uid = React.useId();
  const clipId = `ss-clip-${uid.replace(/:/g, "")}`;
  const gradId = `ss-trail-${uid.replace(/:/g, "")}`;

  const style = {
    width: size,
    height: size,
    ...(cycle ? { "--ss-cycle": cycle } : {}),
    ...styleProp,
  };

  const cls = `scan-loader ${state}${onAmber ? " on-amber" : ""} ${className}`.trim();
  return (
    <div className={cls} style={style}>
      <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id={clipId}>
            <path d="M120 32 L190 56 V128 C190 170 162 196 120 214 C78 196 50 170 50 128 V56 Z" />
          </clipPath>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="currentColor" stopOpacity="0" />
            <stop offset="55%" stopColor="currentColor" stopOpacity=".18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity=".9" />
          </linearGradient>
        </defs>

        {showBrackets && (
          <g className="ss-brackets">
            <path d="M14 14 H58 V25 H25 V58 H14 Z" />
            <path d="M226 14 H182 V25 H215 V58 H226 Z" />
            <path d="M14 226 H58 V215 H25 V182 H14 Z" />
            <path d="M226 226 H182 V215 H215 V182 H226 Z" />
          </g>
        )}

        <path
          className="ss-shield"
          d="M120 32 L190 56 V128 C190 170 162 196 120 214 C78 196 50 170 50 128 V56 Z"
        />

        <g clipPath={`url(#${clipId})`}>
          <g className="ss-beam-group">
            <rect x="50" y="60"  width="140" height="64" fill={`url(#${gradId})`} />
            <rect className="ss-beam-bar"       x="50" y="118" width="140" height="6" />
            <rect className="ss-beam-bar faint" x="50" y="126" width="140" height="2" />
          </g>
        </g>

        <polyline className="ss-tick" points="88,120 110,142 154,96" />
      </svg>
    </div>
  );
}

/**
 * Convenience hook — drives the scan lifecycle.
 *
 *   const { state, start } = useScan({ duration: 10000 });
 *   <button onClick={start} disabled={state !== 'idle'}>
 *     <ScanLoader state={state} size={20} showBrackets={false} />
 *     {state === 'idle' ? 'Run scan' : state === 'scanning' ? 'Scanning…' : 'Done'}
 *   </button>
 */
export function useScan({ duration = 10000, holdComplete = 1800 } = {}) {
  const [state, setState] = React.useState("idle");
  const t1 = React.useRef(null);
  const t2 = React.useRef(null);

  const start = React.useCallback(() => {
    setState("scanning");
    clearTimeout(t1.current);
    clearTimeout(t2.current);
    t1.current = setTimeout(() => setState("complete"), duration);
    t2.current = setTimeout(() => setState("idle"), duration + holdComplete);
  }, [duration, holdComplete]);

  React.useEffect(
    () => () => {
      clearTimeout(t1.current);
      clearTimeout(t2.current);
    },
    []
  );

  return { state, start, setState };
}

export default ScanLoader;
