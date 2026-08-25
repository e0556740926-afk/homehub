import { X } from "lucide-react";

export default function PhotoViewer({ url, title, onClose }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" dir="rtl" onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-4 flex-none" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X size={18} color="#FBF7F2" strokeWidth={2} />
        </button>
        {title && <div className="text-cream font-display font-bold text-sm">{title}</div>}
        <div className="w-9" />
      </div>
      <div className="flex-1 flex items-center justify-center overflow-auto px-2 pb-4">
        <img src={url} alt={title || "קבלה"} className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}
