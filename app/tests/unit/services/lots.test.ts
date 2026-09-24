// listMyLots (SPEC.md §5.6, §5.8) - regression test for the 2026-09-24 bug
// where "My Lots" showed every farmer's listed lots on every account. RLS
// alone isn't enough to scope "my own rows" (a buyer-marketplace read policy
// on `lots` lets any signed-in user read a listed lot), so the query must
// filter by farmer_id itself - this locks that filter in.
import { describe, expect, it, vi, beforeEach } from "vitest";

const { getUser, from, eq } = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  eq: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { getUser }, from },
}));

import { listMyLots } from "@/services/lots";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function makeLotsQuery(result: { data: unknown[] | null; error: null }) {
  const query: { select: ReturnType<typeof vi.fn>; eq: typeof eq; order: ReturnType<typeof vi.fn> } = {
    select: vi.fn(() => query),
    eq,
    order: vi.fn(() => Promise.resolve(result)),
  };
  eq.mockReturnValue(query);
  return query;
}

beforeEach(() => {
  getUser.mockReset();
  from.mockReset();
  eq.mockReset();
});

describe("listMyLots", () => {
  it("filters by the signed-in farmer's own id, not just RLS", async () => {
    getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
    from.mockReturnValue(makeLotsQuery({ data: [], error: null }));

    await listMyLots();

    expect(from).toHaveBeenCalledWith("lots");
    expect(eq).toHaveBeenCalledWith("farmer_id", USER_ID);
  });

  it("throws NOT_SIGNED_IN and never queries lots when there is no session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(listMyLots()).rejects.toThrow();
    expect(from).not.toHaveBeenCalled();
  });
});
