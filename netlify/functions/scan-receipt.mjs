// Netlify Function: scan-receipt
// Receives a base64 receipt image, asks Google Gemini (vision) to extract
// structured line items in Hebrew, and returns clean JSON for the client
// to review.

const MODEL = "gemini-3.6-flash";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_API_KEY לא מוגדר בסביבת Netlify" }),
      { status: 500 }
    );
  }

  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "חסרה תמונת קבלה" }), { status: 400 });
    }

    const prompt = `אתה מקבל צילום של קבלת קניות מסופרמרקט ישראלי. חלץ ממנה נתונים מובנים.
עבור כל פריט, קבע גם את מיקום האחסון הסביר ביתר לפי כלל הטמפרטורה הבא (לפי סוג המוצר, לא לפי מה שרואים בתמונה — התמונה היא קבלה, לא מדף):
- "מקרר": מוצרים שצריכים 0–6 מעלות (חלב, גבינות, יוגורט, ביצים, בשר/עוף/דגים טריים, ירקות טריים שדורשים קירור, מוצרים פתוחים)
- "מקפיא": מוצרים קפואים (0 עד מינוס 7 מעלות) — גלידה, ירקות/בשר/דגים קפואים, מוצרים שמסומנים כ"קפוא" בקבלה
- "מזווה": מוצרים יציבים בטמפרטורת חדר ומעלה (עד סביב 7 מעלות ומעלה) — שימורים, יבשים, אורז, פסטה, שמן, ממתקים, משקאות לא פתוחים שאינם קירור

החזר אך ורק JSON תקני (ללא טקסט נוסף, ללא markdown fences) במבנה הבא:
{
  "store": "שם החנות אם ניתן לזהות, אחרת null",
  "purchased_at": "YYYY-MM-DD אם ניתן לזהות, אחרת null",
  "total": מספר או null,
  "items": [
    {
      "name": "שם המוצר בעברית, מנוקה מקיצורים",
      "quantity": מספר,
      "unit": "יח׳ | ג׳ | ק״ג | ל׳ | מ״ל",
      "unit_price": מספר או null,
      "total_price": מספר,
      "location": "מקרר | מקפיא | מזווה",
      "confidence": מספר בין 0 ל-1 (רמת ביטחון בזיהוי השם/הכמות)
    }
  ]
}
אם פריט לא ברור לחלוטין, עדיין נסה לשער בצורה הכי סבירה והורד את confidence בהתאם. אל תמציא פריטים שלא מופיעים בקבלה.`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
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
          generationConfig: {
            response_mime_type: "application/json",
          },
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

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
