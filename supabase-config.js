/* =========================================================
   SUPABASE CONFIG
   Fill in the two values below from:
   Supabase Dashboard → Settings → API
   - "Project URL"        → SUPABASE_URL
   - "anon public" key    → SUPABASE_ANON_KEY
   Never put your "service_role" key here — that one must
   stay on a server and never ship in frontend code.
   ========================================================= */

const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
