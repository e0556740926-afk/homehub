// Netlify Function: scan-receipt
// Receives a base64 receipt image, asks Claude (vision) to extract structured
// line items in Hebrew, and returns clean JSON for the client to review.

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY לא מוגדר בסביבת Netlify" }),
      { status: 500 }
    );
  }

  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "חסרה תמונת קבלה" }), { status: 400 });
    }

    const prompt = `אתה מקבל צילום של קבלת קניות מסופרמרקט ישראלי. חלץ ממנה נתונים מובנים.
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
      "confidence": מספר בין 0 ל-1 (רמת ביטחון בזיהוי השם/הכמות)
    }
  ]
}
אם פריט לא ברור לחלוטין, עדיין נסה לשער בצורה הכי סבירה והורד את confidence בהתאם. אל תמציא פריטים שלא מופיעים בקבלה.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: "שגיאה מול Claude API", detail: errText }), { status: 502 });
    }

    const data = await resp.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");
    const raw = textBlock ? textBlock.text : "{}";
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
