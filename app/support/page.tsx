import type { Metadata } from 'next'
import SupportPageContent from './SupportPageContent'

export const metadata: Metadata = {
  title: 'Support | SiteSpotter',
  description: 'Get help with SiteSpotter — browse our FAQs or send us a message.',
}

export default function SupportPage() {
  return <SupportPageContent />
}
