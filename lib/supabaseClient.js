import { createClient } from '@supabase/supabase-js'

// Environment variables - must be set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase Error: Missing environment variables.')
  console.info('Current URL:', supabaseUrl ? 'Set' : 'MISSING')
  console.info('Current Key:', supabaseAnonKey ? 'Set' : 'MISSING')
}

/**
 * Supabase client for browser-side usage.
 * Uses anon key — row-level security (RLS) should be enabled on all tables.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

/**
 * Helper: get the current authenticated user's session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

/**
 * Helper: get the current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}
