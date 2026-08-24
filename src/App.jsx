import { useState } from "react";
import { isSupabaseConfigured, supabaseConfigError } from "./lib/supabaseClient";
import { useHomeHubData } from "./lib/useHomeHubData";
import TabBar from "./components/TabBar";
import Toast from "./components/Toast";
import InventoryTab from "./components/InventoryTab";
import ListTab from "./components/ListTab";
import ReceiptsTab from "./components/ReceiptsTab";
import CookTab from "./components/CookTab";
import HomeTab from "./components/HomeTab";
import AddSheet from "./components/sheets/AddSheet";
import ScanSheet from "./components/sheets/ScanSheet";
import ReviewSheet from "./components/sheets/ReviewSheet";
import WizardSheet from "./components/sheets/WizardSheet";
import RecipeSheet from "./components/sheets/RecipeSheet";
import SettingsSheet from "./components/sheets/SettingsSheet";
import BarcodeSheet from "./components/sheets/BarcodeSheet";
import FridgeScanSheet from "./components/sheets/FridgeScanSheet";
import WeeklyMenuSheet from "./components/sheets/WeeklyMenuSheet";
import VoiceSheet from "./components/sheets/VoiceSheet";

function ConfigErrorScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base p-6" dir="rtl">
      <div className="w-full max-w-sm bg-white rounded-xl2 p-6 shadow-sm">
        <div className="font-display font-extrabold text-xl text-terracotta mb-2">חסרה הגדרת Supabase</div>
        <div className="text-mutedDark text-sm leading-relaxed mb-3">{supabaseConfigError}</div>
        <div className="text-mutedDark text-sm leading-relaxed">
          ב-Netlify: Site configuration → Environment variables → ודא ש-
          <code className="bg-chip px-1 rounded">VITE_SUPABASE_URL</code> ו-
          <code className="bg-chip px-1 rounded">VITE_SUPABASE_ANON_KEY</code> מוגדרים נכון (הערכים ב-
          <code className="bg-chip px-1 rounded">.env.example</code> ברפו), ואז Trigger deploy מחדש.
        </div>
      </div>
    </div>
  );
}

// שלב ניסיוני: אין מסך התחברות — משתמש יחיד מרומז, ישר לדף הבית.
// ה-RLS בטבלאות כובה בהתאם (ראה מיגרציית disable_auth_single_user_experimental).
export default function App() {
  if (!isSupabaseConfigured) {
    return <ConfigErrorScreen />;
  }
  return <Main />;
}

