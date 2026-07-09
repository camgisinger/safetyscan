import { createClient } from './node_modules/@supabase/supabase-js/dist/index.mjs'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.split('=').slice(0, 1)[0].trim(), l.split('=').slice(1).join('=').trim()])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const OPENAI_KEY = env.OPENAI_API_KEY

async function embed(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 30000) })
  })
  const d = await res.json()
  if (!res.ok) throw new Error(`OpenAI error: ${JSON.stringify(d)}`)
  return d.data[0].embedding
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function parseFile(filepath) {
  const lines = readFileSync(filepath, 'utf8').split('\n')

  // Parse header (everything before first '---' line)
  const header = {}
  let bodyStart = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') { bodyStart = i + 1; break }
    const m = lines[i].match(/^([A-Z_]+):\s*(.+)$/)
    if (m) header[m[1]] = m[2].trim()
  }

  const document = header['DOCUMENT']
  const region = header['REGION'] || 'QLD'
  const source = header['SOURCE'] || null
  const work_types = (header['WORK_TYPES'] || '').split(',').map(s => s.trim()).filter(Boolean)

  // Parse chunks: delimited by lines matching "CHUNK N: topic"
  const chunks = []
  let currentTopic = null
  let currentLines = []

  for (let i = bodyStart; i < lines.length; i++) {
    const m = lines[i].match(/^CHUNK \d+:\s*(.+)$/)
    if (m) {
      if (currentTopic !== null) {
        chunks.push({ title: `${document} — ${currentTopic}`, content: currentLines.join('\n').trim() })
      }
      currentTopic = m[1].trim()
      currentLines = []
    } else if (currentTopic !== null) {
      currentLines.push(lines[i])
    }
  }
  if (currentTopic !== null) {
    chunks.push({ title: `${document} — ${currentTopic}`, content: currentLines.join('\n').trim() })
  }

  return { document, region, source, work_types, chunks }
}

const FILES = [
  '_vector_docs/ep_act_1994_qld_vector.txt',
  '_vector_docs/ep_regulation_2019_qld_vector.txt',
  '_vector_docs/ieca_esc_building_sites_vector.txt',
  '_vector_docs/qbcc_standards_tolerances_2023_vector.txt',
]

async function main() {
  const totals = {}
  const failures = {}

  for (const filepath of FILES) {
    const filename = filepath.split('/').pop()
    const { document, region, source, work_types, chunks } = parseFile(filepath)

    console.log(`\n[${filename}] ${chunks.length} chunks | DOCUMENT="${document}" | region=${region}`)

    totals[filename] = 0
    failures[filename] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const num = i + 1
      try {
        const embedding = await embed(chunk.content)
        const { data, error } = await supabase.from('documents').insert({
          title: chunk.title,
          source,
          content: chunk.content,
          region,
          work_types,
          metadata: {},
          embedding,
          chunk_index: i,
        }).select('id').single()

        if (error) {
          console.log(`  chunk ${num}/${chunks.length} ERROR: ${error.message} | ${chunk.title.slice(0, 70)}`)
          failures[filename].push(num)
        } else {
          console.log(`  chunk ${num}/${chunks.length} OK (id=${data.id}) | ${chunk.title.slice(0, 70)}`)
          totals[filename]++
        }
      } catch (e) {
        console.log(`  chunk ${num}/${chunks.length} EXCEPTION: ${e.message}`)
        failures[filename].push(num)
      }

      if (i < chunks.length - 1) await sleep(1000)
    }
  }

  console.log('\n=== UPLOAD SUMMARY ===')
  for (const filename of FILES.map(f => f.split('/').pop())) {
    const failed = failures[filename]?.length ?? 0
    const ok = totals[filename] ?? 0
    console.log(`${filename}: ${ok} uploaded${failed > 0 ? `, ${failed} FAILED (chunks: ${failures[filename].join(', ')})` : ', 0 failed'}`)
  }
}

main().catch(console.error)
