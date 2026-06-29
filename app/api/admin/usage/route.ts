import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function extractSecret(request: NextRequest): string {
  const header = request.headers.get('authorization') || ''
  if (header.startsWith('Bearer ')) return header.slice(7).trim()
  return (request.nextUrl.searchParams.get('secret') || '').trim()
}

export async function GET(request: NextRequest) {
  const provided = extractSecret(request)
  const secret = process.env.ADMIN_SECRET?.trim()

  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // NOTE: listUsers() paginates at 50 users by default. When user count grows
    // past 50, implement pagination using data.aq_pagination.nextCursor to
    // loop through all pages before building the email map.
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) throw new Error(`listUsers failed: ${authError.message}`)

    const emailMap: Record<string, string> = {}
    for (const user of authData.users) {
      emailMap[user.id] = user.email || user.id
    }

    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()

    const { data: scans, error: scansError } = await supabase
      .from('scans')
      .select('user_id, created_at')
      .gte('created_at', monthStart)

    if (scansError) throw new Error(`scans query failed: ${scansError.message}`)

    const monthCounts: Record<string, number> = {}
    let scansToday = 0

    for (const scan of scans || []) {
      monthCounts[scan.user_id] = (monthCounts[scan.user_id] || 0) + 1
      if (scan.created_at >= todayStart) scansToday++
    }

    const totalScansThisMonth = (scans || []).length
    const totalUsers = Object.keys(monthCounts).length
    const averageScansPerUser =
      totalUsers > 0 ? Math.round((totalScansThisMonth / totalUsers) * 10) / 10 : 0

    const users = Object.entries(monthCounts)
      .map(([user_id, scan_count]) => ({
        user_id,
        email: emailMap[user_id] || user_id,
        scan_count,
      }))
      .sort((a, b) => b.scan_count - a.scan_count)

    return NextResponse.json({
      total_scans_this_month: totalScansThisMonth,
      total_users: totalUsers,
      scans_today: scansToday,
      average_scans_per_user: averageScansPerUser,
      users,
    })
  } catch (err: any) {
    console.error('[admin/usage]', err)
    return NextResponse.json({ error: err.message || 'Query failed' }, { status: 500 })
  }
}
