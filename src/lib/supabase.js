import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    db: { schema: 'anger-controller' },
    auth: { persistSession: true, autoRefreshToken: true }
  }
)

export default supabase
