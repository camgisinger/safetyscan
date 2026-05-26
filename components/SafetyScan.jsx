"use client"
import { useState, useRef, useCallback } from "react";

const NAVY = "#0F1923";
const AMBER = "#F5A623";
const OFFWHITE = "#F1EFE8";
const PASS_GREEN = "#3B6D11";
const FAIL_RED = "#A32D2D";
const WARN_AMBER = "#854F0B";
const MAX_PHOTOS = 5;

// ─── PHOTO LIBRARY SLOT ───────────────────────────────────────────────────────
// Replace this component when real photos are available.
// workType tells you which photo to load.
function CompliantPhotoSlot({ workType }) {
  return (
    <div style={{ background: "#F1EFE8", border: "1.5px dashed #C8C5BE", borderRadius: 10, height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14 }}>
      <div style={{ fontSize: 24 }}>📸</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Photo library coming soon</div>
      <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", maxWidth: 200, lineHeight: 1.4 }}>Compliant example photos for {workType || "this work type"} will appear here</div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are SafetyScan, a Queensland construction compliance assistant. Analyse site photos and check compliance against Queensland legislation and Australian Standards covering: traffic/signage (AS 1742, Qld MUTCD, Transport Operations Road Use Management Act 1995), scaffolding (WHS Act 2011 Qld, WHS Reg 2011 Qld, AS/NZS 4576), electrical (Electrical Safety Act 2002 Qld, AS/NZS 3000), plumbing (Plumbing and Drainage Act 2018 Qld, AS/NZS 3500), and general WHS (WHS Act 2011 Qld).

Respond ONLY with a valid JSON object. No markdown. No text outside JSON. Start with { end with }.

{"work_type":"string","status":"pass|fail|uncertain","confidence":"high|medium|low","legislation":[{"code":"string","description":"string"}],"findings":[{"type":"ok|warning|critical","text":"string"}],"summary":"string","checklist":[{"item":"string","category":"string"}],"compliant_example":{"description":"string","measurements":[{"label":"string","value":"string","standard":"string"}],"visual_indicators":["string"]},"follow_up_questions":[],"photo_quality":"good|poor"}

Max 5 findings, 8 checklist items, 4 measurements, 4 visual_indicators.`;

const MAX_IMAGE_PX = 512;

async function convertToJpeg(file) {
  // Step 1: read file as data URL via FileReader (works in all environments)
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

  // Step 2: load into image element using data URL (no createObjectURL needed)
  const resized = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_PX / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const out = canvas.toDataURL("image/jpeg", 0.82);
      if (!out || out === "data:,") return reject(new Error("Canvas export failed."));
      resolve(out);
    };
    img.onerror = () => reject(new Error("Could not decode image. Try a JPG or PNG."));
    img.src = dataUrl;
  });

  return resized;
}


async function analysePhoto(base64, mediaType, context, extraInfo) {
  const userContent = [
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
    { type: "text", text: `Analyse this construction site photo for Queensland compliance.${context ? `\n\nContext: ${context}` : ""}${extraInfo ? `\n\nAdditional info: ${extraInfo}` : ""}` }
  ];

  let res, data;
  try {
    res = await fetch("/api/analyse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }]
      }),
    });
  } catch (fetchErr) {
    throw new Error(`Network error: ${fetchErr.message}`);
  }

  let rawText = "";
  try {
    rawText = await res.text();
  } catch (e) {
    throw new Error(`Could not read response body: ${e.message}`);
  }

  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw new Error(`Response not JSON (status ${res.status}): ${rawText.substring(0, 200)}`);
  }

  if (!res.ok || data.error) {
    const msg = data.error?.message || data.message || JSON.stringify(data).substring(0, 200);
    throw new Error(`API ${res.status}: ${msg}`);
  }

  const raw = (data.content || [])
    .filter(b => b.type === "text")
    .map(b => b.text || "")
    .join("")
    .trim();

  if (!raw) throw new Error(`Empty response. Stop: ${data.stop_reason}. Full: ${JSON.stringify(data).substring(0, 200)}`);

  const stripped = raw.replace(/^```json\s*/m, "").replace(/^```\s*/m, "").replace(/```\s*$/m, "").trim();

  try { return JSON.parse(stripped); } catch (_) {}

  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch (_) {} }

  const f = stripped.indexOf("{"), l = stripped.lastIndexOf("}");
  if (f !== -1 && l !== -1) { try { return JSON.parse(stripped.slice(f, l + 1)); } catch (_) {} }

  throw new Error(`Parse failed: ${stripped.substring(0, 200)}`);
}


function ScanIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 46 46" fill="none">
      <rect x="5" y="5" width="36" height="36" rx="7" stroke={AMBER} strokeWidth="2.5" fill="none"/>
      <line x1="5" y1="23" x2="41" y2="23" stroke={AMBER} strokeWidth="3" strokeLinecap="round"/>
      <line x1="13" y1="15" x2="33" y2="15" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="13" y1="31" x2="25" y2="31" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function StatusBadge({ status, confidence }) {
  const cfg = {
    pass: { bg: "#EAF3DE", border: "#97C459", color: PASS_GREEN, label: "Likely compliant", icon: "✓" },
    fail: { bg: "#FCEBEB", border: "#F09595", color: FAIL_RED, label: "Issues found", icon: "✕" },
    uncertain: { bg: "#FAEEDA", border: "#EF9F27", color: WARN_AMBER, label: "More information needed", icon: "?" },
  };
  const c = cfg[status] || cfg.uncertain;
  const conf = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" }[confidence] || "";
  return (
    <div style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{c.icon}</div>
      <div>
        <div style={{ fontWeight: 700, color: c.color, fontSize: 15 }}>{c.label}</div>
        <div style={{ fontSize: 11, color: c.color, opacity: 0.75, marginTop: 1 }}>{conf}</div>
      </div>
    </div>
  );
}

function FindingItem({ type, text }) {
  const cfg = {
    ok: { bg: "#EAF3DE", border: "#C0DD97", color: PASS_GREEN, icon: "✓" },
    warning: { bg: "#FAEEDA", border: "#FAC775", color: WARN_AMBER, icon: "⚠" },
    critical: { bg: "#FCEBEB", border: "#F7C1C1", color: FAIL_RED, icon: "✕" },
  };
  const c = cfg[type] || cfg.warning;
  return (
    <div style={{ display: "flex", gap: 8, padding: "9px 11px", borderRadius: 8, background: c.bg, border: `0.5px solid ${c.border}`, marginBottom: 5 }}>
      <div style={{ color: c.color, fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>{c.icon}</div>
      <div style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function LegTag({ code, description }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "inline-block", marginRight: 5, marginBottom: 5 }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: "pointer", fontSize: 11, padding: "3px 9px", borderRadius: 20, background: NAVY, color: AMBER, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
        {code} <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ marginTop: 4, padding: "7px 10px", background: "#fff", border: "0.5px solid #D3D1C7", borderRadius: 7, fontSize: 12, color: "#444", lineHeight: 1.5, maxWidth: 240 }}>{description}</div>}
    </div>
  );
}

