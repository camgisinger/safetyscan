import type { Metadata } from 'next'
import ContactPageContent from './ContactPageContent'

export const metadata: Metadata = {
  title: 'Contact | SiteSpotter',
  description: 'Get in touch with the SiteSpotter team.',
}

export default function ContactPage() {
  return <ContactPageContent />
}
