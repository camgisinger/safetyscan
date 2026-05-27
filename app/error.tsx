'use client'
import AppHeader from '@/components/AppHeader'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#EFEAE0", fontFamily: "Inter, system-ui, sans-serif" }}>
      <AppHeader />
      <div style={{ maxWidth: 400, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#16181C", marginBottom: 8 }}>Something went wrong</div>
        <div style={{ fontSize: 14, color: "#7A7468", lineHeight: 1.6, marginBottom: 32 }}>{error.message || "An unexpected error occurred. Please try again."}</div>
        <button onClick={reset} style={{ padding: "12px 24px", background: "#F39410", color: "#16181C", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginRight: 12 }}>Try again</button>
        <a href="/dashboard" style={{ display: "inline-block", padding: "12px 24px", background: "transparent", color: "#16181C", border: "1px solid rgba(0,0,0,0.18)", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Dashboard</a>
      </div>
    </div>
  )
}
