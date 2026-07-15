'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { useUser } from '../../../lib/UserContext'
import AppHeader from '../../../components/AppHeader'

export default function EditProfilePage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [email,    setEmail]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [saved,    setSaved]    = useState(false)
  const { user, loading } = useUser()

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    const m = user.user_metadata || {}
    setFullName(m.full_name || '')
    setJobTitle(m.job_title || '')
    setEmail(user.email || '')
  }, [user, loading, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { setError('Full name is required'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), job_title: jobTitle.trim() }
    })
    if (err) { setError(err.message); setSaving(false); return }
    setSaved(true)
    setTimeout(() => router.push('/settings'), 800)
  }

  const initials = fullName.trim()
    ? fullName.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', height: 50, padding: '0 14px',
    border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-input)',
    background: 'var(--surf-inset)', color: 'var(--text)', fontSize: 14,
    fontWeight: 500, fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const label: React.CSSProperties = {
    fontWeight: 700, fontSize: 10.5, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, display: 'block',
  }

  if (loading) return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border-card)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  )

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 48 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input{outline:none}`}</style>
      <AppHeader variant="detail" title="Edit profile" onBack={() => router.back()}/>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '8px 18px 48px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Avatar preview — updates live as name is typed */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16, background: 'var(--amber)',
              display: 'grid', placeItems: 'center',
              fontSize: 26, fontWeight: 700, color: '#1B1A12', letterSpacing: '-0.02em',
            }}>
              {initials}
            </div>
          </div>

          {/* Full name */}
          <div>
            <label style={label}>Full name <span style={{ color: 'var(--amber)' }}>*</span></label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Ellie Marsden"
              required
              style={inp}
            />
          </div>

          {/* Job title */}
          <div>
            <label style={label}>
              Job title{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, opacity: 0.6 }}>(optional)</span>
            </label>
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Site Supervisor, Foreman…"
              style={inp}
            />
          </div>

          {/* Email — display only */}
          <div>
            <label style={label}>Email</label>
            <div style={{
              ...inp, display: 'flex', alignItems: 'center',
              color: 'var(--text-muted)', cursor: 'default', userSelect: 'none',
            }}>
              {email}
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', border: '1.5px solid var(--issue)',
              borderRadius: 'var(--r-card)', fontSize: 12.5, fontWeight: 500,
              color: 'var(--issue-tx-theme)', background: 'var(--issue-bg)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || saved}
            style={{
              height: 52, background: saved ? 'var(--clear)' : 'var(--amber)',
              border: 'none', borderRadius: 'var(--r-control)',
              color: '#1B1A12', fontSize: 15, fontWeight: 700,
              cursor: (saving || saved) ? 'default' : 'pointer',
              fontFamily: 'inherit', marginTop: 4,
              transition: 'background 0.2s', boxShadow: 'var(--shadow-btn)',
            }}
          >
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </main>
    </div>
  )
}
