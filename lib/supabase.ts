import { createBrowserClient } from '@supabase/ssr'

// Define and export Supabase URL and anon key
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create and export Supabase client instance
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server-side client - Not fully implemented for now
// Ensure all DB access from server uses official Supabase helper libraries for Next.js
export const createServerSupabaseClient = () => {
  // This function needs to be properly implemented if server-side operations
  // not using Supabase helper libraries are required.
  console.warn(
    'createServerSupabaseClient is not fully implemented. Use official Supabase helpers for server-side Next.js operations.'
  )
  return null
}
