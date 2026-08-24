import { Package, AlertTriangle, ShoppingCart, ScanLine, ChefHat, Heart } from "lucide-react";
import { getItemVisual } from "../lib/categoryVisuals";
import { gradientForName } from "../lib/gradients";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "לילה טוב";
  if (h < 12) return "בוקר טוב";
  if (h < 18) return "צהריים טובים";
  return "ערב טוב";
}

const DATE_FMT = new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long" });

export default function HomeTab({
  items,
  list,
  expiringCount,
  recentItems,
  favorites,
  onOpenScan,
  onOpenWizard,
  onOpenAdd,
  onOpenRecipe,
}) {
  return (
    <div className="pb-28" dir="rtl">
      {/* Hero header with a soft decorative blob background */}
      <div className="relative overflow-hidden bg-ink px-5 pt-8 pb-8 rounded-b-[32px]">
        <svg
          className="absolute -top-10 -left-16 opacity-40"
          width="260"
          height="260"
          viewBox="0 0 260 260"
          fill="none"
        >
          <circle cx="130" cy="130" r="130" fill="#E2603C" />
        </svg>
        <svg
          className="absolute -bottom-16 -right-10 opacity-30"
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="100" fill="#5C7A63" />
        </svg>
        <div className="relative">
          <div className="text-cream/60 text-xs font-semibold mb-1">{DATE_FMT.format(new Date())}</div>
          <div className="font-display font-extrabold text-3xl text-cream mb-5">{greeting()} 👋</div>

          <div className="grid grid-cols-3 gap-2.5">
            <StatCard icon={Package} value={items.length} label="פריטים" />
            <StatCard icon={AlertTriangle} value={expiringCount} label="פגים בקרוב" warn={expiringCount > 0} />
            <StatCard icon={ShoppingCart} value={list.length} label="לקנייה" />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 -mt-5 relative grid grid-cols-3 gap-2.5 mb-6">
        <QuickAction icon={ScanLine} label="סרוק קבלה" onClick={onOpenScan} />
        <QuickAction icon={ChefHat} label="מה מבשלים" onClick={onOpenWizard} />
        <QuickAction icon={Package} label="הוסף פריט" onClick={onOpenAdd} />
      </div>

      {/* Recently added */}
      {recentItems.length > 0 && (
        <div className="mb-6">
          <div className="px-5 font-display font-extrabold text-lg text-ink mb-3">נוספו לאחרונה</div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
            {recentItems.map((i) => {
              const { Icon, bg, fg } = getItemVisual(i.name);
              return (
                <div key={i.id} className="flex-none w-24 flex flex-col items-center gap-1.5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: bg }}>
                    <Icon size={26} color={fg} strokeWidth={2} />
                  </div>
                  <div className="text-xs text-mutedDark text-center leading-tight line-clamp-2">{i.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Favorite recipes */}
      <div className="px-5">
        <div className="font-display font-extrabold text-lg text-ink mb-3">מתכונים מועדפים</div>
        {favorites.length === 0 ? (
          <div className="bg-white rounded-xl2 p-5 text-center shadow-sm">
            <Heart className="mx-auto mb-2" size={22} color="#DED5CA" />
            <div className="text-muted text-sm">
              עוד אין מועדפים — סמן מתכון בלב מתוך "מה מבשלים" כדי לשמור אותו כאן
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((r) => (
              <button
                key={r.id}
                onClick={() => onOpenRecipe(r)}
                className="text-right rounded-xl2 overflow-hidden shadow-sm bg-white"
              >
                <div
                  className="h-20 flex items-center justify-center"
                  style={{ background: gradientForName(r.name) }}
                >
                  <ChefHat size={28} color="#fff" strokeWidth={1.8} />
                </div>
                <div className="p-3">
                  <div className="font-display font-bold text-sm text-ink line-clamp-1">{r.name}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {r.time_minutes ? `${r.time_minutes} דק׳ · ` : ""}
                    {r.style}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, warn }) {
  return (
    <div className="bg-white/10 rounded-2xl p-3 flex flex-col items-center gap-1">
      <Icon size={18} color={warn ? "#F0997B" : "#FBF7F2"} strokeWidth={2} />
      <div className="font-display font-extrabold text-xl text-cream">{value}</div>
      <div className="text-[11px] text-cream/60 font-semibold">{label}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl py-3.5 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
    >
      <Icon size={20} color="#2A2724" strokeWidth={2} />
      <span className="text-xs font-display font-bold text-ink">{label}</span>
    </button>
  );
}
