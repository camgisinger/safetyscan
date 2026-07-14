import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getServerUser } from '../../../lib/supabase-server'

const serviceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

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

// GET /api/invites?org_id=X  — list invites for org (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const org_id = searchParams.get('org_id')
    if (!org_id) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })

    if (!(await isOrgAdmin(org_id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: invites } = await serviceRole
      .from('invites')
      .select('id, email, role, status, expires_at, created_at')
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ invites: invites || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}

// POST /api/invites  — create invite + send email (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { org_id, email, role = 'member' } = body

    if (!org_id || !email) {
      return NextResponse.json({ error: 'org_id and email are required' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (role !== 'admin' && role !== 'member') {
      return NextResponse.json({ error: 'role must be admin or member' }, { status: 400 })
    }

    if (!(await isOrgAdmin(org_id, user.id))) {
      return NextResponse.json({ error: 'Only org admins can send invites' }, { status: 403 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Duplicate pending invite check
    const { data: existing } = await serviceRole
      .from('invites')
      .select('id')
      .eq('org_id', org_id)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .single()
    if (existing) {
      return NextResponse.json(
        { error: 'An invite is already pending for this email — revoke it first to re-invite' },
        { status: 409 }
      )
    }

    const { data: org } = await serviceRole
      .from('organisations')
      .select('name')
      .eq('id', org_id)
      .single()
    if (!org) return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })

    // Insert invite — token and expires_at are set by column defaults
    const { data: invite, error: insertErr } = await serviceRole
      .from('invites')
      .insert({ org_id, email: normalizedEmail, role, created_by: user.id })
      .select('id, token, email, role, expires_at')
      .single()
    if (insertErr || !invite) {
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    // Send invite email — failure is non-fatal; invite is created regardless
    const acceptUrl = `https://sitespotter.com.au/invite/${invite.token}`
    const inviterName = escHtml(user.user_metadata?.full_name || user.email || 'A team member')
    const orgName = escHtml(org.name)
    const expiryDate = new Date(invite.expires_at).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    const { error: emailError } = await resend.emails.send({
      from: 'noreply@sitespotter.com.au',
      to: invite.email,
      subject: `You've been invited to join ${org.name} on SiteSpotter`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #16181C;">
          <div style="background: #16181C; padding: 24px 28px; border-radius: 8px 8px 0 0;">
            <span style="font-size: 20px; font-weight: 700; color: #fff;">Site<span style="color: #F39410;">Spotter</span></span>
          </div>
          <div style="background: #f9f8f5; border: 1px solid #e5e3da; border-top: none; border-radius: 0 0 8px 8px; padding: 32px 28px;">
            <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #16181C;">You're invited</h2>
            <p style="margin: 0 0 24px; font-size: 14px; color: #555; line-height: 1.6;">
              ${inviterName} has invited you to join <strong>${orgName}</strong> on SiteSpotter as a <strong>${escHtml(role)}</strong>.
            </p>
            <a href="${acceptUrl}"
              style="display: inline-block; padding: 14px 28px; background: #F39410; border-radius: 6px; color: #16181C; font-size: 14px; font-weight: 700; text-decoration: none;">
              Accept invitation →
            </a>
            <p style="margin: 24px 0 0; font-size: 12px; color: #999; line-height: 1.6;">
              This invite expires on ${expiryDate}. If you did not expect this invitation, you can ignore this email.
            </p>
            <p style="margin: 16px 0 0; font-size: 11px; color: #bbb;">
              Or copy this link:<br>
              <a href="${acceptUrl}" style="color: #F39410; word-break: break-all;">${acceptUrl}</a>
            </p>
          </div>
        </div>
      `,
    })

    if (emailError) {
      console.error('[invites] Resend error:', emailError)
    }

    return NextResponse.json({
      id: invite.id,
      token: invite.token,
      email: invite.email,
      role: invite.role,
      expires_at: invite.expires_at,
      email_sent: !emailError,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}

// DELETE /api/invites?id=X  — revoke invite (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { data: invite } = await serviceRole
      .from('invites')
      .select('id, org_id')
      .eq('id', id)
      .single()
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

    if (!(await isOrgAdmin(invite.org_id, user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await serviceRole.from('invites').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}