function ChecklistTab({ checklist }) {
  const [checked, setChecked] = useState({});
  const toggle = i => setChecked(p => ({ ...p, [i]: !p[i] }));
  const categories = [...new Set(checklist.map(c => c.category))];
  const done = Object.values(checked).filter(Boolean).length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;
  return (
    <div>
      <div style={{ marginBottom: 14, padding: "11px 13px", background: "#F1EFE8", borderRadius: 9, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 5 }}>{done} of {checklist.length} items checked</div>
          <div style={{ height: 5, background: "#D3D1C7", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? PASS_GREEN : AMBER, borderRadius: 3, transition: "width 0.3s" }} />
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: pct === 100 ? PASS_GREEN : AMBER }}>{pct}%</div>
      </div>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "#888", textTransform: "uppercase", marginBottom: 7 }}>{cat}</div>
          {checklist.filter(c => c.category === cat).map(item => {
            const idx = checklist.indexOf(item);
            const on = checked[idx];
            return (
              <div key={idx} onClick={() => toggle(idx)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 7, background: on ? "#EAF3DE" : "#fff", border: `0.5px solid ${on ? "#97C459" : "#D3D1C7"}`, marginBottom: 5, cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${on ? PASS_GREEN : "#C8C5BE"}`, background: on ? PASS_GREEN : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {on && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ fontSize: 13, color: on ? PASS_GREEN : "#1a1a1a", textDecoration: on ? "line-through" : "none", lineHeight: 1.4 }}>{item.item}</div>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ padding: "9px 12px", background: "#F1EFE8", borderRadius: 7, fontSize: 11, color: "#888", lineHeight: 1.5 }}>AI-generated checklist based on Queensland standards. Resets with each new scan.</div>
    </div>
  );
}

function ExampleTab({ example, workType }) {
  return (
    <div>
      <CompliantPhotoSlot workType={workType} />
      <div style={{ marginBottom: 14, padding: "12px 14px", background: "#fff", border: "0.5px solid #D3D1C7", borderRadius: 9 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "#888", textTransform: "uppercase", marginBottom: 7 }}>What compliant looks like</div>
        <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{example.description}</div>
      </div>
      {example.measurements?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "#888", textTransform: "uppercase", marginBottom: 7 }}>Key measurements</div>
          {example.measurements.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 11px", background: i % 2 === 0 ? "#F1EFE8" : "#fff", borderRadius: 7, marginBottom: 3, gap: 8 }}>
              <div><div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{m.label}</div><div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>{m.standard}</div></div>
              <div style={{ fontSize: 13, fontWeight: 700, color: AMBER, flexShrink: 0 }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}
      {example.visual_indicators?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "#888", textTransform: "uppercase", marginBottom: 7 }}>Visual indicators to check</div>
          {example.visual_indicators.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "8px 11px", background: "#fff", border: "0.5px solid #D3D1C7", borderRadius: 7, marginBottom: 5 }}>
              <div style={{ color: AMBER, fontWeight: 700, flexShrink: 0 }}>→</div>
              <div style={{ fontSize: 13, color: "#333", lineHeight: 1.4 }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: "9px 12px", background: "#FAEEDA", border: "0.5px solid #FAC775", borderRadius: 7, fontSize: 11, color: "#633806", lineHeight: 1.5 }}>Real compliant site photos will be added here — giving you a direct visual comparison on the job.</div>
    </div>
  );
}

function FollowUp({ questions, onSubmit }) {
  const [answers, setAnswers] = useState("");
  return (
    <div style={{ marginTop: 16, padding: 14, background: "#FAEEDA", border: "1.5px solid #FAC775", borderRadius: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: WARN_AMBER, marginBottom: 9 }}>? Additional information needed</div>
      {questions.map((q, i) => <div key={i} style={{ marginBottom: 6, padding: "9px 11px", background: "rgba(255,255,255,0.6)", borderRadius: 7, fontSize: 13, color: "#412402", lineHeight: 1.5 }}>{q}</div>)}
      <textarea value={answers} onChange={e => setAnswers(e.target.value)} placeholder="Type your answers here..." rows={2}
        style={{ width: "100%", marginTop: 8, padding: "9px 11px", borderRadius: 7, border: "0.5px solid #EF9F27", background: "#fff", fontSize: 13, fontFamily: "inherit", resize: "none", color: "#1a1a1a", boxSizing: "border-box" }} />
      <button onClick={() => onSubmit(answers)} disabled={!answers.trim()}
        style={{ marginTop: 8, padding: "9px 18px", background: AMBER, border: "none", borderRadius: 7, color: NAVY, fontSize: 13, fontWeight: 700, cursor: answers.trim() ? "pointer" : "not-allowed", opacity: answers.trim() ? 1 : 0.5, fontFamily: "inherit" }}>
        Re-analyse with this information
      </button>
    </div>
  );
}

function PhotoResultCard({ photo, index, total, onReanalyse }) {
  const [tab, setTab] = useState("findings");
  const r = photo.result;
  const tabs = [{ id: "findings", label: "Findings" }, { id: "checklist", label: `Checklist (${r.checklist?.length || 0})` }, { id: "example", label: "Example" }];
  const statusColor = { pass: PASS_GREEN, fail: FAIL_RED, uncertain: WARN_AMBER }[r.status] || WARN_AMBER;
  const statusLabel = { pass: "Compliant", fail: "Issues found", uncertain: "Unclear" }[r.status] || "Unclear";

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #E0DDD6", overflow: "hidden", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: NAVY, borderBottom: `2px solid ${statusColor}` }}>
        <img src={photo.dataUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.15)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Photo {index + 1}{total > 1 ? ` of ${total}` : ""}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{r.work_type}</div>
        </div>
        <div style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: `${statusColor}25`, color: statusColor, fontWeight: 700, border: `0.5px solid ${statusColor}50` }}>{statusLabel}</div>
      </div>

      <div style={{ padding: "14px 16px" }}>
        <StatusBadge status={r.status} confidence={r.confidence} />

        {r.legislation?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "#888", textTransform: "uppercase", marginBottom: 7 }}>Applicable Queensland legislation</div>
            <div>{r.legislation.map((l, i) => <LegTag key={i} code={l.code} description={l.description} />)}</div>
            <div style={{ fontSize: 10, color: "#ccc", marginTop: 3 }}>Tap each to expand</div>
          </div>
        )}

        <div style={{ display: "flex", borderBottom: "1.5px solid #E0DDD6", marginBottom: 14 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "9px 2px", fontSize: 11, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? NAVY : "#888", background: "transparent", border: "none", borderBottom: tab === t.id ? `2.5px solid ${AMBER}` : "2.5px solid transparent", cursor: "pointer", fontFamily: "inherit", marginBottom: -1.5 }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "findings" && (
          <div>
            {r.findings?.map((f, i) => <FindingItem key={i} type={f.type} text={f.text} />)}
            {r.summary && <div style={{ marginTop: 10, padding: "12px 14px", background: "#F1EFE8", borderRadius: 9 }}><div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Summary</div><div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{r.summary}</div></div>}
            {r.follow_up_questions?.length > 0 && <FollowUp questions={r.follow_up_questions} onSubmit={(a) => onReanalyse(index, a)} />}
          </div>
        )}
        {tab === "checklist" && (r.checklist?.length > 0 ? <ChecklistTab checklist={r.checklist} /> : <div style={{ padding: 16, textAlign: "center", color: "#aaa", fontSize: 13 }}>No checklist generated.</div>)}
        {tab === "example" && (r.compliant_example ? <ExampleTab example={r.compliant_example} workType={r.work_type} /> : <div style={{ padding: 16, textAlign: "center", color: "#aaa", fontSize: 13 }}>No example available.</div>)}
      </div>
    </div>
  );
}

export default function SafetyScan() {
  const [photos, setPhotos] = useState([]);
  const [context, setContext] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [results, setResults] = useState([]);
  const [globalError, setGlobalError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const addFiles = useCallback(async (files) => {
    const arr = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    if (!arr.length) return;
    const converted = await Promise.all(arr.map(async file => {
      try {
        const dataUrl = await convertToJpeg(file);
        const mediaType = "image/jpeg"; // always jpeg — canvas conversion normalises all formats
        return { dataUrl, base64: dataUrl.split(",")[1], mediaType, error: null };
      } catch (e) {
        return { dataUrl: null, base64: null, mediaType: null, error: e.message };
      }
    }));
    const valid = converted.filter(p => !p.error);
    const errors = converted.filter(p => p.error);
    setPhotos(prev => [...prev, ...valid].slice(0, MAX_PHOTOS));
    if (errors.length) setGlobalError(errors[0].error);
  }, [photos.length]);

  const removePhoto = (i) => setPhotos(prev => prev.filter((_, idx) => idx !== i));

  const runAll = async () => {
    if (!photos.length) return;
    setAnalysing(true);
    setGlobalError(null);
    setResults(photos.map(() => ({ status: "loading" })));
    await Promise.all(photos.map(async (photo, i) => {
      try {
        const result = await analysePhoto(photo.base64, photo.mediaType || "image/jpeg", context);
        setResults(prev => { const n = [...prev]; n[i] = { status: "done", result }; return n; });
      } catch (e) {
        setResults(prev => { const n = [...prev]; n[i] = { status: "error", error: e.message }; return n; });
      }
    }));
    setAnalysing(false);
  };

  const reanalyse = async (photoIndex, extraInfo) => {
    setResults(prev => { const n = [...prev]; n[photoIndex] = { status: "loading" }; return n; });
    try {
      const result = await analysePhoto(photos[photoIndex].base64, photos[photoIndex].mediaType || "image/jpeg", context, extraInfo);
      setResults(prev => { const n = [...prev]; n[photoIndex] = { status: "done", result }; return n; });
    } catch (e) {
      setResults(prev => { const n = [...prev]; n[photoIndex] = { status: "error", error: e.message }; return n; });
    }
  };

  const reset = () => { setPhotos([]); setResults([]); setContext(""); setGlobalError(null); };

  const hasResults = results.some(r => r.status === "done" || r.status === "error");
  const allDone = results.length > 0 && results.every(r => r.status !== "loading");

  return (
    <div style={{ minHeight: "100vh", background: OFFWHITE, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        button:active { transform: scale(0.98); }
      `}</style>

      <header style={{ background: NAVY, padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ScanIcon />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              <span style={{ color: "#fff" }}>Safety</span><span style={{ color: AMBER }}>Scan</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>CONSTRUCTION COMPLIANCE</div>
          </div>
        </div>
        <div style={{ fontSize: 11, padding: "4px 10px", background: "rgba(245,166,35,0.15)", color: AMBER, borderRadius: 10, border: "0.5px solid rgba(245,166,35,0.3)", fontWeight: 600 }}>Queensland</div>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 48px" }}>

        {/* Upload panel — always visible until analysing */}
        {!analysing && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "0.5px solid #E0DDD6", marginBottom: 16 }}>
            {!hasResults && (
              <>
                <h1 style={{ fontSize: 19, fontWeight: 700, color: NAVY, marginBottom: 3 }}>Compliance check</h1>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5, marginBottom: 16 }}>Upload up to {MAX_PHOTOS} site photos. SafetyScan analyses each one separately — ideal for checking multiple work types or areas in one go.</p>
              </>
            )}

            {/* Photo strip */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: photos.length ? 12 : 0 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: "relative", width: 72, height: 72 }}>
                  <img src={p.dataUrl} alt={`Photo ${i + 1}`} style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", border: "1.5px solid #E0DDD6" }} />
                  <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: FAIL_RED, border: "2px solid #fff", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, padding: 0, lineHeight: 1 }}>✕</button>
                  <div style={{ position: "absolute", bottom: 3, left: 3, fontSize: 9, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.55)", borderRadius: 3, padding: "1px 4px" }}>{i + 1}</div>
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <div onClick={() => fileRef.current.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                  style={{ width: photos.length === 0 ? "100%" : 72, height: photos.length === 0 ? 120 : 72, borderRadius: photos.length === 0 ? 12 : 8, border: dragOver ? `2px dashed ${AMBER}` : "1.5px dashed #C8C5BE", background: dragOver ? "#FAEEDA" : "#FAFAF8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", gap: 4 }}>
                  {photos.length === 0 ? (
                    <>
                      <div style={{ fontSize: 32 }}>📷</div>
                      <div style={{ fontWeight: 700, color: NAVY, fontSize: 13 }}>Tap to add photos</div>
                      <div style={{ fontSize: 11, color: "#999" }}>Up to {MAX_PHOTOS} photos · JPG, PNG, HEIC</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 20, color: "#aaa" }}>+</div>
                      <div style={{ fontSize: 9, color: "#aaa", fontWeight: 600 }}>{MAX_PHOTOS - photos.length} left</div>
                    </>
                  )}
                </div>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />

            {globalError && <div style={{ marginBottom: 10, padding: "9px 12px", background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 12, color: FAIL_RED }}>{globalError}</div>}

            {photos.length > 0 && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 5 }}>
                    Context <span style={{ fontWeight: 400, color: "#999" }}>(optional — applies to all photos)</span>
                  </label>
                  <textarea rows={2} placeholder='e.g. "Scaffold and traffic management on Ipswich Motorway upgrade, Brisbane"'
                    value={context} onChange={e => setContext(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #C8C5BE", background: "#FAFAF8", fontSize: 13, fontFamily: "inherit", resize: "none", color: "#1a1a1a", lineHeight: 1.5 }} />
                </div>

                <button onClick={runAll}
                  style={{ width: "100%", padding: 13, background: NAVY, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Analyse {photos.length} photo{photos.length > 1 ? "s" : ""} for compliance →
                </button>
              </>
            )}

            {hasResults && allDone && (
              <button onClick={reset} style={{ marginTop: 10, width: "100%", padding: 11, background: "transparent", border: "1px solid #D3D1C7", borderRadius: 9, fontSize: 13, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
                ↩ Start a new scan
              </button>
            )}

            <div style={{ marginTop: 10, fontSize: 11, color: "#bbb", textAlign: "center" }}>AI-assisted · Queensland legislation · Not a substitute for professional advice</div>
          </div>
        )}

        {/* Loading state */}
        {analysing && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px 20px", border: "0.5px solid #E0DDD6", textAlign: "center", marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, border: `3px solid #E0DDD6`, borderTopColor: AMBER, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
            <div style={{ fontWeight: 700, color: NAVY, fontSize: 14, marginBottom: 3 }}>Analysing {photos.length} photo{photos.length > 1 ? "s" : ""}…</div>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>Each photo is checked independently</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 5, flexWrap: "wrap" }}>
              {["Traffic & signage", "Scaffolding", "Electrical", "Plumbing", "WHS"].map(t => (
                <div key={t} style={{ fontSize: 10, padding: "3px 7px", background: "#F1EFE8", borderRadius: 7, color: "#888" }}>{t}</div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {results.length > 1 && (
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
                {results.filter(r => r.status === "done").length} of {results.length} photos analysed
              </div>
            )}

            {results.map((r, i) => {
              if (r.status === "loading") return (
                <div key={i} style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #E0DDD6", padding: "20px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  {photos[i] && <img src={photos[i].dataUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 4 }}>Photo {i + 1} — Analysing…</div>
                    <div style={{ height: 4, background: "#F1EFE8", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "60%", background: AMBER, borderRadius: 2, animation: "pulse 1.5s ease infinite" }} />
                    </div>
                  </div>
                </div>
              );

              if (r.status === "error") return (
                <div key={i} style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #F09595", padding: "16px", marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: FAIL_RED, marginBottom: 4 }}>Photo {i + 1} — Analysis failed</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{r.error}</div>
                </div>
              );

              if (r.status === "done") return (
                <PhotoResultCard key={i} photo={photos[i]} index={i} total={photos.length} onReanalyse={reanalyse} />
              );

              return null;
            })}

            {allDone && (
              <div style={{ padding: "10px 14px", background: "#F1EFE8", borderRadius: 8, fontSize: 11, color: "#888", lineHeight: 1.5, borderLeft: `3px solid ${AMBER}` }}>
                <strong style={{ color: "#555" }}>Important:</strong> SafetyScan is AI-assisted only. Always verify findings with a qualified professional before sign-off.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}