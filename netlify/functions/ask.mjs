// Netlify Function: ask
// Free-text (or speech-transcribed) question about the household —
// "what's in my fridge", "do I have eggs" — answered from current
// inventory + pending shopping list. Kept to a short, speakable answer.

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
    const { question, items, list } = await req.json();
    if (!question) {
      return new Response(JSON.stringify({ error: "חסרה שאלה" }), { status: 400 });
    }

    const inventoryText = (items || []).map((i) => `${i.name}: ${i.quantity} ${i.unit} (${i.location})`).join("\n") || "(המלאי ריק)";
    const listText = (list || []).map((l) => l.item_name || l.name).join(", ") || "(אין פריטים ברשימה)";

    const prompt = `אתה עוזר בית דובר עברית. ענה בקצרה וברורה (משפט או שניים, מתאים להקראה בקול) על סמך המידע הבא בלבד — אל תמציא מידע שלא מופיע כאן.

מלאי נוכחי:
${inventoryText}

רשימת קניות:
${listText}

שאלה: ${question}

החזר אך ורק JSON תקני: {"answer": "התשובה הקצרה"}`;

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
      parsed = { answer: cleaned };
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
