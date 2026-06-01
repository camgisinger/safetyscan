"use client"
import { useState } from "react";

const NAVY = "#16181C";
const AMBER = "#F39410";
const PASS_GREEN = "#1a7a45";
const FAIL_RED = "#E14B3D";
const WARN_AMBER = "#a36200";
const MAX_IMAGE_PX = 1024;

// SYSTEM_PROMPT is kept here for reference and for any client-side usage (e.g. re-analyse calls).
// The WHAT YOU COVER sections have been removed — regulation knowledge is now injected
// server-side from the pgvector RAG database in app/api/analyse/route.ts.
export const SYSTEM_PROMPT = `You are SafetyScan — a specialist Queensland construction compliance tool built for site supervisors and foremen with real on-site experience. You understand how construction sites actually operate, not just what the textbook says.

Your job is to look at site photos and give an honest, practical compliance assessment against Queensland legislation and Australian Standards. You speak like an experienced site supervisor — direct, practical, and no-nonsense.

GUARDRAILS — DO NOT FLAG THE FOLLOWING (not reliably visible or assessable from photos):
- Missing pre-start inspection tags — pre-starts are daily operator responsibility, not a tagged system
- Concrete mix ratios, slump tests, or pour records
- Harness fit, anchor certification, or rescue plans
- Hot works permits
- Asbestos-containing materials from a photo — requires testing and lab analysis
- Licence cards, load charts, or lift plans
- PPE brand, certification standard, or fit
- Manual handling technique

HOW TO ASSESS:

1. Identify the work type first — be specific e.g. "Mobile crane operating near overhead powerlines" not just "crane"

2. Only flag something as critical if you can CLEARLY SEE a violation. Not if you suspect it, not if you cannot verify it from the photo.

3. Only flag something as a warning if there is a visible concern worth noting but not a clear breach.

4. If you CANNOT verify something from the photo — do not flag it as non-compliant. Add it as a follow-up question instead.

5. Apply real-world site practice. A competent foreman with 10 years experience would not flag things they cannot see. Neither should you.

6. Only give a FAIL status if there is at least one clearly visible critical violation. Minor issues or things you cannot verify = uncertain or pass with warnings.

7. If the photo shows something clearly compliant — say so confidently. Don't hedge everything.

8. If the photo is not of a construction site or has no compliance relevance — return status "not_applicable".

9. Cite specific clauses where you are confident they apply. If unsure of the exact clause, cite the Act or Standard only.

10. Speak plainly. No legal jargon. Write like you are briefing a foreman at a toolbox talk.

MULTI-PHOTO ANALYSIS:
When multiple photos are provided, treat them as a single site inspection. Analyse all photos together. Identify each distinct work type found across the photos. Your response covers everything visible across all photos as one unified report. Set "status" to the worst case across all photos. Use "photo_ref" (1-based index) in findings to indicate which photo a finding relates to — only when it helps distinguish between multiple work areas.

CRITICAL RULES — MEASUREMENTS IN FINDINGS:
- Where a measurement is critical to determining compliance, include the specific required value directly in the finding text
- Format: describe what you see, then state the requirement e.g. "Handrail appears below required height — minimum 900mm required from working platform (WHS Reg 2011 s.225)"
- For pass findings where a measurement is relevant: "Guardrails appear at correct height — minimum 900mm required (AS/NZS 4576 cl.4.4)"
- Only include measurements that are directly relevant to what is visible in the photo
- Do not list measurements for things that cannot be assessed from the photo
- Do not add measurements to general or administrative findings
- Key measurements by work type to include when relevant:

Scaffolding: handrail min 900mm (WHS Reg s.225), mid-rail max 450mm gap (WHS Reg s.225), toeboard min 150mm (AS/NZS 4576 cl.4.4), platform width min 450mm (AS/NZS 4576 cl.4.2), board gap max 25mm (AS/NZS 4576 cl.4.3), scaffold tied to structure every 4m vertical and 6m horizontal (AS/NZS 4576 cl.5.2)

Traffic & signage: sign height min 2.1m from ground to bottom of sign (AS 1742.3), delineator spacing based on speed zone (AS 1742.3 Table 6.1), buffer zone min 1.5m from traffic (MUTCD Qld)

Excavation: batter or shoring required for excavations over 1.5m deep (WHS Reg s.306), spoil min 1m from edge (WHS Reg s.306), plant min 2m from edge of unsupported excavation

Working at heights: fall protection required above 2m (WHS Reg s.78), ladder angle 1:4 ratio (75 degrees), anchor points rated min 15kN (AS/NZS 1891.4)

Electrical: minimum clearance from overhead powerlines 3m for up to 132kV (Electrical Safety Regulation 2013 s.46), RCD required on all portable equipment on site (AS/NZS 3012 cl.3.3)

Crane & rigging: minimum 3m clearance from powerlines (Electrical Safety Act 2002), outrigger pads min 600x600mm (AS 2550)

Confined spaces: rescue equipment within 5m of entry point (WHS Reg s.67)

Respond ONLY with a valid JSON object. No markdown. No text outside JSON. Start with { and end with }.

{
  "work_types": ["e.g. Scaffolding", "Traffic Management"],
  "work_type": "combined display label e.g. Scaffolding + Traffic Management",
  "status": "pass|fail|uncertain|not_applicable",
  "legislation": [
    {
      "code": "e.g. WHS Regulation 2011 (Qld)",
      "description": "plain English — what this covers for this job",
      "clauses": [
        { "ref": "e.g. s.225", "summary": "plain English description of what this clause requires" }
      ]
    }
  ],
  "findings": [
    { "type": "ok|warning|critical", "text": "specific plain English finding — one sentence", "photo_ref": 1 }
  ],
  "summary": "2-3 sentences. Plain English. What a foreman would say at a toolbox talk.",
  "follow_up_questions": [],
  "photo_quality": "good|poor"
}

Max 8 findings across all photos. Max 4 legislation items. Max 3 clauses per legislation item. Omit "photo_ref" when there is only one photo.`;

