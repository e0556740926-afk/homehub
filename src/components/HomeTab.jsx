import {
  ShoppingCart, ScanLine, Package, RefrigeratorIcon, ChefHat, Heart, Settings, CalendarClock,
  Mic, TrendingDown, Flame, Trash2, Tag,
} from "lucide-react";
import { getItemVisual } from "../lib/categoryVisuals";
import { gradientForName } from "../lib/gradients";

const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "לילה טוב";
  if (h < 12) return "בוקר טוב";
  if (h < 18) return "צהריים טובים";
  return "ערב טוב";
}

const DATE_FMT = new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long" });
const MONEY_FMT = (n) => "₪" + Number(n || 0).toFixed(0);

export default function HomeTab({
  items,
  list,
  expiringCount,
  recentItems,
  favorites,
  settings,
  predictedRunOut,
  spendingStats,
  priceComparison,
  cookStreak,
  wasteThisMonth,
  onOpenScan,
  onOpenWizard,
  onOpenAdd,
  onOpenRecipe,
  onOpenSettings,
  onOpenFridgeScan,
  onOpenVoice,
}) {
  return (
    <div className="pb-28" dir="rtl">
      {/* Hero header with a soft decorative blob background */}
      <div className="relative overflow-hidden bg-ink px-5 pt-8 pb-8 rounded-b-[32px]">
        <svg className="absolute -top-10 -left-16 opacity-40" width="260" height="260" viewBox="0 0 260 260" fill="none">
          <circle cx="130" cy="130" r="130" fill="#E2603C" />
        </svg>
        <svg className="absolute -bottom-16 -right-10 opacity-30" width="200" height="200" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="100" fill="#5C7A63" />
        </svg>
        <div className="relative">
          <div className="flex items-start justify-between mb-1">
            <div className="text-cream/60 text-xs font-semibold">{DATE_FMT.format(new Date())}</div>
            <div className="flex gap-2">
              <button onClick={onOpenVoice} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Mic size={15} color="#FBF7F2" strokeWidth={2} />
              </button>
              <button onClick={onOpenSettings} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Settings size={16} color="#FBF7F2" strokeWidth={2} />
              </button>
            </div>
          </div>
          <div className="font-display font-extrabold text-3xl text-cream mb-5">{greeting()} 👋</div>

          <div className="bg-white/10 rounded-2xl p-3.5 flex items-center gap-3">
            <ShoppingCart size={20} color="#FBF7F2" strokeWidth={2} />
            <div className="font-display font-extrabold text-xl text-cream">{list.length}</div>
            <div className="text-xs text-cream/60 font-semibold">פריטים ברשימת הקניות</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 -mt-5 relative grid grid-cols-3 gap-2.5 mb-6">
        <QuickAction icon={ScanLine} label="סרוק קבלה" onClick={onOpenScan} />
        <QuickAction icon={RefrigeratorIcon} label="סרוק מדף" onClick={onOpenFridgeScan} />
        <QuickAction icon={Package} label="הוסף פריט" onClick={onOpenAdd} />
      </div>

      {/* Secondary insight stats: spending, cook streak, waste */}
      <div className="px-5 grid grid-cols-3 gap-2.5 mb-6">
        <MiniStat icon={TrendingDown} value={MONEY_FMT(spendingStats?.thisMonth)} label="הוצאה החודש" />
        <MiniStat icon={Flame} value={cookStreak || 0} label="ימי בישול רצוף" accent={cookStreak > 0} />
        <MiniStat icon={Trash2} value={wasteThisMonth || 0} label="נזרק החודש" warn={wasteThisMonth > 0} />
      </div>

      {settings?.weekly_list_enabled && (
        <button
          onClick={onOpenSettings}
          className="mx-5 mb-6 bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm w-[calc(100%-2.5rem)] text-right"
        >
          <div className="w-9 h-9 rounded-full bg-chip flex items-center justify-center flex-none">
            <CalendarClock size={16} color="#7A7168" strokeWidth={2} />
          </div>
          <div className="text-xs text-mutedDark">
            רשימת קניות אוטומטית מתעדכנת כל יום{" "}
            <span className="font-bold text-ink">{DAY_NAMES[settings.weekly_list_day]}</span> בשעה{" "}
            <span className="font-bold text-ink">{String(settings.weekly_list_hour).padStart(2, "0")}:00</span>
          </div>
        </button>
      )}

      {/* Predicted run-out */}
      {predictedRunOut?.length > 0 && (
        <div className="px-5 mb-6">
          <div className="font-display font-extrabold text-lg text-ink mb-3">עומד להיגמר בקרוב</div>
          <div className="flex flex-col gap-2">
            {predictedRunOut.slice(0, 4).map((p) => (
              <div key={p.name} className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                <span className="text-sm font-medium text-ink">{p.name}</span>
                <span className="text-xs font-semibold text-terracotta">
                  {p.daysLeft <= 0 ? "כנראה כבר נגמר" : `בעוד כ-${p.daysLeft} ימים`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Price comparison across stores */}
      {priceComparison?.length > 0 && (
        <div className="px-5 mb-6">
          <div className="font-display font-extrabold text-lg text-ink mb-3">השוואת מחירים</div>
          <div className="flex flex-col gap-2">
            {priceComparison.slice(0, 4).map((p) => (
              <div key={p.name} className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <Tag size={14} color="#5C7A63" strokeWidth={2} />
                  <span className="text-sm font-medium text-ink">{p.name}</span>
                </div>
                <span className="text-xs font-semibold text-sage">
                  הכי זול ב{p.cheapestStore} · ₪{Number(p.cheapestPrice).toFixed(2)}
                </span>
              </div>
            ))}
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
                <div className="h-20 flex items-center justify-center" style={{ background: gradientForName(r.name) }}>
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

function MiniStat({ icon: Icon, value, label, warn, accent }) {
  return (
    <div className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm">
      <Icon size={16} color={warn ? "#E2603C" : accent ? "#5C7A63" : "#7A7168"} strokeWidth={2} />
      <div className="font-display font-extrabold text-base text-ink">{value}</div>
      <div className="text-[10px] text-muted font-semibold text-center leading-tight">{label}</div>
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
