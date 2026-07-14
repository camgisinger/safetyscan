'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'

type UserCtx = {
  user: any | null
  orgId: string | null
  orgName: string | null
  role: string | null
  loading: boolean
}

const CACHE_KEY = 'ss_org'

function readOrgCache(): { orgId: string; orgName: string; role: string } | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') } catch { return null }
}

function writeOrgCache(v: { orgId: string | null; orgName: string | null; role: string | null } | null) {
  try {
    if (v?.orgId) localStorage.setItem(CACHE_KEY, JSON.stringify(v))
    else localStorage.removeItem(CACHE_KEY)
  } catch {}
}

const UserContext = createContext<UserCtx>({ user: null, orgId: null, orgName: null, role: null, loading: true })

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore org from cache immediately — before any network call
    const cached = readOrgCache()
    if (cached) {
      setOrgId(cached.orgId)
      setOrgName(cached.orgName)
      setRole(cached.role)
    }

    const fetchOrg = async (userId: string) => {
      const { data } = await supabase
        .from('organisation_members')
        .select('org_id, role, organisations(name)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()
      const next = {
        orgId: data?.org_id ?? null,
        orgName: (data?.organisations as any)?.name ?? null,
        role: data?.role ?? null,
      }
      setOrgId(next.orgId)
      setOrgName(next.orgName)
      setRole(next.role)
      writeOrgCache(next)
    }

    // onAuthStateChange fires INITIAL_SESSION from localStorage — no network round-trip
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)  // Auth resolved — stop showing skeleton immediately
      if (!u) {
        setOrgId(null); setOrgName(null); setRole(null)
        writeOrgCache(null)
        return
      }
      fetchOrg(u.id)  // Refresh org in background; cache already in state
    })

    return () => subscription.unsubscribe()
  }, [])

  return <UserContext.Provider value={{ user, orgId, orgName, role, loading }}>{children}</UserContext.Provider>
}

export function useUser(): UserCtx {
  return useContext(UserContext)
}
