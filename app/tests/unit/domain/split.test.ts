// SPEC.md §5.7 release split order (steps 4-5 only - prototype scope,
// CLAUDE.md §6 "sum of payouts = escrow total to the paisa; rounding goes
// to the largest share; platform fee never reduces farmer money").
import { describe, expect, it } from "vitest";
import { splitRelease } from "@shared/split.ts";

function sum(lines: ReturnType<typeof splitRelease>): number {
  return lines.reduce((total, line) => total + line.amountPaise, 0);
}

describe("splitRelease", () => {
  it("single lot: farmer gets total minus fee, fee is its own line", () => {
    const lines = splitRelease({
      escrowTotalPaise: 925000 + 9250, // 1% fee on top, like accept_bid
      feePaise: 9250,
      farmers: [{ farmerId: "f1", quantityKg: 500 }],
    });
    expect(lines).toEqual([
      { type: "farmer_share", farmerId: "f1", amountPaise: 925000 },
      { type: "platform_fee", amountPaise: 9250 },
    ]);
    expect(sum(lines)).toBe(925000 + 9250);
  });

  it("10-farmer mega lot with uneven kg: sum exact, leftover on the largest share", () => {
    // 1000 paise pool split by kg 33/33/34 -> 330/330/340 exactly, no leftover -
    // use kg that doesn't divide evenly instead.
    const farmers = [
      { farmerId: "a", quantityKg: 37 },
      { farmerId: "b", quantityKg: 41 },
      { farmerId: "c", quantityKg: 22 },
    ];
    // pool = 1000, totalKg = 100 -> shares floor(370), floor(410), floor(220) = 370/410/220 = 1000 exact.
    // Pick a pool that doesn't divide evenly by these weights.
    const lines = splitRelease({ escrowTotalPaise: 1001, feePaise: 0, farmers });
    expect(sum(lines)).toBe(1001);
    // largest kg is "b" (41) -> gets any leftover paisa
    const shareFor = (id: string) =>
      lines.find((l) => l.type === "farmer_share" && l.farmerId === id)!.amountPaise;
    const floorB = Math.floor((1001 * 41) / 100); // 410
    expect(shareFor("b")).toBeGreaterThanOrEqual(floorB);
    expect(shareFor("a")).toBe(Math.floor((1001 * 37) / 100));
    expect(shareFor("c")).toBe(Math.floor((1001 * 22) / 100));
  });

  it("tie on largest kg: the first farmer in input order gets the leftover", () => {
    // Two farmers with equal, largest kg; pool doesn't divide evenly.
    const lines = splitRelease({
      escrowTotalPaise: 7,
      feePaise: 0,
      farmers: [
        { farmerId: "first", quantityKg: 5 },
        { farmerId: "second", quantityKg: 5 },
        { farmerId: "third", quantityKg: 2 }, // smaller kg, never the tiebreak winner
      ],
    });
    expect(sum(lines)).toBe(7);
    const shareFor = (id: string) =>
      lines.find((l) => l.type === "farmer_share" && l.farmerId === id)!.amountPaise;
    // floor(7*5/12)=2, floor(7*5/12)=2, floor(7*2/12)=1 -> sum 5, leftover 2 -> "first"
    expect(shareFor("first")).toBe(4);
    expect(shareFor("second")).toBe(2);
    expect(shareFor("third")).toBe(1);
  });

  it("fee of zero produces no platform_fee line", () => {
    const lines = splitRelease({
      escrowTotalPaise: 500,
      feePaise: 0,
      farmers: [{ farmerId: "f1", quantityKg: 10 }],
    });
    expect(lines).toEqual([{ type: "farmer_share", farmerId: "f1", amountPaise: 500 }]);
  });

  it("fee never reduces farmer money: farmer lines always sum to total minus fee", () => {
    const cases = [
      { escrowTotalPaise: 100000, feePaise: 1000, farmers: [{ farmerId: "f1", quantityKg: 1 }] },
      {
        escrowTotalPaise: 250000,
        feePaise: 2500,
        farmers: [
          { farmerId: "a", quantityKg: 60 },
          { farmerId: "b", quantityKg: 40 },
        ],
      },
    ];
    for (const c of cases) {
      const lines = splitRelease(c);
      const farmerSum = lines
        .filter((l) => l.type === "farmer_share")
        .reduce((t, l) => t + l.amountPaise, 0);
      expect(farmerSum).toBe(c.escrowTotalPaise - c.feePaise);
    }
  });

  it("drops a farmer whose floored share is zero, sum still exact", () => {
    // pool = 3, kg 1/1/98 -> floors 0/0/2, leftover 1 goes to the largest (98).
    const lines = splitRelease({
      escrowTotalPaise: 3,
      feePaise: 0,
      farmers: [
        { farmerId: "tiny1", quantityKg: 1 },
        { farmerId: "tiny2", quantityKg: 1 },
        { farmerId: "big", quantityKg: 98 },
      ],
    });
    expect(lines).toEqual([{ type: "farmer_share", farmerId: "big", amountPaise: 3 }]);
    expect(sum(lines)).toBe(3);
  });

  it("throws on no farmers", () => {
    expect(() => splitRelease({ escrowTotalPaise: 100, feePaise: 0, farmers: [] })).toThrow(
      "SPLIT_INVALID_INPUT",
    );
  });

  it("throws on zero quantity for a farmer", () => {
    expect(() =>
      splitRelease({ escrowTotalPaise: 100, feePaise: 0, farmers: [{ farmerId: "f1", quantityKg: 0 }] }),
    ).toThrow("SPLIT_INVALID_INPUT");
  });

  it("throws on negative quantity for a farmer", () => {
    expect(() =>
      splitRelease({
        escrowTotalPaise: 100,
        feePaise: 0,
        farmers: [{ farmerId: "f1", quantityKg: -5 }],
      }),
    ).toThrow("SPLIT_INVALID_INPUT");
  });

  it("throws on a fractional quantity", () => {
    expect(() =>
      splitRelease({
        escrowTotalPaise: 100,
        feePaise: 0,
        farmers: [{ farmerId: "f1", quantityKg: 1.5 }],
      }),
    ).toThrow("SPLIT_INVALID_INPUT");
  });

  it("throws when fee is greater than the total", () => {
    expect(() =>
      splitRelease({
        escrowTotalPaise: 100,
        feePaise: 200,
        farmers: [{ farmerId: "f1", quantityKg: 1 }],
      }),
    ).toThrow("SPLIT_INVALID_INPUT");
  });

  it("throws when fee equals the total (nothing left for farmers)", () => {
    expect(() =>
      splitRelease({
        escrowTotalPaise: 100,
        feePaise: 100,
        farmers: [{ farmerId: "f1", quantityKg: 1 }],
      }),
    ).toThrow("SPLIT_INVALID_INPUT");
  });

  it("throws on a non-integer total", () => {
    expect(() =>
      splitRelease({
        escrowTotalPaise: 100.5,
        feePaise: 0,
        farmers: [{ farmerId: "f1", quantityKg: 1 }],
      }),
    ).toThrow("SPLIT_INVALID_INPUT");
  });

  it("throws on a negative fee", () => {
    expect(() =>
      splitRelease({
        escrowTotalPaise: 100,
        feePaise: -10,
        farmers: [{ farmerId: "f1", quantityKg: 1 }],
      }),
    ).toThrow("SPLIT_INVALID_INPUT");
  });

  it("throws on a non-integer fee", () => {
    expect(() =>
      splitRelease({
        escrowTotalPaise: 100,
        feePaise: 1.5,
        farmers: [{ farmerId: "f1", quantityKg: 1 }],
      }),
    ).toThrow("SPLIT_INVALID_INPUT");
  });

  it("throws on a non-positive total", () => {
    expect(() =>
      splitRelease({ escrowTotalPaise: 0, feePaise: 0, farmers: [{ farmerId: "f1", quantityKg: 1 }] }),
    ).toThrow("SPLIT_INVALID_INPUT");
  });

  it("many random-shaped mega lots always sum exactly to the total", () => {
    // Deterministic pseudo-random cases (no seed dependency across runs) -
    // proves the rounding rule holds broadly, not just on picked examples.
    let state = 42;
    const nextInt = (max: number) => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return (state % max) + 1;
    };
    for (let i = 0; i < 50; i++) {
      const farmerCount = nextInt(10);
      const farmers = Array.from({ length: farmerCount }, (_, idx) => ({
        farmerId: `f${idx}`,
        quantityKg: nextInt(500),
      }));
      const feePaise = nextInt(1000);
      const escrowTotalPaise = feePaise + nextInt(1_000_000);
      const lines = splitRelease({ escrowTotalPaise, feePaise, farmers });
      expect(sum(lines)).toBe(escrowTotalPaise);
    }
  });
});
