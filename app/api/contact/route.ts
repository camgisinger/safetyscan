import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (message.trim().length < 20) {
      return NextResponse.json({ error: 'Message must be at least 20 characters.' }, { status: 400 })
    }

    const { error } = await resend.emails.send({
      from: 'noreply@send.safetyscan.com.au',
      to: 'support@safetyscan.com.au',
      replyTo: email.trim(),
      subject: `[SafetyScan Support] ${subject} — from ${name.trim()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #1a1a1a;">
          <h2 style="margin-top: 0;">SafetyScan Support Request</h2>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; width: 120px; border: 1px solid #e0e0e0;">Name</td>
              <td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${escHtml(name.trim())}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; border: 1px solid #e0e0e0;">Email</td>
              <td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${escHtml(email.trim())}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f5f5f5; font-weight: 600; border: 1px solid #e0e0e0;">Subject</td>
              <td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${escHtml(subject.trim())}</td>
            </tr>
          </table>
          <h3 style="margin-bottom: 8px;">Message</h3>
          <div style="background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px; white-space: pre-wrap; line-height: 1.6;">
            ${escHtml(message.trim())}
          </div>
          <p style="margin-top: 24px; font-size: 12px; color: #888;">
            Reply directly to this email to respond to ${escHtml(name.trim())} at ${escHtml(email.trim())}.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('[contact] Resend error:', error)
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[contact] Unexpected error:', err)
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
