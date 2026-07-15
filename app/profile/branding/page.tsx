'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, BRAND_LOGOS_BUCKET } from '../../../lib/supabase'
import { useUser } from '../../../lib/UserContext'

async function compressImage(file: File, maxDim: number): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.85)
    }
    img.src = url
  })
}

export default function BrandingPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fromSetup, setFromSetup] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const [pageLoading, setPageLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setFromSetup(new URLSearchParams(window.location.search).get('from') === 'setup')
  }, [])

  useEffect(() => {
    if (userLoading) return
    if (!user) { router.push('/login'); return }
    supabase.from('profiles')
      .select('company_name, logo_url, company_email, company_phone, company_website')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setCompanyName(data.company_name || '')
          setCompanyEmail(data.company_email || '')
          setCompanyPhone(data.company_phone || '')
          setCompanyWebsite(data.company_website || '')
          setLogoUrl(data.logo_url || null)
        }
        setPageLoading(false)
      })
  }, [user, userLoading, router])

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true); setError('')
    try {
      const compressed = await compressImage(file, 400)
      const path = `${user.id}/logo.jpg`
      const { error: uploadError } = await supabase.storage
        .from(BRAND_LOGOS_BUCKET)
        .upload(path, compressed, { contentType: 'image/jpeg', upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from(BRAND_LOGOS_BUCKET).getPublicUrl(path)
      setLogoUrl(urlData.publicUrl + '?v=' + Date.now())
    } catch {
      setError('Logo upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    if (!user) return
    await supabase.storage.from(BRAND_LOGOS_BUCKET).remove([`${user.id}/logo.jpg`])
    await supabase.from('profiles').upsert({ id: user.id, logo_url: null, updated_at: new Date().toISOString() })
    setLogoUrl(null)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true); setError('')
    const cleanLogoUrl = logoUrl ? logoUrl.split('?')[0] : null
    const { error: err } = await supabase.from('profiles').upsert({
      id: user.id,
      company_name: companyName.trim() || null,
      company_email: companyEmail.trim() || null,
      company_phone: companyPhone.trim() || null,
      company_website: companyWebsite.trim() || null,
      logo_url: cleanLogoUrl,
      updated_at: new Date().toISOString(),
    })
    if (err) { setError(err.message); setSaving(false); return }
    setSaved(true)
    setTimeout(() => router.push(fromSetup ? '/dashboard' : '/settings'), 600)
  }

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', height: 50, padding: '0 14px',
    border: '1.5px solid var(--line)', borderRadius: 6,
    background: 'var(--surf)', color: 'var(--text)', fontSize: 14,
    fontWeight: 500, fontFamily: 'inherit', boxSizing: 'border-box',
  }

  if (pageLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: '2px solid var(--line)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <style>{`input{outline:none} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ height: 7, background: 'var(--hazard-bg)', flexShrink: 0 }} />

      <div style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto', padding: '32px 18px 48px', boxSizing: 'border-box' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 36 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--amber)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <img src="/brand/mark-black-white.png" alt="" style={{ width: 34, height: 34 }} />
          </div>
          <span style={{ fontWeight: 500, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Site<b style={{ fontWeight: 700, color: 'var(--amber)' }}>Spotter</b>
          </span>
        </div>

        {fromSetup && (
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 8 }}>
            Step 2 of 2 · Optional
          </div>
        )}

        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.18, color: 'var(--text)', marginBottom: 6 }}>
          Branding.
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.5, marginBottom: 32 }}>
          Your logo and company details appear on exported PDF reports.
        </div>

        {/* Logo upload */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 10 }}>Logo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: 80, height: 80, borderRadius: 12, flexShrink: 0,
                background: 'var(--surf)', border: `1.5px ${logoUrl ? 'solid' : 'dashed'} var(--line)`,
                cursor: uploading ? 'not-allowed' : 'pointer', overflow: 'hidden', padding: 0,
                display: 'grid', placeItems: 'center',
              }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : uploading ? (
                <div style={{ width: 22, height: 22, border: '2px solid var(--line)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="1" y="1" width="20" height="20" rx="4" stroke="var(--mut)" strokeWidth="1.4" strokeDasharray="3 2" />
                    <path d="M11 7v8M7 11h8" stroke="var(--mut)" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--mut)', letterSpacing: '0.06em' }}>UPLOAD</span>
                </div>
              )}
            </button>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                {logoUrl ? 'Logo uploaded' : 'Upload your logo'}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.6 }}>
                PNG, JPG or WebP · Max 5 MB<br />Appears on exported PDF reports
              </div>
              {logoUrl && (
                <button onClick={handleRemoveLogo} style={{
                  marginTop: 8, fontSize: 12, fontWeight: 600,
                  color: 'var(--issue-tx-theme)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                }}>
                  Remove logo
                </button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>Company / organisation name</div>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. XYZ Constructions" style={inp} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>
              Website <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </div>
            <input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="e.g. acmesafety.com.au" style={inp} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>
              Phone <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </div>
            <input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="e.g. 07 1234 5678" style={inp} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 6 }}>
              Email <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </div>
            <input value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} placeholder="e.g. safety@acme.com.au" style={inp} />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '10px 14px', border: '1.5px solid var(--issue)', borderRadius: 6, fontSize: 12, fontWeight: 500, color: 'var(--issue-tx-theme)' }}>{error}</div>
        )}

        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            style={{
              height: 50, background: saved ? 'var(--pass)' : 'var(--amber)',
              border: 'none', borderRadius: 8, color: '#1B1A12',
              fontSize: 13.5, fontWeight: 600,
              cursor: saving || saved ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
              transition: 'background 0.2s',
            }}
          >
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save branding'}
          </button>
          <button
            onClick={() => router.push(fromSetup ? '/dashboard' : '/profile')}
            style={{ height: 40, background: 'transparent', border: 'none', color: 'var(--mut)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {fromSetup ? 'Skip for now' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
