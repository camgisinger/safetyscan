import type { Metadata } from 'next'
import GuideContent from './GuideContent'

export const metadata: Metadata = {
  title: 'Guide — How to use SafetyScan',
  description: 'Learn how to use SafetyScan for Queensland construction compliance checks. Step by step guide for site supervisors and foremen.',
}

export default function GuidePage() {
  return <GuideContent />
}
