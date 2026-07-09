'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'

type UserCtx = {
  user: any | null
  orgId: string | null
  loading: boolean
}

const UserContext = createContext<UserCtx>({ user: null, orgId: null, loading: true })

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      if (!user) { setLoading(false); return }
      supabase
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()
        .then(({ data }) => {
          setOrgId(data?.org_id ?? null)
          setLoading(false)
        })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setOrgId(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return <UserContext.Provider value={{ user, orgId, loading }}>{children}</UserContext.Provider>
}

export function useUser(): UserCtx {
  return useContext(UserContext)
}
