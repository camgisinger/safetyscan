import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') || ''
  const secret = process.env.ADMIN_SECRET

  console.log('[admin/usage] ADMIN_SECRET present:', !!secret)
  console.log('[admin/usage] ADMIN_SECRET length:', secret?.length ?? 0)
  console.log('[admin/usage] Auth header received:', !!request.headers.get('authorization'))
  console.log('[admin/usage] Auth header length:', auth.length)
  console.log('[admin/usage] Auth header starts with "Bearer ":', auth.startsWith('Bearer '))
  console.log('[admin/usage] Match:', !!secret && auth === `Bearer ${secret}`)

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase.rpc('admin_scan_counts_this_month')

    if (error) {
      // Fallback: raw query if the RPC doesn't exist yet
      const { data: rows, error: qErr } = await supabase
        .from('scans')
        .select('user_id, created_at')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      if (qErr) throw new Error(qErr.message)

      const counts: Record<string, number> = {}
      for (const row of rows || []) {
        counts[row.user_id] = (counts[row.user_id] || 0) + 1
      }

      const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const result = Object.entries(counts)
        .map(([user_id, scan_count]) => ({ user_id, scan_count, month }))
        .sort((a, b) => b.scan_count - a.scan_count)

      return NextResponse.json(result)
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[admin/usage]', err)
    return NextResponse.json({ error: err.message || 'Query failed' }, { status: 500 })
  }
}
