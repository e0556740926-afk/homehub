// Netlify Function: scan-fridge
// Receives a photo of a fridge/pantry shelf (not a receipt) and asks Gemini
// to identify every visible grocery item, so the user can bulk-confirm and
// add them to inventory in one shot — no prices involved here.

const MODEL = "gemini-3.6-flash";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GOOGLE_API_KEY לא מוגדר בסביבת Netlify" }), { status: 500 });
  }

  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "חסרה תמונה" }), { status: 400 });
    }

    const prompt = `אתה מקבל תמונה של מדף במקרר, מקפיא או מזווה. זהה כל מוצר מזון נראה לעין.
לגבי שדה "location": קבע אותו **לפי מה שרואים בפועל בתמונה** — איזה מכשיר/מדף זה (מקרר / מקפיא / מזווה) — ולא לפי כלל כללי על סוג המוצר. אם מוצר מסוים בדרך כלל שייך למקרר (כלל טמפרטורה: 0–6 מעלות) אבל בתמונה הוא נמצא במזווה (7 מעלות ומעלה), רשום "מזווה" — התמונה קובעת, לא ההנחה הכללית. אותו הדבר לגבי מקפיא (0 עד מינוס 7 מעלות).

החזר אך ורק JSON תקני (ללא markdown fences, ללא טקסט נוסף) במבנה:
{
  "items": [
    { "name": "שם המוצר בעברית", "quantity": מספר משוער, "unit": "יח׳ | ג׳ | ק״ג | ל׳ | מ״ל", "location": "מקרר | מזווה | מקפיא", "confidence": מספר בין 0 ל-1 }
  ]
}
נחש כמות סבירה גם אם אי אפשר לדעת בוודאות (למשל בקבוק חלב פתוח = 1 יח׳). אל תמציא מוצרים שלא רואים בבירור בתמונה. אם רואים כמה יחידות של אותו מוצר, אחד אותם לשורה אחת עם הכמות המתאימה.`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inline_data: { mime_type: mediaType || "image/jpeg", data: imageBase64 } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { response_mime_type: "application/json" },
        }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: "שגיאה מול Gemini API", detail: errText }), { status: 502 });
    }

    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return new Response(JSON.stringify({ error: "לא ניתן לפרש את תשובת המודל", raw: cleaned }), { status: 502 });
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
