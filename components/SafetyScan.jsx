"use client"
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

if (typeof window !== 'undefined') {
  window.onerror = function(msg, src, line, col, error) {
    console.error('Global error:', msg, error)
  }
  window.onunhandledrejection = function(event) {
    console.error('Unhandled promise rejection:', event.reason)
  }
}

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

const SYSTEM_PROMPT = `You are SafetyScan, a Queensland construction compliance assistant used by experienced site supervisors and compliance officers. You are pragmatic and realistic — you understand that construction sites operate under real-world conditions and that not everything can be verified from a single photo.

You check compliance against Queensland legislation and Australian Standards covering: traffic/signage (AS 1742, Qld MUTCD, Transport Operations Road Use Management Act 1995), scaffolding (WHS Act 2011 Qld, WHS Reg 2011 Qld, AS/NZS 4576), electrical (Electrical Safety Act 2002 Qld, AS/NZS 3000), plumbing (Plumbing and Drainage Act 2018 Qld, AS/NZS 3500), and general WHS (WHS Act 2011 Qld).

CRITICAL RULES FOR FINDINGS:
1. Only mark something as "critical" if you can CLEARLY SEE a violation in the photo. Not if you suspect it, not if you can't verify it.
2. Only mark something as "warning" if there is a visible concern that warrants attention but is not a clear breach.
3. Mark something as "ok" if it appears compliant or cannot be assessed from this angle.
4. If you CANNOT verify something from the photo (e.g. cannot see a tag, cannot measure a height precisely) — do NOT mark it as non-compliant. Instead add it as a follow-up question.
5. Do not apply overly strict interpretations. Apply the standard as a competent site supervisor would — with real-world tolerance and common sense.
6. A "fail" status should only be given if there is at least one clearly visible critical violation. If issues are minor or unverifiable, use "uncertain" or "pass" with warnings.
7. Never fail an entire installation based on things you cannot see in the photo.

LEGISLATION CLAUSE REFERENCES:
For each piece of legislation identified, cite the specific clauses that apply. For example:
- WHS Regulation 2011 (Qld) → s.225 (scaffolding), s.44 (duty to manage risks)
- AS/NZS 4576 → cl.4.2 (erection), cl.5.3 (inspection)
- Electrical Safety Act 2002 (Qld) → s.28 (electrical safety obligation)
Only cite clauses you are confident apply to what is visible in the photo. If unsure of the exact clause, omit it rather than guess.

Respond ONLY with a valid JSON object. No markdown. No text outside JSON. Start with { end with }.

{"work_type":"string","status":"pass|fail|uncertain","confidence":"high|medium|low","legislation":[{"code":"string","description":"string","clauses":[{"ref":"string","summary":"string"}]}],"findings":[{"type":"ok|warning|critical","text":"string"}],"summary":"string","follow_up_questions":[],"photo_quality":"good|poor"}

Max 5 findings.`;

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


async function analysePhoto(base64, mediaType, context, extraInfo, extraPhotos = []) {
  const userContent = [
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
    ...extraPhotos.map(p => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: p.base64 } })),
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
        max_tokens: 2000,
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

