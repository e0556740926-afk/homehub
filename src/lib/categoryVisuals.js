import {
  Milk, Egg, Beef, Fish, Carrot, Wheat, Apple, Cherry, Soup, Cookie,
  Droplet, Package, Salad, IceCreamBowl, Sandwich, Nut,
} from "lucide-react";

// Maps a free-text Hebrew item name to a representative icon + color ramp.
// Falls back to a generic package icon when nothing matches.
const RULES = [
  { test: /חלב|יוגורט|לבן|קוטג|שמנת|גבינה/, icon: Milk, ramp: "blue" },
  { test: /ביצ/, icon: Egg, ramp: "amber" },
  { test: /עוף|בקר|בשר|נקניק|שניצל|כבש|הודו/, icon: Beef, ramp: "rose" },
  { test: /דג|סלמון|טונה/, icon: Fish, ramp: "cyan" },
  { test: /גזר|עגבני|מלפפון|פלפל|בצל|ירק|חסה|כרוב|תפוח אדמה|בטטה/, icon: Carrot, ramp: "orange" },
  { test: /אורז|פסטה|קמח|לחם|פיתה|קוואקר|שיבולת|בורגול|קינואה/, icon: Wheat, ramp: "amber" },
  { test: /תפוח|בננה|ענב|תות|אבטיח|מלון|פרי/, icon: Apple, ramp: "rose" },
  { test: /דובדבן|פטל/, icon: Cherry, ramp: "rose" },
  { test: /מרק|רוטב/, icon: Soup, ramp: "orange" },
  { test: /עוגי|ביסקוויט|שוקולד|ממתק|חטיף/, icon: Cookie, ramp: "amber" },
  { test: /שמן|טחינה|רוטב סויה|חומץ|מיץ|משקה/, icon: Droplet, ramp: "emerald" },
  { test: /גלידה/, icon: IceCreamBowl, ramp: "cyan" },
  { test: /סלט/, icon: Salad, ramp: "emerald" },
  { test: /כריך|טוסט/, icon: Sandwich, ramp: "amber" },
  { test: /אגוז|שקד|בוטן|גרעינ/, icon: Nut, ramp: "orange" },
];

const RAMPS = {
  blue: { bg: "#E6F1FB", fg: "#185FA5" },
  amber: { bg: "#FAEEDA", fg: "#854F0B" },
  rose: { bg: "#FBEAF0", fg: "#993556" },
  cyan: { bg: "#E1F5EE", fg: "#0F6E56" },
  orange: { bg: "#FAECE7", fg: "#993C1D" },
  emerald: { bg: "#EAF3DE", fg: "#3B6D11" },
  neutral: { bg: "#EFE8DF", fg: "#7A7168" },
};

export function getItemVisual(name = "") {
  const rule = RULES.find((r) => r.test.test(name));
  const Icon = rule?.icon || Package;
  const ramp = RAMPS[rule?.ramp || "neutral"];
  return { Icon, ...ramp };
}

// Distinct accent per storage location, used for chips/badges.
export const LOCATION_RAMP = {
  מקרר: RAMPS.blue,
  מזווה: RAMPS.amber,
  מקפיא: RAMPS.cyan,
};
