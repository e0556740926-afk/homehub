import SheetShell from "./SheetShell";

export default function RecipeSheet({ recipe, evalRecipe, servings, onClose, onAddMissing, onCook }) {
  if (!recipe) return null;
  const e = evalRecipe(recipe);

  return (
    <SheetShell title={recipe.name} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted text-sm">
          {recipe.time_minutes} דק׳ · {servings} סועדים · {recipe.style}
        </span>
        <span className={`font-display font-extrabold text-xl ${e.pct === 100 ? "text-sage" : "text-terracotta"}`}>
          {e.pct}%
        </span>
      </div>

      <div className="font-display font-bold text-sm text-ink mb-2">מצרכים</div>
      <div className="flex flex-col gap-2 mb-5">
        {recipe.ingredients.map((ing, idx) => {
          const missing = e.missing.includes(ing.name);
          return (
            <div key={idx} className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: missing ? "#E2603C" : "#5C7A63" }}
                />
                <span className="text-ink text-sm font-medium">{ing.name}</span>
              </div>
              <span className={`font-display font-bold text-sm ${missing ? "text-terracotta" : "text-ink"}`}>
                {missing ? "חסר" : `${ing.quantity} ${ing.unit}`}
              </span>
            </div>
          );
        })}
      </div>

      {recipe.instructions && (
        <>
          <div className="font-display font-bold text-sm text-ink mb-2">הוראות הכנה</div>
          <div className="text-sm text-mutedDark leading-relaxed mb-5">{recipe.instructions}</div>
        </>
      )}

      {e.missing.length > 0 && (
        <button
          onClick={() => onAddMissing(recipe)}
          className="w-full bg-white text-ink rounded-xl2 py-3 font-display font-bold mb-2.5 shadow-sm"
        >
          הוסף {e.missing.length} מצרכים חסרים לרשימה
        </button>
      )}
      <button onClick={() => onCook(recipe)} className="w-full bg-ink text-cream rounded-xl2 py-3.5 font-display font-bold">
        בישול · הפחת מהמלאי
      </button>
    </SheetShell>
  );
}
