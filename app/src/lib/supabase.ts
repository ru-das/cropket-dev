// The one Supabase client (CLAUDE.md §3 "Pages never import lib/supabase.ts.
// Only services/* and offline/* do."). Session is persisted to localStorage
// by default, which is what lets the app open logged-in while offline
// (SPEC.md §9.2 Phase 0 "Done when").
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { config } from "./config";

export const supabase = createClient<Database>(config.supabaseUrl, config.supabasePublishableKey);
