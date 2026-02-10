import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rsiabnbiyzhopnhjdobf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzaWFibmJpeXpob3BuaGpkb2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTM5ODgsImV4cCI6MjA4NjE2OTk4OH0.-rx6emhLRJgh78RewlG2mI9hZQyzlC-CSaNUptXTfs4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
