import { useState } from "react";
import SheetShell from "./SheetShell";

const STEPS = [
  { key: "servings", q: "לכמה אנשים מבשלים?", opts: ["1", "2", "4", "6"] },
  { key: "style", q: "איזה סגנון ארוחה מתאים עכשיו?", opts: ["חלבי", "בשרי", "פרווה", "טבעוני"] },
  { key: "time", q: "כמה זמן יש לך?", opts: ["15", "30", "60"] },
  { key: "flex", q: "רמת גמישות בקנייה?", opts: ["רק מה שיש", "עד מצרך אחד חסר", "עד 2 חסרים"] },
];

export default function WizardSheet({ onClose, onDone, defaultServings = 2, busy }) {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState({ servings: String(defaultServings), style: "חלבי", time: "30", flex: "עד מצרך אחד חסר" });

  const s = STEPS[step];

  function pick(v) {
    setAns((a) => ({ ...a, [s.key]: v }));
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onDone(ans);
    }
  }

  function back() {
    if (step === 0) onClose();
    else setStep(step - 1);
  }

  return (
    <SheetShell title={`שאלה ${step + 1} מתוך ${STEPS.length}`} onClose={onClose}>
      <div className="h-1 bg-chip rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-terracotta rounded-full transition-all"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>
      <div className="font-display font-extrabold text-2xl text-ink mb-5">{s.q}</div>
      <div className="flex flex-col gap-2.5 mb-6">
        {s.opts.map((o) => {
          const on = ans[s.key] === o;
          return (
            <button
              key={o}
              onClick={() => pick(o)}
              className={`rounded-2xl px-4 py-3.5 flex justify-between items-center font-display font-bold text-base ${
                on ? "bg-ink text-cream" : "bg-white text-ink shadow-sm"
              }`}
            >
              <span>{o}</span>
              {on && <span>✓</span>}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2.5">
        <button onClick={back} className="px-5 py-3.5 rounded-xl2 bg-chip text-mutedDark font-display font-bold">
          חזרה
        </button>
        <button
          onClick={next}
          disabled={busy}
          className="flex-1 bg-ink text-cream rounded-xl2 py-3.5 font-display font-bold disabled:opacity-50"
        >
          {busy ? "מחפש התאמות…" : step === STEPS.length - 1 ? "הצג התאמות" : "המשך"}
        </button>
      </div>
    </SheetShell>
  );
}
