'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type Tab = 'signin' | 'signup'

function LoginContent() {
  const [tab, setTab]           = useState<Tab>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (tab === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // First-time login without profile → setup screen
        const needsSetup = !data.user?.user_metadata?.full_name
        router.push(needsSetup ? '/profile/setup' : redirectTo)
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSignedUp(true)
      }
    } catch (err: any) {
      const msg = typeof err?.message === 'string' && err.message.trim()
        ? err.message
        : typeof err?.error_description === 'string' && err.error_description.trim()
          ? err.error_description
          : 'Something went wrong. Please try again.'
      setError(msg)
    }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', height: 50,
    padding: '0 16px', borderRadius: 8, border: '1.5px solid var(--line)',
    background: 'var(--surf)', fontSize: 14, color: 'var(--text)', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input::placeholder{color:var(--mut)}`}</style>
      <div style={{ height: 7, background: 'var(--hazard-bg)', flexShrink: 0 }} />

      <div style={{ flex: 1, maxWidth: 420, width: '100%', margin: '0 auto', padding: '32px 26px 32px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        {signedUp ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📬</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Check your email</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.6, marginBottom: 24 }}>We sent a confirmation link to <strong>{email}</strong>.</div>
            <button onClick={() => { setTab('signin'); setSignedUp(false) }}
              style={{ height: 46, padding: '0 24px', background: 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, color: '#1B1A12', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--amber)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <img src="/brand/mark-black-white.png" alt="" style={{ width: 34, height: 34 }}/>
              </div>
              <span style={{ fontWeight: 500, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                Site<b style={{ fontWeight: 700, color: 'var(--amber)' }}>Spotter</b>
              </span>
            </div>

            {/* Heading */}
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 6, color: 'var(--text)' }}>
              Walk the site.<br/>Catch the gap.
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mut)', marginBottom: 24, lineHeight: 1.5 }}>
              QLD construction compliance in your pocket.
            </div>

            {/* Segmented toggle */}
            <div style={{ display: 'flex', padding: 3, borderRadius: 999, background: 'var(--surf)', border: '1.5px solid var(--line)', marginBottom: 24 }}>
              {(['signin', 'signup'] as Tab[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setError('') }}
                  style={{ flex: 1, textAlign: 'center', height: 38, borderRadius: 999, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: tab === t ? 'var(--amber)' : 'transparent', color: tab === t ? '#1B1A12' : 'var(--mut)' }}>
                  {t === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>Email</div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com.au" style={inp}/>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>Password</div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} style={inp}/>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'var(--issue-bg)', border: '1.5px solid var(--issue)', borderRadius: 6, fontSize: 12, fontWeight: 500, color: 'var(--issue-tx-theme)', fontFamily: 'var(--ff-mono)', letterSpacing: '0.04em' }}>{error}</div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--amber)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <svg width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M1 3L4 6L9 1" stroke="#1B1A12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  Keep me signed in
                </div>
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, color: 'var(--amber)' }}>Forgot?</button>
              </div>

              <button type="submit" disabled={loading}
                style={{ height: 50, background: loading ? 'rgba(238,128,26,0.5)' : 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, color: '#1B1A12', fontSize: 13.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(27,26,18,0.3)', borderTopColor: '#1B1A12', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }}/> Please wait…</> : tab === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1.5, background: 'var(--div)' }}/>
              <span style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--mut)' }}>or</span>
              <div style={{ flex: 1, height: 1.5, background: 'var(--div)' }}/>
            </div>

            <button style={{ height: 50, background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 18 18">
                <path d="M17.5 9.2c0-.7-.06-1.2-.15-1.7H9v3.4h4.7c-.1.9-.6 2.2-1.9 3l-.02.12 2.78 2.15.2.02c1.8-1.66 2.74-4.1 2.74-7z" fill="#4285F4"/>
                <path d="M9 18c2.5 0 4.6-.83 6.16-2.26l-2.94-2.28c-.8.55-1.84.94-3.22.94-2.5 0-4.6-1.62-5.35-3.86l-.11.01-2.9 2.24-.04.1A9 9 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.65 10.5A5.5 5.5 0 0 1 3.35 9c0-.53.1-1.04.28-1.5l-.01-.1L.7 5.13l-.1.05A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.05L3.65 10.5z" fill="#FBBC05"/>
                <path d="M9 3.6c1.77 0 2.96.77 3.64 1.4l2.66-2.6C13.6.84 11.5 0 9 0A9 9 0 0 0 .97 4.95L3.65 7.5C4.4 5.26 6.5 3.6 9 3.6z" fill="#EB4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 11.5, fontWeight: 500, color: 'var(--mut)', paddingTop: 20, opacity: 0.7 }}>
              By signing in you agree to our Terms · Privacy
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>
}
