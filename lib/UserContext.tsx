'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'

type UserCtx = {
  user: any | null
  loading: boolean
  companyName: string | null
}

const UserContext = createContext<UserCtx>({ user: null, loading: true, companyName: null })

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch company name once per login — eliminates per-page sidebar query
  useEffect(() => {
    if (!user) { setCompanyName(null); return }
    supabase.from('profiles').select('company_name').eq('id', user.id).single()
      .then(({ data }) => setCompanyName(data?.company_name ?? null))
  }, [user?.id])

  return (
    <UserContext.Provider value={{ user, loading, companyName }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserCtx {
  return useContext(UserContext)
}
