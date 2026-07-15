'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

interface AppHeaderProps {
  variant?: 'main' | 'detail' | 'modal'
  title?: string
  onBack?: () => void
  onClose?: () => void
  rightContent?: React.ReactNode
  // legacy props — accepted but unused in new design
  onLogoClick?: () => void
  rightAction?: string
}

export default function AppHeader({
  variant = 'main',
  title,
  onBack,
  onClose,
  rightContent,
}: AppHeaderProps) {
  const router = useRouter()

  const handleBack  = () => onBack  ? onBack()  : router.back()
  const handleClose = () => onClose ? onClose() : router.back()

  const iconBtn: React.CSSProperties = {
    width: 38, height: 38,
    borderRadius: 'var(--r-control-sm)',
    display: 'grid', placeItems: 'center',
    border: '1.5px solid var(--border-card)',
    background: 'var(--surf)',
    color: 'var(--text)',
    flexShrink: 0, cursor: 'pointer',
  }

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)' }}>
      <header style={{
        display: 'flex', alignItems: 'center',
        padding: '12px 18px 11px',
        minHeight: 52, gap: 12,
      }}>
        {variant === 'main' ? (
          <>
            {title ? (
              <h1 style={{ flex: 1, margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.1 }}>
                {title}
              </h1>
            ) : (
              <button onClick={() => router.push('/dashboard')} className="desktop-hidden"
                style={{ flex: 1, background: 'none', border: 'none', padding: 0, alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--amber)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <img src="/brand/mark-black-white.png" alt="" style={{ width: 24, height: 24 }} />
                </div>
                <span style={{ fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                  Site<b style={{ fontWeight: 700, color: 'var(--amber)' }}>Spotter</b>
                </span>
              </button>
            )}
            {rightContent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {rightContent}
              </div>
            )}
            <div className="desktop-hidden" style={{ alignItems: 'center', gap: 8 }}>
              <ThemeToggle compact />
            </div>
          </>
        ) : (
          <>
            <button onClick={variant === 'modal' ? handleClose : handleBack} style={{ ...iconBtn }}>
              {variant === 'modal'
                ? <X size={18} strokeWidth={2} />
                : <ArrowLeft size={18} strokeWidth={2} />
              }
            </button>
            {title ? (
              <span style={{ flex: 1, fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </span>
            ) : (
              <div style={{ flex: 1 }} />
            )}
            {rightContent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {rightContent}
              </div>
            )}
          </>
        )}
      </header>
    </div>
  )
}
