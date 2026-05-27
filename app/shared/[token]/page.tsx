import SharedScan from './SharedScan'

export default async function SharedScanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <SharedScan token={token} />
}
