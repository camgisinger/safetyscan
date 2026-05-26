'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const NAVY = '#0F1923'
const AMBER = '#F5A623'
const OFFWHITE = '#F1EFE8'

export default function LoginPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const router = useRouter()

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

  return (
    <div style={{ minHeight: '100vh', background: OFFWHITE, fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: NAVY, padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
          <span style={{ color: '#fff' }}>Safety</span><span style={{ color: AMBER }}>Scan</span>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>CONSTRUCTION COMPLIANCE</div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
        <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, padding: 28, border: '0.5px solid #E0DDD6' }}>

          {signedUp ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Check your email</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and sign in.
              </div>
              <button onClick={() => { setTab('signin'); setSignedUp(false) }}
                style={{ marginTop: 20, padding: '10px 24px', background: NAVY, border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
                {tab === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 22, lineHeight: 1.5 }}>
                {tab === 'signin' ? 'Sign in to access your scans and projects.' : 'Start checking Queensland compliance today.'}
              </p>

              <div style={{ display: 'flex', background: OFFWHITE, borderRadius: 10, padding: 3, marginBottom: 24 }}>
                {(['signin', 'signup'] as const).map(t => (
                  <button key={t} onClick={() => { setTab(t); setError('') }}
                    style={{ flex: 1, padding: '8px 0', fontSize: 13, fontWeight: tab === t ? 700 : 400, color: tab === t ? NAVY : '#888', background: tab === t ? '#fff' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                    {t === 'signin' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 5 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #C8C5BE', background: '#FAFAF8', fontSize: 13, fontFamily: 'inherit', color: '#1a1a1a', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#444', display: 'block', marginBottom: 5 }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #C8C5BE', background: '#FAFAF8', fontSize: 13, fontFamily: 'inherit', color: '#1a1a1a', boxSizing: 'border-box' }} />
                </div>

                {error && (
                  <div style={{ marginBottom: 14, padding: '9px 12px', background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 8, fontSize: 12, color: '#A32D2D' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: 13, background: loading ? '#888' : NAVY, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {loading ? 'Please wait...' : tab === 'signin' ? 'Sign in →' : 'Create account →'}
                </button>
              </form>

              {tab === 'signup' && (
                <p style={{ marginTop: 14, fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.6 }}>
                  By creating an account you agree to our terms of service.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
