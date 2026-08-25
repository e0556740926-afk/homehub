import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  suggestRecipes as suggestRecipesApi,
  scanReceipt as scanReceiptApi,
  scanFridge as scanFridgeApi,
  getWeeklyMenu as getWeeklyMenuApi,
  askAssistant as askAssistantApi,
  estimateCalories as estimateCaloriesApi,
} from "./api";

const UNIT_STEP = { "ק״ג": 0.5, "ג׳": 50, "ל׳": 0.5, "מ״ל": 50, "יח׳": 1 };

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function useHomeHubData() {
  const [items, setItems] = useState([]);
  const [list, setList] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [settings, setSettings] = useState(null);
  const [wasteLog, setWasteLog] = useState([]);
  const [cookLog, setCookLog] = useState([]);
  const [priceHistoryRaw, setPriceHistoryRaw] = useState([]);
  const [priceMap, setPriceMap] = useState({}); // item_name -> latest estimated price
  const [loading, setLoading] = useState(true);
  const [toast, setToastState] = useState(null);

  const showToast = useCallback((msg) => {
    setToastState(msg);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToastState(null), 2300);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [itemsRes, listRes, receiptsRes, priceRes, favRes, settingsRes, wasteRes, cookRes] = await Promise.all([
      supabase.from("items").select("*").order("name"),
      supabase.from("shopping_list").select("*").eq("status", "pending").order("created_at"),
      supabase.from("receipts").select("*").order("purchased_at", { ascending: false }).limit(20),
      supabase.from("price_history").select("item_name, store, unit_price, price, purchased_at").order("purchased_at", { ascending: false }).limit(500),
      supabase.from("recipes").select("*").eq("is_favorite", true).order("created_at", { ascending: false }),
      supabase.from("settings").select("*").eq("id", 1).single(),
      supabase.from("waste_log").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("cook_log").select("*").order("cooked_at", { ascending: false }).limit(200),
    ]);
    if (!itemsRes.error) setItems(itemsRes.data || []);
    if (!listRes.error) setList(listRes.data || []);
    if (!receiptsRes.error) setReceipts(receiptsRes.data || []);
    if (!favRes.error) setFavorites(favRes.data || []);
    if (!settingsRes.error) setSettings(settingsRes.data || null);
    if (!wasteRes.error) setWasteLog(wasteRes.data || []);
    if (!cookRes.error) setCookLog(cookRes.data || []);
    if (!priceRes.error) {
      setPriceHistoryRaw(priceRes.data || []);
      const map = {};
      for (const row of priceRes.data || []) {
        if (!(row.item_name in map)) map[row.item_name] = row.unit_price || row.price;
      }
      setPriceMap(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const estimatePrice = useCallback((name) => priceMap[name] ?? 9.9, [priceMap]);

  // ---------- inventory ----------
  const addItemManual = useCallback(
    async ({ name, quantity, unit, location, category }) => {
      const { data, error } = await supabase
        .from("items")
        .insert({ name, quantity: parseFloat(quantity) || 1, unit, location, category })
        .select()
        .single();
      if (error) {
        showToast("שגיאה בהוספת פריט");
        return;
      }
      setItems((s) => [...s, data].sort((a, b) => a.name.localeCompare(b.name, "he")));
      showToast(`${name} נוסף למלאי`);
    },
    [showToast]
  );

  const addToList = useCallback(
    async (name, origin, quantity = 1, unit = "יח׳") => {
      if (list.some((l) => l.name === name)) return;
      const estimated_price = estimatePrice(name);
      const { data, error } = await supabase
        .from("shopping_list")
        .insert({ item_name: name, origin, quantity, unit, estimated_price, status: "pending" })
        .select()
        .single();
      if (!error) setList((s) => [...s, { ...data, name: data.item_name }]);
    },
    [list, estimatePrice]
  );

  const incItem = useCallback(async (item) => {
    const step = UNIT_STEP[item.unit] ?? 1;
    const nq = round2(item.quantity + step);
    const { error } = await supabase.from("items").update({ quantity: nq }).eq("id", item.id);
    if (!error) setItems((s) => s.map((x) => (x.id === item.id ? { ...x, quantity: nq } : x)));
  }, []);

  const decItem = useCallback(
    async (item) => {
      const step = UNIT_STEP[item.unit] ?? 1;
      const nq = round2(item.quantity - step);
      if (nq <= 0) {
        await supabase.from("items").delete().eq("id", item.id);
        setItems((s) => s.filter((x) => x.id !== item.id));
        await addToList(item.name, "נגמר במלאי");
        showToast(`${item.name} נגמר — נוסף לרשימת הקניות`);
      } else {
        const { error } = await supabase.from("items").update({ quantity: nq }).eq("id", item.id);
        if (!error) setItems((s) => s.map((x) => (x.id === item.id ? { ...x, quantity: nq } : x)));
      }
    },
    [addToList, showToast]
  );

  const markOut = useCallback(
    async (item) => {
      await supabase.from("items").delete().eq("id", item.id);
      setItems((s) => s.filter((x) => x.id !== item.id));
      await addToList(item.name, "נגמר במלאי");
      showToast(`${item.name} עבר לרשימת הקניות`);
    },
    [addToList, showToast]
  );

  // ---------- shopping list ----------
  const buyListItem = useCallback(
    async (listRow) => {
      await supabase.from("shopping_list").delete().eq("id", listRow.id);
      setList((s) => s.filter((x) => x.id !== listRow.id));
      const existing = items.find((i) => i.name === listRow.item_name);
      if (existing) {
        const nq = round2(existing.quantity + (listRow.quantity || 1));
        await supabase.from("items").update({ quantity: nq }).eq("id", existing.id);
        setItems((s) => s.map((x) => (x.id === existing.id ? { ...x, quantity: nq } : x)));
      } else {
        const { data } = await supabase
          .from("items")
          .insert({ name: listRow.item_name, quantity: listRow.quantity || 1, unit: listRow.unit || "יח׳", location: "מזווה" })
          .select()
          .single();
        if (data) setItems((s) => [...s, data].sort((a, b) => a.name.localeCompare(b.name, "he")));
      }
      showToast(`${listRow.item_name} נקנה → נוסף למלאי`);
    },
    [items, showToast]
  );

  const addManualToList = useCallback(
    async ({ name, quantity, unit }) => {
      const estimated_price = estimatePrice(name);
      const { data, error } = await supabase
        .from("shopping_list")
        .insert({ item_name: name, origin: "הוספה ידנית", quantity: parseFloat(quantity) || 1, unit, estimated_price, status: "pending" })
        .select()
        .single();
      if (!error) {
        setList((s) => [...s, data]);
        showToast(`${name} נוסף לרשימה`);
      }
    },
    [estimatePrice, showToast]
  );

  // ---------- receipts ----------
  const saveReceipt = useCallback(
    async (parsed) => {
      const { store, purchased_at, total, items: scanItems } = parsed;
      const { data: receiptRow } = await supabase
        .from("receipts")
        .insert({ store, purchased_at: purchased_at || new Date().toISOString().slice(0, 10), total, raw_json: parsed })
        .select()
        .single();

      for (const row of scanItems) {
        const existing = items.find((i) => i.name === row.name);
        if (existing) {
          const nq = round2(existing.quantity + row.quantity);
          await supabase.from("items").update({ quantity: nq }).eq("id", existing.id);
        } else {
          const { data: newItem } = await supabase
            .from("items")
            .insert({ name: row.name, quantity: row.quantity, unit: row.unit, location: "מזווה" })
            .select()
            .single();
          if (newItem) items.push(newItem);
        }
        await supabase.from("price_history").insert({
          item_name: row.name,
          store,
          price: row.total_price,
          unit_price: row.unit_price,
          purchased_at: purchased_at || new Date().toISOString().slice(0, 10),
          receipt_id: receiptRow?.id,
        });
        const matchingListEntry = list.find((l) => l.item_name === row.name || l.name === row.name);
        if (matchingListEntry) {
          await supabase.from("shopping_list").delete().eq("id", matchingListEntry.id);
        }
      }
      showToast("המלאי והמחירים עודכנו");
      await loadAll();
    },
    [items, list, loadAll, showToast]
  );

  const runScanReceipt = useCallback(async (file) => {
    return scanReceiptApi(file);
  }, []);

  // ---------- recipes ----------
  const evalRecipe = useCallback(
    (recipe) => {
      let have = 0;
      const missing = [];
      for (const ing of recipe.ingredients) {
        const it = items.find((i) => i.name === ing.name);
        if (it && it.quantity >= ing.quantity * 0.6) have++;
        else missing.push(ing.name);
      }
      const pct = recipe.ingredients.length ? Math.round((have / recipe.ingredients.length) * 100) : 0;
      return { pct, missing };
    },
    [items]
  );

  const runSuggestRecipes = useCallback(async (answers) => {
    const recipes = await suggestRecipesApi(items, answers);
    return recipes;
  }, [items]);

  const addMissingToList = useCallback(
    async (recipe) => {
      const { missing } = evalRecipe(recipe);
      for (const name of missing) {
        await addToList(name, "חסר למתכון");
      }
      showToast("נוסף לרשימת הקניות");
    },
    [evalRecipe, addToList, showToast]
  );

  const cookRecipe = useCallback(
    async (recipe) => {
      const outNames = [];
      for (const ing of recipe.ingredients) {
        const it = items.find((i) => i.name === ing.name);
        if (!it) continue;
        const nq = round2(it.quantity - ing.quantity);
        if (nq <= 0) {
          await supabase.from("items").delete().eq("id", it.id);
          outNames.push(it.name);
        } else {
          await supabase.from("items").update({ quantity: nq }).eq("id", it.id);
        }
      }
      for (const name of outNames) {
        await addToList(name, "נגמר בבישול");
      }
      await supabase.from("cook_log").insert({ recipe_name: recipe.name });
      showToast(`המלאי עודכן לפי ${recipe.name}`);
      await loadAll();
    },
    [items, addToList, loadAll, showToast]
  );

  const toggleFavorite = useCallback(
    async (recipe) => {
      const existing = favorites.find((f) => f.name === recipe.name);
      if (existing) {
        await supabase.from("recipes").delete().eq("id", existing.id);
        setFavorites((s) => s.filter((f) => f.id !== existing.id));
        showToast("הוסר מהמועדפים");
      } else {
        const { data, error } = await supabase
          .from("recipes")
          .insert({
            name: recipe.name,
            style: recipe.style,
            time_minutes: recipe.time_minutes,
            calories_per_serving: recipe.calories_per_serving,
            ingredients: recipe.ingredients,
            is_favorite: true,
          })
          .select()
          .single();
        if (!error) {
          setFavorites((s) => [data, ...s]);
          showToast(`${recipe.name} נוסף למועדפים`);
        }
      }
    },
    [favorites, showToast]
  );

  const isFavorite = useCallback((recipeName) => favorites.some((f) => f.name === recipeName), [favorites]);

  const saveSettings = useCallback(async (patch) => {
    const { data, error } = await supabase.from("settings").update(patch).eq("id", 1).select().single();
    if (!error) {
      setSettings(data);
      showToast("ההגדרה נשמרה");
    }
  }, [showToast]);

  // ---------- waste tracking ----------
  const logWaste = useCallback(
    async (item) => {
      await supabase.from("items").delete().eq("id", item.id);
      setItems((s) => s.filter((x) => x.id !== item.id));
      await supabase.from("waste_log").insert({ item_name: item.name, quantity: item.quantity, unit: item.unit });
      setWasteLog((s) => [{ item_name: item.name, quantity: item.quantity, unit: item.unit, created_at: new Date().toISOString() }, ...s]);
      showToast(`${item.name} סומן כנזרק`);
    },
    [showToast]
  );

  // ---------- fridge/pantry photo scan (bulk add, no prices) ----------
  const runScanFridge = useCallback(async (file) => scanFridgeApi(file), []);

  const addFridgeScanItems = useCallback(
    async (scanItems) => {
      let added = 0;
      for (const row of scanItems) {
        const existing = items.find((i) => i.name === row.name);
        if (existing) {
          const nq = round2(existing.quantity + row.quantity);
          await supabase.from("items").update({ quantity: nq }).eq("id", existing.id);
        } else {
          await supabase.from("items").insert({ name: row.name, quantity: row.quantity, unit: row.unit, location: row.location || "מזווה" });
          added++;
        }
      }
      showToast(`המלאי עודכן (${scanItems.length} פריטים)`);
      await loadAll();
      return added;
    },
    [items, loadAll, showToast]
  );

  // ---------- weekly meal planner ----------
  const runWeeklyMenu = useCallback(async (servings) => getWeeklyMenuApi(items, servings), [items]);

  // ---------- one-off photo calorie estimate ----------
  const runEstimateCalories = useCallback(async (file, servings) => estimateCaloriesApi(file, servings), []);

  // ---------- voice / text assistant ----------
  const runAsk = useCallback(async (question) => askAssistantApi(question, items, list), [items, list]);

  // ---------- predictive "about to run out" ----------
  const predictedRunOut = useMemo(() => {
    const byName = new Map();
    for (const row of priceHistoryRaw) {
      if (!byName.has(row.item_name)) byName.set(row.item_name, []);
      byName.get(row.item_name).push(new Date(row.purchased_at));
    }
    const predictions = [];
    for (const item of items) {
      const dates = (byName.get(item.name) || []).sort((a, b) => a - b);
      if (dates.length < 2) continue;
      let totalGap = 0;
      for (let i = 1; i < dates.length; i++) totalGap += dates[i] - dates[i - 1];
      const avgGapDays = totalGap / (dates.length - 1) / (1000 * 60 * 60 * 24);
      const lastPurchase = dates[dates.length - 1];
      const predictedDate = new Date(lastPurchase.getTime() + avgGapDays * 24 * 60 * 60 * 1000);
      const daysLeft = Math.round((predictedDate - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3) predictions.push({ name: item.name, daysLeft });
    }
    return predictions.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [items, priceHistoryRaw]);

  // ---------- spending summary ----------
  const spendingStats = useMemo(() => {
    const total = priceHistoryRaw.reduce((sum, r) => sum + (Number(r.price) || 0), 0);
    const thisMonth = priceHistoryRaw
      .filter((r) => {
        const d = new Date(r.purchased_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, r) => sum + (Number(r.price) || 0), 0);
    return { total: round2(total), thisMonth: round2(thisMonth) };
  }, [priceHistoryRaw]);

  // ---------- price comparison across stores ----------
  const priceComparison = useMemo(() => {
    const byName = new Map();
    for (const row of priceHistoryRaw) {
      if (!row.store) continue;
      if (!byName.has(row.item_name)) byName.set(row.item_name, []);
      byName.get(row.item_name).push({ store: row.store, price: row.unit_price || row.price, purchased_at: row.purchased_at });
    }
    const result = [];
    for (const [name, rows] of byName) {
      const stores = new Set(rows.map((r) => r.store));
      if (stores.size < 2) continue; // only interesting when we have 2+ stores to compare
      const cheapest = rows.reduce((a, b) => (Number(b.price) < Number(a.price) ? b : a));
      result.push({ name, cheapestStore: cheapest.store, cheapestPrice: cheapest.price, comparedStores: stores.size });
    }
    return result;
  }, [priceHistoryRaw]);

  // ---------- gamification: cook streak ----------
  const cookStreak = useMemo(() => {
    if (cookLog.length === 0) return 0;
    const days = new Set(cookLog.map((c) => new Date(c.cooked_at).toISOString().slice(0, 10)));
    let streak = 0;
    let d = new Date();
    while (days.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }, [cookLog]);

  const wasteThisMonth = useMemo(() => {
    const now = new Date();
    return wasteLog.filter((w) => {
      const d = new Date(w.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [wasteLog]);

  const expiringCount = useMemo(
    () => items.filter((i) => i.expiry_date && new Date(i.expiry_date) - new Date() < 1000 * 60 * 60 * 24 * 5).length,
    [items]
  );

  const recentItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8),
    [items]
  );

  return {
    items,
    list,
    receipts,
    favorites,
    recentItems,
    settings,
    saveSettings,
    loading,
    toast,
    showToast,
    estimatePrice,
    expiringCount,
    addItemManual,
    incItem,
    decItem,
    markOut,
    buyListItem,
    addManualToList,
    saveReceipt,
    runScanReceipt,
    evalRecipe,
    runSuggestRecipes,
    addMissingToList,
    cookRecipe,
    toggleFavorite,
    isFavorite,
    logWaste,
    runScanFridge,
    addFridgeScanItems,
    runWeeklyMenu,
    runEstimateCalories,
    runAsk,
    predictedRunOut,
    spendingStats,
    priceComparison,
    cookStreak,
    wasteThisMonth,
    reload: loadAll,
  };
}
