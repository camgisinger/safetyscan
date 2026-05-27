'use client'
import { useRouter, usePathname } from 'next/navigation'

export default function FloatingActionButton() {
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === '/') return null

  return (
    <button
      onClick={() => router.push('/')}
      style={{
        position: "fixed",
        bottom: 28,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        boxShadow: "0 4px 16px rgba(243,148,16,0.35)",
        zIndex: 30,
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      aria-label="New scan"
    >
      <img
        src="/fab-amber-ink.svg"
        alt="New scan"
        style={{ width: 56, height: 56, display: "block" }}
      />
    </button>
  )
}
