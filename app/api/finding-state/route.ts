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
    if (state !== null && state !== 'dismissed' && state !== 'confirmed') {
      return NextResponse.json({ error: 'Invalid state value' }, { status: 400 })
    }

    // Verify scan ownership before touching any module data
    const { data: scan, error: scanErr } = await serviceRole
      .from('scans')
      .select('id, user_id')
      .eq('id', scan_id)
      .single()

    if (scanErr || !scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
    if (scan.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
