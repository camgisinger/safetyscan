import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { searchDocuments } from '../../../lib/embeddings'
import { getServerUser } from '../../../lib/supabase-server'

export const maxDuration = 300

const serviceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

SafetyScan operates as a compliance guide first and a compliance checker second. The distinction is critical:

A CRITICAL finding is only raised when a clear, unambiguous violation is directly visible in the photo beyond reasonable doubt. If you would not be comfortable standing in front of a WHS inspector and pointing to that exact violation in the photo, do not flag it as critical.

A GUIDE PROMPT replaces what was previously a warning. Any item that requires on-site verification — because it cannot be confirmed from the photo alone — must be reworded as an actionable prompt for the supervisor to physically check. Do not write "cannot verify". Write "Confirm on site that...".

A PASS finding is raised when something is clearly visible and compliant. State it with confidence.

ASSESSMENT RULES:

1. Identify the work type first — be specific. "Scaffolding on a multi-storey residential build" not just "scaffolding".

2. Only raise a CRITICAL finding if the violation is unambiguously visible. Not suspected. Not possible. Visible.

3. Reword all verification items as guide prompts using this format: "Confirm [specific item] — [requirement and clause reference]". Example: "Confirm excavation depth — if exceeding 1.5m, shoring or battering is required under WHS Regulation 2011 s.306."

4. If you cannot see something clearly — do not flag it as non-compliant. Convert it to a follow-up question or guide prompt instead.

5. Apply real-world site experience. A senior site supervisor with 15 years experience would not flag something they cannot clearly see. Neither should you.

6. Only assign a FAIL status if at least one unambiguous critical violation is visible in the photo.

7. If the site or activity appears compliant from what is visible — say so directly and with confidence. Do not hedge every finding.

8. If the photo is not of a construction site or has no compliance relevance — return status "not_applicable".

9. Cite specific clause references where you are confident they apply. If the exact clause is uncertain, cite the Act or Code of Practice only.

10. Never use the phrase "cannot verify" — convert every instance to an actionable guide prompt.

WHEN TO REQUEST BETTER PHOTOS:

If a critical threshold cannot be confirmed from the photo, add a photo request to follow_up_questions and set status to "uncertain" for that finding — do NOT guess pass or fail. Only request photos that would change or confirm a specific finding.

Mandatory requests when these thresholds are unconfirmable:
- EXCAVATION DEPTH: Cannot confirm vs 1.5m shoring threshold (WHS Reg s.306) → "Photograph: side-on view of the full excavation showing depth against a reference object (person, tape, or excavator arm)."
- WORKING AT HEIGHTS: Cannot confirm work is above 2m fall-protection threshold (WHS Reg s.78) → "Photograph: full view showing the worker and ground level."
- GUARDRAIL HEIGHT: Cannot confirm 900mm above working platform → "Photograph: close-up of guardrail from platform level with measuring tape or person for scale."
- SPOIL PILE: Cannot confirm spoil is at least 1m from excavation edge (WHS Reg s.306) → "Photograph: overhead or side-on view showing spoil pile position relative to the edge."
- POWERLINE CLEARANCE: Cannot confirm at least 3m gap between plant/boom and powerlines → "Photograph: view showing the full gap with a reference for scale."

Useful angles by work type when re-requesting photos:
- Scaffold: full elevation showing all levels and ties · guardrail height from platform · toeboard and mid-rail gaps · base plates and soleboards
- Traffic management: full approach from 150m showing signage sequence · taper zone from driver's perspective · cone spacing · any missing signs
- Excavation: side-on showing full depth and edge · spoil pile distance · any shoring or battering · plant proximity
- Working at heights: full ladder showing angle and both feet · harness and lanyard attachment point · edge protection from above and side
- Crane/plant: full unit showing all outriggers · outrigger pad and ground condition · clearance to nearest powerline
- Electrical: full switchboard showing all connections · trailing leads on ground · overhead powerline and nearest plant position

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

SUMMARY WRITING RULES:

The summary must read like a briefing from a senior WHS officer to a site foreman — professional, direct, and unambiguous. It must not read like a text message, a legal document, or a generic AI response.

TONE REQUIREMENTS:
- Write in full sentences. No dot points in the summary.
- No contractions. Write "is not" not "isn't". Write "does not" not "doesn't".
- No casual language. Do not use: "looks like", "seems", "basically", "straight up", "borderline", "fair enough", or similar.
- No corporate filler. Do not use: "it is important to note", "please ensure", "it should be noted that", or similar.
- State observations as facts, not possibilities. "Toeboards are absent" not "toeboards appear to be missing".
- State requirements directly. "This must be rectified before work proceeds" not "you might want to look at this".
- No hedging on things that are clearly visible.

