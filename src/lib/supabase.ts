import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

// Debug info in development (disabled)
// if (process.env.NODE_ENV === 'development') {
//     console.log('Supabase URL:', supabaseUrl)
//     console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...')
// }

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        debug: false // Disable debug logging
    }
})
