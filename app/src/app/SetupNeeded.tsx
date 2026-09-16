// Shown instead of the app when a required VITE_* value is missing or
// invalid (see lib/config.ts). Lives outside src/routes/ on purpose: it
// must render before i18n exists (milestone 0.3) and before the router
// does, so it cannot use t() - CLAUDE.md's "no hard-coded text" lint rule
// is scoped to src/components and src/routes and does not apply here.
type Props = {
  missing: string[];
};

export default function SetupNeeded({ missing }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-field p-4">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6">
        <h1 className="font-display text-title text-leaf-dark">Setup needed</h1>
        <p className="mt-2 text-body text-ink">
          This app is not configured yet. Add these to <code>app/.env</code>:
        </p>
        {import.meta.env.DEV && missing.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-body text-ink">
            {missing.map((name) => (
              <li key={name}>
                <code>{name}</code>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-meta text-ink-muted">
          Run <code>bash scripts/set-key.sh</code> in your terminal, then reload this page.
        </p>
      </div>
    </div>
  );
}
