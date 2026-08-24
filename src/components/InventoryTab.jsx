import { useState } from "react";
import { getItemVisual } from "../lib/categoryVisuals";

const LOCATIONS = ["הכל", "מקרר", "מזווה", "מקפיא"];

export default function InventoryTab({ items, expiringCount, onInc, onDec, onMarkOut }) {
  const [loc, setLoc] = useState("הכל");
  const visible = items.filter((i) => loc === "הכל" || i.location === loc);
  const soon = (i) => i.expiry_date && new Date(i.expiry_date) - new Date() < 1000 * 60 * 60 * 24 * 5;
  const expiringNames = items.filter(soon).map((i) => i.name).slice(0, 3).join(" · ");

  return (
    <div className="px-5 pt-4 pb-28" dir="rtl">
      <div className="font-display text-xs tracking-widest text-mutedLight mb-1">INVENTORY</div>
      <div className="font-display font-extrabold text-3xl text-ink mb-4">מלאי הבית</div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {LOCATIONS.map((l) => (
          <button
            key={l}
            onClick={() => setLoc(l)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold ${
              loc === l ? "bg-ink text-cream" : "bg-chip text-mutedDark"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {expiringCount > 0 && (
        <div className="bg-terracotta text-white rounded-xl2 p-3.5 flex justify-between items-center mb-4">
          <div>
            <div className="font-display font-extrabold text-sm">{expiringCount} פריטים פגים בקרוב</div>
            <div className="text-xs opacity-90">{expiringNames}</div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {visible.length === 0 && <div className="text-muted text-sm text-center py-10">אין פריטים במיקום זה</div>}
        {visible.map((i) => {
          const { Icon, bg, fg } = getItemVisual(i.name);
          return (
            <div
              key={i.id}
              className={`bg-white rounded-xl2 px-4 py-3 flex items-center justify-between shadow-sm ${
                soon(i) ? "border-[1.5px] border-terracottaLight" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl2 flex items-center justify-center flex-none"
                  style={{ background: bg }}
                >
                  <Icon size={20} color={fg} strokeWidth={2} />
                </div>
                <div>
                  <div className="font-display font-extrabold text-base text-ink">{i.name}</div>
                  <div className={`text-xs ${soon(i) ? "text-terracotta font-semibold" : "text-muted"}`}>
                    {soon(i) ? `פג בקרוב · ${i.expiry_date}` : i.location}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-display font-bold text-sm text-ink">
                  {i.quantity} {i.unit}
                </span>
                <button
                  onClick={() => onDec(i)}
                  className="w-7 h-7 rounded-lg border-2 border-ink text-ink flex items-center justify-center font-bold"
                >
                  −
                </button>
                <button
                  onClick={() => onInc(i)}
                  className="w-7 h-7 rounded-lg bg-ink text-cream flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
