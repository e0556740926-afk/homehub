import { useRef, useState } from "react";
import { Flame } from "lucide-react";
import SheetShell from "./SheetShell";

const SERVING_OPTIONS = [1, 2, 3, 4, 6];

export default function CalorieSheet({ onClose, onEstimate }) {
  const inputRef = useRef(null);
  const [servings, setServings] = useState(1);
  const [status, setStatus] = useState("idle"); // idle | busy | result | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleFile(file) {
    setStatus("busy");
    try {
      const data = await onEstimate(file, servings);
      setResult(data);
      setStatus("result");
    } catch (err) {
      setError(err.message || "שגיאה בהערכת הקלוריות");
      setStatus("error");
    }
  }

  return (
    <SheetShell title="הערכת קלוריות מתמונה" onClose={onClose}>
      {status !== "result" && (
        <>
          <div className="font-display font-bold text-sm text-ink mb-2">לכמה מנות מתחלקת הארוחה?</div>
          <div className="flex gap-2 flex-wrap mb-5">
            {SERVING_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setServings(n)}
                className={`w-10 h-10 rounded-full font-display font-bold text-sm ${
                  servings === n ? "bg-ink text-cream" : "bg-chip text-mutedDark"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div
            onClick={() => status !== "busy" && inputRef.current?.click()}
            className="bg-white rounded-xl2 h-56 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border cursor-pointer"
          >
            {status === "busy" ? (
              <>
                <div className="w-8 h-8 border-4 border-ink/20 border-t-ink rounded-full animate-spin" />
                <div className="text-mutedDark text-sm font-semibold">מעריך קלוריות…</div>
              </>
            ) : (
              <>
                <div className="text-4xl">🍽️</div>
                <div className="text-ink font-display font-bold">צלם את הארוחה</div>
                <div className="text-muted text-xs">הערכה חד-פעמית — לא נשמר</div>
              </>
            )}
          </div>

          {status === "error" && <div className="text-terracotta text-sm mt-3">{error}</div>}
        </>
      )}

      {status === "result" && result && (
        <div>
          <div className="bg-white rounded-xl2 p-5 text-center mb-4">
            <Flame className="mx-auto mb-2" size={28} color="#E2603C" strokeWidth={2} />
            <div className="font-display font-extrabold text-xl text-ink mb-1">{result.dish_name}</div>
            <div className="text-xs text-muted mb-4">רמת ביטחון: {Math.round((result.confidence ?? 0) * 100)}%</div>

            <div className="flex justify-center gap-6">
              <div>
                <div className="font-display font-extrabold text-3xl text-terracotta">
                  {Math.round(result.calories_per_serving)}
                </div>
                <div className="text-xs text-muted">קק״ל למנה</div>
              </div>
              <div className="w-px bg-base" />
              <div>
                <div className="font-display font-extrabold text-3xl text-ink">{Math.round(result.total_calories)}</div>
                <div className="text-xs text-muted">קק״ל סה״כ · {servings} מנות</div>
              </div>
            </div>
          </div>
          {result.note && <div className="text-xs text-mutedDark leading-relaxed mb-4">{result.note}</div>}
          <button
            onClick={() => {
              setStatus("idle");
              setResult(null);
            }}
            className="w-full bg-white text-ink rounded-xl2 py-3 font-display font-bold shadow-sm"
          >
            צלם ארוחה נוספת
          </button>
        </div>
      )}
    </SheetShell>
  );
}
