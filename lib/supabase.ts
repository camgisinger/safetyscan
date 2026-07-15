import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const SCAN_PHOTOS_BUCKET = 'scan-photos'
export const BRAND_LOGOS_BUCKET = 'brand-logos'

export type Site = {
  id: string
  created_by: string
  name: string
  location: string | null
  archived: boolean
  created_at: string
}

export type Scan = {
  id: string
  created_by: string
  site_id: string | null
  work_type: string
  work_types: string[] | null
  status: string
  legislation: any
  findings: any
  summary: string
  follow_up_questions: any
  photo_url: string | null
  photo_urls: string[] | null
  notes: string | null
  share_token: string | null
  share_enabled: boolean
  created_at: string
}
