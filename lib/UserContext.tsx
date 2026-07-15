'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'

type UserCtx = {
  user: any | null
  loading: boolean
}

const UserContext = createContext<UserCtx>({ user: null, loading: true })

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserCtx {
  return useContext(UserContext)
}
