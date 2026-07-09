'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

type InvitePreview = {
  org_name: string | null
  role: 'admin' | 'member'
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  inviter_name: string | null
}

type PageState = 'loading' | 'not-found' | 'expired' | 'already-used' | 'valid' | 'success'
type AcceptError = 'wrong-account' | 'already-member' | 'server-error' | null

const IconBuilding = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <path d="M9 22v-4h6v4"/>
    <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
  </svg>
)

const IconCheck = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
)

const IconX = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const IconShield = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const IconUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/>
  </svg>
)

const Spinner = ({ size = 20, color = 'var(--amber)' }: { size?: number; color?: string }) => (
  <span style={{ width: size, height: size, border: '2px solid rgba(128,128,128,.2)', borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
)

const Disc = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <div style={{ width: 64, height: 64, borderRadius: '50%', background: color, display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
    {children}
  </div>
)

export default function InvitePage({ params }: { params: { token: string } }) {
  const { token } = params
  const router = useRouter()

  const [state, setState] = useState<PageState>('loading')
  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [authUser, setAuthUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState<AcceptError>(null)

  useEffect(() => {
    async function init() {
      const [{ data: { user } }, res] = await Promise.all([
        supabase.auth.getUser(),
        fetch(`/api/invites/accept?token=${encodeURIComponent(token)}`),
      ])
      setAuthUser(user ?? null)
      setAuthChecked(true)
      if (!res.ok) { setState('not-found'); return }
      const data: InvitePreview = await res.json()
      setInvite(data)
      if (data.status === 'expired') setState('expired')
      else if (data.status === 'accepted') setState('already-used')
      else setState('valid')
    }
    init()
  }, [token])

  const handleAccept = async () => {
    if (!authUser) {
      router.push(`/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`)
      return
    }
    setAccepting(true)
    setAcceptError(null)
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.ok) {
        setState('success')
        setTimeout(() => router.push('/dashboard'), 2200)
        return
      }
      if (res.status === 403) setAcceptError('wrong-account')
      else if (res.status === 409) setAcceptError('already-member')
      else setAcceptError('server-error')
    } catch {
      setAcceptError('server-error')
    } finally {
      setAccepting(false)
    }
  }

  const btn: React.CSSProperties = {
    width: '100%', height: 52, borderRadius: 'var(--r-control)', border: 'none',
    fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'opacity 0.15s',
  }

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--ff)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ height: 7, background: 'var(--hazard-bg)', flexShrink: 0 }} />

      <div style={{ flex: 1, maxWidth: 420, width: '100%', margin: '0 auto', padding: '32px 26px 56px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 44 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--amber)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <img src="/brand/mark-ink.svg" alt="" style={{ width: 28, height: 28 }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Site<b style={{ color: 'var(--amber)' }}>Spotter</b>
          </span>
        </div>

        {/* Loading */}
        {state === 'loading' && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <Spinner size={28} />
          </div>
        )}

        {/* Not found */}
        {state === 'not-found' && (
          <div style={{ textAlign: 'center' }}>
            <Disc color="var(--surf)">
              <div style={{ color: 'var(--mut)' }}><IconX /></div>
            </Disc>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 10 }}>
              This invite isn't valid
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.6, marginBottom: 28 }}>
              The invite link may have expired, been revoked, or already been used.
            </div>
            <button style={{ ...btn, background: 'var(--surf)', border: '1.5px solid var(--div)', color: 'var(--text)' }} onClick={() => router.push('/login')}>
              Sign in to SiteSpotter
            </button>
          </div>
        )}

        {/* Expired */}
        {state === 'expired' && (
          <div style={{ textAlign: 'center' }}>
            <Disc color="rgba(224,133,11,.12)">
              <div style={{ color: 'var(--warning)' }}><IconClock /></div>
            </Disc>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 10 }}>
              This invite has expired
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.6, marginBottom: 28 }}>
              Invite links are only valid for 7 days. Ask the person who invited you
              {invite?.org_name ? ` to ${invite.org_name}` : ''} to send a new one.
            </div>
            <button style={{ ...btn, background: 'var(--surf)', border: '1.5px solid var(--div)', color: 'var(--text)' }} onClick={() => router.push('/login')}>
              Sign in to SiteSpotter
            </button>
          </div>
        )}

        {/* Already used */}
        {state === 'already-used' && (
          <div style={{ textAlign: 'center' }}>
            <Disc color="var(--clear-bg)">
              <div style={{ color: 'var(--clear)' }}><IconCheck size={24} /></div>
            </Disc>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 10 }}>
              Already accepted
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.6, marginBottom: 28 }}>
              This invite has already been used{invite?.org_name ? ` to join ${invite.org_name}` : ''}.
              If you need access, ask a team member to invite you.
            </div>
            <button style={{ ...btn, background: 'var(--amber)', color: '#1B1A12' }} onClick={() => router.push('/dashboard')}>
              Go to SiteSpotter
            </button>
          </div>
        )}

        {/* Valid invite */}
        {state === 'valid' && invite && (
          <div>
            <Disc color="var(--brand-tint)">
              <div style={{ color: 'var(--amber)' }}><IconBuilding /></div>
            </Disc>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--mut)', marginBottom: 6, letterSpacing: '0.02em' }}>
                You've been invited to join
              </div>
              <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.15, marginBottom: 14 }}>
                {invite.org_name ?? 'an organisation'}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 'var(--r-pill)', background: 'var(--surf)', border: '1.5px solid var(--div)', fontSize: 11, fontWeight: 700, color: 'var(--text-label)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--ff-mono)' }}>
                <IconShield />
                AS {invite.role === 'admin' ? 'AN ADMIN' : 'A MEMBER'}
              </div>
            </div>

            {invite.inviter_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--surf)', borderRadius: 10, border: '1.5px solid var(--div)', marginBottom: 20 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surf-inset)', display: 'grid', placeItems: 'center', color: 'var(--mut)', flexShrink: 0 }}>
                  <IconUser />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--mut)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 1, fontFamily: 'var(--ff-mono)' }}>
                    Invited by
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
                    {invite.inviter_name}
                  </div>
                </div>
              </div>
            )}

            {acceptError === 'wrong-account' && (
              <div style={{ padding: '12px 14px', background: 'var(--issue-bg)', border: '1.5px solid var(--issue)', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--issue-tx-theme)', lineHeight: 1.5, marginBottom: 14 }}>
                This invite was sent to a different email address. Sign out and sign in with the invited email, or ask for a new invite.
              </div>
            )}
            {acceptError === 'server-error' && (
              <div style={{ padding: '12px 14px', background: 'var(--issue-bg)', border: '1.5px solid var(--issue)', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--issue-tx-theme)', lineHeight: 1.5, marginBottom: 14 }}>
                Something went wrong. Please try again.
              </div>
            )}
            {acceptError === 'already-member' && (
              <div style={{ padding: '12px 14px', background: 'var(--clear-bg)', border: '1.5px solid var(--clear)', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'var(--clear-tx)', lineHeight: 1.5, marginBottom: 14 }}>
                You're already a member of this organisation.
              </div>
            )}

            <button
              style={{ ...btn, background: 'var(--amber)', color: '#1B1A12', marginBottom: 10, opacity: accepting ? 0.6 : 1 }}
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting
                ? <><Spinner size={18} color="#1B1A12" /> Accepting…</>
                : <><div style={{ color: '#1B1A12' }}><IconCheck size={18} /></div> Accept invitation</>
              }
            </button>

            {acceptError === 'already-member' && (
              <button style={{ ...btn, background: 'transparent', border: '1.5px solid var(--div)', color: 'var(--text)', marginBottom: 10 }} onClick={() => router.push('/dashboard')}>
                Go to dashboard
              </button>
            )}

            <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.6, marginTop: 4 }}>
              {authChecked && authUser
                ? <>Signed in as <strong style={{ color: 'var(--text)' }}>{authUser.email}</strong></>
                : <>You'll create an account or sign in to continue.</>
              }
            </div>

            <div style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: 'var(--text-faint)', fontWeight: 500 }}>
              Not you? You can safely ignore this invite.
            </div>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <Disc color="var(--clear-bg)">
              <div style={{ color: 'var(--clear)' }}><IconCheck size={24} /></div>
            </Disc>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 10 }}>
              You're in!
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.6, marginBottom: 24 }}>
              Welcome to {invite?.org_name ?? 'the team'}. Taking you to your dashboard…
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Spinner size={22} />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
