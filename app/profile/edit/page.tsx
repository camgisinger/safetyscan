'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import AppHeader from '../../../components/AppHeader'

const JOB_TITLES = [
  'Site Supervisor',
  'Project Manager / Superintendent',
  'Foreman',
  'Safety Officer',
  'Engineer',
  'Inspector / Certifier',
  'Subcontractor',
  'Other',
]

export default function EditProfilePage() {
  const router = useRouter()
  const [fullName,    setFullName]    = useState('')
  const [jobTitle,    setJobTitle]    = useState('')
  const [company,     setCompany]     = useState('')
  const [license,     setLicense]     = useState('')
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [saved,       setSaved]       = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const m = user.user_metadata || {}
      setFullName(m.full_name || '')
      setJobTitle(m.job_title || '')
      setCompany(m.company || '')
      setLicense(m.license || '')
      setLoading(false)
    }
    load()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { setError('Full name is required'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), job_title: jobTitle, company: company.trim(), license: license.trim() }
    })
    if (err) { setError(err.message); setSaving(false); return }
    setSaved(true)
    setTimeout(() => router.push('/profile'), 800)
  }

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', height: 50, padding: '0 14px',
    border: '1.5px solid var(--line)', borderRadius: 6,
    background: 'var(--bg)', color: 'var(--text)', fontSize: 14,
    fontWeight: 500, fontFamily: 'inherit', boxSizing: 'border-box',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid var(--line)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 48 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input,select{outline:none}`}</style>
      <AppHeader variant="detail" title="Edit profile" onBack={() => router.push('/profile')}/>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '8px 18px 48px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Avatar preview */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 16px' }}>
            <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--amber)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 600, color: '#1B1A12' }}>
              {(fullName || '?')[0].toUpperCase()}
            </div>
          </div>

          {/* Full name */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>Full name <span style={{ color: 'var(--amber)' }}>*</span></div>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Ellie Marsden" required style={inp}/>
          </div>

          {/* Job title */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>Job title</div>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Site Supervisor, Foreman…" style={inp}/>
          </div>

          {/* Company */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>Company <span style={{ opacity: 0.5 }}>(optional)</span></div>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Marsden Construction" style={inp}/>
          </div>

          {/* QBCC license */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>QBCC license no. <span style={{ opacity: 0.5 }}>(optional)</span></div>
            <input value={license} onChange={e => setLicense(e.target.value)} placeholder="e.g. 14821" style={inp}/>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', border: '1.5px solid var(--issue)', borderRadius: 6, fontSize: 12, fontWeight: 500, color: 'var(--issue-tx-theme)', background: 'var(--issue-bg)' }}>{error}</div>
          )}

          <button type="submit" disabled={saving || saved}
            style={{ height: 50, background: saved ? 'var(--clear)' : 'var(--amber)', border: '1.5px solid var(--line)', borderRadius: 8, color: '#1B1A12', fontSize: 13.5, fontWeight: 600, cursor: (saving || saved) ? 'default' : 'pointer', fontFamily: 'inherit', marginTop: 4, transition: 'background 0.2s' }}>
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </main>
    </div>
  )
}
