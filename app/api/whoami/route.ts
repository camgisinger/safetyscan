import { NextResponse } from 'next/server'
import { getServerUser } from '../../../lib/supabase-server'

export async function GET() {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ userId: user.id, email: user.email })
}
