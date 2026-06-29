import type { Metadata } from 'next'
import HelpContent from './HelpContent'

export const metadata: Metadata = {
  title: 'Help & Support | SafetyScan',
  description: 'Get help with SafetyScan — frequently asked questions about construction site compliance scanning, and contact support.',
}

export default function HelpPage() {
  return <HelpContent />
}
