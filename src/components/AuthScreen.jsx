import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthScreen() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fn = mode === "signin" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { error } = await fn({ email, password });
    setBusy(false);
    if (error) setError(error.message);
    else if (mode === "signup") setError("נרשם! בדוק את המייל לאישור, ואז התחבר.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base p-6" dir="rtl">
      <div className="w-full max-w-sm bg-white rounded-xl2 p-6 shadow-sm">
        <div className="font-display font-extrabold text-2xl text-ink mb-1">HomeHub</div>
        <div className="text-muted text-sm mb-6">ניהול משק הבית שלך — מלאי, קניות, קבלות ומתכונים</div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-chip rounded-xl px-4 py-3 text-ink outline-none focus:ring-2 focus:ring-ink/20"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-chip rounded-xl px-4 py-3 text-ink outline-none focus:ring-2 focus:ring-ink/20"
          />
          {error && <div className="text-terracotta text-sm">{error}</div>}
          <button
            type="submit"
            disabled={busy}
            className="bg-ink text-cream rounded-xl py-3 font-bold font-display disabled:opacity-50"
          >
            {mode === "signin" ? "התחברות" : "הרשמה"}
          </button>
        </form>
        <button
          className="text-mutedDark text-sm mt-4 underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "משתמש חדש? הירשם כאן" : "כבר יש לך חשבון? התחבר"}
        </button>
      </div>
    </div>
  );
}
