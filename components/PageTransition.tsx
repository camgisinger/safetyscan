'use client'
import { useEffect, useState } from 'react'

type TransitionType = 'slide-up' | 'slide-right' | 'fade'

interface PageTransitionProps {
  children: React.ReactNode
  type?: TransitionType
}

export default function PageTransition({ children, type = 'fade' }: PageTransitionProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const classMap = {
    'slide-up': 'page-slide-up',
    'slide-right': 'page-slide-right-in',
    'fade': 'page-fade-in',
  }

  return (
    <div className={mounted ? classMap[type] : ''} style={{ willChange: 'transform, opacity' }}>
      {children}
    </div>
  )
}
