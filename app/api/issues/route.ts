import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '../../../lib/supabase-server'

const serviceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const requestedOrgId = searchParams.get('org_id')

    let orgId: string

    if (requestedOrgId) {
      // Verify the caller is actually a member of the requested org before using service role
      const { data: mem } = await serviceRole
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('org_id', requestedOrgId)
        .maybeSingle()

      if (!mem) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      orgId = requestedOrgId
    } else {
      const { data: mem } = await serviceRole
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!mem?.org_id) return NextResponse.json({ outstanding: [], pending: [] })
      orgId = mem.org_id
    }

    // Single JOIN query instead of two sequential queries
    const { data: modules } = await serviceRole
      .from('scan_modules')
      .select('id, scan_id, module, findings, findings_state, scans!inner(id, work_type, created_at, site_id, org_id, sites(name))')
      .eq('scans.org_id', orgId)

    if (!modules || modules.length === 0) return NextResponse.json({ outstanding: [], pending: [] })

    const outstanding: any[] = []
    const pending: any[] = []

    for (const mod of modules) {
      const scan = (mod as any).scans
      if (!scan) continue
      const findings: any[] = (mod as any).findings || []
      const state: Record<string, string> = (mod as any).findings_state || {}

      for (const f of findings) {
        const fState = state[f.id]
        if (fState === 'done' || fState === 'dismissed') continue

        if (f.tentative) {
          pending.push({
            finding_id: f.id,
            text: f.text || f.title || '',
            type: f.type,
            module: (mod as any).module,
            scan_id: (mod as any).scan_id,
            module_id: (mod as any).id,
            scan_name: scan.work_type || 'Unnamed scan',
            site_name: scan.sites?.name ?? null,
            created_at: scan.created_at,
          })
        } else if (f.type === 'critical' || f.type === 'warning') {
          outstanding.push({
            finding_id: f.id,
            text: f.text || f.title || '',
            type: f.type,
            module: (mod as any).module,
            scan_id: (mod as any).scan_id,
            module_id: (mod as any).id,
            scan_name: scan.work_type || 'Unnamed scan',
            site_name: scan.sites?.name ?? null,
            created_at: scan.created_at,
          })
        }
      }
    }

    return NextResponse.json({ outstanding, pending })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
