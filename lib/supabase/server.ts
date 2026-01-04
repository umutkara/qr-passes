import { createClient } from '@supabase/supabase-js';

export function supabaseServer() {
  // For server components, use regular client
  // Cookies are managed automatically by Supabase
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