FORMAT:
- 3 to 5 sentences maximum
- Sentence 1: Overall site assessment — what is the general compliance picture
- Sentence 2-3: The most significant findings — what specifically is wrong or right
- Sentence 4-5: Required actions — what must happen before work proceeds or what needs on-site verification

EXAMPLE OF CORRECT TONE:
"Scaffold structure is generally well-constructed however critical edge protection deficiencies are present. Toeboards are absent across all working levels, which is a direct non-compliance with AS/NZS 4576. The upper platform at the stair landing has no guardrail on the open side and must not be used until this is rectified. Guardrail heights and mid-rail spacing require on-site verification against the required minimums before the next inspection."

EXAMPLE OF INCORRECT TONE (do not write like this):
"The scaffold looks mostly okay but has some issues. There are no toeboards anywhere — that's a fail straight up. The top platform has no guardrails at all on the open side. Get this sorted before anyone works up there."

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
  "summary": "3-5 sentence briefing per SUMMARY WRITING RULES above.",
  "follow_up_questions": [],
  "photo_quality": "good|poor"
}

Max 8 findings across all photos. Max 4 legislation items. Max 3 clauses per legislation item. Omit "photo_ref" when there is only one photo.`

const MODULE_PROMPTS: Record<string, string> = {
  safety: `You are currently assessing this site against the SAFETY compliance module ONLY.

Assess against Queensland work health and safety law: the Work Health and Safety Act 2011 (Qld), the Work Health and Safety Regulation 2011 (Qld), and relevant WHS Codes of Practice.

Focus on: hazards to worker health and safety — falls and working at heights, PPE, exclusion zones, high-risk work licensing, SWMS, plant and equipment, excavation and trenching, electrical safety, asbestos worker exposure and removal licensing, hazardous materials handling.

The "legislation" field must cite ONLY WHS instruments (WHS Act, WHS Regulation, WHS Codes of Practice). Do NOT cite environmental (EP Act/Regulation) or building-quality (QBCC) instruments.

Do NOT raise environmental-harm findings (erosion, sediment, waste disposal to environment, contamination) or building-quality/workmanship findings (tolerances, defects, finishes) — those belong to other modules.

If the photo shows no significant safety issues, say so plainly. Do NOT manufacture or pad findings to fill the report.`,

  environmental: `You are currently assessing this site against the ENVIRONMENTAL compliance module ONLY.

Assess against Queensland environmental law: the Environmental Protection Act 1994 (Qld), the Environmental Protection Regulation 2019 (Qld), and the IECA erosion and sediment control model code of practice.

Focus on: risk of environmental harm and its controls — erosion and sediment control (sediment fences, stabilised site entries/exits, stockpile protection, drainage), stormwater and waterway contamination, dust and air, spill/fuel/chemical storage and management, regulated and general waste classification, containment and disposal to licensed facilities, land rehabilitation and the waste hierarchy.

