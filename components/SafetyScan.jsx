"use client"
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { convertToJpeg } from "./PhotoResultCard";
import AppHeader from "./AppHeader";

if (typeof window !== 'undefined') {
  window.onerror = function(msg, src, line, col, error) {
    console.error('Global error:', msg, error)
  }
  window.onunhandledrejection = function(event) {
    console.error('Unhandled promise rejection:', event.reason)
  }
}

const MAX_PHOTOS = 5;


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
  const [showTips, setShowTips] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [workTypes, setWorkTypes] = useState([]);
  const [selectedModules, setSelectedModules] = useState(["safety"]);
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

  const uploadPhotos = async (photoList) => {
    if (!currentUser) return [];
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
        const { error: uploadError } = await supabase.storage
          .from('scan-photos')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
        if (uploadError) {
          console.error('[uploadPhotos] upload failed:', uploadError.message);
        } else {
          const { data: urlData } = supabase.storage.from('scan-photos').getPublicUrl(fileName);
          photoUrls.push(urlData.publicUrl);
        }
      } catch (photoErr) {
        console.error('[uploadPhotos] photo processing error:', photoErr);
      }
    }
    return photoUrls;
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

  const navigateToDashboard = () => {
    setExiting(true);
    setTimeout(() => router.push('/dashboard'), 280);
  };

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
      // Upload photos first so URLs are available for the scan row
      const photoUrls = await uploadPhotos(photos);

      const userContent = [
        ...photos.map(p => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: p.base64 } })),
        {
          type: "text",
          text: `Analyse these ${photos.length} site photo${photos.length > 1 ? "s" : ""} together as a single inspection. Identify all work types present across all photos and return one organised compliance report covering everything you can see.${context ? `\n\nContext: ${context}` : ""}`
        }
      ];
      const searchQuery = [...workTypes, context].filter(Boolean).join(" ");

      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: [{ role: "user", content: userContent }],
          model: "claude-sonnet-4-6",
          modules: selectedModules,
          photo_urls: photoUrls,
          site_id: resolvedSiteId,
          work_types: workTypes,
          searchQuery: searchQuery || "construction site safety compliance Queensland WHS",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `Analysis failed (${res.status})`);
      }

      const { scanId } = data;
      if (!scanId) throw new Error("No scan ID returned from server");

      setScanLoaderState("complete");
      await new Promise(resolve => setTimeout(resolve, 1200));
      router.push(`/scan/${scanId}`);
    } catch (e) {
      setGlobalError(e.message || "Analysis failed");
      setAnalysing(false);
    }
  };

  return (
    <div className={exiting ? "page-slide-down" : "page-slide-up"} style={{ minHeight: "100vh", background: "var(--bg)", willChange: "transform, opacity" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes ping{0%{transform:scale(0.5);opacity:0.8}100%{transform:scale(1.4);opacity:0}} textarea,input{outline:none;box-sizing:border-box}`}</style>

      <AppHeader onLogoClick={navigateToDashboard} rightContent={
        <span style={{ fontWeight: 600, fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", padding: "4px 10px", background: "rgba(238,128,26,0.15)", color: "var(--amber)", borderRadius: 4, border: "1.5px solid var(--line)" }}>QLD</span>
      } />

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "8px 18px 48px" }}>

        {/* Analysing state */}
        {analysing && (
          <div style={{ background: "var(--ink-bg)", borderRadius: 20, padding: "40px 20px", boxShadow: "inset 0 0 0 1px var(--ink-border)", textAlign: "center" }}>
            {/* MarkLoader — radar arcs spin + ping ring */}
            <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto" }}>
              <svg style={{ animation: "spin 3.6s linear infinite", transformOrigin: "50% 50%", position: "absolute", inset: 0 }} viewBox="0 0 240 240" width="160" height="160">
                <g fill="none" strokeLinecap="butt" strokeWidth="14" stroke="#F39410">
                  <g opacity=".25">
                    <path d="M 210 120 A 90 90 0 0 1 48 174"/>
                    <path d="M 186 120 A 66 66 0 0 1 66 156"/>
                    <path d="M 162 120 A 42 42 0 0 1 84 138"/>
                  </g>
                  <path d="M 30 120 A 90 90 0 0 1 192 66"/>
                  <path d="M 54 120 A 66 66 0 0 1 174 84"/>
                  <path d="M 78 120 A 42 42 0 0 1 156 102"/>
                </g>
              </svg>
              <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 240 240" width="160" height="160">
                <circle cx="120" cy="120" r="10" fill="#F39410"/>
                <circle style={{ animation: "ping 1.8s ease-out infinite", transformOrigin: "50% 50%" }} cx="120" cy="120" r="60" fill="none" stroke="#F39410" strokeWidth="3" opacity="0.5"/>
              </svg>
            </div>
            <div style={{ marginTop: 28, fontWeight: 600, fontSize: 22, letterSpacing: "-0.01em", color: "#ECE7DD" }}>{LOADING_MESSAGES[msgIdx]}</div>
            <div style={{ width: "100%", marginTop: 28, maxWidth: 360, margin: "28px auto 0" }}>
              {/* Step cards */}
              {[
                { label: "Photos uploaded", meta: `${photos.length} / ${photos.length}`, done: true },
                { label: "Detecting hazards", meta: "DONE", done: msgIdx >= 1 },
                { label: LOADING_MESSAGES[msgIdx] || "Matching regulations", meta: "NOW", active: msgIdx >= 2 && msgIdx < 5, done: msgIdx >= 5 },
                { label: "Compiling report", meta: "", dim: msgIdx < 3 },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--ink-card-2)", borderRadius: 12, marginBottom: i < 3 ? 8 : 0, opacity: s.dim ? 0.5 : 1 }}>
                  {s.done ? (
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "var(--amber)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <span style={{ display: "block", width: 10, height: 6, borderLeft: "1.8px solid #fff", borderBottom: "1.8px solid #fff", transform: "rotate(-45deg) translate(1px,-1px)" }}/>
                    </div>
                  ) : s.active ? (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--amber)", borderTopColor: "transparent", animation: "spin 0.9s linear infinite", flexShrink: 0 }}/>
                  ) : (
                    <div style={{ width: 20, height: 20, borderRadius: 6, boxShadow: "inset 0 0 0 1.5px rgba(255,250,240,0.16)", flexShrink: 0 }}/>
                  )}
                  <span style={{ flex: 1, fontSize: 13, color: "#ECE7DD" }}>{s.label}</span>
                  {s.meta && <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.16em", opacity: s.active ? 1 : 0.55, color: s.active ? "var(--amber)" : "#ECE7DD" }}>{s.meta}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload form */}
        {!analysing && (
          <div style={{ background: "var(--surf)", border: "1.5px solid var(--line)", borderRadius: 4 }}>
            <div style={{ padding: "14px 16px 0" }}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: 4 }}>Compliance check</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--mut)", lineHeight: 1.5, marginBottom: 14 }}>Upload up to {MAX_PHOTOS} site photos. All photos are analysed together as a single inspection report.</div>

            {/* Photo strip */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: photos.length ? 14 : 0 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: "relative", width: 72, height: 72 }}>
                  <img src={p.dataUrl} alt={`Photo ${i + 1}`} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" }}/>
                  <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--status-red)", border: "2px solid var(--bg)", color: "#fff", fontSize: 11, cursor: "pointer", display: "grid", placeItems: "center", fontWeight: 700, padding: 0 }}>✕</button>
                  <div style={{ position: "absolute", bottom: 3, left: 3, fontSize: 9, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.55)", borderRadius: 3, padding: "1px 4px" }}>{i + 1}</div>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <div onClick={() => fileRef.current.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                  style={{ width: photos.length === 0 ? "100%" : 72, height: photos.length === 0 ? 140 : 72, borderRadius: photos.length === 0 ? 4 : 4, border: dragOver ? "2px dashed var(--amber)" : "1.5px dashed var(--line)", background: dragOver ? "rgba(238,128,26,0.08)" : "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", gap: 4 }}>
                  {photos.length === 0 ? (
                    <>
                      <div style={{ fontSize: 32 }}>📷</div>
                      <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>Tap to add photos</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--mut)" }}>Up to {MAX_PHOTOS} · JPG, PNG, HEIC</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 20, color: "var(--text-dim)" }}>+</div>
                      <div style={{ fontSize: 9, color: "var(--text-dim)", fontWeight: 600 }}>{MAX_PHOTOS - photos.length} left</div>
                    </>
                  )}
                </div>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={e => { addFiles(e.target.files); e.target.value = ""; }}/>

            {globalError && (
              <div style={{ marginBottom: 12, padding: "10px 14px", background: "var(--status-red-bg)", borderRadius: 10, fontSize: 12, color: "var(--status-red)", fontFamily: "var(--ff-mono)" }}>{globalError}</div>
            )}

            {photos.length > 0 && (
              <>
                {/* Context */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--mut)", marginBottom: 6 }}>Context <span style={{ opacity: 0.6 }}>(optional)</span></div>
                  <textarea rows={2} placeholder='e.g. "Scaffold on Ipswich Motorway upgrade, Brisbane"'
                    value={context} onChange={e => setContext(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--line)", background: "var(--bg)", fontSize: 13, fontWeight: 500, resize: "none", color: "var(--text)", lineHeight: 1.5, borderRadius: 4 }}/>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--mut)", marginBottom: 6 }}>Site <span style={{ opacity: 0.6 }}>(optional)</span></div>
                  <select value={siteDropdownValue} onChange={e => setSiteDropdownValue(e.target.value)}
                    style={{ display: "block", width: "100%", height: 46, padding: "0 14px", border: "1.5px solid var(--line)", background: "var(--bg)", fontSize: 14, fontWeight: 500, color: "var(--text)", cursor: "pointer", borderRadius: 4, fontFamily: "inherit", boxSizing: "border-box" }}>
                    <option value="none">No site</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option value="new">+ Create new site</option>
                  </select>
                  {siteDropdownValue === "new" && (
                    <input value={newSiteName} onChange={e => setNewSiteName(e.target.value)} placeholder="Site name"
                      style={{ marginTop: 8, display: "block", width: "100%", height: 46, padding: "0 14px", border: "1.5px solid var(--amber)", background: "var(--bg)", fontSize: 14, color: "var(--text)", borderRadius: 4, fontFamily: "inherit", boxSizing: "border-box" }}/>
                  )}
                </div>
                {/* Work type selector — multi-select */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--mut)" }}>
                      Work type <span style={{ opacity: 0.5 }}>(optional — skip if unsure)</span>
                    </div>
                    {workTypes.length > 0 && (
                      <button onClick={() => setWorkTypes([])}
                        style={{ fontWeight: 600, fontSize: 10, letterSpacing: "0.1em", color: "var(--amber)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                        Clear
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[
                      "Scaffolding", "Traffic Management", "Excavation",
                      "Working at Heights", "Mobile Crane", "Tower Crane",
                      "Crane & Rigging", "Electrical", "Confined Spaces",
                      "Demolition", "Formwork", "Concrete Pumping",
                      "Plant & Equipment", "Hot Works", "Asbestos",
                      "Steel Construction", "Tilt-up & Precast",
                      "Spray Painting", "Abrasive Blasting", "PPE Check",
                    ].map(type => {
                      const selected = workTypes.includes(type);
                      return (
                        <button key={type}
                          onClick={() => setWorkTypes(prev =>
                            selected ? prev.filter(t => t !== type) : [...prev, type]
                          )}
                          style={{
                            padding: "6px 12px",
                            border: `1.5px solid ${selected ? "var(--amber)" : "var(--line)"}`,
                            borderRadius: 4,
                            background: selected ? "rgba(238,128,26,0.1)" : "var(--bg)",
                            color: selected ? "var(--amber)" : "var(--mut)",
                            fontSize: 12, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                            transition: "all 0.12s",
                          }}>
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Module selector */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--mut)", marginBottom: 6 }}>Analysis modules</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { key: "safety", label: "Safety" },
                      { key: "quality", label: "Quality" },
                      { key: "environmental", label: "Environmental" },
                    ].map(({ key, label }) => {
                      const selected = selectedModules.includes(key);
                      return (
                        <button key={key}
                          onClick={() => setSelectedModules(prev => {
                            if (prev.includes(key) && prev.length === 1) return prev;
                            return prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key];
                          })}
                          style={{
                            padding: "6px 12px",
                            border: `1.5px solid ${selected ? "var(--amber)" : "var(--line)"}`,
                            borderRadius: 4,
                            background: selected ? "rgba(238,128,26,0.1)" : "var(--bg)",
                            color: selected ? "var(--amber)" : "var(--mut)",
                            fontSize: 12, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                            transition: "all 0.12s",
                          }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button onClick={runAll}
                  style={{ display: "block", width: "100%", height: 46, background: "var(--amber)", border: "1.5px solid var(--line)", borderRadius: 6, color: "#1B1A12", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Analyse {photos.length} photo{photos.length > 1 ? "s" : ""} for compliance →
                </button>
              </>
            )}

            <div style={{ borderTop: "1.5px solid var(--div)", marginTop: 12 }}>
              <button onClick={navigateToDashboard}
                style={{ display: "block", width: "100%", height: 44, background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "var(--mut)", cursor: "pointer", fontFamily: "inherit" }}>
                Back to dashboard
              </button>
            </div>
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1.5px solid var(--div)", fontWeight: 600, fontSize: 9.5, color: "var(--mut)", textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI-assisted · Queensland legislation · Not legal advice</div>
          </div>
        )}
      </main>
    </div>
  );
}
