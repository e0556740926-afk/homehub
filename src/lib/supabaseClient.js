import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export let isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export let supabaseConfigError = null;

if (!isSupabaseConfigured) {
  supabaseConfigError = "VITE_SUPABASE_URL ו/או VITE_SUPABASE_ANON_KEY ריקים או לא מוגדרים.";
  // eslint-disable-next-line no-console
  console.warn(supabaseConfigError);
} else if (!/^https:\/\/.+\.supabase\.co\/?$/.test(supabaseUrl)) {
  // Catches the common mistake of pasting the values into the wrong fields
  // (e.g. the anon key into the URL field), which otherwise throws deep
  // inside createClient during module import — before React even mounts,
  // so no error boundary can catch it and the page is just blank.
  isSupabaseConfigured = false;
  supabaseConfigError = `VITE_SUPABASE_URL לא נראה כמו כתובת Supabase תקינה: "${supabaseUrl.slice(0, 60)}". ייתכן שהוא הוחלף בטעות עם VITE_SUPABASE_ANON_KEY.`;
  // eslint-disable-next-line no-console
  console.warn(supabaseConfigError);
}

// Never let a missing/invalid config crash the whole app at import time
// (that produces a silent blank page with no visible error, since it
// happens before React mounts and no error boundary can catch it). Fall
// back to harmless placeholder values so the client can always be
// constructed; App.jsx checks isSupabaseConfigured and shows a clear
// setup screen (with supabaseConfigError) instead.
let client;
try {
  client = createClient(
    isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
    isSupabaseConfigured ? supabaseAnonKey : "placeholder"
  );
} catch (err) {
  isSupabaseConfigured = false;
  supabaseConfigError = `שגיאה ביצירת חיבור ל-Supabase: ${err.message || err}`;
  // eslint-disable-next-line no-console
  console.error(supabaseConfigError);
  client = createClient("https://placeholder.supabase.co", "placeholder");
}

export const supabase = client;
