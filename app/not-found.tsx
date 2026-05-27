import AppHeader from '@/components/AppHeader'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#EFEAE0", fontFamily: "Inter, system-ui, sans-serif" }}>
      <AppHeader />
      <div style={{ maxWidth: 400, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#F39410", marginBottom: 8 }}>404</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#16181C", marginBottom: 8 }}>Page not found</div>
        <div style={{ fontSize: 14, color: "#7A7468", lineHeight: 1.6, marginBottom: 32 }}>The page you are looking for does not exist or has been moved.</div>
        <Link href="/dashboard" style={{ display: "inline-block", padding: "12px 24px", background: "#16181C", color: "#EFEAE0", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Back to dashboard</Link>
      </div>
    </div>
  )
}
