import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '../../../lib/supabase-server'

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

// PATCH /api/org?org_id=X — update org name/branding (admin only)
// Body: { name?, logo_url?, abn? } — at least one required; omitted fields are untouched
export async function PATCH(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const org_id = searchParams.get('org_id')
    if (!org_id) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })

    const body = await request.json()
    const { name, logo_url, abn } = body

    if (name === undefined && logo_url === undefined && abn === undefined) {
      return NextResponse.json(
        { error: 'At least one field (name, logo_url, abn) is required' },
        { status: 400 }
      )
    }
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
    }

    if (!(await isOrgAdmin(org_id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name.trim()
    if (logo_url !== undefined) updates.logo_url = logo_url
    if (abn !== undefined) updates.abn = abn

    const { data, error } = await serviceRole
      .from('organisations')
      .update(updates)
      .eq('id', org_id)
      .select('id, name, logo_url, abn')
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Failed to update organisation' }, { status: 500 })
    }

    return NextResponse.json({ organisation: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}
