// The only file that reads import.meta.env (CLAUDE.md §4). Every other file
// imports `config` from here instead. Checks values with zod so a missing
// or broken key shows the "Setup needed" screen (CLAUDE.md §5) instead of a
// white page or a crash somewhere deep in the app.
import { z } from "zod";

// An empty string in .env ("VITE_FOO=") must count as missing, not as "".
function emptyToUndefined(v: unknown) {
  return v === "" ? undefined : v;
}
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url()),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.preprocess(emptyToUndefined, z.string().min(1)),
  VITE_APP_URL: optionalString,
  VITE_MAPTILER_KEY: optionalString,
  VITE_DEFAULT_LANG: z.preprocess(emptyToUndefined, z.enum(["en", "hi", "mr"]).optional()).default("mr"),
  VITE_DEMO_MODE: z.preprocess(emptyToUndefined, z.stringbool().optional()).default(false),
});

export type Config = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  appUrl: string | undefined;
  maptilerKey: string | undefined;
  defaultLang: "en" | "hi" | "mr";
  demoMode: boolean;
  /** Missing or invalid VITE_ names. Non-empty means show <SetupNeeded/>. */
  setupErrors: string[];
};

// Pure function (no import.meta) so it can be unit tested with plain
// objects - see tests/unit/config.test.ts.
export function readConfig(env: Record<string, string | undefined>): Config {
  const result = EnvSchema.safeParse(env);

  if (!result.success) {
    const setupErrors = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    return {
      // Placeholder values: never read when setupErrors is non-empty,
      // because main.tsx renders <SetupNeeded/> instead of <App/>.
      supabaseUrl: "",
      supabasePublishableKey: "",
      appUrl: undefined,
      maptilerKey: undefined,
      defaultLang: "mr",
      demoMode: false,
      setupErrors,
    };
  }

  const env_ = result.data;
  return {
    supabaseUrl: env_.VITE_SUPABASE_URL,
    supabasePublishableKey: env_.VITE_SUPABASE_PUBLISHABLE_KEY,
    appUrl: env_.VITE_APP_URL,
    maptilerKey: env_.VITE_MAPTILER_KEY,
    defaultLang: env_.VITE_DEFAULT_LANG,
    demoMode: env_.VITE_DEMO_MODE,
    setupErrors: [],
  };
}

export const config = readConfig(import.meta.env);
