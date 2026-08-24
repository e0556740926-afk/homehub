import { useRef, useState } from "react";
import SheetShell from "./SheetShell";

export default function FridgeScanSheet({ onClose, onScan, onConfirm }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | busy | review
  const [items, setItems] = useState([]);
  const [checked, setChecked] = useState({});

  async function handleFile(file) {
    setStatus("busy");
    try {
      const found = await onScan(file);
      setItems(found);
      setChecked(Object.fromEntries(found.map((_, i) => [i, true])));
      setStatus("review");
    } catch (err) {
      setStatus("idle");
    }
  }

  function toggle(idx) {
    setChecked((c) => ({ ...c, [idx]: !c[idx] }));
  }

  function commit() {
    const selected = items.filter((_, idx) => checked[idx]);
    onConfirm(selected);
    onClose();
  }

  return (
    <SheetShell title="סריקת מדף" onClose={onClose}>
      {status !== "review" && (
        <>
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
            className="bg-white rounded-xl2 h-64 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border cursor-pointer"
          >
            {status === "busy" ? (
              <>
                <div className="w-8 h-8 border-4 border-ink/20 border-t-ink rounded-full animate-spin" />
                <div className="text-mutedDark text-sm font-semibold">מזהה מה יש על המדף…</div>
              </>
            ) : (
              <>
                <div className="text-4xl">🧊</div>
                <div className="text-ink font-display font-bold">צלם מדף במקרר / מזווה</div>
                <div className="text-muted text-xs">כל המוצרים הנראים בתמונה יזוהו בבת אחת</div>
              </>
            )}
          </div>
        </>
      )}

      {status === "review" && (
        <>
          <div className="text-muted text-xs mb-3">סמן מה נכון להוסיף למלאי — {items.length} פריטים זוהו</div>
          <div className="flex flex-col gap-2 mb-5">
            {items.map((it, idx) => (
              <button
                key={idx}
                onClick={() => toggle(idx)}
                className={`text-right bg-white rounded-xl px-3.5 py-2.5 flex items-center justify-between ${
                  !checked[idx] ? "opacity-40" : ""
                }`}
              >
                <div>
                  <div className="font-display font-bold text-sm text-ink">{it.name}</div>
                  <div className="text-xs text-muted">
                    {it.quantity} {it.unit} · {it.location}
                  </div>
                </div>
                <div
                  className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-none"
                  style={{ borderColor: checked[idx] ? "#2A2724" : "#DED5CA", background: checked[idx] ? "#2A2724" : "transparent" }}
                >
                  {checked[idx] && <span className="text-cream text-xs">✓</span>}
                </div>
              </button>
            ))}
          </div>
          <button onClick={commit} className="w-full bg-ink text-cream rounded-xl2 py-3.5 font-display font-bold">
            הוסף {Object.values(checked).filter(Boolean).length} פריטים למלאי
          </button>
        </>
      )}
    </SheetShell>
  );
}
