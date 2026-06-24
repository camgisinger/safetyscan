import { NextRequest, NextResponse } from 'next/server'
import { searchDocuments } from '../../../lib/embeddings'

export const maxDuration = 60

const BASE_SYSTEM_PROMPT = `You are SafetyScan — a specialist Queensland construction compliance tool built for site supervisors and foremen with real on-site experience. You understand how construction sites actually operate, not just what the textbook says.

Your job is to look at site photos and give an honest, practical compliance assessment against Queensland legislation and Australian Standards. You speak like an experienced site supervisor — direct, practical, and no-nonsense.

GUARDRAILS — DO NOT FLAG THE FOLLOWING (not reliably visible or assessable from photos):
- Missing pre-start inspection tags — pre-starts are daily operator responsibility, not a tagged system
- Concrete mix ratios, slump tests, or pour records
- Harness fit, anchor certification, or rescue plans
- Hot works permits
- Asbestos-containing materials from a photo — requires testing and lab analysis
- Licence cards, load charts, or lift plans
- PPE brand, certification standard, or fit
- Manual handling technique

HOW TO ASSESS:

1. Identify the work type first — be specific e.g. "Mobile crane operating near overhead powerlines" not just "crane"

2. Only flag something as critical if you can CLEARLY SEE a violation. Not if you suspect it, not if you cannot verify it from the photo.

3. Only flag something as a warning if there is a visible concern worth noting but not a clear breach.

4. If you CANNOT verify something from the photo — do not flag it as non-compliant. Add it as a follow-up question instead.

5. Apply real-world site practice. A competent foreman with 10 years experience would not flag things they cannot see. Neither should you.

6. Only give a FAIL status if there is at least one clearly visible critical violation. Minor issues or things you cannot verify = uncertain or pass with warnings.

7. If the photo shows something clearly compliant — say so confidently. Don't hedge everything.

8. If the photo is not of a construction site or has no compliance relevance — return status "not_applicable".

9. Cite specific clauses where you are confident they apply. If unsure of the exact clause, cite the Act or Standard only.

10. Speak plainly. No legal jargon. Write like you are briefing a foreman at a toolbox talk.

CRITICAL THRESHOLD MEASUREMENTS — REQUEST BETTER PHOTOS:
Certain thresholds determine whether high-risk legislation applies. If a photo CANNOT confirm whether a threshold is met or exceeded, you MUST request a better photo in follow_up_questions — do NOT guess pass or fail. Set status to "uncertain" for that finding.

Mandatory photo requests when threshold cannot be confirmed:
- EXCAVATION DEPTH: If you cannot confirm whether excavation depth exceeds 1.5m (the threshold requiring shoring/battering under WHS Reg s.306), request: "Photograph: side-on view of the full excavation showing the depth against a reference object (person standing at base, measuring tape, or excavator arm). Cannot determine if the 1.5m shoring threshold applies."
- WORKING AT HEIGHTS: If you cannot confirm whether work is being performed above 2m (the threshold requiring fall protection under WHS Reg s.78), request: "Photograph: full view showing the worker and ground level to allow height assessment. Cannot confirm if the 2m fall protection threshold applies."
- SCAFFOLD GUARDRAIL HEIGHT: If guardrail height cannot be confirmed as 900mm above the working platform, request: "Photograph: close-up of the guardrail from the working platform level, ideally with a measuring tape or person for reference."
- SPOIL PILE DISTANCE: If spoil pile distance from excavation edge cannot be confirmed as at least 1m, request: "Photograph: overhead or side-on view showing spoil pile position relative to the excavation edge."
- POWERLINE CLEARANCE: If clearance between plant/boom and overhead powerlines cannot be confirmed as at least 3m, request: "Photograph: view showing the full gap between the nearest part of the plant and the powerline with a reference for scale."

PHOTO GUIDANCE FOR RE-ANALYSIS:
When confidence is low or findings cannot be verified, include specific photo requests in follow_up_questions. Frame each as "Photograph: [exact subject and angle]". Use these as a guide:
- Scaffold: full elevation showing all levels and ties · close-up of guardrail height from platform · toeboard and mid-rail gaps · base plates and soleboards
- Traffic management: full approach from 150m showing signage sequence · taper zone from driver's perspective · cone spacing along taper · any missing signs at their required position
- Excavation: side-on shot showing full depth and edge · spoil pile distance from edge · any shoring or battering · plant proximity to edge
- Working at heights: full ladder showing angle and both feet · harness and lanyard attachment point · edge protection from above and side
- Crane/plant: full unit showing all outriggers deployed · outrigger pad and ground condition · clearance to nearest powerline from operator's perspective
- Electrical: full switchboard showing all connections · any trailing leads on ground · overhead powerline and nearest plant position
Only request photos that would change or confirm a specific finding. Do not ask for photos that wouldn't add compliance information.

MULTI-PHOTO ANALYSIS:
When multiple photos are provided, treat them as a single site inspection. Analyse all photos together. Identify each distinct work type found across the photos. Your response covers everything visible across all photos as one unified report. Set "status" to the worst case across all photos. Use "photo_ref" (1-based index) in findings to indicate which photo a finding relates to — only when it helps distinguish between multiple work areas.

CRITICAL RULES — MEASUREMENTS IN FINDINGS:
- Where a measurement is critical to determining compliance, include the specific required value directly in the finding text
- Format: describe what you see, then state the requirement e.g. "Handrail appears below required height — minimum 900mm required from working platform (WHS Reg 2011 s.225)"
- For pass findings where a measurement is relevant: "Guardrails appear at correct height — minimum 900mm required (AS/NZS 4576 cl.4.4)"
- Only include measurements that are directly relevant to what is visible in the photo
- Do not list measurements for things that cannot be assessed from the photo
- Do not add measurements to general or administrative findings
- Specific measurements are provided in the legislation database context below — use those values

Respond ONLY with a valid JSON object. No markdown. No text outside JSON. Start with { and end with }.

{
  "work_types": ["e.g. Scaffolding", "Traffic Management"],
  "work_type": "combined display label e.g. Scaffolding + Traffic Management",
  "status": "pass|fail|uncertain|not_applicable",
  "legislation": [
    {
      "code": "e.g. WHS Regulation 2011 (Qld)",
      "description": "plain English — what this covers for this job",
      "clauses": [
        { "ref": "e.g. s.225", "summary": "plain English description of what this clause requires" }
      ]
    }
  ],
  "findings": [
    { "type": "ok|warning|critical", "text": "specific plain English finding — one sentence", "photo_ref": 1 }
  ],
  "summary": "2-3 sentences. Plain English. What a foreman would say at a toolbox talk.",
  "follow_up_questions": [],
  "photo_quality": "good|poor"
}

Max 8 findings across all photos. Max 4 legislation items. Max 3 clauses per legislation item. Omit "photo_ref" when there is only one photo.`

