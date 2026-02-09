import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rsiabnbiyzhopnhjdobf.supabase.com'
const supabaseAnonKey = 'sb_publishable_aWKSBql1jr3OIDW0SYZbTg_oFo3p5Y4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
