import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const SCAN_PHOTOS_BUCKET = 'scan-photos'

export type Site = {
  id: string
  user_id: string
  name: string
  location: string | null
  archived: boolean
  created_at: string
}

export type Scan = {
  id: string
  user_id: string
  site_id: string | null
  work_type: string
  work_types: string[] | null
  status: string
  legislation: any
  findings: any
  summary: string
  checklist: any
  follow_up_questions: any
  photo_url: string | null
  photo_urls: string[] | null
  notes: string | null
  checklist_state: Record<string, boolean> | null
  share_token: string | null
  share_enabled: boolean
  created_at: string
}
