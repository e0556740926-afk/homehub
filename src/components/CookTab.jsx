import { ChefHat } from "lucide-react";
import { gradientForName } from "../lib/gradients";

export default function CookTab({ results, evalRecipe, onOpenWizard, onOpenRecipe, answers }) {
  return (
    <div className="px-5 pt-4 pb-28" dir="rtl">
      <div className="font-display text-xs tracking-widest text-mutedLight mb-1">RECIPES</div>
      <div className="font-display font-extrabold text-3xl text-ink mb-1">מה מבשלים?</div>
      <div className="text-muted text-sm mb-5">
        {results ? `לפי המלאי · ${answers.servings} סועדים · ${answers.style}` : "התאמה חיה למלאי הנוכחי"}
      </div>

      <button
        onClick={onOpenWizard}
        className="w-full bg-ink text-cream rounded-xl2 py-3.5 font-display font-bold mb-5"
      >
        {results ? "שאלון חדש" : "מה מבשלים הערב?"}
      </button>

      {!results && (
        <div className="text-muted text-sm text-center py-10">
          ענה על כמה שאלות קצרות ונציע לך מתכונים לפי מה שכבר יש בבית
        </div>
      )}

      <div className="flex flex-col gap-3">
        {(results || []).map((r, idx) => {
          const e = evalRecipe(r);
          const full = e.pct === 100;
          return (
            <button
              key={idx}
              onClick={() => onOpenRecipe(r)}
              className={`text-right bg-white rounded-xl2 p-4 shadow-sm flex gap-3 items-start ${
                idx === 0 ? "border-[1.5px] border-sage" : ""
              }`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-none"
                style={{ background: gradientForName(r.name) }}
              >
                <ChefHat size={20} color="#fff" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-display font-extrabold text-lg text-ink">{r.name}</span>
                  <span className={`font-display font-bold text-lg flex-none ${full ? "text-sage" : "text-terracotta"}`}>
                    {e.pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-chip rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${e.pct}%`, background: full ? "#5C7A63" : "#E2603C" }}
                  />
                </div>
                <div className="text-xs text-muted">
                  {r.time_minutes} דק׳ · {e.missing.length ? `חסר: ${e.missing.join(", ")}` : "הכל קיים במלאי"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
