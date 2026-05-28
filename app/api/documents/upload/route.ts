import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../../../../lib/embeddings'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { title, source, content, region, work_types, metadata } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    const embedding = await generateEmbedding(content)

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title,
        source: source || null,
        content,
        region: region || 'QLD',
        work_types: work_types || [],
        metadata: metadata || {},
        embedding,
        chunk_index: 0,
      })
      .select('id')
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, id: data.id })
  } catch (error: any) {
    console.error('[documents/upload]', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
