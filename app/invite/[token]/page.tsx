import InviteContent from './InviteContent'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <InviteContent token={token} />
}
