// Placeholder screen (milestone 0.2): shows the design tokens and both
// bundled fonts working together. Replaced by the real Welcome screen in
// milestone 0.4 (app shell + routes).
export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-field p-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6">
        <p className="text-meta text-ink-muted">Today's onion price</p>
        <p className="font-display text-hero text-leaf-dark">₹1,850</p>
        <p className="mt-1 text-body text-ink">per quintal, Lasalgaon mandi</p>
        <button
          type="button"
          className="mt-6 h-14 w-full rounded-button bg-leaf text-body font-semibold text-white"
        >
          See today's advice
        </button>
      </div>
    </div>
  );
}
