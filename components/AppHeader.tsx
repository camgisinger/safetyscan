'use client'
import { useRouter } from 'next/navigation'

const ShieldLogo = () => (
  <svg width="32" height="32" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.7">
      <path d="M14 14 H58 V25 H25 V58 H14 Z" fill="#EFEAE0"/>
      <path d="M226 14 H182 V25 H215 V58 H226 Z" fill="#EFEAE0"/>
      <path d="M14 226 H58 V215 H25 V182 H14 Z" fill="#EFEAE0"/>
      <path d="M226 226 H182 V215 H215 V182 H226 Z" fill="#EFEAE0"/>
    </g>
    <path d="M120 32 L190 56 V128 C190 170 162 196 120 214 C78 196 50 170 50 128 V56 Z" fill="none" stroke="#F39410" strokeWidth="8" strokeLinejoin="miter"/>
    <polyline points="88,120 110,142 154,96" fill="none" stroke="#F39410" strokeWidth="16" strokeLinecap="square" strokeLinejoin="miter"/>
  </svg>
)

interface AppHeaderProps {
  rightContent?: React.ReactNode
}

export default function AppHeader({ rightContent }: AppHeaderProps) {
  const router = useRouter()
  return (
    <header style={{ background: '#16181C', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
      <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
        <ShieldLogo />
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>
          <span style={{ color: '#EFEAE0' }}>Safety</span><span style={{ color: '#F39410' }}>Scan</span>
        </div>
      </button>
      {rightContent && <div>{rightContent}</div>}
    </header>
  )
}
