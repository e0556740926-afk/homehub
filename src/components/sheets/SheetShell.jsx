export default function SheetShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" dir="rtl" onClick={onClose}>
      <div
        className="sheet-enter w-full max-w-md bg-base rounded-t-[28px] max-h-[88vh] overflow-y-auto"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-base">
          <button onClick={onClose} className="text-mutedDark text-sm font-semibold">
            סגור
          </button>
          <div className="font-display font-extrabold text-sm text-ink">{title}</div>
          <div className="w-8" />
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
