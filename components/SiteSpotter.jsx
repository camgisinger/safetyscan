"use client"
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useOrg } from "../lib/useOrg";
import { useUser } from "../lib/UserContext";
import { convertToJpeg } from "./PhotoResultCard";
import AppHeader from "./AppHeader";
import { Camera, ChevronRight } from "lucide-react";

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

export default function SiteSpotter() {
  const [mode, setMode] = useState("quick"); // 'quick' | 'advanced'
  const [photos, setPhotos] = useState([]);
  const [context, setContext] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [globalError, setGlobalError] = useState(null);
  const [exiting, setExiting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [workTypes, setWorkTypes] = useState([]);
  const [selectedModules, setSelectedModules] = useState(["safety"]);
  const [currentUser, setCurrentUser] = useState(null);
  const [sites, setSites] = useState([]);
  const { orgId } = useOrg();
  const { user: contextUser } = useUser();
  const [siteDropdownValue, setSiteDropdownValue] = useState("none");
  const [newSiteName, setNewSiteName] = useState("");
  const fileRef = useRef();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!analysing) return;
    setMsgIdx(0);
    const msgTimer = setInterval(() => {
      setMsgIdx(prev => prev >= LOADING_MESSAGES.length - 1 ? prev : prev + 1);
    }, 2200);
    return () => clearInterval(msgTimer);
  }, [analysing]);

  // Sync user from context (already loaded at app boot — no extra auth round-trip)
  useEffect(() => {
    if (!contextUser) return;
    setCurrentUser(contextUser);
    supabase.from('sites').select('id, name').eq('archived', false).order('name', { ascending: true })
      .then(({ data }) => setSites(data || []));
  }, [contextUser]);

  useEffect(() => {
    const urlSiteId = searchParams.get('site_id');
    if (urlSiteId) setSiteDropdownValue(urlSiteId);
  }, [searchParams]);

  const uploadPhotos = async (photoList) => {
    if (!currentUser) return [];
    const results = await Promise.all(photoList.map(async (photo, i) => {
      try {
        const base64 = photo.dataUrl.split(',')[1];
        if (!base64) return null;
        const byteCharacters = atob(base64);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) byteArray[j] = byteCharacters.charCodeAt(j);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const fileName = `${currentUser.id}/${Date.now()}-${i}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('scan-photos')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('scan-photos').getPublicUrl(fileName);
          return urlData.publicUrl;
        }
        return null;
      } catch (photoErr) {
        console.error('[uploadPhotos] photo processing error:', photoErr);
        return null;
      }
    }));
    return results.filter(Boolean);
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
    setGlobalError(null);

    const modules = mode === "quick" ? ["safety"] : selectedModules;

    // Resolve site
    let resolvedSiteId = siteDropdownValue === "none" ? null : siteDropdownValue === "new" ? null : siteDropdownValue;
    if (siteDropdownValue === "new" && newSiteName.trim() && currentUser) {
      const { data } = await supabase.from('sites').insert({
        created_by: currentUser.id,
        org_id: orgId,
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
      const photoUrls = await uploadPhotos(photos);

      const userContent = [
        {
          type: "text",
          text: `Analyse these ${photos.length} site photo${photos.length > 1 ? "s" : ""} together as a single inspection. Identify all work types present across all photos and return one organised compliance report covering everything you can see.${context ? `\n\nContext: ${context}` : ""}`
        }
      ];
      const searchQuery = [...(mode === "quick" ? [] : workTypes), context].filter(Boolean).join(" ");

      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: [{ role: "user", content: userContent }],
          model: "claude-sonnet-4-6",
          modules,
          photo_urls: photoUrls,
          site_id: resolvedSiteId,
          work_types: mode === "quick" ? [] : workTypes,
          searchQuery: searchQuery || "construction site safety compliance Queensland WHS",
          org_id: orgId,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Analysis failed (${res.status})`);
      const { scanId } = data;
      if (!scanId) throw new Error("No scan ID returned from server");

      router.push(`/scan/${scanId}`);
    } catch (e) {
      setGlobalError(e.message || "Analysis failed");
      setAnalysing(false);
    }
  };

  const inp = {
    display: "block", width: "100%", height: 46, padding: "0 14px",
    border: "1.5px solid var(--border-card)", borderRadius: "var(--r-input)",
    background: "var(--surf-inset)", color: "var(--text)",
    fontSize: 14, fontWeight: 500, fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div className={exiting ? "page-slide-down" : "page-slide-up"} style={{ minHeight: "100svh", background: "var(--bg)", willChange: "transform, opacity" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes ping{0%{transform:scale(0.5);opacity:0.8}100%{transform:scale(1.4);opacity:0}} textarea,input{outline:none;box-sizing:border-box} ::-webkit-scrollbar{display:none}`}</style>

      <AppHeader onLogoClick={navigateToDashboard} rightContent={
        <span style={{ fontWeight: 700, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", padding: "4px 10px", background: "var(--brand-tint)", color: "var(--amber)", borderRadius: 6, border: "1.5px solid var(--border-card)" }}>QLD</span>
      } />

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "8px 18px 48px" }}>

        {/* Analysing state */}
        {analysing && (
          <div style={{ background: "var(--surf)", border: "1.5px solid var(--border-card)", borderRadius: "var(--r-card-hero)", padding: "40px 20px", textAlign: "center" }}>
            {/* Radar animation */}
            <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto" }}>
              <svg style={{ animation: "spin 3.6s linear infinite", transformOrigin: "50% 50%", position: "absolute", inset: 0 }} viewBox="0 0 240 240" width="160" height="160">
                <g fill="none" strokeLinecap="butt" strokeWidth="14" stroke="var(--amber)">
                  <g opacity=".2">
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
                <circle cx="120" cy="120" r="10" fill="var(--amber)"/>
                <circle style={{ animation: "ping 1.8s ease-out infinite", transformOrigin: "50% 50%" }} cx="120" cy="120" r="60" fill="none" stroke="var(--amber)" strokeWidth="3" opacity="0.4"/>
              </svg>
            </div>
            <div style={{ marginTop: 28, fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: "var(--text)" }}>{LOADING_MESSAGES[msgIdx]}</div>
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Photos uploaded", meta: `${photos.length} / ${photos.length}`, done: true },
                { label: "Detecting hazards", meta: "DONE", done: msgIdx >= 1 },
                { label: LOADING_MESSAGES[msgIdx] || "Matching regulations", meta: "NOW", active: msgIdx >= 2 && msgIdx < 5, done: msgIdx >= 5 },
                { label: "Compiling report", meta: "", dim: msgIdx < 3 },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "var(--surf-inset)", borderRadius: "var(--r-card)", opacity: s.dim ? 0.45 : 1 }}>
                  {s.done ? (
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "var(--amber)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="#1B1A12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  ) : s.active ? (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--amber)", borderTopColor: "transparent", animation: "spin 0.9s linear infinite", flexShrink: 0 }}/>
                  ) : (
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: "1.5px solid var(--border-card)", flexShrink: 0 }}/>
                  )}
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{s.label}</span>
                  {s.meta && <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.14em", opacity: s.active ? 1 : 0.5, color: s.active ? "var(--amber)" : "var(--text-muted)" }}>{s.meta}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload form */}
        {!analysing && (
          <div>
            {/* Title */}
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1.5px solid var(--border-card)" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)", margin: "0 0 4px" }}>New scan</h1>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Upload photos for an AI compliance report.
              </div>
            </div>

            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 3, marginBottom: 18, padding: 3, background: "var(--surf-inset)", border: "1.5px solid var(--border-card)", borderRadius: "var(--r-control)", width: "fit-content" }}>
              {[["quick", "Quick"], ["advanced", "Advanced"]].map(([key, label]) => (
                <button key={key} onClick={() => setMode(key)} style={{
                  height: 32, padding: "0 18px", borderRadius: "calc(var(--r-control) - 4px)", border: "none",
                  background: mode === key ? "var(--surf)" : "transparent",
                  color: mode === key ? "var(--text)" : "var(--text-muted)",
                  fontWeight: mode === key ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  boxShadow: mode === key ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Photo dropzone */}
            {photos.length === 0 ? (
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                style={{
                  height: 168, borderRadius: "var(--r-card-hero)",
                  border: `1.5px dashed ${dragOver ? "var(--amber)" : "var(--border-card)"}`,
                  background: dragOver ? "var(--brand-tint)" : "var(--surf)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.15s", gap: 6, marginBottom: 14,
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: dragOver ? "rgba(255,106,26,0.15)" : "var(--surf-inset)", display: "grid", placeItems: "center" }}>
                  <Camera size={22} strokeWidth={1.75} color={dragOver ? "var(--amber)" : "var(--text-muted)"} />
                </div>
                <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14.5 }}>Tap to add photos</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>Up to {MAX_PHOTOS} · JPG, PNG, HEIC</div>
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                {/* Horizontal scroll strip */}
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                      <img src={p.dataUrl} alt={`Photo ${i + 1}`} style={{ width: 84, height: 84, borderRadius: "var(--r-card)", objectFit: "cover" }}/>
                      <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: 5, right: 5, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", display: "grid", placeItems: "center", fontWeight: 700, padding: 0 }}>✕</button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <div onClick={() => fileRef.current.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                      style={{ width: 84, height: 84, flexShrink: 0, borderRadius: "var(--r-card)", border: `1.5px dashed ${dragOver ? "var(--amber)" : "var(--border-card)"}`, background: "var(--surf)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 3 }}>
                      <span style={{ fontSize: 20, lineHeight: 1, color: "var(--text-muted)" }}>+</span>
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: "var(--text-muted)" }}>{MAX_PHOTOS - photos.length} left</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={e => { addFiles(e.target.files); e.target.value = ""; }}/>

            {globalError && (
              <div style={{ marginBottom: 12, padding: "10px 14px", background: "var(--fail-tint)", borderRadius: "var(--r-card)", fontSize: 12.5, color: "var(--issue)", border: "1.5px solid var(--issue)", fontWeight: 500 }}>{globalError}</div>
            )}

            {/* Advanced mode options — only show after photos added */}
            {mode === "advanced" && photos.length > 0 && (
              <>
                {/* Modules — first so user picks scope before anything else */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Analysis modules</label>
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
                            padding: "6px 14px",
                            border: `1.5px solid ${selected ? "var(--amber)" : "var(--border-card)"}`,
                            borderRadius: "var(--r-pill)",
                            background: selected ? "var(--brand-tint)" : "var(--surf)",
                            color: selected ? "var(--amber)" : "var(--text-muted)",
                            fontSize: 13, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                          }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Context */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
                    Context <span style={{ opacity: 0.5, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <textarea rows={2} placeholder='e.g. "Scaffold on Ipswich Motorway upgrade, Brisbane"'
                    value={context} onChange={e => setContext(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid var(--border-card)", background: "var(--surf-inset)", fontSize: 13.5, fontWeight: 500, resize: "none", color: "var(--text)", lineHeight: 1.5, borderRadius: "var(--r-input)", fontFamily: "inherit" }}/>
                </div>

                {/* Site */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
                    Site <span style={{ opacity: 0.5, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <select value={siteDropdownValue} onChange={e => setSiteDropdownValue(e.target.value)} style={{ ...inp }}>
                    <option value="none">No site</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option value="new">+ Create new site</option>
                  </select>
                  {siteDropdownValue === "new" && (
                    <input value={newSiteName} onChange={e => setNewSiteName(e.target.value)} placeholder="Site name"
                      style={{ ...inp, marginTop: 8, border: "1.5px solid var(--amber)" }}/>
                  )}
                </div>

                {/* Work types */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <label style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Work type <span style={{ opacity: 0.45, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                    </label>
                    {workTypes.length > 0 && (
                      <button onClick={() => setWorkTypes([])} style={{ fontSize: 11, fontWeight: 600, color: "var(--amber)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Clear</button>
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
                          onClick={() => setWorkTypes(prev => selected ? prev.filter(t => t !== type) : [...prev, type])}
                          style={{
                            padding: "5px 11px",
                            border: `1.5px solid ${selected ? "var(--amber)" : "var(--border-card)"}`,
                            borderRadius: "var(--r-pill)",
                            background: selected ? "var(--brand-tint)" : "var(--surf)",
                            color: selected ? "var(--amber)" : "var(--text-muted)",
                            fontSize: 12.5, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                            transition: "all 0.12s",
                          }}>
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </>
            )}

            {/* Analyse button */}
            {photos.length > 0 && (
              <button onClick={runAll}
                style={{
                  display: "flex", width: "100%", height: 50, alignItems: "center", justifyContent: "center", gap: 8,
                  background: "var(--amber)", border: "none",
                  borderRadius: "var(--r-control)", color: "#1B1A12",
                  fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "var(--shadow-btn)", marginBottom: 10,
                }}>
                {mode === "quick" ? "Quick safety check" : `Analyse ${photos.length} photo${photos.length > 1 ? "s" : ""}`}
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            )}

            {/* Footer */}
            <div style={{ borderTop: "1.5px solid var(--border-card)", marginTop: 6, paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={navigateToDashboard}
                style={{ height: 40, background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                ← Back
              </button>
              <span style={{ fontWeight: 600, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>AI · Queensland law · Not legal advice</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