function LegTag({ code, description, clauses, isOpen, onToggle }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={onToggle} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 10px", borderRadius: 20, background: isOpen ? "#fff" : NAVY, color: isOpen ? NAVY : AMBER, fontWeight: 600, border: `1.5px solid ${isOpen ? NAVY : "transparent"}`, transition: "all 0.15s" }}>
        {code} <span style={{ fontSize: 10, opacity: 0.6 }}>{isOpen ? "▲" : "▼"}</span>
      </div>
      {isOpen && (
        <div style={{ marginTop: 6, padding: "12px 14px", background: "#fff", border: `1.5px solid ${NAVY}`, borderRadius: 10, fontSize: 13 }}>
          <div style={{ color: "#555", lineHeight: 1.5, marginBottom: clauses?.length ? 10 : 0 }}>{description}</div>
          {clauses?.length > 0 && (
            <div style={{ borderTop: "0.5px solid #E0DDD6", paddingTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Applicable clauses</div>
              {clauses.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 52, background: NAVY, color: AMBER, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, textAlign: "center", flexShrink: 0 }}>{c.ref}</div>
                  <div style={{ fontSize: 12, color: "#444", lineHeight: 1.5, paddingTop: 2 }}>{c.summary}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
  const [extraPhotos, setExtraPhotos] = useState([]);
  return (
    <div style={{ marginTop: 16, padding: 14, background: "#FAEEDA", border: "1.5px solid #FAC775", borderRadius: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: WARN_AMBER, marginBottom: 9 }}>? Additional information needed</div>
      {questions.map((q, i) => <div key={i} style={{ marginBottom: 6, padding: "9px 11px", background: "rgba(255,255,255,0.6)", borderRadius: 7, fontSize: 13, color: "#412402", lineHeight: 1.5 }}>{q}</div>)}
      <textarea value={answers} onChange={e => setAnswers(e.target.value)} placeholder="Type your answers here..." rows={2}
        style={{ width: "100%", marginTop: 8, padding: "9px 11px", borderRadius: 7, border: "0.5px solid #EF9F27", background: "#fff", fontSize: 13, fontFamily: "inherit", resize: "none", color: "#1a1a1a", boxSizing: "border-box" }} />
      <div style={{ marginTop: 8 }}>
        <label style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(255,255,255,0.6)", border: "1px solid #EF9F27", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#633806", fontWeight: 500 }}>
          📷 Attach photos
          <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={async (e) => {
            const files = Array.from(e.target.files).slice(0, 3);
            const converted = await Promise.all(files.map(f => convertToJpeg(f)));
            setExtraPhotos(converted.map(d => ({ dataUrl: d, base64: d.split(",")[1] })));
            e.target.value = "";
          }} />
        </label>
        {extraPhotos.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {extraPhotos.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={p.dataUrl} style={{ width: 52, height: 52, borderRadius: 6, objectFit: "cover", border: "0.5px solid #EF9F27" }} alt="" />
                <button onClick={() => setExtraPhotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#A32D2D", border: "1.5px solid #fff", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => onSubmit(answers, extraPhotos)} disabled={!answers.trim()}
        style={{ marginTop: 8, padding: "9px 18px", background: AMBER, border: "none", borderRadius: 7, color: NAVY, fontSize: 13, fontWeight: 700, cursor: answers.trim() ? "pointer" : "not-allowed", opacity: answers.trim() ? 1 : 0.5, fontFamily: "inherit" }}>
        Re-analyse with this information
      </button>
    </div>
  );
}

function PhotoResultCard({ photo, index, total, onReanalyse }) {
  const [tab, setTab] = useState("findings");
  const [openLeg, setOpenLeg] = useState(null);
  const r = photo.result;
  const tabs = [{ id: "findings", label: "Findings" }, { id: "example", label: "Example" }];
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
            <div>{r.legislation.map((l, i) => <LegTag key={i} code={l.code} description={l.description} clauses={l.clauses} isOpen={openLeg === i} onToggle={() => setOpenLeg(openLeg === i ? null : i)} />)}</div>
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
            {r.follow_up_questions?.length > 0 && <FollowUp questions={r.follow_up_questions} onSubmit={(a, extraPhotos) => onReanalyse(index, a, extraPhotos)} />}
          </div>
        )}
        {tab === "example" && (
          <div>
            <CompliantPhotoSlot workType={r.work_type} />
            <div style={{ padding: "10px 14px", background: "#FAEEDA", border: "0.5px solid #FAC775", borderRadius: 8, fontSize: 12, color: "#633806", lineHeight: 1.5 }}>
              Compliant example photos for this work type will be added here shortly — giving you a direct visual comparison on the job.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const LOADING_MESSAGES = [
  "Identifying work type...",
  "Checking Queensland legislation...",
  "Reviewing WHS compliance...",
  "Checking safety requirements...",
  "Reviewing findings...",
  "Almost done...",
];

function LoadingSpinner() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx(prev => prev >= LOADING_MESSAGES.length - 1 ? prev : prev + 1);
    }, 2200);
    const progTimer = setInterval(() => {
      setProgress(prev => prev >= 92 ? 92 : prev + Math.random() * 8);
    }, 800);
    return () => { clearInterval(msgTimer); clearInterval(progTimer); };
  }, []);

  return (
    <>
      <div style={{ width: 36, height: 36, border: "3px solid #E0DDD6", borderTopColor: AMBER, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
      <div style={{ fontWeight: 700, color: NAVY, fontSize: 15, marginBottom: 12, minHeight: 24, transition: "all 0.3s" }}>{LOADING_MESSAGES[msgIdx]}</div>
      <div style={{ height: 4, background: "#F1EFE8", borderRadius: 2, overflow: "hidden", maxWidth: 280, margin: "0 auto" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: AMBER, borderRadius: 2, transition: "width 0.8s ease" }} />
      </div>
    </>
  );
}

export default function SafetyScan() {
  const [photos, setPhotos] = useState([]);
  const [context, setContext] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [results, setResults] = useState([]);
  const [globalError, setGlobalError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sites, setSites] = useState([]);
  const [siteDropdownValue, setSiteDropdownValue] = useState("none");
  const [newSiteName, setNewSiteName] = useState("");
  const [scanIds, setScanIds] = useState([]);
  const [assignSiteId, setAssignSiteId] = useState("");
  const [assignDone, setAssignDone] = useState(false);
  const fileRef = useRef();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        supabase.from('sites').select('id, name').eq('archived', false).order('name', { ascending: true })
          .then(({ data }) => setSites(data || []));
      }
    });
    const urlSiteId = searchParams.get('site_id');
    if (urlSiteId) setSiteDropdownValue(urlSiteId);
  }, [searchParams]);

  const saveScan = async (result, siteId = null) => {
    if (!currentUser) return null;
    try {
      const { data } = await supabase.from('scans').insert({
        user_id: currentUser.id,
        site_id: siteId || null,
        work_type: result.work_type,
        status: result.status,
        confidence: result.confidence,
        legislation: result.legislation,
        findings: result.findings,
        summary: result.summary,
        checklist: result.checklist,
        follow_up_questions: result.follow_up_questions,
      }).select('id').single();
      return data?.id || null;
    } catch (err) {
      console.error('Failed to save scan:', err);
      return null;
    }
  };

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
    setScanIds([]);
    setAssignDone(false);

    // Resolve site ID — create new site if needed
    let resolvedSiteId = siteDropdownValue === "none" ? null : siteDropdownValue === "new" ? null : siteDropdownValue;
    if (siteDropdownValue === "new" && newSiteName.trim() && currentUser) {
      const { data } = await supabase.from('sites').insert({
        user_id: currentUser.id,
        name: newSiteName.trim(),
        archived: false,
      }).select('id, name').single();
      if (data) {
        resolvedSiteId = data.id;
        setSites(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setSiteDropdownValue(data.id);
      }
    }

    try {
      await Promise.all(photos.map(async (photo, i) => {
        try {
          const parsed = await analysePhoto(photo.base64, photo.mediaType || "image/jpeg", context);
          const safeResult = {
            work_type: parsed.work_type || "Unknown work type",
            status: parsed.status || "uncertain",
            confidence: parsed.confidence || "low",
            legislation: (parsed.legislation || []).map(l => ({ ...l, clauses: l.clauses || [] })),
            findings: parsed.findings || [],
            summary: parsed.summary || "",
            follow_up_questions: parsed.follow_up_questions || [],
            photo_quality: parsed.photo_quality || "good",
          };
          setResults(prev => { const n = [...prev]; n[i] = { status: "done", result: safeResult }; return n; });
          const scanId = await saveScan(safeResult, resolvedSiteId);
          if (scanId) setScanIds(prev => { const n = [...prev]; n[i] = scanId; return n; });
        } catch (e) {
          setResults(prev => { const n = [...prev]; n[i] = { status: "error", error: e.message || "Analysis failed" }; return n; });
        }
      }));
    } catch (e) {
      setGlobalError(e.message || "Unexpected error during analysis");
    } finally {
      setAnalysing(false);
    }
  };

  const reanalyse = async (photoIndex, extraInfo, extraPhotos = []) => {
    setResults(prev => { const n = [...prev]; n[photoIndex] = { status: "loading" }; return n; });
    try {
      const parsed = await analysePhoto(photos[photoIndex].base64, photos[photoIndex].mediaType || "image/jpeg", context, extraInfo, extraPhotos);
      const safeResult = {
        work_type: parsed.work_type || "Unknown work type",
        status: parsed.status || "uncertain",
        confidence: parsed.confidence || "low",
        legislation: parsed.legislation || [],
        findings: parsed.findings || [],
        summary: parsed.summary || "",
        follow_up_questions: parsed.follow_up_questions || [],
        photo_quality: parsed.photo_quality || "good",
      };
      setResults(prev => { const n = [...prev]; n[photoIndex] = { status: "done", result: safeResult }; return n; });
      saveScan(safeResult);
    } catch (e) {
      setResults(prev => { const n = [...prev]; n[photoIndex] = { status: "error", error: e.message }; return n; });
    }
  };

  const assignScansToSite = async () => {
    if (!assignSiteId) return;
    const ids = scanIds.filter(Boolean);
    if (!ids.length) return;
    await Promise.all(ids.map(id => supabase.from('scans').update({ site_id: assignSiteId }).eq('id', id)));
    setAssignDone(true);
    setSiteDropdownValue(assignSiteId);
  };

  const reset = () => {
    setPhotos([]); setResults([]); setContext(""); setGlobalError(null);
    setScanIds([]); setAssignSiteId(""); setAssignDone(false);
  };

  const hasResults = results.some(r => r.status === "done" || r.status === "error");
  const allDone = results.length > 0 && results.every(r => r.status !== "loading");

  return (
    <div style={{ minHeight: "100vh", background: OFFWHITE, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes progressPulse { 0% { width: 20%; } 50% { width: 85%; } 100% { width: 20%; } }
        @keyframes dotPulse { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
        * { box-sizing: border-box; }
        button:active { transform: scale(0.98); }
      `}</style>

      <header style={{ background: NAVY, padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: 0, fontFamily: "inherit" }}>
          <ScanIcon />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              <span style={{ color: "#fff" }}>Safety</span><span style={{ color: AMBER }}>Scan</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>CONSTRUCTION COMPLIANCE</div>
          </div>
        </button>
        <div style={{ fontSize: 11, padding: "4px 10px", background: "rgba(245,166,35,0.15)", color: AMBER, borderRadius: 10, border: "0.5px solid rgba(245,166,35,0.3)", fontWeight: 600 }}>Queensland</div>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 48px" }}>

        {/* Back to dashboard link */}
        <button onClick={() => router.push('/dashboard')} style={{ background: "transparent", border: "none", color: "#888", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "0 0 14px 0", fontFamily: "inherit" }}>
          ‹ Dashboard
        </button>

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

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 5 }}>
                    Site <span style={{ fontWeight: 400, color: "#999" }}>(optional)</span>
                  </label>
                  <select value={siteDropdownValue} onChange={e => setSiteDropdownValue(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #C8C5BE", background: "#FAFAF8", fontSize: 13, fontFamily: "inherit", color: "#1a1a1a", cursor: "pointer" }}>
                    <option value="none">No site</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option value="new">+ Create new site</option>
                  </select>
                  {siteDropdownValue === "new" && (
                    <input value={newSiteName} onChange={e => setNewSiteName(e.target.value)}
                      placeholder="Site name"
                      style={{ marginTop: 8, width: "100%", padding: "9px 12px", borderRadius: 8, border: "0.5px solid #C8C5BE", background: "#FAFAF8", fontSize: 13, fontFamily: "inherit", color: "#1a1a1a" }} />
                  )}
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
          <div style={{ background: "#fff", borderRadius: 16, padding: "36px 20px", border: "0.5px solid #E0DDD6", textAlign: "center", marginBottom: 16 }}>
            <LoadingSpinner />
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
                <div key={i} style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #E0DDD6", padding: "16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
                  {photos[i] && <img src={photos[i].dataUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0, opacity: 0.6 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: AMBER, animation: "dotPulse 1.2s ease-in-out infinite" }} />
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: AMBER, animation: "dotPulse 1.2s ease-in-out 0.2s infinite" }} />
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: AMBER, animation: "dotPulse 1.2s ease-in-out 0.4s infinite" }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginLeft: 4 }}>Photo {i + 1} — Analysing</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>Checking Queensland compliance...</div>
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
                <PhotoResultCard key={i} photo={{ ...photos[i], result: r.result }} index={i} total={photos.length} onReanalyse={reanalyse} />
              );

              return null;
            })}

            {allDone && siteDropdownValue === "none" && scanIds.some(Boolean) && sites.length > 0 && !assignDone && (
              <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #E0DDD6", padding: "14px 16px", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 8 }}>Assign these scans to a site?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={assignSiteId} onChange={e => setAssignSiteId(e.target.value)}
                    style={{ flex: 1, padding: "9px 11px", borderRadius: 8, border: "0.5px solid #C8C5BE", background: "#FAFAF8", fontSize: 13, fontFamily: "inherit", color: "#1a1a1a", cursor: "pointer" }}>
                    <option value="">Select a site…</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button onClick={assignScansToSite} disabled={!assignSiteId}
                    style={{ padding: "9px 14px", background: assignSiteId ? NAVY : "#E0DDD6", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: assignSiteId ? "pointer" : "not-allowed", fontFamily: "inherit", flexShrink: 0 }}>
                    Assign
                  </button>
                </div>
              </div>
            )}
            {allDone && assignDone && (
              <div style={{ padding: "9px 14px", background: "#EAF3DE", borderRadius: 8, fontSize: 12, color: "#3B6D11", marginBottom: 10, fontWeight: 600 }}>
                ✓ Scans assigned to site
              </div>
            )}

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