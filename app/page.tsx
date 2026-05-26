'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
// @ts-ignore
import SafetyScan from '../components/SafetyScan'

export default function Page() {
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
      } else {
        setReady(true)
      }
    })
  }, [router])

  if (!ready) return null
  return <SafetyScan />
}
