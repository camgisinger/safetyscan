'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from './supabase'

export type OrgEntry = { id: string; name: string; role: string }

type OrgCache = { all: OrgEntry[]; activeId: string }

type UserCtx = {
  user: any | null
  orgId: string | null
  orgName: string | null
  role: string | null
  allOrgs: OrgEntry[]
  loading: boolean
  setActiveOrg: (orgId: string) => void
}

const CACHE_KEY = 'ss_orgs'

function readOrgCache(): OrgCache | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(CACHE_KEY)
    if (v) return JSON.parse(v)
    // Migrate from old single-org key
    const old = localStorage.getItem('ss_org')
    if (old) {
      const o = JSON.parse(old)
      if (o?.orgId) return { all: [{ id: o.orgId, name: o.orgName ?? '', role: o.role ?? 'member' }], activeId: o.orgId }
    }
    return null
  } catch { return null }
}

function writeOrgCache(v: OrgCache | null) {
  try {
    localStorage.removeItem('ss_org')
    if (v) localStorage.setItem(CACHE_KEY, JSON.stringify(v))
    else localStorage.removeItem(CACHE_KEY)
  } catch {}
}

const UserContext = createContext<UserCtx>({
  user: null, orgId: null, orgName: null, role: null, allOrgs: [], loading: true, setActiveOrg: () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [allOrgs, setAllOrgs] = useState<OrgEntry[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const setActiveOrg = useCallback((orgId: string) => {
    setActiveOrgId(orgId)
    const cached = readOrgCache()
    if (cached) writeOrgCache({ ...cached, activeId: orgId })
  }, [])

  useEffect(() => {
    const cached = readOrgCache()
    if (cached?.all?.length) {
      setAllOrgs(cached.all)
      setActiveOrgId(cached.activeId)
    }

    const fetchOrgs = async (userId: string) => {
      const { data } = await supabase
        .from('organisation_members')
        .select('org_id, role, organisations(name)')
        .eq('user_id', userId)

      const orgs: OrgEntry[] = (data || []).map((m: any) => ({
        id: m.org_id,
        name: m.organisations?.name ?? '',
        role: m.role ?? 'member',
      }))

      setAllOrgs(orgs)
      setActiveOrgId(prev => {
        const next = orgs.some(o => o.id === prev) ? prev : (orgs[0]?.id ?? null)
        writeOrgCache(orgs.length && next ? { all: orgs, activeId: next } : null)
        return next
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)
      if (!u) {
        setAllOrgs([])
        setActiveOrgId(null)
        writeOrgCache(null)
        return
      }
      fetchOrgs(u.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  const activeOrg = allOrgs.find(o => o.id === activeOrgId) ?? allOrgs[0] ?? null

  return (
    <UserContext.Provider value={{
      user,
      orgId: activeOrg?.id ?? null,
      orgName: activeOrg?.name ?? null,
      role: activeOrg?.role ?? null,
      allOrgs,
      loading,
      setActiveOrg,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserCtx {
  return useContext(UserContext)
}
