import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import SheetShell from "./SheetShell";

const SpeechRecognitionCtor =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function VoiceSheet({ onClose, onAsk }) {
  const [supported] = useState(!!SpeechRecognitionCtor);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const rec = new SpeechRecognitionCtor();
    rec.lang = "he-IL";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      ask(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => rec.abort();
  }, [supported]);

  async function ask(question) {
    if (!question.trim()) return;
    setBusy(true);
    setAnswer("");
    try {
      const a = await onAsk(question);
      setAnswer(a);
      if (window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(a);
        utter.lang = "he-IL";
        window.speechSynthesis.speak(utter);
      }
    } catch (err) {
      setAnswer(err.message || "שגיאה בקבלת תשובה");
    } finally {
      setBusy(false);
    }
  }

  function startListening() {
    setTranscript("");
    setAnswer("");
    setListening(true);
    recognitionRef.current?.start();
  }

  return (
    <SheetShell title="שאל את הבית" onClose={onClose}>
      {!supported && (
        <div className="text-muted text-xs mb-3">
          זיהוי דיבור לא נתמך בדפדפן הזה (זמין בעיקר ב-Chrome) — אפשר להקליד את השאלה:
        </div>
      )}

      {supported && (
        <div className="flex flex-col items-center gap-3 py-4 mb-3">
          <button
            onClick={startListening}
            disabled={listening || busy}
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              listening ? "bg-terracotta animate-pulse" : "bg-ink"
            }`}
          >
            <Mic size={30} color="#FBF7F2" strokeWidth={2} />
          </button>
          <div className="text-mutedDark text-sm font-semibold">
            {listening ? "מקשיב…" : "לחץ ושאל, למשל \"יש לי ביצים?\""}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="או הקלד שאלה כאן"
          className="flex-1 bg-white rounded-xl px-4 py-3 text-ink outline-none"
          onKeyDown={(e) => e.key === "Enter" && ask(typed)}
        />
        <button
          onClick={() => ask(typed)}
          className="bg-ink text-cream px-4 rounded-xl font-display font-bold text-sm"
        >
          שלח
        </button>
      </div>

      {transcript && <div className="text-xs text-muted mb-2">שאלת: {transcript}</div>}

      {busy && <div className="text-mutedDark text-sm">חושב…</div>}

      {answer && (
        <div className="bg-white rounded-xl2 p-4">
          <div className="text-ink text-sm font-medium leading-relaxed">{answer}</div>
        </div>
      )}
    </SheetShell>
  );
}