Regulated waste note: materials such as asbestos are REGULATED WASTE under the EP Regulation. When such materials are present, assess the ENVIRONMENTAL dimension — proper containment, prevention of soil/water/site contamination, and disposal to an appropriately licensed facility — NOT worker exposure or PPE (that is the safety module's concern).

The "legislation" field must cite ONLY environmental instruments (EP Act 1994, EP Regulation 2019, IECA code). Do NOT cite WHS or QBCC instruments.

Do NOT raise worker-safety findings (PPE, harnesses, exclusion zones for worker protection, removal licensing) or building-quality findings — those belong to other modules.

If the photo shows no significant environmental issues, say so plainly (e.g. "No significant environmental compliance issues are visible in this photo"). Do NOT manufacture or pad findings.`,

  quality: `You are currently assessing this site against the QUALITY compliance module ONLY.

Assess against the QBCC Standards and Tolerances Guide (Queensland Building and Construction Commission).

Focus on: building workmanship, defects, and dimensional tolerances — structural and framing tolerances (timber/steel), surface flatness and level, wall plumb, cracking in concrete/masonry/finishes, waterproofing of wet areas, decks and balconies, tiling and finishes, and other measurable standards-and-tolerances compliance.

The "legislation"/reference field must cite ONLY the QBCC Standards and Tolerances Guide (with the relevant section). Do NOT cite WHS or environmental instruments.

Do NOT raise worker-safety findings or environmental-harm findings — those belong to other modules.

If the photo shows no significant quality/workmanship issues, say so plainly. Do NOT manufacture or pad findings.`,
}

const GENERIC_FALLBACK = 'construction site safety compliance Queensland WHS'

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────────
    const user = await getServerUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    const body = await request.json()
    const { messages, model, modules, scan_id, photo_urls, site_id, work_types, searchQuery } = body
    const moduleList: string[] = Array.isArray(modules) && modules.length > 0 ? modules : ['safety']
    const workTypes: string[] = Array.isArray(work_types) ? work_types : []

    // ── 3. RAG query resolution — ONCE ────────────────────────────────────────
    let query = GENERIC_FALLBACK
    let usedClassifier = false
    try {
      const rawQuery = (searchQuery as string | undefined)?.trim() ?? ''
      const hasUserQuery = rawQuery.length > 0 && rawQuery !== GENERIC_FALLBACK

      const imageBlocks = (messages ?? [])
        .flatMap((m: any) => Array.isArray(m.content) ? m.content : [])
        .filter((block: any) => block.type === 'image')
      const hasImages = imageBlocks.length > 0

      if (hasUserQuery) {
        query = rawQuery
      } else if (hasImages) {
        try {
          const classifierRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY || '',
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 100,
              temperature: 0,
              system: 'You are a construction site classifier. Look at this photo and list every work type and hazard category clearly visible. Be comprehensive but only include what is visibly present — do not guess. Respond with ONLY a comma-separated list of short work type terms, nothing else. Example: "asbestos removal, PPE, waste disposal"',
              messages: [{ role: 'user', content: imageBlocks }],
            }),
          })
          if (classifierRes.ok) {
            const classifierData = await classifierRes.json()
            const classified = classifierData.content?.[0]?.text?.trim()
            if (classified) {
              query = classified
              usedClassifier = true
            }
          }
        } catch {
          // Classifier failed — silent fallback, never block the scan
        }
      }

      console.log('[RAG QUERY SOURCE]', usedClassifier ? 'haiku-classified' : hasUserQuery ? 'user-provided' : 'generic-fallback')
    } catch {
      // Keep query = GENERIC_FALLBACK
    }

    // ── 4. Scan row ───────────────────────────────────────────────────────────
    let scanId: string

    if (scan_id) {
      // Re-analysis: verify ownership before proceeding
      const { data: existing, error: fetchErr } = await serviceRole
        .from('scans')
        .select('id, user_id')
        .eq('id', scan_id)
        .single()

      if (fetchErr || !existing) {
        return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
      }
      if (existing.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      scanId = scan_id
    } else {
      // New scan — create with verified user.id
      const { data: newScan, error: insertErr } = await serviceRole
        .from('scans')
        .insert({
          user_id: user.id,
          photo_url: Array.isArray(photo_urls) ? (photo_urls[0] ?? null) : null,
          photo_urls: photo_urls ?? null,
          site_id: site_id ?? null,
          work_types: workTypes.length > 0 ? workTypes : null,
          work_type: '',
          status: 'processing',
        })
        .select('id')
        .single()

      if (insertErr || !newScan) {
        return NextResponse.json({ error: 'Failed to create scan' }, { status: 500 })
      }
      scanId = newScan.id
    }

    // ── 5. Per-module loop — parallelised ────────────────────────────────────
    // Each module runs concurrently. Failure isolation is preserved: errors are
    // caught inside each task so the task always fulfills, never rejects.
    // Promise.allSettled provides a safety net if an uncaught error escapes.
    const results: Record<string, any> = {}

    await Promise.allSettled(
      moduleList.map(async (module) => {
        try {
          // a. RAG for this module
          const chunks = await searchDocuments(query, 'QLD', workTypes, 4, module)

          console.log('[RAG DEBUG] Query:', query)
          console.log('[RAG DEBUG] Module:', module, '| Chunks:', chunks.length)
          chunks.forEach((c, i) => {
            console.log(`[RAG DEBUG] Chunk ${i + 1}: "${c.title}" (similarity: ${c.similarity?.toFixed(3) || 'n/a'})`)
          })

          // b. Build system blocks (prompt-caching structure preserved)
          let ragSection = ''
          if (chunks.length > 0) {
            ragSection = chunks
              .map(c => `## ${c.title}\nSource: ${c.source || 'Queensland legislation'}\n\n${c.content}`)
              .join('\n\n---\n\n')
          }

          const systemBlocks: object[] = [
            {
              type: 'text',
              text: BASE_SYSTEM_PROMPT,
              cache_control: { type: 'ephemeral' },
            },
            {
              type: 'text',
              text: MODULE_PROMPTS[module] ?? MODULE_PROMPTS.safety,
            },
          ]
          if (ragSection) {
            systemBlocks.push({
              type: 'text',
              text: `\n\nRELEVANT QUEENSLAND LEGISLATION FROM DATABASE:\n\n${ragSection}`,
            })
          }

          // c. Temporary token-cost breakdown logging
          const msgChars = JSON.stringify(messages ?? []).length
          const est = (chars: number) => Math.round(chars / 4)
          console.log(
            `[TOKEN BREAKDOWN] module=${module}` +
            ` base=${est(BASE_SYSTEM_PROMPT.length)}` +
            ` moduleBlock=${est((MODULE_PROMPTS[module] ?? '').length)}` +
            ` rag=${est(ragSection.length)}` +
            ` userMsg=${est(msgChars)}`
          )

          // d. POST to Anthropic
          const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY || '',
              'anthropic-version': '2023-06-01',
              'anthropic-beta': 'prompt-caching-2024-07-31',
            },
            body: JSON.stringify({
              model: model || 'claude-sonnet-4-6',
              max_tokens: 4096,
              temperature: 0.1,
              system: systemBlocks,
              messages,
            }),
          })

          if (!anthropicRes.ok) {
            const errText = await anthropicRes.text()
            throw new Error(`Anthropic error ${anthropicRes.status}: ${errText.slice(0, 200)}`)
          }

          // d. Parse Claude's JSON response
          const anthropicData = await anthropicRes.json()
          const rawText: string = anthropicData.content?.[0]?.text ?? ''
          // Strip markdown fences — Claude wraps its response in ```json ... ``` despite instructions
          const stripped = rawText
            .replace(/^```json\s*/m, '')
            .replace(/^```\s*/m, '')
            .replace(/```\s*$/m, '')
            .trim()

          let parsed: any
          // Attempt 1: direct parse of stripped text
          try { parsed = JSON.parse(stripped) } catch (_) {}
          // Attempt 2: extract first {...} block (handles any preamble or trailing text)
          if (!parsed) {
            const match = stripped.match(/\{[\s\S]*\}/)
            if (match) { try { parsed = JSON.parse(match[0]) } catch (_) {} }
          }
          // Attempt 3: brace scan — slice from first { to last }
          if (!parsed) {
            const f = stripped.indexOf('{'), l = stripped.lastIndexOf('}')
            if (f !== -1 && l !== -1) { try { parsed = JSON.parse(stripped.slice(f, l + 1)) } catch (_) {} }
          }
          if (!parsed) {
            throw new Error(`Failed to parse Claude JSON for module "${module}"`)
          }

          // e. Upsert scan_modules
          await serviceRole.from('scan_modules').upsert(
            {
              scan_id: scanId,
              module,
              status: parsed.status ?? 'uncertain',
              confidence: null,
              legislation: parsed.legislation ?? null,
              findings: parsed.findings ?? null,
              summary: parsed.summary ?? null,
              checklist: null,
              checklist_state: null,
              follow_up_questions: parsed.follow_up_questions ?? null,
            },
            { onConflict: 'scan_id,module' }
          )

          results[module] = { ...parsed }
        } catch (moduleErr: any) {
          console.error(`[analyse] module "${module}" failed:`, moduleErr?.message)
          try {
            await serviceRole.from('scan_modules').upsert(
              { scan_id: scanId, module, status: 'error' },
              { onConflict: 'scan_id,module' }
            )
          } catch {}
          results[module] = { status: 'error' }
          // Caught here — task fulfills so other modules are unaffected
        }
      })
    )

    // ── 6. Update scans row — unconditional ──────────────────────────────────
    // Always runs after the loop. If every module errored, scan is marked 'error'
    // and never left stuck on 'processing'.
    const firstSuccess = Object.values(results).find(r => r.status !== 'error')
    await serviceRole.from('scans').update({
      work_type: firstSuccess?.work_type ?? '',
      work_types: firstSuccess?.work_types ?? null,
      status: firstSuccess?.status ?? 'error',
    }).eq('id', scanId)

    // ── 7. Return ─────────────────────────────────────────────────────────────
    return NextResponse.json({ scanId, results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Request failed' }, { status: 500 })
  }
}
