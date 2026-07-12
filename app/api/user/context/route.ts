import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '../../../../lib/supabase-server'

const serviceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/user/context — name + active org + outstanding count for sidebar
export async function GET() {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ data: mem }, { data: count }] = await Promise.all([
      serviceRole
        .from('organisation_members')
        .select('org_id, role, organisations!inner(name)')
        .eq('user_id', user.id)
        .limit(1)
        .single(),
      serviceRole
        .rpc('get_outstanding_findings_count', { p_user_id: user.id, p_site_id: null }),
    ])

    return NextResponse.json({
      org_id:            mem?.org_id ?? null,
      org_name:          (mem?.organisations as any)?.name ?? null,
      role:              mem?.role ?? null,
      outstanding_count: (count as number) ?? 0,
      full_name:         user.user_metadata?.full_name ?? null,
      email:             user.email ?? null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}
