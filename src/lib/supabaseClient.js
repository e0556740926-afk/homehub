import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "חסרים VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — הגדר אותם ב-.env (ראה .env.example)"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
