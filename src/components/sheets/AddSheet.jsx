import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { ScanBarcode, Pencil } from "lucide-react";
import SheetShell from "./SheetShell";
import { lookupBarcode } from "../../lib/api";

const UNITS = ["יח׳", "ג׳", "ק״ג", "ל׳", "מ״ל"];
const LOCATIONS = ["מקרר", "מזווה", "מקפיא"];

export default function AddSheet({ toList, onClose, onAddInventory, onAddList }) {
  const [mode, setMode] = useState("manual"); // manual | scan
  const [scanStatus, setScanStatus] = useState("scanning"); // scanning | looking-up | error
  const [scanError, setScanError] = useState("");
  const videoRef = useRef(null);
  const controlsRef = useRef(null);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("יח׳");
  const [location, setLocation] = useState("מזווה");

  useEffect(() => {
    if (toList || mode !== "scan") return;
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;
    setScanStatus("scanning");

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, async (result, err, controls) => {
        controlsRef.current = controls;
        if (result && !cancelled) {
          cancelled = true;
          controls.stop();
          setScanStatus("looking-up");
          try {
            const product = await lookupBarcode(result.getText());
            if (product?.name) setName(product.name);
            setMode("manual");
          } catch {
            setScanError("שגיאה בבדיקת הברקוד — הזן שם ידנית");
            setMode("manual");
          }
        }
      })
      .catch(() => {
        setScanStatus("error");
        setScanError("אין גישה למצלמה");
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [mode, toList]);

  function commit() {
    if (!name.trim()) return;
    if (toList) onAddList({ name: name.trim(), quantity, unit });
    else onAddInventory({ name: name.trim(), quantity, unit, location });
    onClose();
  }

  return (
    <SheetShell title={toList ? "הוספה לרשימת הקניות" : "הוספה למלאי"} onClose={onClose}>
      {!toList && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("scan")}
            className={`flex-1 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm font-display font-bold ${
              mode === "scan" ? "bg-ink text-cream" : "bg-white text-ink shadow-sm"
            }`}
          >
            <ScanBarcode size={16} strokeWidth={2} />
            סריקת ברקוד
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm font-display font-bold ${
              mode === "manual" ? "bg-ink text-cream" : "bg-white text-ink shadow-sm"
            }`}
          >
            <Pencil size={14} strokeWidth={2} />
            הזנה ידנית
          </button>
        </div>
      )}

      {mode === "scan" && !toList && (
        <div className="rounded-xl2 overflow-hidden bg-black relative h-64 mb-4">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {scanStatus === "looking-up" && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <div className="text-white text-sm font-semibold">בודק מול מאגר מוצרים…</div>
            </div>
          )}
          {scanStatus === "error" && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center px-4">
              <div className="text-white text-sm font-semibold text-center">{scanError}</div>
            </div>
          )}
        </div>
      )}

      {mode === "manual" && (
        <>
          {scanError && <div className="text-terracotta text-xs mb-3">{scanError}</div>}
          <input
            autoFocus
            placeholder="שם הפריט"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white rounded-xl px-4 py-3 text-ink mb-3 outline-none"
          />
          <input
            type="number"
            placeholder="כמות"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-white rounded-xl px-4 py-3 text-ink mb-3 outline-none"
          />
          <div className="flex gap-2 flex-wrap mb-3">
            {UNITS.map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  unit === u ? "bg-ink text-cream" : "bg-chip text-mutedDark"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          {!toList && (
            <div className="flex gap-2 flex-wrap mb-5">
              {LOCATIONS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLocation(l)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    location === l ? "bg-ink text-cream" : "bg-chip text-mutedDark"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          <button onClick={commit} className="w-full bg-ink text-cream rounded-xl2 py-3.5 font-display font-bold">
            הוספה
          </button>
        </>
      )}
    </SheetShell>
  );
}
