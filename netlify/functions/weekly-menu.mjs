// Netlify Function: weekly-menu
// Given current inventory, asks Gemini for a full 7-day meal plan that
// maximizes use of what's already at home and minimizes waste.

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
    const { items, servings } = await req.json();
    if (!Array.isArray(items)) {
      return new Response(JSON.stringify({ error: "חסרים נתוני מלאי" }), { status: 400 });
    }

    const inventoryText = items.map((i) => `${i.name}: ${i.quantity} ${i.unit}`).join("\n");

    const prompt = `יש לי בבית את המצרכים הבאים (שם: כמות):
${inventoryText}

בנה לי תפריט ל-7 ימים (ראשון עד שבת), ארוחת ערב אחת ליום, ל-${servings || 2} סועדים כל ארוחה.
תעדף מתכונים שממקסמים שימוש במה שכבר יש, ומצרכים משותפים בין כמה ימים כדי לצמצם בזבוז וקנייה נוספת.
החזר אך ורק JSON תקני (ללא markdown fences, ללא טקסט נוסף) במבנה:
{
  "days": [
    {
      "day": "ראשון",
      "recipe": {
        "name": "שם המתכון",
        "time_minutes": מספר,
        "ingredients": [ { "name": "שם המצרך (זהה לשם במלאי אם קיים)", "quantity": מספר, "unit": "יח׳ | ג׳ | ק״ג | ל׳ | מ״ל" } ],
        "instructions": "הוראות קצרות"
      }
    }
  ]
}
7 ימים בדיוק, לפי הסדר ראשון-שבת.`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
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
