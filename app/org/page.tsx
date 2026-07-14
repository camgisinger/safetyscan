'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../lib/UserContext'
import AppHeader from '../../components/AppHeader'
import { Mail, X, Check } from 'lucide-react'

type Tab = 'details' | 'members'

type Member = {
  user_id: string
  email: string
  full_name: string | null
  role: 'admin' | 'member'
  joined_at: string
}

type Invite = {
  id: string
  email: string
  role: 'admin' | 'member'
  status: string
  expires_at: string
  created_at: string
}

function initials(name: string | null, email: string) {
  if (name) return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return email[0].toUpperCase()
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '0 2px 8px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' as any }}>
    {children}
  </div>
)

function OrgPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, orgId, orgName, role: myRole, loading } = useUser()
  const isAdmin = myRole === 'admin'

  const [tab, setTab] = useState<Tab>('details')

  // Details
  const [orgAbn, setOrgAbn] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [abnInput, setAbnInput] = useState('')
  const [detailsLoaded, setDetailsLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Members
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  // Set tab from URL param
  useEffect(() => {
    setTab(searchParams.get('tab') === 'members' ? 'members' : 'details')
  }, [searchParams])

  // Redirect if no org
  useEffect(() => {
    if (!loading && (!user || !orgId)) router.push('/settings')
  }, [loading, user, orgId, router])

  // Load org details
  useEffect(() => {
    if (!orgId) return
    supabase.from('organisations').select('name, abn').eq('id', orgId).single()
      .then(({ data }) => {
        const name = data?.name ?? orgName ?? ''
        const abn = data?.abn ?? null
        setNameInput(name)
        setAbnInput(abn ?? '')
        setOrgAbn(abn)
        setDetailsLoaded(true)
      })
  }, [orgId, orgName])

  const loadMembers = useCallback(async () => {
    if (!orgId) return
    setMembersLoading(true)
    setActionError(null)
    const [membersRes, invitesRes] = await Promise.all([
      fetch(`/api/org/members?org_id=${orgId}`, { credentials: 'include' }),
      isAdmin ? fetch(`/api/invites?org_id=${orgId}`, { credentials: 'include' }) : Promise.resolve(null),
    ])
    if (membersRes.ok) {
      const d = await membersRes.json()
      setMembers(d.members || [])
    }
    if (invitesRes?.ok) {
      const d = await invitesRes.json()
      setInvites((d.invites || []).filter((i: Invite) => i.status === 'pending'))
    }
    setMembersLoading(false)
  }, [orgId, isAdmin])

  useEffect(() => {
    if (tab === 'members' && orgId) loadMembers()
  }, [tab, orgId, loadMembers])

  const isDirty = detailsLoaded && (
    nameInput.trim() !== (orgName ?? '') ||
    (abnInput.trim() || null) !== orgAbn
  )

  const handleSave = async () => {
    if (!orgId || !nameInput.trim()) return
    setSaving(true); setSaveError(null); setSaveSuccess(false)
    const body: Record<string, any> = { name: nameInput.trim() }
    const newAbn = abnInput.trim() || null
    if (newAbn !== orgAbn) body.abn = newAbn
    const res = await fetch(`/api/org?org_id=${orgId}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const d = await res.json()
      setOrgAbn(d.organisation?.abn ?? null)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } else {
      const d = await res.json()
      setSaveError(d.error || 'Failed to save')
    }
    setSaving(false)
  }

  const handleChangeRole = async (member: Member, newRole: 'admin' | 'member') => {
    setActionError(null)
    const res = await fetch(`/api/org/members?org_id=${orgId}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: member.user_id, role: newRole }),
    })
    if (res.ok) {
      setMembers(prev => prev.map(m => m.user_id === member.user_id ? { ...m, role: newRole } : m))
    } else {
      const d = await res.json()
      setActionError(d.error || 'Failed to change role')
    }
  }

  const handleRemove = async (member: Member) => {
    if (!confirm(`Remove ${member.full_name || member.email} from this organisation?`)) return
    setActionError(null)
    const res = await fetch(`/api/org/members?org_id=${orgId}&user_id=${member.user_id}`, {
      method: 'DELETE', credentials: 'include',
    })
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.user_id !== member.user_id))
    } else {
      const d = await res.json()
      setActionError(d.error || 'Failed to remove member')
    }
  }

  const handleRevokeInvite = async (inv: Invite) => {
    const res = await fetch(`/api/invites?id=${inv.id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) setInvites(prev => prev.filter(i => i.id !== inv.id))
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !orgId) return
    setInviting(true); setInviteError(null); setInviteSuccess(null)
    const res = await fetch('/api/invites', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, email: inviteEmail.trim(), role: inviteRole }),
    })
    const d = await res.json()
    if (res.ok) {
      setInviteSuccess(d.email_sent ? `Invite sent to ${d.email}` : `Invite created for ${d.email}`)
      setInviteEmail('')
      setInvites(prev => [{ id: d.id, email: d.email, role: d.role, status: 'pending', expires_at: d.expires_at, created_at: new Date().toISOString() }, ...prev])
    } else {
      setInviteError(d.error || 'Failed to send invite')
    }
    setInviting(false)
  }

  if (loading || !orgId) return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border-card)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', height: 46, padding: '0 14px',
    border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-input)',
    background: 'var(--surf-inset)', color: 'var(--text)',
    fontSize: 14, fontWeight: 500, fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div className="page-fade-in" style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 96 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AppHeader title={orgName || 'Organisation'} />

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '16px 18px 0' }}>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 20, padding: 3, background: 'var(--surf-inset)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-control)', width: 'fit-content' }}>
          {(['details', 'members'] as const).map(key => (
            <button key={key} onClick={() => setTab(key)} style={{
              height: 32, padding: '0 18px', borderRadius: 'calc(var(--r-control) - 4px)', border: 'none',
              background: tab === key ? 'var(--surf)' : 'transparent',
              color: tab === key ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: tab === key ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              textTransform: 'capitalize',
            }}>{key}</button>
          ))}
        </div>

        {/* ── DETAILS TAB ───────────────────────────────────────────────── */}
        {tab === 'details' && (
          <div>
            <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', padding: 18, marginBottom: 14 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                  Organisation name
                </label>
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="Organisation name"
                  style={{
                    ...inp,
                    border: isAdmin ? '1.5px solid var(--border-card)' : '1.5px solid transparent',
                    background: isAdmin ? 'var(--surf-inset)' : 'transparent',
                    fontWeight: 600, fontSize: 15,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                  ABN <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  value={abnInput}
                  onChange={e => setAbnInput(e.target.value)}
                  disabled={!isAdmin}
                  placeholder={isAdmin ? 'e.g. 12 345 678 901' : 'Not set'}
                  style={{
                    ...inp,
                    border: isAdmin ? '1.5px solid var(--border-card)' : '1.5px solid transparent',
                    background: isAdmin ? 'var(--surf-inset)' : 'transparent',
                  }}
                />
              </div>
            </div>

            {saveError && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--fail-tint)', borderRadius: 'var(--r-card)', fontSize: 13, color: 'var(--issue)', border: '1.5px solid var(--issue)', fontWeight: 500 }}>
                {saveError}
              </div>
            )}

            {isAdmin && (
              <button onClick={handleSave} disabled={saving || !isDirty} style={{
                width: '100%', height: 48,
                background: saveSuccess ? 'var(--pass)' : isDirty ? 'var(--amber)' : 'var(--surf)',
                border: `1.5px solid ${isDirty || saveSuccess ? 'transparent' : 'var(--border-card)'}`,
                borderRadius: 'var(--r-control)',
                color: saveSuccess ? '#fff' : isDirty ? '#1B1A12' : 'var(--text-muted)',
                fontSize: 14, fontWeight: 700, cursor: isDirty ? 'pointer' : 'default',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: saving ? 0.6 : 1, transition: 'all 0.2s',
              }}>
                {saveSuccess ? <><Check size={16} strokeWidth={2.5} /> Saved</> : saving ? 'Saving…' : 'Save changes'}
              </button>
            )}
          </div>
        )}

        {/* ── MEMBERS TAB ───────────────────────────────────────────────── */}
        {tab === 'members' && (
          <div>
            {actionError && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--fail-tint)', borderRadius: 'var(--r-card)', fontSize: 13, color: 'var(--issue)', border: '1.5px solid var(--issue)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1 }}>{actionError}</span>
                <button onClick={() => setActionError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--issue)', padding: 0, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            )}

            {/* Member list */}
            <div style={{ marginBottom: 20 }}>
              <SectionLabel>{membersLoading ? 'Members' : `${members.length} member${members.length !== 1 ? 's' : ''}`}</SectionLabel>
              {membersLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
                  <div style={{ width: 24, height: 24, border: '2px solid var(--border-card)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              ) : (
                <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
                  {members.map((m, i) => {
                    const isMe = m.user_id === user?.id
                    return (
                      <div key={m.user_id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                        borderTop: i > 0 ? '1.5px solid var(--border-subtle)' : 'none',
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--amber)', display: 'grid', placeItems: 'center',
                          fontSize: 13, fontWeight: 700, color: '#1B1A12',
                        }}>
                          {initials(m.full_name, m.email)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {m.full_name || m.email}
                            {isMe && <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>You</span>}
                          </div>
                          {m.full_name && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{m.email}</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {isAdmin && !isMe ? (
                            <>
                              <select
                                value={m.role}
                                onChange={e => handleChangeRole(m, e.target.value as 'admin' | 'member')}
                                style={{
                                  height: 30, padding: '0 8px 0 10px',
                                  borderRadius: 'var(--r-pill)',
                                  border: '1.5px solid var(--border-card)',
                                  background: 'var(--surf-inset)', color: 'var(--text)',
                                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                                }}
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                              </select>
                              <button onClick={() => handleRemove(m)} style={{
                                width: 30, height: 30, borderRadius: 'var(--r-pill)', flexShrink: 0,
                                border: '1.5px solid var(--border-card)', background: 'var(--surf-inset)',
                                color: 'var(--text-muted)', cursor: 'pointer', display: 'grid', placeItems: 'center',
                              }}>
                                <X size={14} strokeWidth={2} />
                              </button>
                            </>
                          ) : (
                            <span style={{
                              padding: '3px 10px', borderRadius: 'var(--r-pill)', fontSize: 11.5, fontWeight: 600,
                              background: m.role === 'admin' ? 'var(--brand-tint)' : 'var(--surf-inset)',
                              color: m.role === 'admin' ? 'var(--amber)' : 'var(--text-muted)',
                              border: `1.5px solid ${m.role === 'admin' ? 'var(--border-card)' : 'var(--border-subtle)'}`,
                            }}>
                              {m.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pending invites — admin only */}
            {isAdmin && invites.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <SectionLabel>Pending invites</SectionLabel>
                <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
                  {invites.map((inv, i) => (
                    <div key={inv.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      borderTop: i > 0 ? '1.5px solid var(--border-subtle)' : 'none',
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--surf-inset)', border: '1.5px dashed var(--border-card)',
                        display: 'grid', placeItems: 'center',
                      }}>
                        <Mail size={15} strokeWidth={1.75} color="var(--text-muted)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                          {inv.role === 'admin' ? 'Admin' : 'Member'} · expires {new Date(inv.expires_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <button onClick={() => handleRevokeInvite(inv)} style={{
                        height: 30, padding: '0 12px', borderRadius: 'var(--r-pill)', flexShrink: 0,
                        border: '1.5px solid var(--border-card)', background: 'var(--surf-inset)',
                        color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                      }}>
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invite form — admin only */}
            {isAdmin && (
              <div>
                <SectionLabel>Invite someone</SectionLabel>
                <div style={{ background: 'var(--surf)', border: '1.5px solid var(--border-card)', borderRadius: 'var(--r-card)', padding: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: inviteError || inviteSuccess ? 10 : 10 }}>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={inviteEmail}
                      onChange={e => { setInviteEmail(e.target.value); setInviteError(null); setInviteSuccess(null) }}
                      onKeyDown={e => e.key === 'Enter' && handleInvite()}
                      style={{ ...inp, flex: 1, height: 42 }}
                    />
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value as 'admin' | 'member')}
                      style={{
                        height: 42, padding: '0 10px', borderRadius: 'var(--r-input)', flexShrink: 0,
                        border: '1.5px solid var(--border-card)', background: 'var(--surf-inset)',
                        color: 'var(--text)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {inviteError && (
                    <div style={{ marginBottom: 10, padding: '8px 12px', background: 'var(--fail-tint)', borderRadius: 8, fontSize: 12.5, color: 'var(--issue)', fontWeight: 500 }}>{inviteError}</div>
                  )}
                  {inviteSuccess && (
                    <div style={{ marginBottom: 10, padding: '8px 12px', background: 'var(--pass-tint)', borderRadius: 8, fontSize: 12.5, color: 'var(--pass-deep)', fontWeight: 500 }}>{inviteSuccess}</div>
                  )}

                  <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} style={{
                    width: '100%', height: 44,
                    background: inviteEmail.trim() ? 'var(--amber)' : 'var(--surf-inset)',
                    border: 'none', borderRadius: 'var(--r-control)',
                    color: inviteEmail.trim() ? '#1B1A12' : 'var(--text-muted)',
                    fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                    cursor: inviteEmail.trim() && !inviting ? 'pointer' : 'default',
                    opacity: inviting ? 0.6 : 1,
                  }}>
                    {inviting ? 'Sending…' : 'Send invite'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrgPageWrapper() {
  return (
    <Suspense>
      <OrgPage />
    </Suspense>
  )
}
