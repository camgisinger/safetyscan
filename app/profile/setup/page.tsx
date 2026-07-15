'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { useUser } from '../../../lib/UserContext'

export default function ProfileSetupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const { user, loading } = useUser()

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    if (user.user_metadata?.full_name) router.push('/dashboard')
  }, [user, loading, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { setError('Full name is required'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), job_title: jobTitle.trim() }
    })
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/profile/branding?from=setup')
  }

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', height: 50, padding: '0 14px',
    border: '1.5px solid var(--line)', borderRadius: 6,
    background: 'var(--surf)', color: 'var(--text)', fontSize: 14,
    fontWeight: 500, fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <style>{`input{outline:none}`}</style>
      <div style={{ height: 7, background: 'var(--hazard-bg)', flexShrink: 0 }} />

      <div style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto', padding: '32px 18px 48px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 36 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--amber)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <img src="/brand/mark-black-white.png" alt="" style={{ width: 28, height: 28 }}/>
          </div>
          <span style={{ fontWeight: 600, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Site<b style={{ color: 'var(--amber)' }}>Spotter</b>
          </span>
        </div>

        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.18, color: 'var(--text)', marginBottom: 6 }}>
          Set up your profile.
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.5, marginBottom: 32 }}>
          This helps SiteSpotter tailor results for your role on site.
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

          <div>
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>Full name <span style={{ color: 'var(--amber)' }}>*</span></div>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Ellie Marsden" required autoFocus style={inp}/>
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>
              Your role{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </div>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Site Supervisor, Foreman…" style={inp}/>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', border: '1.5px solid var(--issue)', borderRadius: 6, fontSize: 12, fontWeight: 500, color: 'var(--issue-tx-theme)' }}>{error}</div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button type="submit" disabled={saving}
              style={{ height: 50, background: 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, color: '#1B1A12', fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Get started →'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard')}
              style={{ height: 40, background: 'transparent', border: 'none', color: 'var(--mut)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
