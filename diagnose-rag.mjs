
// Run: node diagnose-rag.mjs
// Diagnoses match_documents function definition and RAG retrieval behaviour

import { createClient } from './node_modules/@supabase/supabase-js/dist/index.mjs'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.split('=').slice(0, 1)[0].trim(), l.split('=').slice(1).join('=').trim()])
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = env.OPENAI_API_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function embed(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  })
  const d = await res.json()
  if (!res.ok) throw new Error(`OpenAI error: ${JSON.stringify(d)}`)
  return d.data[0].embedding
}

async function main() {
  console.log('=== 1. Fetch match_documents function definition from information_schema ===')
  const { data: routines, error: routineErr } = await supabase
    .from('information_schema.routines')
    .select('routine_name, routine_definition, data_type, external_language')
    .eq('routine_name', 'match_documents')

  if (routineErr) {
    console.log('information_schema.routines error:', routineErr.message)
  } else {
    console.log('Routines found:', routines?.length)
    console.log(JSON.stringify(routines, null, 2))
  }

  console.log('\n=== 2. Fetch function via pg_proc RPC ===')
  // Try calling pg_get_functiondef via a direct rpc
  const { data: procData, error: procErr } = await supabase.rpc('pg_get_functiondef', {
    funcid: null
  })
  console.log('pg_get_functiondef direct call error (expected):', procErr?.message)

  console.log('\n=== 3. Query pg_catalog via REST fallback ===')
  // Some Supabase instances expose pg_catalog via REST
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pg_catalog.pg_proc?select=proname,prosrc,proargnames&proname=eq.match_documents`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    }
  })
  const txt = await res.text()
  console.log('pg_catalog status:', res.status)
  console.log('pg_catalog response:', txt.slice(0, 500))

  console.log('\n=== 4. Call match_documents with known-similar query ===')
  const queryVec = await embed('Asbestos')
  console.log('Query vector magnitude:', Math.sqrt(queryVec.reduce((s,v)=>s+v*v,0)).toFixed(6))

  const { data: results, error: matchErr } = await supabase.rpc('match_documents', {
    query_embedding: queryVec,
    match_count: 10,
    match_region: 'QLD',
    match_work_types: null,
  })
  if (matchErr) {
    console.log('match_documents error:', matchErr.message)
  } else {
    console.log(`Results count: ${results?.length ?? 0}`)
    results?.forEach((r, i) => console.log(`  [${i+1}] sim=${r.similarity?.toFixed(4)} | ${r.title?.slice(0,80)}`))
  }

  console.log('\n=== 5. Call match_documents with higher match_count ===')
  const { data: r2, error: e2 } = await supabase.rpc('match_documents', {
    query_embedding: queryVec,
    match_count: 50,
    match_region: 'QLD',
    match_work_types: null,
  })
  if (e2) {
    console.log('Error (match_count=50):', e2.message)
  } else {
    console.log(`Results count (match_count=50): ${r2?.length ?? 0}`)
    r2?.forEach((r, i) => console.log(`  [${i+1}] sim=${r.similarity?.toFixed(4)} | ${r.title?.slice(0,80)}`))
  }

  console.log('\n=== 6. Call match_documents with no region filter ===')
  const { data: r3, error: e3 } = await supabase.rpc('match_documents', {
    query_embedding: queryVec,
    match_count: 10,
    match_region: null,
    match_work_types: null,
  })
  if (e3) {
    console.log('Error (no region):', e3.message)
  } else {
    console.log(`Results count (no region): ${r3?.length ?? 0}`)
    r3?.forEach((r, i) => console.log(`  [${i+1}] sim=${r.similarity?.toFixed(4)} | ${r.title?.slice(0,80)}`))
  }

  console.log('\n=== 7. Fetch one asbestos doc embedding from DB and compare cosines ===')
  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('id, title, embedding')
    .ilike('title', '%asbestos%')
    .limit(1)
    .single()

  if (docErr || !doc) {
    console.log('Doc fetch error:', docErr?.message)
  } else {
    console.log('Doc:', doc.title)
    const storedVec = typeof doc.embedding === 'string' ? JSON.parse(doc.embedding) : doc.embedding
    const mag = Math.sqrt(storedVec.reduce((s, v) => s + v * v, 0))
    const dot = queryVec.reduce((s, v, i) => s + v * storedVec[i], 0)
    const cos = dot / (Math.sqrt(queryVec.reduce((s,v)=>s+v*v,0)) * mag)
    console.log(`Stored vector dims: ${storedVec.length}`)
    console.log(`Stored vector magnitude: ${mag.toFixed(6)}`)
    console.log(`Dot product with "Asbestos": ${dot.toFixed(4)}`)
    console.log(`Cosine similarity with "Asbestos": ${cos.toFixed(4)}`)
    console.log(`Expected return from match_documents if threshold < ${cos.toFixed(4)}`)
  }

  console.log('\n=== 8. Call match_documents with text-3-small embedding of generic fallback ===')
  const genericVec = await embed('construction site safety compliance Queensland WHS')
  const { data: r4, error: e4 } = await supabase.rpc('match_documents', {
    query_embedding: genericVec,
    match_count: 4,
    match_region: 'QLD',
    match_work_types: null,
  })
  if (e4) {
    console.log('Error (generic):', e4.message)
  } else {
    console.log(`Results count (generic fallback): ${r4?.length ?? 0}`)
    r4?.forEach((r, i) => console.log(`  [${i+1}] sim=${r.similarity?.toFixed(4)} | ${r.title?.slice(0,80)}`))
  }

  console.log('\n=== 9. Check what similarity values match_documents returns for "scaffolding" ===')
  const scaffVec = await embed('scaffolding falls from height edge protection')
  const { data: r5, error: e5 } = await supabase.rpc('match_documents', {
    query_embedding: scaffVec,
    match_count: 10,
    match_region: 'QLD',
    match_work_types: null,
  })
  if (e5) {
    console.log('Error (scaffolding):', e5.message)
  } else {
    console.log(`Results count (scaffolding): ${r5?.length ?? 0}`)
    r5?.forEach((r, i) => console.log(`  [${i+1}] sim=${r.similarity?.toFixed(4)} | ${r.title?.slice(0,80)}`))
  }
}

main().catch(console.error)
