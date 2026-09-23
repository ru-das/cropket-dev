// Runs once before core-flow.spec.ts (playwright.config.ts's globalSetup).
// Gets the two e2e test accounts (farmer 9090910010, buyer 9090920001) into
// a known, ready state - same "make the demo people exist" shape
// scripts/demo-reset.ts already uses (Admin API for the auth user, then a
// plain SQL file for everything else), scoped down to these two people
// instead of all 18 demo ones. Safe to run before every test - both steps
// are upserts (accounts.sql), and the Admin API call is a no-op once the
// farmer's auth user already exists.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`🔑 ${name} is missing. Run in your terminal: bash ../scripts/set-key.sh ${name}`);
    process.exit(1);
  }
  return value;
}

async function ensureFarmerAuthUser(supabaseUrl: string, serviceRoleKey: string): Promise<void> {
  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ phone: "9090910010", phone_confirm: true }),
  });
  if (res.ok) return;

  const body = (await res.json().catch(() => ({}))) as { msg?: string; error_code?: string };
  const alreadyExists = body.error_code === "phone_exists" || body.msg?.includes("already been registered");
  if (!alreadyExists) {
    throw new Error(`Could not create the e2e farmer auth user (${JSON.stringify(body)}).`);
  }
}

export default async function globalSetup(): Promise<void> {
  // scripts/.env is not loaded by the shell that runs `pnpm test:e2e` -
  // load it the same way scripts/demo-reset.ts's caller does
  // (`node --env-file=scripts/.env`), but from here since Playwright always
  // runs `pnpm dev`/`pnpm test:e2e` itself, not through that wrapper.
  process.loadEnvFile(path.join(dirname, "../../../scripts/.env"));

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  requireEnv("SUPABASE_DB_URL"); // read by psql itself, via -v below

  console.log("e2e: making sure the farmer test account exists…");
  await ensureFarmerAuthUser(supabaseUrl, serviceRoleKey);

  console.log("e2e: setting up farmer + buyer profiles (accounts.sql)…");
  const dbUrl = process.env.SUPABASE_DB_URL as string;
  execFileSync(
    "psql",
    [dbUrl, "-X", "-1", "-v", "ON_ERROR_STOP=1", "-f", path.join(dirname, "accounts.sql")],
    { stdio: "inherit" },
  );
}
