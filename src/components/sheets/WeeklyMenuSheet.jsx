import { useState } from "react";
import { ChefHat } from "lucide-react";
import SheetShell from "./SheetShell";
import { gradientForName } from "../../lib/gradients";

export default function WeeklyMenuSheet({ onClose, onGenerate, onAddAllMissing, evalRecipe }) {
  const [status, setStatus] = useState("idle"); // idle | busy | ready
  const [days, setDays] = useState([]);
  const [openIdx, setOpenIdx] = useState(null);

  async function generate() {
    setStatus("busy");
    try {
      const result = await onGenerate();
      setDays(result);
      setStatus("ready");
    } catch (err) {
      setStatus("idle");
    }
  }

  const allMissing = days
    .flatMap((d) => evalRecipe(d.recipe).missing)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <SheetShell title="תפריט שבועי" onClose={onClose}>
      {status === "idle" && (
        <div className="text-center py-6">
          <div className="text-4xl mb-3">📅</div>
          <div className="text-mutedDark text-sm mb-5 leading-relaxed">
            תפריט מלא ל-7 ימים, בנוי כדי למקסם שימוש במה שכבר יש בבית ולצמצם בזבוז
          </div>
          <button onClick={generate} className="w-full bg-ink text-cream rounded-xl2 py-3.5 font-display font-bold">
            בנה תפריט שבועי
          </button>
        </div>
      )}

      {status === "busy" && (
        <div className="text-center py-10">
          <div className="w-8 h-8 mx-auto mb-3 border-4 border-ink/20 border-t-ink rounded-full animate-spin" />
          <div className="text-mutedDark text-sm font-semibold">בונה תפריט לשבוע…</div>
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="flex flex-col gap-2 mb-5">
            {days.map((d, idx) => {
              const e = evalRecipe(d.recipe);
              const open = openIdx === idx;
              return (
                <div key={idx} className="bg-white rounded-xl2 overflow-hidden">
                  <button onClick={() => setOpenIdx(open ? null : idx)} className="w-full flex items-center gap-3 p-3 text-right">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-none"
                      style={{ background: gradientForName(d.recipe.name) }}
                    >
                      <ChefHat size={16} color="#fff" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted">{d.day}</div>
                      <div className="font-display font-bold text-sm text-ink line-clamp-1">{d.recipe.name}</div>
                      {d.recipe.calories_per_serving && (
                        <div className="text-[11px] text-terracotta font-semibold">
                          {Math.round(d.recipe.calories_per_serving)} קק״ל למנה
                        </div>
                      )}
                    </div>
                    <span className={`font-display font-bold text-sm flex-none ${e.pct === 100 ? "text-sage" : "text-terracotta"}`}>
                      {e.pct}%
                    </span>
                  </button>
                  {open && (
                    <div className="px-3.5 pb-3.5">
                      <div className="border-t border-base pt-3">
                        <div className="font-display font-bold text-xs text-ink mb-2">מצרכים</div>
                        <div className="flex flex-col gap-1.5 mb-3">
                          {d.recipe.ingredients.map((ing, ingIdx) => {
                            const ingMissing = e.missing.includes(ing.name);
                            return (
                              <div key={ingIdx} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full flex-none"
                                    style={{ background: ingMissing ? "#E2603C" : "#5C7A63" }}
                                  />
                                  <span className="text-mutedDark">{ing.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-none">
                                  <span className="font-semibold text-ink">
                                    {ing.quantity} {ing.unit}
                                  </span>
                                  {ingMissing && <span className="text-terracotta font-semibold">חסר</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-xs text-mutedDark leading-relaxed">{d.recipe.instructions}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {allMissing.length > 0 && (
            <button
              onClick={() => onAddAllMissing(allMissing)}
              className="w-full bg-white text-ink rounded-xl2 py-3 font-display font-bold shadow-sm"
            >
              הוסף {allMissing.length} מצרכים חסרים לרשימה
            </button>
          )}
        </>
      )}
    </SheetShell>
  );
}
