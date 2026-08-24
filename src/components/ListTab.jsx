function fmt(n) {
  return "₪" + Number(n || 0).toFixed(2).replace(/\.00$/, "");
}

export default function ListTab({ list, estimatePrice, onBuy }) {
  const total = list.reduce((a, l) => a + Number(l.estimated_price ?? estimatePrice(l.item_name)), 0);

  return (
    <div className="px-5 pt-4 pb-28" dir="rtl">
      <div className="font-display text-xs tracking-widest text-mutedLight mb-1">SHOPPING LIST</div>
      <div className="font-display font-extrabold text-3xl text-ink mb-1">רשימת קניות</div>
      <div className="text-muted text-sm mb-4">{list.length} פריטים · הערכה לפי היסטוריית מחירים</div>

      {list.length === 0 ? (
        <div className="text-muted text-sm text-center py-16">הרשימה ריקה — הכל קיים במלאי 🎉</div>
      ) : (
        <div className="flex flex-col gap-2.5 mb-5">
          {list.map((l) => (
            <div key={l.id} className="bg-white rounded-xl2 px-4 py-3 flex items-center justify-between shadow-sm">
              <div>
                <div className="font-display font-extrabold text-base text-ink">{l.item_name}</div>
                <div className="text-xs text-muted">{l.origin}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-sm text-ink">
                  {fmt(l.estimated_price ?? estimatePrice(l.item_name))}
                </span>
                <button
                  onClick={() => onBuy(l)}
                  className="w-7 h-7 rounded-lg border-2 border-border text-border flex items-center justify-center font-bold hover:border-sage hover:text-sage"
                  title="סמן כנקנה"
                >
                  ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {list.length > 0 && (
        <div className="bg-white rounded-xl2 p-4 flex items-center justify-between shadow-sm sticky bottom-24">
          <span className="text-muted text-sm">סה״כ משוער</span>
          <span className="font-display font-extrabold text-xl text-ink">{fmt(total)}</span>
        </div>
      )}
    </div>
  );
}
