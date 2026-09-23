// Resets cropket-dev to the demo starting point (SPEC.md §8.6, §9.2 "5.1").
// Run by the user, only when asked (CLAUDE.md §2):
//   node --env-file=scripts/.env scripts/demo-reset.ts
// Plain Node, no packages - Node 22 runs .ts files natively, and this only
// needs fetch + psql, both already used elsewhere in scripts/.
//
// Two steps: (1) make sure the 18 demo `auth.users` rows exist - SQL can't
// create those itself, only the Admin API can; (2) run seed.sql then
// demo-data.sql, which do the rest (profiles, lots, bids, mega lot...).
// Both are safe to run again - demo-data.sql wipes-then-inserts, so a
// second reset after a practice run returns to the exact same state.
import { execFileSync } from "node:child_process";

// Must match the `demo_people` table at the top of supabase/demo-data.sql -
// that file writes everything else about these people, this script only
// has to get their auth.users row (id + phone) into existence first.
const DEMO_PEOPLE: { id: string; phone: string }[] = Array.from({ length: 18 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return { id: `30000001-0000-0000-0000-0000000000${n}`, phone: `9090950${n}` };
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`🔑 ${name} is missing. Run in your terminal: bash scripts/set-key.sh ${name}`);
    process.exit(1);
  }
  return value;
}

async function ensureAuthUser(supabaseUrl: string, serviceRoleKey: string, person: { id: string; phone: string }) {
  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ id: person.id, phone: person.phone, phone_confirm: true }),
  });
  if (res.ok) return;

  const body = await res.json().catch(() => ({}) as { msg?: string; error_code?: string; id?: string });
  const alreadyOurs =
    (body.error_code === "phone_exists" || body.msg?.includes("already been registered")) &&
    // Confirm it's *our* fixed id, not someone else's account on this phone.
    (await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/admin/users/${person.id}`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    }).then((r) => r.ok));

  if (!alreadyOurs) {
    throw new Error(
      `Could not create the demo auth user for ${person.phone} (${JSON.stringify(body)}). ` +
        `If that phone number is already used by a different account, delete it in the Supabase ` +
        `dashboard (Auth → Users) and run this again.`,
    );
  }
}

async function main() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  requireEnv("SUPABASE_DB_URL"); // read by psql itself, via -v below

  console.log("Creating/checking 18 demo auth users…");
  for (const person of DEMO_PEOPLE) {
    await ensureAuthUser(supabaseUrl, serviceRoleKey, person);
  }

  console.log("Running seed.sql + demo-data.sql (one transaction each, via psql -1)…");
  const dbUrl = process.env.SUPABASE_DB_URL as string;
  execFileSync("psql", [dbUrl, "-X", "-1", "-v", "ON_ERROR_STOP=1", "-f", "supabase/seed.sql"], {
    stdio: "inherit",
  });
  execFileSync("psql", [dbUrl, "-X", "-1", "-v", "ON_ERROR_STOP=1", "-f", "supabase/demo-data.sql"], {
    stdio: "inherit",
  });

  console.log(`
✅ Demo data ready. Test phone numbers (Supabase dashboard → Auth → Phone → test OTPs):
  9090950001 / 950001  farmer (Ramesh Patil)
  9090950013 / 950013  buyer  (Sharma Traders)
  9090950017 / 950017  fpo    (Nashik Farmer Producer Co)
  9090950018 / 950018  admin
`);

  // ponytail: uploaded files from a practice run (scan photos, consent
  // audio, delivery photos) stay in Storage as orphans - a reset only
  // clears database rows, not the crop-photos/consent-audio/delivery-photos
  // buckets. Harmless for a demo; clean up by hand via the Storage API if
  // the buckets grow large.
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
