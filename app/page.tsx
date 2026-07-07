import type { Metadata } from 'next'
import LandingPage from '../components/LandingPage'

export const metadata: Metadata = {
  title: 'SiteSpotter — AI Construction Compliance Scanner for Queensland Sites',
  description: 'Instant AI-powered WHS compliance scanning for Queensland construction sites. Upload a photo, get a detailed compliance report with specific clause references in seconds.',
  keywords: [
    'AI construction compliance',
    'WHS compliance scanner Queensland',
    'construction safety inspection app',
    'OHS compliance checker',
    'safety scan construction site',
    'AI safety scanner',
    'Queensland WHS compliance',
    'construction site safety requirements Queensland',
    'WHS Regulation 2011',
    'site supervisor compliance tool',
    'construction compliance app Australia',
  ],
  openGraph: {
    title: 'SiteSpotter — AI Construction Compliance Scanner for Queensland Sites',
    description: 'Snap a photo and SiteSpotter checks your site against Queensland WHS legislation in seconds.',
    url: 'https://safetyscan.com.au',
    siteName: 'SiteSpotter',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SiteSpotter — AI Construction Compliance Scanner',
    description: 'Snap a photo and SiteSpotter checks your site against Queensland WHS legislation in seconds.',
  },
}

export default function Page() {
  return <LandingPage />
}
