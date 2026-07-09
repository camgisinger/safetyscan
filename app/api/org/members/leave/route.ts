import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '../../../../../lib/supabase-server'

const serviceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/org/members/leave — leave an organisation (self-removal, any member)
// Body: { org_id }
// Guards: only-member block (covers personal-org case), last-admin block
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { org_id } = body
    if (!org_id) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })

    const { data: membership } = await serviceRole
      .from('organisation_members')
      .select('user_id, role')
      .eq('org_id', org_id)
      .eq('user_id', user.id)
      .single()
    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this organisation' }, { status: 404 })
    }

    // Only-member guard — covers the personal-org case where the user is the sole member
    const { data: otherMembers } = await serviceRole
      .from('organisation_members')
      .select('user_id')
      .eq('org_id', org_id)
      .neq('user_id', user.id)
      .limit(1)
    if (!otherMembers || otherMembers.length === 0) {
      return NextResponse.json(
        { error: 'Cannot leave an org with no other members — delete the organisation instead' },
        { status: 400 }
      )
    }

    // Last-admin guard — endpoint check before DB trigger fires
    if (membership.role === 'admin') {
      const { data: otherAdmins } = await serviceRole
        .from('organisation_members')
        .select('user_id')
        .eq('org_id', org_id)
        .eq('role', 'admin')
        .neq('user_id', user.id)
        .limit(1)
      if (!otherAdmins || otherAdmins.length === 0) {
        return NextResponse.json(
          { error: 'Cannot leave — you are the only admin. Promote another member first.' },
          { status: 400 }
        )
      }
    }

    const { error } = await serviceRole
      .from('organisation_members')
      .delete()
      .eq('org_id', org_id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: 'Failed to leave organisation' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}
