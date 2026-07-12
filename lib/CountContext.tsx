'use client'
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from './supabase'
import { useUser } from './UserContext'

type CountContextType = {
  outstandingCount: number | null
  scansWithIssues: number | null
  refreshCount: () => void
  adjustCount: (delta: number) => void
}

const CountContext = createContext<CountContextType>({
  outstandingCount: null,
  scansWithIssues: null,
  refreshCount: () => {},
  adjustCount: () => {},
})

export function CountProvider({ children }: { children: React.ReactNode }) {
  const [outstandingCount, setOutstandingCount] = useState<number | null>(null)
  const [scansWithIssues, setScansWithIssues] = useState<number | null>(null)
  const { user } = useUser()

  const refreshCount = useCallback(() => {
    if (!user) return
    supabase
      .from('scan_modules')
      .select('findings, findings_state, scan_id')
      .then(({ data: mods }) => {
        let outstanding = 0
        const scanIdsWithIssues = new Set<string>()
        for (const mod of (mods || [])) {
          const findings: any[] = (mod as any).findings || []
          const state: Record<string, string> = (mod as any).findings_state || {}
          const scanId: string = (mod as any).scan_id
          let modHasIssues = false
          for (const f of findings) {
            if (state[f.id] === 'done' || state[f.id] === 'dismissed') continue
            if (f.type === 'critical' || f.type === 'warning' || f.type === 'action') {
              outstanding++
              modHasIssues = true
            }
          }
          if (modHasIssues && scanId) scanIdsWithIssues.add(scanId)
        }
        setOutstandingCount(outstanding)
        setScansWithIssues(scanIdsWithIssues.size)
      })
  }, [user])

  useEffect(() => {
    if (!user) return
    refreshCount()
    const onVisible = () => { if (document.visibilityState === 'visible') refreshCount() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [user, refreshCount])

  const adjustCount = useCallback((delta: number) => {
    setOutstandingCount(prev => prev === null ? null : Math.max(0, prev + delta))
  }, [])

  return (
    <CountContext.Provider value={{ outstandingCount, scansWithIssues, refreshCount, adjustCount }}>
      {children}
    </CountContext.Provider>
  )
}

export function useCount() {
  return useContext(CountContext)
}
