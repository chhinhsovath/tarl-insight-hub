// Supabase configuration - Currently disabled for static demo
// This file is kept for future database integration

export const supabase = null

export const createServerSupabaseClient = () => {
  return null
}

// Mock functions for compatibility
export const mockSupabaseClient = {
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        order: (column: string, options?: any) => ({
          data: [],
          error: new Error("Static mode - no database connection"),
        }),
      }),
      order: (column: string, options?: any) => ({
        data: [],
        error: new Error("Static mode - no database connection"),
      }),
      data: [],
      error: new Error("Static mode - no database connection"),
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => ({
          data: null,
          error: new Error("Static mode - no database connection"),
        }),
      }),
    }),
  }),
}
