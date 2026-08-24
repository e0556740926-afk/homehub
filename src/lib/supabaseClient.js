import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "חסרים VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — הגדר אותם ב-.env (מקומית) או במשתני הסביבה של Netlify (בפריסה)."
  );
}

// Never let a missing/invalid config crash the whole app at import time
// (that produces a silent blank page with no visible error). Fall back to
// harmless placeholder values so the client can be constructed; App.jsx
// checks isSupabaseConfigured and shows a clear setup screen instead.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);
