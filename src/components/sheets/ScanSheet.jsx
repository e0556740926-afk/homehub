import { useRef } from "react";
import SheetShell from "./SheetShell";

export default function ScanSheet({ onClose, onFile, busy }) {
  const inputRef = useRef(null);

  return (
    <SheetShell title="סריקת קבלה" onClose={onClose}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div
        onClick={() => !busy && inputRef.current?.click()}
        className="bg-white rounded-xl2 h-64 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border cursor-pointer"
      >
        {busy ? (
          <>
            <div className="w-8 h-8 border-4 border-ink/20 border-t-ink rounded-full animate-spin" />
            <div className="text-mutedDark text-sm font-semibold">Claude קורא את הקבלה…</div>
          </>
        ) : (
          <>
            <div className="text-4xl">📷</div>
            <div className="text-ink font-display font-bold">צלם או העלה קבלה</div>
            <div className="text-muted text-xs">התמונה תישלח לזיהוי אוטומטי</div>
          </>
        )}
      </div>
    </SheetShell>
  );
}
