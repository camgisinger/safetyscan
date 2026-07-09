import { createClient } from './node_modules/@supabase/supabase-js/dist/index.mjs'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.split('=').slice(0,1)[0].trim(), l.split('=').slice(1).join('=').trim()])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Fetch ALL document titles currently in the database
let allTitles = []
let page = 0
const pageSize = 1000
while (true) {
  const { data, error } = await supabase
    .from('documents')
    .select('title')
    .range(page * pageSize, (page + 1) * pageSize - 1)
  if (error) { console.error('DB error:', error.message); break }
  if (!data || data.length === 0) break
  allTitles = allTitles.concat(data.map(r => r.title))
  if (data.length < pageSize) break
  page++
}

console.log(JSON.stringify(allTitles))
