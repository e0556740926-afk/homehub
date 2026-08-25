import { useState } from "react";
import SheetShell from "./SheetShell";

function fmt(n) {
  return "₪" + Number(n || 0).toFixed(2).replace(/\.00$/, "");
}

export default function ReviewSheet({ parsed, onClose, onConfirm }) {
  const [fixed, setFixed] = useState({}); // index -> true once confirmed
  const [saving, setSaving] = useState(false);

  if (!parsed) return null;
  const lowConfidenceIdx = parsed.items.findIndex((it) => (it.confidence ?? 1) < 0.7);
  const needsFix = lowConfidenceIdx >= 0 && !fixed[lowConfidenceIdx];

  async function handleConfirm() {
    if (saving) return;
    setSaving(true);
    try {
      await onConfirm(parsed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SheetShell title="אישור קבלה" onClose={onClose}>
      <div className="text-muted text-xs mb-3">
        {parsed.store || "חנות לא זוהתה"} · {parsed.purchased_at || "תאריך לא זוהה"} · {parsed.items.length} פריטים
      </div>
      <div className="flex flex-col gap-2.5 mb-4">
        {parsed.items.map((it, idx) => {
          const low = (it.confidence ?? 1) < 0.7;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl px-4 py-3 ${low && !fixed[idx] ? "border-[1.5px] border-terracotta" : ""}`}
            >
              <div className="flex justify-between items-center">
                <div className="font-display font-bold text-sm text-ink">
                  {it.name} · {it.quantity} {it.unit}
                </div>
                <div className="font-display font-bold text-sm text-ink">{fmt(it.total_price)}</div>
              </div>
              <div
                className={`text-xs mt-1 font-semibold ${
                  low && !fixed[idx] ? "text-terracotta" : fixed[idx] ? "text-sage" : "text-muted"
                }`}
              >
                {low && fixed[idx]
                  ? "אושר ידנית"
                  : low
                  ? `שם המוצר לא ודאי · ביטחון ${Math.round((it.confidence ?? 0) * 100)}%`
                  : it.unit_price
                  ? `₪${it.unit_price} ליחידה`
                  : ""}
              </div>
              {low && !fixed[idx] && (
                <button
                  onClick={() => setFixed((s) => ({ ...s, [idx]: true }))}
                  className="mt-2 w-full bg-terracotta text-white rounded-lg py-2 text-sm font-bold"
                >
                  אישור
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button
        disabled={needsFix || saving}
        onClick={handleConfirm}
        className={`w-full rounded-xl2 py-3.5 text-center font-display font-bold ${
          needsFix || saving ? "bg-chip text-mutedLight" : "bg-ink text-cream"
        }`}
      >
        {saving ? "שומר…" : needsFix ? "צריך לאשר את הפריט המסומן" : "שמור ועדכן מלאי"}
      </button>
    </SheetShell>
  );
}
