'use client'
import { useRouter } from 'next/navigation'
import AppHeader from './AppHeader'

export default function LegalPageHeader({ title }: { title: string }) {
  const router = useRouter()
  return (
    <AppHeader
      variant="detail"
      title={title}
      onBack={() => router.push('/')}
    />
  )
}
