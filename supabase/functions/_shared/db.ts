// The service-role Supabase client (CLAUDE.md §3: "used only inside
// functions. Never import it in the app"). Bypasses RLS entirely, so every
// query made with this client must check its own authorization by hand
// (requireRole, ownership checks) - RLS isn't there to catch a mistake here.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";
import { requireEnv } from "./env.ts";

export const db = createClient<Database>(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
);
