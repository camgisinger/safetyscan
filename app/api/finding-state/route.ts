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
    if (state !== null && state !== 'dismissed' && state !== 'done' && state !== 'confirm') {
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

    // Confirm: clear the tentative flag on the finding object (not a findings_state write)
    if (state === 'confirm') {
      const { data: confirmRow, error: confirmModErr } = await serviceRole
        .from('scan_modules')
        .select('findings')
        .eq('scan_id', scan_id)
        .eq('module', module)
        .single()
      if (confirmModErr || !confirmRow) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 })
      }
      const findings: any[] = confirmRow.findings ?? []
      const target = findings.find((f: any) => f.id === finding_id)
      if (!target) {
        return NextResponse.json({ error: 'Finding not found' }, { status: 404 })
      }
      if (!target.tentative) {
        return NextResponse.json({ ok: true }) // already confirmed — idempotent
      }
      const updatedFindings = findings.map((f: any) =>
        f.id === finding_id ? { ...f, tentative: false } : f
      )
      const { error: confirmErr } = await serviceRole
        .from('scan_modules')
        .update({ findings: updatedFindings })
        .eq('scan_id', scan_id)
        .eq('module', module)
      if (confirmErr) {
        return NextResponse.json({ error: 'Failed to confirm finding' }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    // Read current findings_state
    const { data: moduleRow, error: moduleErr } = await serviceRole
      .from('scan_modules')
      .select('findings_state')
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

    const { error: updateErr } = await serviceRole
      .from('scan_modules')
      .update({ findings_state: next })
      .eq('scan_id', scan_id)
      .eq('module', module)

    if (updateErr) return NextResponse.json({ error: 'Failed to update state' }, { status: 500 })

    return NextResponse.json({ findings_state: next })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}
