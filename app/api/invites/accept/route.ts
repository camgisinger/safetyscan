import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '../../../../lib/supabase-server'

const serviceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/invites/accept?token=X  — preview invite details (no auth required)
// Returns safe public fields only: no email, no id, no org_id, no created_by.
// The email match is enforced server-side on POST; no need to disclose it here.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'token is required' }, { status: 400 })

    const { data: invite } = await serviceRole
      .from('invites')
      .select('status, expires_at, role, org_id')
      .eq('token', token)
      .single()

    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

    const { data: org } = await serviceRole
      .from('organisations')
      .select('name')
      .eq('id', invite.org_id)
      .single()

    return NextResponse.json({
      org_name: org?.name ?? null,
      role: invite.role,
      status: invite.status,
      expires_at: invite.expires_at,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}

// POST /api/invites/accept  — accept invite and join org (auth required)
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { token } = body
    if (!token) return NextResponse.json({ error: 'token is required' }, { status: 400 })

    const { data: invite } = await serviceRole
      .from('invites')
      .select('id, org_id, email, role, status, expires_at')
      .eq('token', token)
      .single()
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invite has already been used or cancelled' },
        { status: 400 }
      )
    }

    if (new Date(invite.expires_at) < new Date()) {
      await serviceRole.from('invites').update({ status: 'expired' }).eq('id', invite.id)
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 })
    }

    // Security gate: the authenticated user must be the invited party
    if (invite.email.toLowerCase() !== (user.email ?? '').toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite was sent to a different email address' },
        { status: 403 }
      )
    }

    const { data: existingMember } = await serviceRole
      .from('organisation_members')
      .select('user_id')
      .eq('org_id', invite.org_id)
      .eq('user_id', user.id)
      .single()
    if (existingMember) {
      return NextResponse.json(
        { error: 'Already a member of this organisation' },
        { status: 409 }
      )
    }

    const { error: memberErr } = await serviceRole
      .from('organisation_members')
      .insert({ org_id: invite.org_id, user_id: user.id, role: invite.role })
    if (memberErr) {
      return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 })
    }

    await serviceRole.from('invites').update({ status: 'accepted' }).eq('id', invite.id)

    const { data: org } = await serviceRole
      .from('organisations')
      .select('name')
      .eq('id', invite.org_id)
      .single()

    return NextResponse.json({
      org_id: invite.org_id,
      org_name: org?.name ?? null,
      role: invite.role,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}
