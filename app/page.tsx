'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import SafetyScan from '../components/SafetyScan'

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        setAuthed(true)
        setLoading(false)
      }
    })
  }, [])

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F1EFE8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #E0DDD6", borderTopColor: "#F5A623", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!authed) return null
  return <SafetyScan />
}
