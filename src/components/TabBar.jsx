const TABS = [
  { key: "inv", label: "מלאי" },
  { key: "list", label: "קניות" },
  { key: "receipts", label: "קבלות" },
  { key: "cook", label: "מתכונים" },
];

export default function TabBar({ tab, setTab }) {
  return (
    <div
      className="fixed bottom-0 inset-x-0 bg-cream border-t-2 border-ink flex justify-around py-3 px-2 z-30"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      dir="rtl"
    >
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`font-display text-xs font-bold ${tab === t.key ? "text-ink" : "text-mutedLight"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
