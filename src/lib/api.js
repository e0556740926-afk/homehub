export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("קריאת הקובץ נכשלה"));
    reader.readAsDataURL(file);
  });
}

export async function scanReceipt(file) {
  const imageBase64 = await fileToBase64(file);
  const res = await fetch("/api/scan-receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mediaType: file.type || "image/jpeg" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "שגיאה בסריקת הקבלה");
  return data;
}

export async function suggestRecipes(items, answers) {
  const res = await fetch("/api/suggest-recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, answers }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "שגיאה בהצעת מתכונים");
  return data.recipes || [];
}

export async function scanFridge(file) {
  const imageBase64 = await fileToBase64(file);
  const res = await fetch("/api/scan-fridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mediaType: file.type || "image/jpeg" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "שגיאה בסריקת התמונה");
  return data.items || [];
}

export async function getWeeklyMenu(items, servings) {
  const res = await fetch("/api/weekly-menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, servings }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "שגיאה בבניית התפריט השבועי");
  return data.days || [];
}

export async function askAssistant(question, items, list) {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, items, list }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "שגיאה בקבלת תשובה");
  return data.answer || "";
}

export async function estimateCalories(file, servings) {
  const imageBase64 = await fileToBase64(file);
  const res = await fetch("/api/estimate-calories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mediaType: file.type || "image/jpeg", servings }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "שגיאה בהערכת הקלוריות");
  return data;
}

// Open Food Facts is a free, keyless public database — good fit for
// barcode → product-name lookups without adding another paid dependency.
export async function lookupBarcode(code) {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_he,brands,quantity`
  );
  if (!res.ok) throw new Error("שגיאה בבדיקת הברקוד");
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  return {
    name: p.product_name_he || p.product_name || p.brands || null,
    quantity: p.quantity || null,
  };
}
