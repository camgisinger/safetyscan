import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '../../../../lib/supabase-server'

const serviceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function isOrgAdmin(orgId: string, userId: string): Promise<boolean> {
  const { data } = await serviceRole
    .from('organisation_members')
    .select('user_id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single()
  return !!data
}

// GET /api/org/members?org_id=X — list members with user details (any org member)
export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const org_id = searchParams.get('org_id')
    if (!org_id) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })

    // Any member may list — not admin-only
    const { data: membership } = await serviceRole
      .from('organisation_members')
      .select('user_id')
      .eq('org_id', org_id)
      .eq('user_id', user.id)
      .single()
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: members, error } = await serviceRole.rpc('get_org_members', { p_org_id: org_id })
    if (error) return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })

    return NextResponse.json({ members: members ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}

// DELETE /api/org/members?org_id=X&user_id=Y — remove a member (admin only)
// Cannot remove yourself — use POST /api/org/members/leave for self-removal
export async function DELETE(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const org_id = searchParams.get('org_id')
    const target_user_id = searchParams.get('user_id')
    if (!org_id || !target_user_id) {
      return NextResponse.json({ error: 'org_id and user_id are required' }, { status: 400 })
    }

    if (target_user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself — use POST /api/org/members/leave instead' },
        { status: 400 }
      )
    }

    if (!(await isOrgAdmin(org_id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: target } = await serviceRole
      .from('organisation_members')
      .select('user_id, role')
      .eq('org_id', org_id)
      .eq('user_id', target_user_id)
      .single()
    if (!target) {
      return NextResponse.json({ error: 'Member not found in this organisation' }, { status: 404 })
    }

    // Last-admin guard — endpoint check before DB trigger fires
    if (target.role === 'admin') {
      const { data: otherAdmins } = await serviceRole
        .from('organisation_members')
        .select('user_id')
        .eq('org_id', org_id)
        .eq('role', 'admin')
        .neq('user_id', target_user_id)
        .limit(1)
      if (!otherAdmins || otherAdmins.length === 0) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin — promote another member first' },
          { status: 400 }
        )
      }
    }

    const { error } = await serviceRole
      .from('organisation_members')
      .delete()
      .eq('org_id', org_id)
      .eq('user_id', target_user_id)
    if (error) return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}

// PATCH /api/org/members?org_id=X — change a member's role (admin only)
// Body: { user_id, role: 'admin' | 'member' }
export async function PATCH(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const org_id = searchParams.get('org_id')
    if (!org_id) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })

    const body = await request.json()
    const { user_id: target_user_id, role } = body
    if (!target_user_id || !role) {
      return NextResponse.json({ error: 'user_id and role are required' }, { status: 400 })
    }
    if (role !== 'admin' && role !== 'member') {
      return NextResponse.json({ error: 'role must be admin or member' }, { status: 400 })
    }

    if (!(await isOrgAdmin(org_id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: target } = await serviceRole
      .from('organisation_members')
      .select('user_id, role')
      .eq('org_id', org_id)
      .eq('user_id', target_user_id)
      .single()
    if (!target) {
      return NextResponse.json({ error: 'Member not found in this organisation' }, { status: 404 })
    }

    // Last-admin guard for demotion — endpoint check before DB trigger fires
    if (target.role === 'admin' && role === 'member') {
      const { data: otherAdmins } = await serviceRole
        .from('organisation_members')
        .select('user_id')
        .eq('org_id', org_id)
        .eq('role', 'admin')
        .neq('user_id', target_user_id)
        .limit(1)
      if (!otherAdmins || otherAdmins.length === 0) {
        return NextResponse.json(
          { error: 'Cannot demote the last admin — promote another member first' },
          { status: 400 }
        )
      }
    }

    const { error } = await serviceRole
      .from('organisation_members')
      .update({ role })
      .eq('org_id', org_id)
      .eq('user_id', target_user_id)
    if (error) return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })

    return NextResponse.json({ success: true, user_id: target_user_id, role })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}
