// Reads `khata_entries` (SPEC.md §4.15, §5.6, §9.2 Phase 4 "4.4") - the
// only file that talks to Supabase for the farmer's Digital Khata (CLAUDE.md
// §3 "data access from the app goes through services/*"). Read-only: the
// only writer is `fund_escrow()` (4.3) and future 4.6/4.8 functions, never
// the app.
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { toAppError } from "@/lib/errors";
import { Crop } from "@shared/crops.ts";
import type { Database } from "@/lib/database.types";

type KhataRow = Database["public"]["Tables"]["khata_entries"]["Row"];
type KhataColour = Database["public"]["Enums"]["khata_colour"];

// The only title_key values written so far (4.3's `khata.moneyLocked`).
// 4.6/4.8 add their own here as they start writing 🔵/🟢 rows - an unknown
// key falls back to a generic line in KhataRow rather than crashing.
export const KHATA_TITLE_KEYS = ["khata.moneyLocked"] as const;
export type KhataTitleKey = (typeof KHATA_TITLE_KEYS)[number];

// `title_values` is stored as jsonb with no schema of its own (CLAUDE.md §4
// money tables don't have one) - every title key written so far needs the
// same two fields, so one lenient shape covers them all.
const TitleValues = z.object({
  crop: Crop.optional(),
  quantityKg: z.number().optional(),
});

export type KhataEntry = {
  id: string;
  dealId: string;
  amountPaise: number;
  colour: KhataColour;
  titleKey: KhataTitleKey | null;
  crop: Crop | null;
  quantityKg: number | null;
  createdAt: string;
};

function toKhataEntry(row: KhataRow): KhataEntry {
  const values = TitleValues.safeParse(row.title_values).data;
  const titleKey = (KHATA_TITLE_KEYS as readonly string[]).includes(row.title_key)
    ? (row.title_key as KhataTitleKey)
    : null;
  return {
    id: row.id,
    dealId: row.deal_id,
    amountPaise: row.amount_paise,
    colour: row.colour,
    titleKey,
    crop: values?.crop ?? null,
    quantityKg: values?.quantityKg ?? null,
    createdAt: row.created_at,
  };
}

export const khataKeys = {
  mine: () => ["khata", "mine"] as const,
};

// ponytail: no pagination - a pilot farmer has a handful of deals, not
// hundreds. Add a range()/cursor once a real Khata gets long enough to need
// one.
async function getMyKhata(): Promise<KhataEntry[]> {
  const { data, error } = await supabase
    .from("khata_entries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw toAppError(error);
  return (data ?? []).map(toKhataEntry);
}

/** All of the signed-in farmer's Khata entries, newest first (RLS
 * `khata_select_own` already limits this to their own rows). Persisted to
 * IndexedDB like every other farmer query (SPEC.md §5.8), so the Khata
 * screen reads the last saved copy offline for free. */
export function useMyKhata() {
  return useQuery({ queryKey: khataKeys.mine(), queryFn: getMyKhata });
}

export type KhataSummaryData = {
  rows: KhataEntry[];
  receivedThisMonthPaise: number;
  lockedPaise: number;
  inTransitCount: number;
};

const MONTH_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
});

/** "2026-09" for a date in Asia/Kolkata, regardless of the phone's own time
 * zone or locale - the app never uses phone-local time for money (CLAUDE.md
 * §4 "timers use server time"; this isn't a timer, but the same reasoning
 * applies to "this month"). */
function istMonthKey(iso: string): string {
  const parts = MONTH_KEY_FORMAT.formatToParts(new Date(iso));
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

/**
 * Collapses raw ledger rows into one row per deal (its latest entry) and
 * the summary numbers KhataSummary shows (SPEC.md §4.15). `khata_entries`
 * is append-only: a deal gets a 🟡 row at FUNDED (4.3), then later a 🔵 row
 * at IN_TRANSIT (4.6) and a 🟢 row at RELEASED (4.8) - showing every row
 * would double-count "money locked" for a deal that has already moved on.
 * Pure function, no Supabase/React, so it's the part khata.test.ts covers.
 */
export function summariseKhata(entries: KhataEntry[], now: Date = new Date()): KhataSummaryData {
  const latestByDeal = new Map<string, KhataEntry>();
  for (const entry of entries) {
    const existing = latestByDeal.get(entry.dealId);
    if (!existing || entry.createdAt > existing.createdAt) {
      latestByDeal.set(entry.dealId, entry);
    }
  }
  const rows = [...latestByDeal.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const lockedPaise = rows.filter((r) => r.colour === "yellow").reduce((sum, r) => sum + r.amountPaise, 0);
  const inTransitCount = rows.filter((r) => r.colour === "blue").length;

  const thisMonth = istMonthKey(now.toISOString());
  const receivedThisMonthPaise = entries
    .filter((r) => r.colour === "green" && istMonthKey(r.createdAt) === thisMonth)
    .reduce((sum, r) => sum + r.amountPaise, 0);

  return { rows, receivedThisMonthPaise, lockedPaise, inTransitCount };
}
