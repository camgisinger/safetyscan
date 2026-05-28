'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type Tab = 'signin' | 'signup'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    setIsDark(saved !== 'light')
  }, [])

  const markSrc = isDark ? '/brand/mark-amber.svg' : '/brand/mark-ink.svg'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSignedUp(true)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', height: 50, padding: '0 16px',
    borderRadius: 12, border: 'none', outline: 'none',
    background: 'var(--card)',
    boxShadow: 'inset 0 0 0 1px var(--border)',
    fontSize: 14, fontFamily: 'var(--ff-sans)', color: 'var(--text)',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--ff-sans)', display: 'flex', flexDirection: 'column' }}>
      <style>{`input::placeholder{color:var(--text-dim)}`}</style>

      <div style={{ flex: 1, maxWidth: 420, width: '100%', margin: '0 auto', padding: '40px 26px 32px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

        {signedUp ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Check your email</div>
            <div style={{ fontSize: 13, color: 'var(--text-mut)', lineHeight: 1.6, marginBottom: 24 }}>
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
            </div>
            <button onClick={() => { setTab('signin'); setSignedUp(false) }}
              style={{ height: 44, padding: '0 24px', background: 'var(--amber)', border: 'none', borderRadius: 999, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ff-sans)' }}>
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--card)', boxShadow: '0 0 0 1px var(--border)', display: 'grid', placeItems: 'center' }}>
                <img src={markSrc} alt="" style={{ width: 32, height: 32 }}/>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)' }}>
                Safety<span style={{ color: 'var(--amber)' }}>Scan</span>
              </div>
            </div>

            {/* Headline */}
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 6, color: 'var(--text)' }}>
              Walk the site.<br/>Catch the gap.
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-mut)', marginBottom: 20, lineHeight: 1.5 }}>
              QLD construction compliance in your pocket.
            </div>

            {/* Tab toggle */}
            <div style={{ display: 'flex', padding: 4, borderRadius: 999, background: 'var(--card-2)', marginBottom: 28 }}>
              {(['signin', 'signup'] as Tab[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setError('') }}
                  style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 999, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--ff-sans)', background: tab === t ? 'var(--amber)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-mut)', transition: 'all 0.15s' }}>
                  {t === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)', marginBottom: 6, paddingLeft: 2 }}>Email</div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com.au" style={inputStyle}/>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-mut)', marginBottom: 6, paddingLeft: 2 }}>Password</div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} style={inputStyle}/>
              </div>

              {error && (
                <div style={{ padding: '10px 12px', background: 'var(--status-red-bg)', borderRadius: 10, fontSize: 12, color: 'var(--status-red)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ height: 50, background: loading ? 'rgba(243,148,16,0.5)' : 'var(--amber)', border: 'none', borderRadius: 999, color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--ff-sans)', marginTop: 6, boxShadow: loading ? 'none' : 'var(--shadow-btn-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}/>
                    Please wait…
                  </>
                ) : tab === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--divider)' }}/>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--divider)' }}/>
            </div>

            <button style={{ height: 50, background: 'var(--card)', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--ff-sans)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 0 0 1px var(--border)' }}>
              <svg width="16" height="16" viewBox="0 0 18 18">
                <path d="M17.5 9.2c0-.7-.06-1.2-.15-1.7H9v3.4h4.7c-.1.9-.6 2.2-1.9 3l-.02.12 2.78 2.15.2.02c1.8-1.66 2.74-4.1 2.74-7z" fill="#4285F4"/>
                <path d="M9 18c2.5 0 4.6-.83 6.16-2.26l-2.94-2.28c-.8.55-1.84.94-3.22.94-2.5 0-4.6-1.62-5.35-3.86l-.11.01-2.9 2.24-.04.1A9 9 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.65 10.5A5.5 5.5 0 0 1 3.35 9c0-.53.1-1.04.28-1.5l-.01-.1L.7 5.13l-.1.05A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.05L3.65 10.5z" fill="#FBBC05"/>
                <path d="M9 3.6c1.77 0 2.96.77 3.64 1.4l2.66-2.6C13.6.84 11.5 0 9 0A9 9 0 0 0 .97 4.95L3.65 7.5C4.4 5.26 6.5 3.6 9 3.6z" fill="#EB4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 11.5, color: 'var(--text-mut)', paddingTop: 24, opacity: 0.55, lineHeight: 1.5 }}>
              By signing in you agree to our Terms · Privacy
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
