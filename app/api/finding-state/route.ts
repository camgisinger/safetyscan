import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '../../../lib/supabase-server'

const serviceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { scan_id, module, finding_id, state } = body

    if (!scan_id || !module || !finding_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (state !== null && state !== 'dismissed' && state !== 'done') {
      return NextResponse.json({ error: 'Invalid state value' }, { status: 400 })
    }

    // Verify org membership before touching any module data
    const { data: scan, error: scanErr } = await serviceRole
      .from('scans')
      .select('id, org_id')
      .eq('id', scan_id)
      .single()

    if (scanErr || !scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })

    const { data: membership } = await serviceRole
      .from('organisation_members')
      .select('user_id')
      .eq('org_id', scan.org_id)
      .eq('user_id', user.id)
      .single()
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Read current findings + findings_state for this module
    const { data: moduleRow, error: moduleErr } = await serviceRole
      .from('scan_modules')
      .select('findings, findings_state')
      .eq('scan_id', scan_id)
      .eq('module', module)
      .single()

    if (moduleErr || !moduleRow) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

    const next: Record<string, string> = { ...(moduleRow.findings_state ?? {}) }
    if (state === null) {
      delete next[finding_id]
    } else {
      next[finding_id] = state
    }

    // Derive new module status from updated findings_state
    const findings: any[] = moduleRow.findings ?? []
    const hasOpenIssues = findings.some(f => {
      const s = next[f.id]
      return s !== 'done' && s !== 'dismissed' && (f.type === 'critical' || f.type === 'warning')
    })
    const newModuleStatus = hasOpenIssues ? 'fail' : 'pass'

    const { error: updateErr } = await serviceRole
      .from('scan_modules')
      .update({ findings_state: next, status: newModuleStatus })
      .eq('scan_id', scan_id)
      .eq('module', module)

    if (updateErr) return NextResponse.json({ error: 'Failed to update state' }, { status: 500 })

    // Recalculate scan-level status from all modules
    const { data: allModules } = await serviceRole
      .from('scan_modules')
      .select('module, status')
      .eq('scan_id', scan_id)

    if (allModules) {
      const statuses = allModules.map(m => m.module === module ? newModuleStatus : m.status)
      const scanStatus = statuses.some(s => s === 'fail') ? 'fail'
        : statuses.every(s => s === 'pass' || s === 'not_applicable') ? 'pass'
        : 'uncertain'
      await serviceRole.from('scans').update({ status: scanStatus }).eq('id', scan_id)
    }

    return NextResponse.json({ findings_state: next, module_status: newModuleStatus })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}
