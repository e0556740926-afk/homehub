# HomeHub — ניהול משק בית

PWA לנייד (React + Vite + Tailwind + Supabase), משתמש יחיד. מלאי, רשימת קניות, סריקת קבלות (Claude Vision) והצעת מתכונים אינטראקטיבית (Claude).

## הרצה מקומית

```bash
npm install
cp .env.example .env   # כבר ממולא עם מפתחות פרויקט ה-Supabase
npm run dev
```

לפונקציות ה-AI (סריקת קבלות + הצעת מתכונים) יש להריץ דרך Netlify CLI כדי שה-functions יעבדו מקומית:

```bash
npm i -g netlify-cli
netlify dev
```

יש להגדיר משתנה סביבה `ANTHROPIC_API_KEY` (ראו למטה).

## Supabase

הפרויקט כבר נוצר וה-schema הוחל (`items`, `receipts`, `price_history`, `shopping_list`, `recipes`, כולן עם RLS לפי `auth.uid()`).

- URL: `https://gdedbksabimjxafsjpej.supabase.co`
- Publishable key: ב-`.env.example`

כדי להשתמש באפליקציה יש להירשם פעם אחת דרך מסך ההתחברות (Sign up) עם אימייל וסיסמה — זה יוצר את משתמש ה-Auth היחיד שה-RLS מוגבל אליו.

## משתני סביבה ב-Netlify

בהגדרות האתר ב-Netlify → Site configuration → Environment variables, יש להוסיף:

| משתנה | ערך |
|---|---|
| `VITE_SUPABASE_URL` | `https://gdedbksabimjxafsjpej.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (ראה `.env.example`) |
| `ANTHROPIC_API_KEY` | מפתח API אישי מ-console.anthropic.com — **סודי, לא לשים ב-git** |

## פריסה

חיבור הריפו ל-Netlify (או `netlify deploy --prod`). `netlify.toml` כבר מגדיר build command, publish dir, ואת ניתוב `/api/*` ל-Netlify Functions.

## מבנה

```
src/
  lib/
    supabaseClient.js      חיבור Supabase
    useHomeHubData.js       כל הלוגיקה + קריאות DB
    api.js                  קריאות ל-Netlify Functions
  components/
    InventoryTab / ListTab / ReceiptsTab / CookTab.jsx
    sheets/  AddSheet, ScanSheet, ReviewSheet, WizardSheet, RecipeSheet
netlify/functions/
  scan-receipt.mjs          Claude vision → JSON מובנה מקבלה
  suggest-recipes.mjs       Claude → הצעות מתכונים לפי מלאי + שאלון
```

## מצב נוכחי (MVP שלב 1+2)

- הוספה למלאי: ידנית + סריקת קבלה
- חיסור מהמלאי: ידני + אוטומטי לפי מתכון שנבחר
- רשימת קניות עם הערכת מחיר מהיסטוריה
- הצעת מתכונים אינטראקטיבית (4 שאלות הבהרה) מבוססת Claude

פתוח להמשך: מאגר מתכונים שמורים, התראות תפוגה חכמות, בית משותף (רב-משתמשים).
