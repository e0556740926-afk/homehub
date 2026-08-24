export default function ReceiptsTab({ receipts, onScan }) {
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
            <div key={r.id} className="bg-white rounded-xl2 px-4 py-3 flex items-center justify-between shadow-sm">
              <div>
                <div className="font-display font-extrabold text-base text-ink">{r.store || "חנות לא ידועה"}</div>
                <div className="text-xs text-muted">
                  {r.purchased_at} · {(r.raw_json?.items || []).length} פריטים
                </div>
              </div>
              <span className="font-display font-bold text-sm text-ink">₪{Number(r.total || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
