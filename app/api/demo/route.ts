import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, company, role, email, phone } = await request.json()

    if (!firstName?.trim() || !lastName?.trim() || !company?.trim() || !role?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'All required fields must be filled.' }, { status: 400 })
    }

    const name = `${firstName.trim()} ${lastName.trim()}`

    const { error } = await resend.emails.send({
      from: 'noreply@safetyscan.com.au',
      to: 'support@safetyscan.com.au',
      replyTo: email.trim(),
      subject: `[SafetyScan Demo] ${name} — ${escHtml(company.trim())}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #1a1a1a;">
          <h2 style="margin-top: 0;">SafetyScan Demo Request</h2>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; width: 120px; border: 1px solid #e0e0e0;">Name</td>
              <td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${escHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; border: 1px solid #e0e0e0;">Company</td>
              <td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${escHtml(company.trim())}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; border: 1px solid #e0e0e0;">Role</td>
              <td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${escHtml(role.trim())}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; border: 1px solid #e0e0e0;">Email</td>
              <td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${escHtml(email.trim())}</td>
            </tr>
            ${phone?.trim() ? `
            <tr>
              <td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; border: 1px solid #e0e0e0;">Phone</td>
              <td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${escHtml(phone.trim())}</td>
            </tr>` : ''}
          </table>
          <p style="margin-top: 24px; font-size: 12px; color: #888;">
            Reply directly to this email to respond to ${escHtml(name)} at ${escHtml(email.trim())}.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('[demo] Resend error:', error)
      return NextResponse.json({ error: error.message || 'Failed to send. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[demo] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
