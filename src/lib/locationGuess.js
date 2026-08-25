// Best-effort default storage location by product name, for paths that
// don't have an AI call to classify from (barcode lookups, shopping-list
// purchases). Mirrors the same temperature-band rule used in the receipt
// and shelf-photo scan prompts:
//   מקרר   — 0–6°C   (dairy, eggs, fresh meat/fish, fresh produce needing cooling)
//   מקפיא  — 0 to −7°C (frozen goods)
//   מזווה  — 7°C and up (shelf-stable dry/canned goods, oils, drinks)
// This is only ever a starting suggestion — the user can always override
// it via the location chips.

const FRIDGE = /חלב|יוגורט|לבן|קוטג|שמנת|גבינה|ביצ|עוף|בקר|בשר|נקניק|שניצל|כבש|הודו|דג|סלמון|טונה|חומוס|טחינה טרייה|סלט קנוי|חלבי/;
const FREEZER = /קפוא|מוקפא|גלידה|שלגון|מקפיא/;
const PANTRY = /אורז|פסטה|קמח|לחם|פיתה|שימור|קופסת שימורים|שמן|חומץ|סוכר|מלח|תבלין|קפה|תה|ביסקוויט|עוגי|שוקולד|חטיף|משקה|מיץ תפוזים ארוך|מים מינרליים|נייר טואלט|ניקוי|כביסה|מגבונים|חיתולים/;

export function guessLocation(name = "") {
  if (FREEZER.test(name)) return "מקפיא";
  if (FRIDGE.test(name)) return "מקרר";
  if (PANTRY.test(name)) return "מזווה";
  return "מזווה";
}
