// Rough estimate of how much a single "יח׳" package/bottle of a product
// actually holds, in the same measuring family (ml for liquids, grams for
// solids) as the recipe ingredient that's being tracked against it. Used
// only to decide when cumulative recipe usage has actually finished off a
// whole unit — not shown to the user, just an internal threshold.

const VOLUME_RULES = [
  { test: /שמן|שמן זית|שמן קנולה/, ml: 750 },
  { test: /חלב|יוגורט לשתייה|מיץ|משקה/, ml: 1000 },
  { test: /רוטב סויה|חומץ/, ml: 500 },
  { test: /טחינה/, ml: 500 },
];

const WEIGHT_RULES = [
  { test: /תבלין|פלפל שחור|כמון|פפריקה|קינמון/, g: 50 },
  { test: /קמח|סוכר|אורז|פסטה/, g: 1000 },
  { test: /גבינה|קוטג/, g: 250 },
  { test: /ממרח|מיונז|קטשופ|חמאה|מרגרינה/, g: 400 },
];

export function estimateCapacity(name = "", family) {
  if (family === "volume") {
    const rule = VOLUME_RULES.find((r) => r.test.test(name));
    return rule ? rule.ml : 500; // generic bottle default
  }
  const rule = WEIGHT_RULES.find((r) => r.test.test(name));
  return rule ? rule.g : 500; // generic package default
}

// Normalize a recipe-ingredient quantity to a base unit (ml or g) so it can
// be compared/accumulated against an estimated capacity regardless of
// whether the recipe used the small or large form of the unit.
export function normalizeToBase(quantity, unit) {
  if (unit === "ק״ג") return quantity * 1000;
  if (unit === "ל׳") return quantity * 1000;
  if (unit === "כף") return quantity * 15; // tablespoon ≈ 15ml
  if (unit === "כפית") return quantity * 5; // teaspoon ≈ 5ml
  return quantity; // ג׳ and מ״ל are already base units
}

export function unitFamily(unit) {
  return unit === "מ״ל" || unit === "ל׳" || unit === "כף" || unit === "כפית" ? "volume" : "weight";
}

export const MEASURED_UNITS = ["ג׳", "ק״ג", "ל׳", "מ״ל", "כף", "כפית"];
