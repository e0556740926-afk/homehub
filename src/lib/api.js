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
