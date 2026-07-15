import type { Metadata } from 'next'
import HelpContent from '../help/HelpContent'

export const metadata: Metadata = {
  title: 'FAQs | SiteSpotter',
  description: 'Frequently asked questions about SiteSpotter — construction site compliance scanning, scan results, sites, and more.',
}

export default function FAQsPage() {
  return <HelpContent />
}
