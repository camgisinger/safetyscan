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

    // Verify scan ownership
    const { data: scan } = await serviceRole
      .from('scans').select('created_by').eq('id', scan_id).single()
    if (!scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
    if (scan.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Single atomic DB operation — replaces 4 sequential queries
    const { data: result, error: rpcError } = await serviceRole.rpc('update_finding_state', {
      p_scan_id:    scan_id,
      p_module:     module,
      p_finding_id: finding_id,
      p_state:      state,
    })

    if (rpcError) {
      console.error('[finding-state RPC]', rpcError)
      return NextResponse.json({ error: rpcError.message || 'Update failed' }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}