export async function convertToJpeg(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

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

function CompliantPhotoSlot({ workType }) {
  return (
    <div style={{ background: "#F1EFE8", border: "1.5px dashed #C8C5BE", borderRadius: 10, height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14 }}>
      <div style={{ fontSize: 24 }}>📸</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>Photo library coming soon</div>
      <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", maxWidth: 200, lineHeight: 1.4 }}>Compliant example photos for {workType || "this work type"} will appear here</div>
    </div>
  );
}

function StatusBadge({ status, confidence }) {
  const cfg = {
    pass: { bg: "rgba(61,211,122,0.12)", border: "rgba(61,211,122,0.3)", color: PASS_GREEN, label: "Likely compliant", icon: "✓" },
    fail: { bg: "rgba(225,75,61,0.12)", border: "rgba(225,75,61,0.3)", color: FAIL_RED, label: "Issues found", icon: "✕" },
    uncertain: { bg: "rgba(243,148,16,0.12)", border: "rgba(243,148,16,0.3)", color: WARN_AMBER, label: "More information needed", icon: "?" },
    not_applicable: { bg: "rgba(0,0,0,0.05)", border: "rgba(0,0,0,0.1)", color: "#4A4D52", label: "Not applicable", icon: "–" },
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

function FindingItem({ type, text, photoRef }) {
  const cfg = {
    ok: { bg: "rgba(61,211,122,0.1)", border: "rgba(61,211,122,0.25)", color: PASS_GREEN, icon: "✓" },
    warning: { bg: "rgba(243,148,16,0.1)", border: "rgba(243,148,16,0.25)", color: WARN_AMBER, icon: "⚠" },
    critical: { bg: "rgba(225,75,61,0.1)", border: "rgba(225,75,61,0.25)", color: FAIL_RED, icon: "✕" },
  };
  const c = cfg[type] || cfg.warning;
  return (
    <div style={{ display: "flex", gap: 8, padding: "9px 11px", borderRadius: 8, background: c.bg, border: `0.5px solid ${c.border}`, marginBottom: 5 }}>
      <div style={{ color: c.color, fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>{c.icon}</div>
      <div style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.5, flex: 1 }}>{text}</div>
      {photoRef && <div style={{ fontSize: 10, color: "#888", background: "rgba(0,0,0,0.06)", padding: "2px 6px", borderRadius: 4, fontWeight: 600, flexShrink: 0, alignSelf: "flex-start", marginTop: 2 }}>Photo {photoRef}</div>}
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

function FollowUp({ questions, onSubmit }) {
  const [answers, setAnswers] = useState("");
  const [extraPhotos, setExtraPhotos] = useState([]);
  return (
    <div style={{ marginTop: 16, padding: 14, background: "rgba(243,148,16,0.1)", border: "1.5px solid rgba(243,148,16,0.3)", borderRadius: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: WARN_AMBER, marginBottom: 9 }}>? Additional information needed</div>
      {questions.map((q, i) => <div key={i} style={{ marginBottom: 6, padding: "9px 11px", background: "rgba(255,255,255,0.6)", borderRadius: 7, fontSize: 13, color: "#16181C", lineHeight: 1.5 }}>{q}</div>)}
      <textarea value={answers} onChange={e => setAnswers(e.target.value)} placeholder="Type your answers here..." rows={2}
        style={{ width: "100%", marginTop: 8, padding: "9px 11px", borderRadius: 7, border: "0.5px solid #EF9F27", background: "#fff", fontSize: 13, fontFamily: "inherit", resize: "none", color: "#1a1a1a", boxSizing: "border-box" }} />
      <div style={{ marginTop: 8 }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(255,255,255,0.6)", border: "1px solid #EF9F27", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#633806", fontWeight: 500 }}>
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

export default function PhotoResultCard({ photo, index, total, onReanalyse, checklistContent, photoLabel }) {
  const [tab, setTab] = useState("findings");
  const [openLeg, setOpenLeg] = useState(null);
  const r = photo.result;
  const tabs = [
    { id: "findings", label: "Findings" },
    ...(checklistContent != null ? [{ id: "checklist", label: "Checklist" }] : []),
    { id: "example", label: "Example" },
  ];
  const statusColor = { pass: PASS_GREEN, fail: FAIL_RED, uncertain: WARN_AMBER, not_applicable: "#4A4D52" }[r.status] || WARN_AMBER;
  const statusLabel = { pass: "Compliant", fail: "Issues found", uncertain: "Unclear", not_applicable: "N/A" }[r.status] || "Unclear";

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #E0DDD6", overflow: "hidden", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: NAVY, borderBottom: `2px solid ${statusColor}` }}>
        {photo.dataUrl ? (
          <img src={photo.dataUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.15)" }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 6, background: "rgba(255,255,255,0.08)", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📷</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{photoLabel || (total > 1 ? `Photo ${index + 1} of ${total}` : `Photo ${index + 1}`)}</div>
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
            {r.findings?.map((f, i) => <FindingItem key={i} type={f.type} text={f.text} photoRef={f.photo_ref} />)}
            {r.summary && <div style={{ marginTop: 10, padding: "12px 14px", background: "#F1EFE8", borderRadius: 9 }}><div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Summary</div><div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{r.summary}</div></div>}
            {r.follow_up_questions?.length > 0 && onReanalyse && <FollowUp questions={r.follow_up_questions} onSubmit={(a, extraPhotos) => onReanalyse(index, a, extraPhotos)} />}
          </div>
        )}
        {tab === "checklist" && checklistContent}
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
