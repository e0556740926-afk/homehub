import { Home, Package, ShoppingCart, Receipt, ChefHat } from "lucide-react";

const TABS = [
  { key: "home", label: "בית", icon: Home },
  { key: "inv", label: "מלאי", icon: Package },
  { key: "list", label: "קניות", icon: ShoppingCart },
  { key: "receipts", label: "קבלות", icon: Receipt },
  { key: "cook", label: "מתכונים", icon: ChefHat },
];

export default function TabBar({ tab, setTab }) {
  return (
    <div
      className="fixed bottom-0 inset-x-0 bg-cream border-t-2 border-ink flex justify-around py-2.5 px-2 z-30"
      style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
      dir="rtl"
    >
      {TABS.map((t) => {
        const active = tab === t.key;
        const Icon = t.icon;
        return (
          <button key={t.key} onClick={() => setTab(t.key)} className="flex flex-col items-center gap-0.5 px-1">
            <Icon size={20} color={active ? "#2A2724" : "#B3AAA0"} strokeWidth={active ? 2.3 : 2} />
            <span className={`font-display text-[10px] font-bold ${active ? "text-ink" : "text-mutedLight"}`}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
