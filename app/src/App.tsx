// Placeholder screen for the repo skeleton (milestone 0.1).
// It only proves Tailwind + shadcn's cn() helper work. Real screens
// (welcome, login, farmer home ...) replace this in later milestones.
import { cn } from "@/lib/utils";

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className={cn("rounded-lg border border-neutral-200 bg-white p-6 shadow-none")}>
        <h1 className="text-xl font-semibold text-neutral-900">Cropket</h1>
        <p className="mt-2 text-base text-neutral-600">Repo skeleton is working.</p>
      </div>
    </div>
  );
}
