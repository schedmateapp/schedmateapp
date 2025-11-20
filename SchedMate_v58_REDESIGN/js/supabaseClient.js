import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// TODO: Replace with your real values
const SUPABASE_URL = "https://dhgczaqzsuvcofqojoqv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZ2N6YXF6c3V2Y29mcW9qb3F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjU5NTEsImV4cCI6MjA3ODcwMTk1MX0.UMtWwzHHGJL0nP6AQyxDXUa8SDve_vfak1EYjYPqdXs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
