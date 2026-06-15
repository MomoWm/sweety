import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fxmrmhfpdkrkkgxzdkvq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jfI5dxVmZDga-2jBXt_fMQ_Lz2rfjtA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
