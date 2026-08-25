import { ChefHat, CalendarDays, Camera, Flame } from "lucide-react";
import { gradientForName } from "../lib/gradients";

export default function CookTab({ results, evalRecipe, onOpenWizard, onOpenRecipe, onOpenWeeklyMenu, onOpenCalories, answers }) {
  return (
    <div className="px-5 pt-4 pb-28" dir="rtl">
      <div className="font-display text-xs tracking-widest text-mutedLight mb-1">RECIPES</div>
      <div className="font-display font-extrabold text-3xl text-ink mb-1">מה מבשלים?</div>
      <div className="text-muted text-sm mb-5">
        {results ? `לפי המלאי · ${answers.servings} סועדים · ${answers.style}` : "התאמה חיה למלאי הנוכחי"}
      </div>

      <div className="flex gap-2.5 mb-5">
        <button
          onClick={onOpenWizard}
          className="flex-1 bg-ink text-cream rounded-xl2 py-3.5 font-display font-bold"
        >
          {results ? "שאלון חדש" : "מה מבשלים הערב?"}
        </button>
        <button
          onClick={onOpenWeeklyMenu}
          className="bg-white text-ink rounded-xl2 px-4 shadow-sm flex items-center justify-center"
          title="תפריט שבועי"
        >
          <CalendarDays size={20} strokeWidth={2} />
        </button>
        <button
          onClick={onOpenCalories}
          className="bg-white text-ink rounded-xl2 px-4 shadow-sm flex items-center justify-center"
          title="הערכת קלוריות מתמונה"
        >
          <Camera size={20} strokeWidth={2} />
        </button>
      </div>

      {!results && (
        <div className="text-muted text-sm text-center py-10">
          ענה על כמה שאלות קצרות ונציע לך מתכונים לפי מה שכבר יש בבית
        </div>
      )}
      {results && results.length === 0 && (
        <div className="text-muted text-sm text-center py-10 leading-relaxed">
          לא נמצא מתכון שעומד בדיוק בדרישות (זמן/כמות מצרכים חסרים).
          <br />
          נסה להאריך את הזמן או להוסיף גמישות ברמת המצרכים החסרים.
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
                <div className="text-xs text-muted flex items-center gap-1.5 flex-wrap">
                  <span>{r.time_minutes} דק׳</span>
                  {r.calories_per_serving && (
                    <span className="inline-flex items-center gap-0.5 text-terracotta font-semibold">
                      <Flame size={11} strokeWidth={2.2} />
                      {Math.round(r.calories_per_serving)} קק״ל
                    </span>
                  )}
                  <span>{e.missing.length ? `· חסר: ${e.missing.join(", ")}` : "· הכל קיים במלאי"}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
