import type { Metadata } from 'next'
import SharedScan from './SharedScan'

export const metadata: Metadata = {
  title: 'Shared Compliance Scan',
  description: 'View a SafetyScan construction compliance report.',
}

export default async function SharedScanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <SharedScan token={token} />
}
