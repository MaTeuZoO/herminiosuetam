import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mtqiieeyncpbjncpfwno.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10cWlpZWV5bmNwYmpuY3Bmd25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzczMDcsImV4cCI6MjA2NzkxMzMwN30.83d2x0B3_V3aYjaBuUcwh6lZIx48wGJ1vJKImpGS2Y8'

export const supabase = createClient(supabaseUrl, supabaseKey)