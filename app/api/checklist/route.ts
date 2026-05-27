import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { work_type, findings, legislation, summary } = await request.json()

    const prompt = `You are SafetyScan, a Queensland construction compliance assistant. Based on this scan result, generate a practical site checklist a worker can tick off on site.

Work type: ${work_type}
Summary: ${summary}
Findings: ${JSON.stringify(findings)}
Legislation: ${JSON.stringify(legislation?.map((l: any) => l.code))}

Respond ONLY with a valid JSON array. No markdown, no text outside JSON:
[{"item":"specific checkable action","category":"category name"}]

Rules:
- Maximum 10 items
- Be specific to the findings above, not generic
- Each item should be something a worker can physically verify or action on site
- Group into 2-4 categories
- Plain English, no jargon`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      }),
    })

    const data = await response.json()
    const raw = data.content?.map((b: any) => b.text || '').join('') || ''
    const stripped = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const checklist = JSON.parse(stripped)
    return NextResponse.json({ checklist })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
