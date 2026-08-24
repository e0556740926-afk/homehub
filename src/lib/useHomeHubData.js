import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { suggestRecipes as suggestRecipesApi, scanReceipt as scanReceiptApi } from "./api";

const UNIT_STEP = { "ק״ג": 0.5, "ג׳": 50, "ל׳": 0.5, "מ״ל": 50, "יח׳": 1 };

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function useHomeHubData() {
  const [items, setItems] = useState([]);
  const [list, setList] = useState([]);
  const [receipts, setReceipts] = useState([]);
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
    const [itemsRes, listRes, receiptsRes, priceRes] = await Promise.all([
      supabase.from("items").select("*").order("name"),
      supabase.from("shopping_list").select("*").eq("status", "pending").order("created_at"),
      supabase.from("receipts").select("*").order("purchased_at", { ascending: false }).limit(20),
      supabase.from("price_history").select("item_name, unit_price, price, purchased_at").order("purchased_at", { ascending: false }).limit(500),
    ]);
    if (!itemsRes.error) setItems(itemsRes.data || []);
    if (!listRes.error) setList(listRes.data || []);
    if (!receiptsRes.error) setReceipts(receiptsRes.data || []);
    if (!priceRes.error) {
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
      showToast(`המלאי עודכן לפי ${recipe.name}`);
      await loadAll();
    },
    [items, addToList, loadAll, showToast]
  );

  const expiringCount = useMemo(
    () => items.filter((i) => i.expiry_date && new Date(i.expiry_date) - new Date() < 1000 * 60 * 60 * 24 * 5).length,
    [items]
  );

  return {
    items,
    list,
    receipts,
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
    reload: loadAll,
  };
}
