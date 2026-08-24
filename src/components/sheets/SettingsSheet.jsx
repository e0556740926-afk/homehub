import { useState } from "react";
import SheetShell from "./SheetShell";

const DAYS = [
  { v: 0, label: "א׳" },
  { v: 1, label: "ב׳" },
  { v: 2, label: "ג׳" },
  { v: 3, label: "ד׳" },
  { v: 4, label: "ה׳" },
  { v: 5, label: "ו׳" },
  { v: 6, label: "ש׳" },
];

const HOURS = [6, 7, 8, 9, 12, 16, 18, 20, 21];

export default function SettingsSheet({ settings, onClose, onSave }) {
  const [enabled, setEnabled] = useState(settings?.weekly_list_enabled ?? false);
  const [day, setDay] = useState(settings?.weekly_list_day ?? 0);
  const [hour, setHour] = useState(settings?.weekly_list_hour ?? 8);

  function commit() {
    onSave({ weekly_list_enabled: enabled, weekly_list_day: day, weekly_list_hour: hour });
    onClose();
  }

  return (
    <SheetShell title="רשימה שבועית אוטומטית" onClose={onClose}>
      <div className="text-muted text-sm leading-relaxed mb-5">
        פעם בשבוע, ביום ובשעה שתבחר, המערכת תבדוק אילו מוצרים שאתה קונה בדרך כלל נגמרו לך —
        ותוסיף אותם אוטומטית לרשימת הקניות, כדי שהיא תהיה מוכנה בלי שתצטרך לבקש.
      </div>

      <button
        onClick={() => setEnabled((v) => !v)}
        className={`w-full rounded-2xl px-4 py-3.5 flex justify-between items-center font-display font-bold text-base mb-5 ${
          enabled ? "bg-ink text-cream" : "bg-white text-ink shadow-sm"
        }`}
      >
        <span>{enabled ? "פעיל" : "כבוי"}</span>
        <span>{enabled ? "✓" : ""}</span>
      </button>

      <div className={enabled ? "" : "opacity-40 pointer-events-none"}>
        <div className="font-display font-bold text-sm text-ink mb-2">באיזה יום</div>
        <div className="flex gap-2 mb-5">
          {DAYS.map((d) => (
            <button
              key={d.v}
              onClick={() => setDay(d.v)}
              className={`w-10 h-10 rounded-full font-display font-bold text-sm ${
                day === d.v ? "bg-ink text-cream" : "bg-chip text-mutedDark"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="font-display font-bold text-sm text-ink mb-2">באיזו שעה</div>
        <div className="flex gap-2 flex-wrap mb-6">
          {HOURS.map((h) => (
            <button
              key={h}
              onClick={() => setHour(h)}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                hour === h ? "bg-ink text-cream" : "bg-chip text-mutedDark"
              }`}
            >
              {String(h).padStart(2, "0")}:00
            </button>
          ))}
        </div>
      </div>

      <button onClick={commit} className="w-full bg-ink text-cream rounded-xl2 py-3.5 font-display font-bold">
        שמירה
      </button>
    </SheetShell>
  );
}
