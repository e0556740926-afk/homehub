import { useState } from "react";
import { ImageOff } from "lucide-react";
import PhotoViewer from "./PhotoViewer";

export default function ReceiptsTab({ receipts, onScan }) {
  const [viewing, setViewing] = useState(null);

  return (
    <div className="px-5 pt-4 pb-28" dir="rtl">
      <div className="font-display text-xs tracking-widest text-mutedLight mb-1">RECEIPTS</div>
      <div className="font-display font-extrabold text-3xl text-ink mb-4">קבלות</div>

      <button
        onClick={onScan}
        className="w-full bg-ink text-cream rounded-xl2 py-3.5 font-display font-bold mb-5"
      >
        + סרוק קבלה חדשה
      </button>

      {receipts.length === 0 ? (
        <div className="text-muted text-sm text-center py-16">עדיין לא נסרקו קבלות</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {receipts.map((r) => (
            <button
              key={r.id}
              onClick={() => r.image_url && setViewing(r)}
              disabled={!r.image_url}
              className="w-full bg-white rounded-xl2 px-4 py-3 flex items-center justify-between shadow-sm text-right"
            >
              <div>
                <div className="font-display font-extrabold text-base text-ink">{r.store || "חנות לא ידועה"}</div>
                <div className="text-xs text-muted flex items-center gap-1">
                  {r.purchased_at} · {(r.raw_json?.items || []).length} פריטים
                  {!r.image_url && (
                    <span className="inline-flex items-center gap-0.5 text-mutedLight">
                      · <ImageOff size={11} strokeWidth={2} /> אין תמונה
                    </span>
                  )}
                </div>
              </div>
              <span className="font-display font-bold text-sm text-ink">₪{Number(r.total || 0).toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}

      {viewing && (
        <PhotoViewer
          url={viewing.image_url}
          title={`${viewing.store || "חנות לא ידועה"} · ${viewing.purchased_at}`}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
