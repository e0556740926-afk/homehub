// Netlify Function: estimate-calories
// Receives a photo of a meal/dish plus the number of servings it's meant
// to be split across, and asks Gemini to estimate total and per-serving
// calories. This is a one-off estimate — nothing is persisted.

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
    const { imageBase64, mediaType, servings } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "חסרה תמונה" }), { status: 400 });
    }
    const numServings = Math.max(1, parseInt(servings, 10) || 1);

    const prompt = `אתה מקבל תמונה של מנת אוכל / סיר / קערה. זהה מה זה, העריך את הכמות הכוללת הנראית בתמונה, וחשב הערכת קלוריות.
המנה בתמונה מיועדת להתחלק ל-${numServings} מנות הגשה (סועדים).

החזר אך ורק JSON תקני (ללא markdown fences, ללא טקסט נוסף) במבנה:
{
  "dish_name": "שם המנה בעברית",
  "total_calories": מספר (הערכת קלוריות לכל מה שנראה בתמונה),
  "calories_per_serving": מספר (total_calories חלקי ${numServings}),
  "confidence": מספר בין 0 ל-1,
  "note": "משפט קצר על הבסיס להערכה (למשל מרכיבים עיקריים שזוהו)"
}
זו הערכה גסה בלבד המבוססת על מראה חזותי — אין צורך בדיוק מדעי, אבל השתדל להיות סביר וריאליסטי.`;

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
