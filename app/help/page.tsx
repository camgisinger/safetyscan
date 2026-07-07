import type { Metadata } from 'next'
import HelpContent from './HelpContent'

export const metadata: Metadata = {
  title: 'Help & Support | SiteSpotter',
  description: 'Get help with SiteSpotter — frequently asked questions about construction site compliance scanning, and contact support.',
}

export default function HelpPage() {
  return <HelpContent />
}