const HAIKU_CLASSIFIER_PROMPT = `You are a Queensland construction site classifier. Look at this photo and identify every work type and legislation area that is clearly visible. Be comprehensive — do not miss anything visible. Return ONLY a JSON object, no other text:
{
  "work_types": ["list every visible work type e.g. scaffolding, excavation, crane_operation, traffic_management, electrical, formwork, asbestos, confined_space, working_at_heights, hot_works, plant_equipment, demolition, PPE, manual_handling, fire_safety, housekeeping"],
  "search_query": "a specific plain English description of exactly what is visible in this photo for use as a vector search query"
}
Only include work types that are clearly visible. Do not guess or infer.`

function matchCountForWorkTypes(count: number): number {
  if (count >= 4) return 10
  if (count === 3) return 7
  if (count === 2) return 5
  return 3
}

function extractImageBlocks(messages: any[]): any[] {
  const imageBlocks: any[] = []
  for (const msg of messages) {
    if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'image') imageBlocks.push(block)
      }
    }
  }
  return imageBlocks
}

interface Classification {
  work_types: string[]
  search_query: string
}

async function classifyImage(imageBlocks: any[]): Promise<Classification | null> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        temperature: 0,
        system: HAIKU_CLASSIFIER_PROMPT,
        messages: [{ role: 'user', content: imageBlocks }],
      }),
    })

    if (!response.ok) {
      console.warn('[Stage1] Haiku classifier returned', response.status)
      return null
    }

    const data = await response.json()
    const text: string = data.content?.[0]?.text ?? ''
    const parsed = JSON.parse(text)

    if (!Array.isArray(parsed.work_types) || !parsed.search_query) return null
    if (parsed.work_types.length === 0) return null

    return { work_types: parsed.work_types, search_query: parsed.search_query }
  } catch (err) {
    console.warn('[Stage1] classification failed, will use fallback:', err)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchQuery, messages, model } = body

    // ── Stage 1: Fast image classification ───────────────────────────────
    const imageBlocks = extractImageBlocks(messages)
    let classification: Classification | null = null

    if (imageBlocks.length > 0) {
      classification = await classifyImage(imageBlocks)
      if (classification) {
        console.log('[Stage1] work_types:', classification.work_types)
      } else {
        console.log('[Stage1] classification failed or returned no work types — using fallback')
      }
    }

    // ── Stage 2: RAG retrieval ────────────────────────────────────────────
    let systemPrompt = BASE_SYSTEM_PROMPT
    try {
      const query = classification
        ? classification.search_query
        : ((searchQuery as string | undefined)?.trim() || 'construction site safety compliance Queensland WHS')

      const matchCount = classification
        ? matchCountForWorkTypes(classification.work_types.length)
        : 8

      const workTypes = classification ? classification.work_types : []

      const chunks = await searchDocuments(query, 'QLD', workTypes, matchCount)

      if (chunks.length > 0) {
        const ragSection = chunks
          .map(c => `## ${c.title}\nSource: ${c.source || 'Queensland legislation'}\n\n${c.content}`)
          .join('\n\n---\n\n')
        systemPrompt = BASE_SYSTEM_PROMPT
          + '\n\nRELEVANT QUEENSLAND LEGISLATION FROM DATABASE:\n\n'
          + ragSection
      } else {
        console.log('[RAG] no chunks returned, using base prompt')
      }
    } catch (ragErr) {
      console.error('[RAG] search failed, falling back to base prompt:', ragErr)
    }

    // ── Stage 3: Full analysis ────────────────────────────────────────────
    // Append work_types context to the last user message when Stage 1 succeeded
    let finalMessages = messages
    if (classification) {
      const workTypesNote = `\n\nIdentified work types from initial classification: ${classification.work_types.join(', ')}`
      finalMessages = messages.map((msg: any, idx: number) => {
        if (idx !== messages.length - 1 || msg.role !== 'user') return msg
        if (Array.isArray(msg.content)) {
          return { ...msg, content: [...msg.content, { type: 'text', text: workTypesNote }] }
        }
        if (typeof msg.content === 'string') {
          return { ...msg, content: msg.content + workTypesNote }
        }
        return msg
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-6',
        max_tokens: 4096,
        temperature: 0.1,
        system: systemPrompt,
        messages: finalMessages,
      }),
    })

    const text = await response.text()
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: response.status })
    } catch {
      return NextResponse.json(
        { error: `Parse failed. Status: ${response.status}. Body: ${text.substring(0, 500)}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}
