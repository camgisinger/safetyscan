'use client'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export function useOrg(): { orgId: string | null; loading: boolean } {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
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
  }, [])

  return { orgId, loading }
}
