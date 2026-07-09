'use client'
import { useUser } from './UserContext'

export function useOrg(): { orgId: string | null; loading: boolean } {
  const { orgId, loading } = useUser()
  return { orgId, loading }
}
