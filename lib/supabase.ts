import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database connection for direct queries (using Supabase's connection pooler)
export const getSupabaseConnection = () => {
  return {
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'db.xbsndhaswzuvkarvzjyq.supabase.co',
    database: process.env.PGDATABASE || 'postgres',
    password: process.env.PGPASSWORD!,
    port: parseInt(process.env.PGPORT || '5432', 10),
  }
}