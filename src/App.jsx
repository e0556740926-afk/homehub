import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { useHomeHubData } from "./lib/useHomeHubData";
import AuthScreen from "./components/AuthScreen";
import TabBar from "./components/TabBar";
import Toast from "./components/Toast";
import InventoryTab from "./components/InventoryTab";
import ListTab from "./components/ListTab";
import ReceiptsTab from "./components/ReceiptsTab";
import CookTab from "./components/CookTab";
import AddSheet from "./components/sheets/AddSheet";
import ScanSheet from "./components/sheets/ScanSheet";
import ReviewSheet from "./components/sheets/ReviewSheet";
import WizardSheet from "./components/sheets/WizardSheet";
import RecipeSheet from "./components/sheets/RecipeSheet";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="min-h-screen bg-base" />;
  }
  if (!session) {
    return <AuthScreen />;
  }
  return <Main />;
}

function Main() {
  const data = useHomeHubData();
  const [tab, setTab] = useState("inv");
  const [sheet, setSheet] = useState(null); // 'add' | 'scan' | 'review' | 'wizard' | 'recipe'
  const [scanBusy, setScanBusy] = useState(false);
  const [wizardBusy, setWizardBusy] = useState(false);
  const [parsedReceipt, setParsedReceipt] = useState(null);
  const [results, setResults] = useState(null);
  const [answers, setAnswers] = useState({ servings: "2", style: "חלבי" });
  const [openRecipeIdx, setOpenRecipeIdx] = useState(null);

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

  function fab() {
    if (tab === "receipts") setSheet("scan");
    else if (tab === "cook") setSheet("wizard");
    else setSheet("add");
  }

  const openRecipe = openRecipeIdx != null ? results?.[openRecipeIdx] : null;

  return (
    <div className="min-h-screen bg-base" dir="rtl">
      <div className="max-w-md mx-auto relative min-h-screen bg-base">
        {tab === "inv" && (
          <InventoryTab
            items={data.items}
            expiringCount={data.expiringCount}
            onInc={data.incItem}
            onDec={data.decItem}
            onMarkOut={data.markOut}
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
            onOpenRecipe={(idx) => {
              setOpenRecipeIdx(idx);
              setSheet("recipe");
            }}
          />
        )}

        {/* Floating action button */}
        <button
          onClick={fab}
          className="fixed z-30 bg-ink text-cream w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))", insetInlineStart: "1.5rem" }}
        >
          +
        </button>

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
          <WizardSheet
            onClose={() => setSheet(null)}
            onDone={handleWizardDone}
            busy={wizardBusy}
            defaultServings={2}
          />
        )}
        {sheet === "recipe" && openRecipe && (
          <RecipeSheet
            recipe={openRecipe}
            evalRecipe={data.evalRecipe}
            servings={answers.servings}
            onClose={() => setSheet(null)}
            onAddMissing={data.addMissingToList}
            onCook={async (r) => {
              await data.cookRecipe(r);
              setSheet(null);
              setTab("inv");
            }}
          />
        )}
      </div>
    </div>
  );
}
