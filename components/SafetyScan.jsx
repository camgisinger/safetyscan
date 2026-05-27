"use client"
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { convertToJpeg, SYSTEM_PROMPT } from "./PhotoResultCard";
import { ScanLoader } from "./ScanLoader";
import AppHeader from "./AppHeader";

if (typeof window !== 'undefined') {
  window.onerror = function(msg, src, line, col, error) {
    console.error('Global error:', msg, error)
  }
  window.onunhandledrejection = function(event) {
    console.error('Unhandled promise rejection:', event.reason)
  }
}

const NAVY = "#16181C";
const AMBER = "#F39410";
const OFFWHITE = "#EFEAE0";
const FAIL_RED = "#E14B3D";
const MAX_PHOTOS = 5;

async function analysePhotos(photoList, context) {
  const userContent = [
    ...photoList.map(p => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: p.base64 } })),
    {
      type: "text",
      text: `Analyse these ${photoList.length} site photo${photoList.length > 1 ? "s" : ""} together as a single inspection. Identify all work types present across all photos and return one organised compliance report covering everything you can see.${context ? `\n\nContext: ${context}` : ""}`
    }
  ];

  let res, data;
  try {
    res = await fetch("/api/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  try { rawText = await res.text(); } catch (e) { throw new Error(`Could not read response: ${e.message}`); }

  try { data = JSON.parse(rawText); } catch (e) { throw new Error(`Response not JSON (status ${res.status}): ${rawText.substring(0, 200)}`); }

  if (!res.ok || data.error) {
    throw new Error(`API ${res.status}: ${data.error?.message || data.message || JSON.stringify(data).substring(0, 200)}`);
  }

  const raw = (data.content || []).filter(b => b.type === "text").map(b => b.text || "").join("").trim();
  if (!raw) throw new Error(`Empty response. Stop: ${data.stop_reason}`);

  const stripped = raw.replace(/^```json\s*/m, "").replace(/^```\s*/m, "").replace(/```\s*$/m, "").trim();

  try { return JSON.parse(stripped); } catch (_) {}
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch (_) {} }
  const f = stripped.indexOf("{"), l = stripped.lastIndexOf("}");
  if (f !== -1 && l !== -1) { try { return JSON.parse(stripped.slice(f, l + 1)); } catch (_) {} }
  throw new Error(`Parse failed: ${stripped.substring(0, 200)}`);
}


const LOADING_MESSAGES = [
  "Identifying work types...",
  "Checking Queensland legislation...",
  "Reviewing WHS compliance...",
  "Checking safety requirements...",
  "Reviewing findings...",
  "Saving scan...",
];

export default function SafetyScan() {
  const [photos, setPhotos] = useState([]);
  const [context, setContext] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [scanLoaderState, setScanLoaderState] = useState("idle");
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [globalError, setGlobalError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sites, setSites] = useState([]);
  const [siteDropdownValue, setSiteDropdownValue] = useState("none");
  const [newSiteName, setNewSiteName] = useState("");
  const fileRef = useRef();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!analysing) return;
    setMsgIdx(0);
    setProgress(0);
    const msgTimer = setInterval(() => {
      setMsgIdx(prev => prev >= LOADING_MESSAGES.length - 1 ? prev : prev + 1);
    }, 2200);
    const progTimer = setInterval(() => {
      setProgress(prev => prev >= 92 ? 92 : prev + Math.random() * 8);
    }, 800);
    return () => { clearInterval(msgTimer); clearInterval(progTimer); };
  }, [analysing]);

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

  const saveScan = async (result, photoList, siteId = null) => {
    if (!currentUser) return null;
    try {
      // Upload all photos to storage
      const photoUrls = [];
      for (let i = 0; i < photoList.length; i++) {
        const photo = photoList[i];
        try {
          const base64 = photo.dataUrl.split(',')[1];
          if (!base64) continue;
          const byteCharacters = atob(base64);
          const byteArray = new Uint8Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) byteArray[j] = byteCharacters.charCodeAt(j);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });
          const fileName = `${currentUser.id}/${Date.now()}-${i}.jpg`;
          console.log('[saveScan] uploading photo', i + 1, 'size:', blob.size);
          const { error: uploadError } = await supabase.storage
            .from('scan-photos')
            .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
          if (uploadError) {
            console.error('[saveScan] upload failed:', uploadError.message);
          } else {
            const { data: urlData } = supabase.storage.from('scan-photos').getPublicUrl(fileName);
            photoUrls.push(urlData.publicUrl);
            console.log('[saveScan] uploaded photo', i + 1, '->', urlData.publicUrl);
          }
        } catch (photoErr) {
          console.error('[saveScan] photo processing error:', photoErr);
        }
      }

      console.log('[saveScan] photo_urls:', photoUrls, 'work_types:', result.work_types);

      const { data, error: insertError } = await supabase.from('scans').insert({
        user_id: currentUser.id,
        site_id: siteId || null,
        work_type: result.work_type,
        work_types: result.work_types || null,
        status: result.status,
        confidence: result.confidence,
        legislation: result.legislation,
        findings: result.findings,
        summary: result.summary,
        follow_up_questions: result.follow_up_questions,
        photo_url: photoUrls[0] || null,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
      }).select('id').single();

      if (insertError) {
        console.error('[saveScan] insert error:', insertError);
        return null;
      }
      return data?.id || null;
    } catch (err) {
      console.error('[saveScan] error:', err);
      return null;
    }
  };

  const addFiles = useCallback(async (files) => {
    const arr = Array.from(files).slice(0, MAX_PHOTOS - photos.length);
    if (!arr.length) return;
    const converted = await Promise.all(arr.map(async file => {
      try {
        const dataUrl = await convertToJpeg(file);
        return { dataUrl, base64: dataUrl.split(",")[1], error: null };
      } catch (e) {
        return { dataUrl: null, base64: null, error: e.message };
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
    setScanLoaderState("scanning");
    setGlobalError(null);

    // Resolve site
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
      const parsed = await analysePhotos(photos, context);

      const workTypes = parsed.work_types || (parsed.work_type ? [parsed.work_type] : ["Unknown work type"]);
      const workTypeLabel = parsed.work_type || workTypes.join(" + ") || "Unknown work type";

      const safeResult = {
        work_types: workTypes,
        work_type: workTypeLabel,
        status: parsed.status || "uncertain",
        confidence: parsed.confidence || "low",
        legislation: (parsed.legislation || []).map(l => ({ ...l, clauses: l.clauses || [] })),
        findings: parsed.findings || [],
        summary: parsed.summary || "",
        follow_up_questions: parsed.follow_up_questions || [],
        photo_quality: parsed.photo_quality || "good",
      };

      const scanId = await saveScan(safeResult, photos, resolvedSiteId);
      if (scanId) {
        setScanLoaderState("complete");
        await new Promise(resolve => setTimeout(resolve, 1200));
        router.push(`/scan/${scanId}`);
      } else {
        setGlobalError("Analysis complete but failed to save. Please try again.");
        setAnalysing(false);
      }
    } catch (e) {
      setGlobalError(e.message || "Analysis failed");
      setAnalysing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: OFFWHITE, fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dotPulse { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
        * { box-sizing: border-box; }
        button:active { transform: scale(0.98); }
      `}</style>

      <AppHeader rightContent={
        <div style={{ fontSize: 11, padding: "4px 10px", background: "rgba(243,148,16,0.15)", color: AMBER, borderRadius: 10, border: "0.5px solid rgba(243,148,16,0.3)", fontWeight: 600 }}>Queensland</div>
      } />

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 48px" }}>

        <button onClick={() => router.push('/dashboard')} style={{ background: "transparent", border: "none", color: "#888", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "0 0 14px 0", fontFamily: "inherit" }}>
          ‹ Dashboard
        </button>

        {analysing && (
          <div style={{ background: "#16181C", borderRadius: 16, padding: "36px 20px", border: "0.5px solid rgba(255,255,255,0.08)", textAlign: "center", marginBottom: 16 }}>
            {console.log('[SafetyScan] scanLoaderState:', scanLoaderState, 'analysing:', analysing)}
            <ScanLoader state={scanLoaderState} size={120} />
            <div style={{ marginTop: 20, fontWeight: 600, color: "#EFEAE0", fontSize: 15, minHeight: 24 }}>{LOADING_MESSAGES[msgIdx]}</div>
            <div style={{ height: 4, background: "#252A30", borderRadius: 2, overflow: "hidden", maxWidth: 280, margin: "12px auto 0" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#F39410", borderRadius: 2, transition: "width 0.8s ease" }} />
            </div>
          </div>
        )}
        {!analysing && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "0.5px solid #E0DDD6" }}>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: NAVY, marginBottom: 3 }}>Compliance check</h1>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5, marginBottom: 16 }}>Upload up to {MAX_PHOTOS} site photos. All photos are analysed together as a single inspection report.</p>

            {/* Photo strip */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: photos.length ? 12 : 0 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: "relative", width: 72, height: 72 }}>
                  <img src={p.dataUrl} alt={`Photo ${i + 1}`} style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", border: "1.5px solid #E0DDD6" }} />
                  <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: FAIL_RED, border: "2px solid #fff", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, padding: 0 }}>✕</button>
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

            {globalError && (
              <div style={{ marginBottom: 10, padding: "9px 12px", background: "rgba(225,75,61,0.1)", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 12, color: FAIL_RED }}>{globalError}</div>
            )}

            {photos.length > 0 && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 5 }}>
                    Context <span style={{ fontWeight: 400, color: "#999" }}>(optional)</span>
                  </label>
                  <textarea rows={2} placeholder='e.g. "Scaffold and traffic management on Ipswich Motorway upgrade, Brisbane"'
                    value={context} onChange={e => setContext(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid #C8C5BE", background: "#FAFAF8", fontSize: 13, fontFamily: "inherit", resize: "none", color: "#1a1a1a", lineHeight: 1.5, outline: "none" }} />
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
                      style={{ marginTop: 8, width: "100%", padding: "9px 12px", borderRadius: 8, border: "0.5px solid #C8C5BE", background: "#FAFAF8", fontSize: 13, fontFamily: "inherit", color: "#1a1a1a", outline: "none" }} />
                  )}
                </div>

                <button onClick={runAll}
                  style={{ width: "100%", padding: 13, background: AMBER, border: "none", borderRadius: 10, color: NAVY, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                  Analyse {photos.length} photo{photos.length > 1 ? "s" : ""} for compliance →
                </button>
              </>
            )}

            <div style={{ marginTop: 10, fontSize: 11, color: "#bbb", textAlign: "center" }}>AI-assisted · Queensland legislation · Not a substitute for professional advice</div>
          </div>
        )}
      </main>
    </div>
  );
}
