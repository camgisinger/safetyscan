'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../../../lib/UserContext'
import SiteSpotter from '../../../components/SiteSpotter.jsx'

export default function NewScanPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return <SiteSpotter />
}
