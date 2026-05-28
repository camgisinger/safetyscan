import { createClient } from '@supabase/supabase-js'

// Use service role key for server-side vector operations — never exposed to client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI embedding failed (${res.status}): ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.data[0].embedding as number[]
}

export async function searchDocuments(
  query: string,
  region: string = 'QLD',
  workTypes: string[] = [],
  matchCount: number = 8
): Promise<Array<{ title: string; content: string; source: string; similarity: number }>> {
  const embedding = await generateEmbedding(query)

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: matchCount,
    filter_region: region,
    filter_work_types: workTypes.length > 0 ? workTypes : null,
  })

  if (error) throw new Error(`match_documents RPC failed: ${error.message}`)

  return (data || []) as Array<{ title: string; content: string; source: string; similarity: number }>
}
