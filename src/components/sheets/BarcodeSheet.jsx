import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import SheetShell from "./SheetShell";
import { lookupBarcode } from "../../lib/api";

const UNITS = ["יח׳", "ג׳", "ק״ג", "ל׳", "מ״ל"];
const LOCATIONS = ["מקרר", "מזווה", "מקפיא"];

export default function BarcodeSheet({ onClose, onAdd }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [status, setStatus] = useState("scanning"); // scanning | looking-up | not-found | error | found
  const [errorMsg, setErrorMsg] = useState("");
  const [draft, setDraft] = useState({ name: "", quantity: "1", unit: "יח׳", location: "מזווה" });

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, async (result, err, controls) => {
        controlsRef.current = controls;
        if (result && !cancelled) {
          cancelled = true;
          controls.stop();
          const code = result.getText();
          setStatus("looking-up");
          try {
            const product = await lookupBarcode(code);
            if (product?.name) {
              setDraft((d) => ({ ...d, name: product.name }));
              setStatus("found");
            } else {
              setStatus("not-found");
            }
          } catch {
            setStatus("error");
            setErrorMsg("שגיאה בבדיקת הברקוד ברשת");
          }
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("אין גישה למצלמה");
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, []);

  function commit() {
    if (!draft.name.trim()) return;
    onAdd({ name: draft.name.trim(), quantity: draft.quantity, unit: draft.unit, location: draft.location });
    onClose();
  }

  return (
    <SheetShell title="סריקת ברקוד" onClose={onClose}>
      {(status === "scanning" || status === "looking-up") && (
        <div className="rounded-xl2 overflow-hidden bg-black relative h-64 mb-4">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {status === "looking-up" && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <div className="text-white text-sm font-semibold">בודק מול מאגר מוצרים…</div>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="bg-white rounded-xl2 p-5 text-center mb-4">
          <div className="text-terracotta text-sm font-semibold">{errorMsg}</div>
        </div>
      )}

      {(status === "found" || status === "not-found") && (
        <>
          {status === "not-found" && (
            <div className="text-muted text-sm mb-3">המוצר לא נמצא במאגר — הזן שם ידנית:</div>
          )}
          <input
            autoFocus
            placeholder="שם הפריט"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            className="w-full bg-white rounded-xl px-4 py-3 text-ink mb-3 outline-none"
          />
          <input
            type="number"
            placeholder="כמות"
            value={draft.quantity}
            onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))}
            className="w-full bg-white rounded-xl px-4 py-3 text-ink mb-3 outline-none"
          />
          <div className="flex gap-2 flex-wrap mb-3">
            {UNITS.map((u) => (
              <button
                key={u}
                onClick={() => setDraft((d) => ({ ...d, unit: u }))}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  draft.unit === u ? "bg-ink text-cream" : "bg-chip text-mutedDark"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap mb-5">
            {LOCATIONS.map((l) => (
              <button
                key={l}
                onClick={() => setDraft((d) => ({ ...d, location: l }))}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  draft.location === l ? "bg-ink text-cream" : "bg-chip text-mutedDark"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <button onClick={commit} className="w-full bg-ink text-cream rounded-xl2 py-3.5 font-display font-bold">
            הוספה למלאי
          </button>
        </>
      )}
    </SheetShell>
  );
}
