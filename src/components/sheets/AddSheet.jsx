import { useState } from "react";
import SheetShell from "./SheetShell";

const UNITS = ["יח׳", "ג׳", "ק״ג", "ל׳", "מ״ל"];
const LOCATIONS = ["מקרר", "מזווה", "מקפיא"];

export default function AddSheet({ toList, onClose, onAddInventory, onAddList }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("יח׳");
  const [location, setLocation] = useState("מזווה");

  function commit() {
    if (!name.trim()) return;
    if (toList) onAddList({ name: name.trim(), quantity, unit });
    else onAddInventory({ name: name.trim(), quantity, unit, location });
    onClose();
  }

  return (
    <SheetShell title={toList ? "הוספה לרשימת הקניות" : "הוספה ידנית למלאי"} onClose={onClose}>
      <input
        autoFocus
        placeholder="שם הפריט"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-white rounded-xl px-4 py-3 text-ink mb-3 outline-none"
      />
      <input
        type="number"
        placeholder="כמות"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="w-full bg-white rounded-xl px-4 py-3 text-ink mb-3 outline-none"
      />
      <div className="flex gap-2 flex-wrap mb-3">
        {UNITS.map((u) => (
          <button
            key={u}
            onClick={() => setUnit(u)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              unit === u ? "bg-ink text-cream" : "bg-chip text-mutedDark"
            }`}
          >
            {u}
          </button>
        ))}
      </div>
      {!toList && (
        <div className="flex gap-2 flex-wrap mb-5">
          {LOCATIONS.map((l) => (
            <button
              key={l}
              onClick={() => setLocation(l)}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                location === l ? "bg-ink text-cream" : "bg-chip text-mutedDark"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      <button onClick={commit} className="w-full bg-ink text-cream rounded-xl2 py-3.5 font-display font-bold">
        הוספה
      </button>
    </SheetShell>
  );
}
