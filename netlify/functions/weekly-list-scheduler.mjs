// Netlify Scheduled Function: weekly-list-scheduler
// Runs every hour (UTC cron below). On each run it checks the single settings
// row: if the current Asia/Jerusalem day+hour match what the user picked,
// and this week's list hasn't been generated yet, it builds a restock
// shopping list and marks the week as done — so by the chosen time, the
// list is simply already there waiting for the user.
//
// Generation logic is deterministic (no AI call, no extra cost/failure
// point): it looks at every item name that has ever appeared in
// price_history (things you've actually bought before) and flags any of
// them that are NOT currently in inventory and NOT already on the pending
// shopping list — i.e. "staples you usually buy that you're currently out
// of". That's a genuinely useful weekly nudge grounded in real purchase
// history rather than a guess.

export const config = { schedule: "0 * * * *" }; // top of every hour, UTC

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

function jerusalemNow() {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
    hour: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const WEEKDAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayIdx = WEEKDAY_MAP[parts.weekday];
  const hour = parseInt(parts.hour, 10) % 24;
  const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
  // Sunday of the current week, as a date key, so we generate at most once/week.
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - dayIdx);
  const weekKey = d.toISOString().slice(0, 10);
  return { dayIdx, hour, weekKey };
}

async function sb(path, opts = {}) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation",
      ...(opts.headers || {}),
    },
  });
  if (!resp.ok) throw new Error(`Supabase ${path} failed: ${resp.status} ${await resp.text()}`);
  return resp.status === 204 ? null : resp.json();
}

export default async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in function environment");
    return new Response("missing config", { status: 500 });
  }

  const { dayIdx, hour, weekKey } = jerusalemNow();

  const [settings] = await sb("settings?id=eq.1&select=*");
  if (!settings || !settings.weekly_list_enabled) {
    return new Response("disabled", { status: 200 });
  }
  if (settings.weekly_list_day !== dayIdx || settings.weekly_list_hour !== hour) {
    return new Response("not time yet", { status: 200 });
  }
  if (settings.last_generated_week === weekKey) {
    return new Response("already generated this week", { status: 200 });
  }

  const [items, pending, priceHistory] = await Promise.all([
    sb("items?select=name"),
    sb("shopping_list?select=item_name&status=eq.pending"),
    sb("price_history?select=item_name,unit_price,price,purchased_at&order=purchased_at.desc&limit=1000"),
  ]);

  const inStock = new Set(items.map((i) => i.name));
  const alreadyOnList = new Set(pending.map((l) => l.item_name));
  const everBought = new Map(); // name -> latest price
  for (const row of priceHistory) {
    if (!everBought.has(row.item_name)) everBought.set(row.item_name, row.unit_price || row.price);
  }

  const toAdd = [...everBought.keys()].filter((name) => !inStock.has(name) && !alreadyOnList.has(name));

  for (const name of toAdd) {
    await sb("shopping_list", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        item_name: name,
        quantity: 1,
        unit: "יח׳",
        estimated_price: everBought.get(name) || null,
        origin: "הצעה שבועית אוטומטית",
        status: "pending",
      }),
    });
  }

  await sb("settings?id=eq.1", {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({ last_generated_week: weekKey, last_run_at: new Date().toISOString() }),
  });

  return new Response(`generated ${toAdd.length} items`, { status: 200 });
};
