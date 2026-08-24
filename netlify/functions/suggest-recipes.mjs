// Netlify Function: suggest-recipes
// Given the current inventory and answers to the clarifying wizard
// (servings / style / time / flexibility), asks Google Gemini to propose
// recipes that make good use of what's already at home.

const MODEL = "gemini-2.5-flash";

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
    const { items, answers } = await req.json();
    if (!Array.isArray(items) || !answers) {
      return new Response(JSON.stringify({ error: "חסרים נתוני מלאי או תשובות" }), { status: 400 });
    }

    const inventoryText = items.map((i) => `${i.name}: ${i.quantity} ${i.unit}`).join("\n");

    const prompt = `יש לי בבית את המצרכים הבאים (שם: כמות):
${inventoryText}

אני רוצה הצעה לארוחה לפי הפרמטרים הבאים:
- מספר סועדים: ${answers.servings}
- סגנון: ${answers.style}
- זמן הכנה מקסימלי: ${answers.time} דקות
- רמת גמישות לקנייה נוספת: ${answers.flex}

הצע עד 3 מתכונים שמתאימים לפרמטרים, מדורגים מהמתאים ביותר (הכי הרבה מצרכים כבר קיימים בבית) לפחות מתאים.
החזר אך ורק JSON תקני (ללא markdown fences, ללא טקסט נוסף) במבנה הבא:
{
  "recipes": [
    {
      "name": "שם המתכון",
      "style": "${answers.style}",
      "time_minutes": מספר,
      "ingredients": [
        { "name": "שם המצרך (בדיוק כפי שמופיע במלאי אם קיים שם)", "quantity": מספר לכמות סועדים שהתבקשה, "unit": "יח׳ | ג׳ | ק״ג | ל׳ | מ״ל" }
      ],
      "instructions": "הוראות הכנה קצרות, 3-5 משפטים"
    }
  ]
}
כאשר מצרך כבר קיים במלאי, השתמש באותו שם בדיוק כדי שהמערכת תוכל להצליב.`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
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