function Main() {
  const data = useHomeHubData();
  const [tab, setTab] = useState("home");
  const [sheet, setSheet] = useState(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [wizardBusy, setWizardBusy] = useState(false);
  const [parsedReceipt, setParsedReceipt] = useState(null);
  const [results, setResults] = useState(null);
  const [answers, setAnswers] = useState({ servings: "2", style: "חלבי" });
  const [openRecipe, setOpenRecipe] = useState(null);

  async function handleScanFile(file) {
    setScanBusy(true);
    try {
      const parsed = await data.runScanReceipt(file);
      setParsedReceipt(parsed);
      setSheet("review");
    } catch (err) {
      data.showToast(err.message || "שגיאה בסריקה");
      setSheet(null);
    } finally {
      setScanBusy(false);
    }
  }

  async function handleConfirmReceipt(parsed) {
    await data.saveReceipt(parsed);
    setSheet(null);
    setParsedReceipt(null);
    setTab("inv");
  }

  async function handleWizardDone(ans) {
    setWizardBusy(true);
    try {
      const recipes = await data.runSuggestRecipes(ans);
      setAnswers(ans);
      setResults(recipes);
      setSheet(null);
      setTab("cook");
    } catch (err) {
      data.showToast(err.message || "שגיאה בהצעת מתכונים");
    } finally {
      setWizardBusy(false);
    }
  }

  async function handleFridgeConfirm(scanItems) {
    await data.addFridgeScanItems(scanItems);
    setTab("inv");
  }

  async function handleAddAllMissing(names) {
    for (const name of names) {
      await data.addManualToList({ name, quantity: 1, unit: "יח׳" });
    }
    setSheet(null);
    setTab("list");
  }

  function fab() {
    if (tab === "receipts") setSheet("scan");
    else if (tab === "cook") setSheet("wizard");
    else setSheet("add");
  }

  function openRecipeSheet(recipe) {
    setOpenRecipe(recipe);
    setSheet("recipe");
  }

  return (
    <div className="min-h-screen bg-base" dir="rtl">
      <div className="max-w-md mx-auto relative min-h-screen bg-base">
        {tab === "home" && (
          <HomeTab
            items={data.items}
            list={data.list}
            expiringCount={data.expiringCount}
            recentItems={data.recentItems}
            favorites={data.favorites}
            settings={data.settings}
            predictedRunOut={data.predictedRunOut}
            spendingStats={data.spendingStats}
            priceComparison={data.priceComparison}
            cookStreak={data.cookStreak}
            wasteThisMonth={data.wasteThisMonth}
            onOpenScan={() => setSheet("scan")}
            onOpenWizard={() => setSheet("wizard")}
            onOpenAdd={() => setSheet("add")}
            onOpenRecipe={openRecipeSheet}
            onOpenSettings={() => setSheet("settings")}
            onOpenBarcode={() => setSheet("barcode")}
            onOpenFridgeScan={() => setSheet("fridge")}
            onOpenWeeklyMenu={() => setSheet("weeklyMenu")}
            onOpenVoice={() => setSheet("voice")}
          />
        )}
        {tab === "inv" && (
          <InventoryTab
            items={data.items}
            expiringCount={data.expiringCount}
            onInc={data.incItem}
            onDec={data.decItem}
            onWaste={data.logWaste}
          />
        )}
        {tab === "list" && <ListTab list={data.list} estimatePrice={data.estimatePrice} onBuy={data.buyListItem} />}
        {tab === "receipts" && <ReceiptsTab receipts={data.receipts} onScan={() => setSheet("scan")} />}
        {tab === "cook" && (
          <CookTab
            results={results}
            evalRecipe={data.evalRecipe}
            answers={answers}
            onOpenWizard={() => setSheet("wizard")}
            onOpenRecipe={openRecipeSheet}
          />
        )}

        {tab !== "home" && (
          <button
            onClick={fab}
            className="fixed z-30 bg-ink text-cream w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
            style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))", insetInlineStart: "1.5rem" }}
          >
            +
          </button>
        )}

        <TabBar tab={tab} setTab={setTab} />
        <Toast message={data.toast} />

        {sheet === "add" && (
          <AddSheet
            toList={tab === "list"}
            onClose={() => setSheet(null)}
            onAddInventory={data.addItemManual}
            onAddList={data.addManualToList}
          />
        )}
        {sheet === "scan" && <ScanSheet onClose={() => setSheet(null)} onFile={handleScanFile} busy={scanBusy} />}
        {sheet === "review" && (
          <ReviewSheet parsed={parsedReceipt} onClose={() => setSheet(null)} onConfirm={handleConfirmReceipt} />
        )}
        {sheet === "wizard" && (
          <WizardSheet onClose={() => setSheet(null)} onDone={handleWizardDone} busy={wizardBusy} defaultServings={2} />
        )}
        {sheet === "recipe" && openRecipe && (
          <RecipeSheet
            recipe={openRecipe}
            evalRecipe={data.evalRecipe}
            servings={answers.servings}
            favorite={data.isFavorite(openRecipe.name)}
            onToggleFavorite={data.toggleFavorite}
            onClose={() => setSheet(null)}
            onAddMissing={data.addMissingToList}
            onCook={async (r) => {
              await data.cookRecipe(r);
              setSheet(null);
              setTab("inv");
            }}
          />
        )}
        {sheet === "settings" && (
          <SettingsSheet settings={data.settings} onClose={() => setSheet(null)} onSave={data.saveSettings} />
        )}
        {sheet === "barcode" && (
          <BarcodeSheet
            onClose={() => setSheet(null)}
            onAdd={(draft) => {
              data.addItemManual(draft);
              setTab("inv");
            }}
          />
        )}
        {sheet === "fridge" && (
          <FridgeScanSheet onClose={() => setSheet(null)} onScan={data.runScanFridge} onConfirm={handleFridgeConfirm} />
        )}
        {sheet === "weeklyMenu" && (
          <WeeklyMenuSheet
            onClose={() => setSheet(null)}
            onGenerate={() => data.runWeeklyMenu(answers.servings)}
            onAddAllMissing={handleAddAllMissing}
            evalRecipe={data.evalRecipe}
          />
        )}
        {sheet === "voice" && <VoiceSheet onClose={() => setSheet(null)} onAsk={data.runAsk} />}
      </div>
    </div>
  );
}
