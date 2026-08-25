// Netlify Function: suggest-recipes
// Given the current inventory and answers to the clarifying wizard
// (servings / style / time / flexibility), asks Google Gemini to propose
// recipes that make good use of what's already at home.

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
    const { items, answers } = await req.json();
    if (!Array.isArray(items) || !answers) {
      return new Response(JSON.stringify({ error: "חסרים נתוני מלאי או תשובות" }), { status: 400 });
    }

    const inventoryText = items.map((i) => `${i.name}: ${i.quantity} ${i.unit}`).join("\n");
    const inventoryNames = items.map((i) => i.name).join(", ");

    const STYLE_RULES = {
      "חלבי": "המתכון חייב להיות חלבי בלבד: מותר חלב/גבינות/מוצרי חלב, ואסור לחלוטין בשר, עוף, או כל מוצר בשרי — אפילו לא ברקע.",
      "בשרי": "המתכון חייב להיות בשרי: מבוסס בשר/עוף/הודו, ואסור לחלוטין מוצרי חלב (חלב, גבינה, חמאה, שמנת וכו').",
      "פרווה": "המתכון חייב להיות פרווה: לא חלבי ולא בשרי — ללא מוצרי חלב וללא בשר/עוף. מבוסס ירקות, דגנים, קטניות, ביצים, דגים, שמנים וכדומה.",
      "טבעוני": "המתכון חייב להיות טבעוני לחלוטין: ללא שום מוצר מן החי (לא בשר, לא דגים, לא ביצים, לא חלב/מוצרי חלב, לא דבש).",
    };
    const styleRule = STYLE_RULES[answers.style] || `סגנון: ${answers.style}`;

    const FLEX_MAX_MISSING = { "רק מה שיש": 0, "עד מצרך אחד חסר": 1, "עד 2 חסרים": 2 };
    const maxMissing = FLEX_MAX_MISSING[answers.flex] ?? 1;

    const prompt = `יש לי בבית בדיוק את המצרכים הבאים (שם: כמות) — שום דבר אחר:
${inventoryText}

אני רוצה הצעה לארוחה לפי הפרמטרים הבאים, וכולם **אילוצים מחייבים**, לא הצעות:

1. מספר סועדים: ${answers.servings} בדיוק. כל כמות בכל מצרך חייבת להיות מחושבת בדיוק ל-${answers.servings} סועדים (לא לסועד אחד, לא לכמות שרירותית).

2. סגנון (חובה): ${styleRule}

3. זמן הכנה: ${answers.time} דקות **לכל היותר**. אסור להציע מתכון שלוקח יותר מ-${answers.time} דקות. אם מתכון טוב לוקח יותר זמן — אל תציע אותו, מצא אחר.

4. מצרכים חסרים: מותר לכל מתכון **עד ${maxMissing} מצרכים** שאינם ברשימת המלאי שלי (${inventoryNames}). לא יותר. ספור בעצמך כמה מהמצרכים במתכון שאתה מציע אינם ברשימה — אם המספר עולה על ${maxMissing}, המתכון פסול ואתה חייב למצוא מתכון אחר או לצמצם/להחליף מצרכים.

הצע עד 3 מתכונים שעומדים בכל 4 האילוצים למעלה, מדורגים מהטוב ביותר (הכי הרבה מצרכים כבר קיימים בבית).

לגבי כמויות ויחידות: כתוב כמויות מדויקות ומעשיות כמו שמתכון אמיתי כתוב — למשל "2 כפות שמן זית", "1 כפית מלח", "300 גרם עגבניות שרי", ולא רק שם המצרך בלי כמות. יחידות מותרות: יח׳ | ג׳ | ק״ג | ל׳ | מ״ל | כף | כפית.

החזר אך ורק JSON תקני (ללא markdown fences, ללא טקסט נוסף) במבנה הבא:
{
  "recipes": [
    {
      "name": "שם המתכון",
      "style": "${answers.style}",
      "time_minutes": מספר (חייב להיות ${answers.time} או פחות),
      "calories_per_serving": מספר (הערכת קלוריות למנה אחת, לפי המצרכים והכמויות),
      "ingredients": [
        { "name": "שם המצרך (בדיוק כפי שמופיע במלאי אם קיים שם)", "quantity": מספר מדויק ל-${answers.servings} סועדים, "unit": "יח׳ | ג׳ | ק״ג | ל׳ | מ״ל | כף | כפית" }
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
