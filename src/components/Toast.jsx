export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      className="toast-enter fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink text-cream text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 whitespace-nowrap"
      dir="rtl"
    >
      {message}
    </div>
  );
}
