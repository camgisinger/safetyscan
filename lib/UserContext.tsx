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

const UserContext = createContext<UserCtx>({ user: null, orgId: null, orgName: null, role: null, loading: true })

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      if (!user) { setLoading(false); return }
      supabase
        .from('organisation_members')
        .select('org_id, role, organisations(name)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          setOrgId(data?.org_id ?? null)
          setOrgName((data?.organisations as any)?.name ?? null)
          setRole(data?.role ?? null)
          setLoading(false)
        })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setOrgId(null); setOrgName(null); setRole(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  return <UserContext.Provider value={{ user, orgId, orgName, role, loading }}>{children}</UserContext.Provider>
}

export function useUser(): UserCtx {
  return useContext(UserContext)
}
