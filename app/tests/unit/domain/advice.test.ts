// SPEC.md §2.4 sell/hold advice v1. Must prove (CLAUDE.md §6): tomato never
// gets "hold" > 2 days, hold days never exceed max_hold_days.
import { describe, expect, it } from "vitest";
import { advise, type PriceDay } from "@shared/advice.ts";

const CROP_MAX_HOLD_DAYS = { onion: 30, potato: 45, tomato: 2 };

/** A 14-day history where the last 7 days average higher/lower than the
 * full window, and arrivals are falling/rising the same way. */
function historyWithSignal(direction: "up" | "down"): PriceDay[] {
  const early = direction === "up" ? 100 : 200;
  const recent = direction === "up" ? 200 : 100;
  const days: PriceDay[] = [];
  for (let i = 0; i < 14; i++) {
    const inLast7 = i >= 7;
    days.push({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      modalPricePaise: inLast7 ? recent : early,
      arrivalsTonnes: inLast7 ? (direction === "up" ? 5 : 10) : (direction === "up" ? 10 : 5),
    });
  }
  return days;
}

describe("advise", () => {
  it("returns null with fewer than 7 days of history", () => {
    const history: PriceDay[] = Array.from({ length: 6 }, (_, i) => ({
      date: `2026-01-0${i + 1}`,
      modalPricePaise: 100,
      arrivalsTonnes: 10,
    }));
    expect(advise({ history, rainMmNext3Days: [], maxHoldDays: 30 })).toBeNull();
  });

  it("onion (max 30 days) with all 3 up-signals holds for the 5-day cap", () => {
    const advice = advise({
      history: historyWithSignal("up"), // price rising + arrivals falling
      rainMmNext3Days: [5, 0, 0], // rain expected
      maxHoldDays: CROP_MAX_HOLD_DAYS.onion,
    });
    expect(advice).toEqual({
      action: "hold",
      holdDays: 5,
      reasons: expect.arrayContaining(["priceRising", "rainExpected", "arrivalsFalling"]),
    });
  });

  it("tomato (max 2 days) with all 3 up-signals holds 2 days, never 5", () => {
    const advice = advise({
      history: historyWithSignal("up"),
      rainMmNext3Days: [5, 0, 0],
      maxHoldDays: CROP_MAX_HOLD_DAYS.tomato,
    });
    expect(advice?.action).toBe("hold");
    expect(advice?.holdDays).toBe(2);
  });

  it("exactly 2 up-signals (no rain) still holds", () => {
    const advice = advise({
      history: historyWithSignal("up"), // priceRising + arrivalsFalling = 2
      rainMmNext3Days: [0, 0, 0],
      maxHoldDays: CROP_MAX_HOLD_DAYS.onion,
    });
    expect(advice?.action).toBe("hold");
  });

  it("only 1 up-signal sells now", () => {
    const advice = advise({
      history: historyWithSignal("up"), // priceRising + arrivalsFalling would be 2; flatten arrivals to drop one
      rainMmNext3Days: [0, 0, 0],
      maxHoldDays: CROP_MAX_HOLD_DAYS.onion,
    });
    // historyWithSignal("up") gives 2 up-signals with no rain (tested above
    // as a hold). To get exactly 1, use the down history with rain added.
    const oneSignal = advise({
      history: historyWithSignal("down"), // 0 up-signals from price/arrivals
      rainMmNext3Days: [5, 0, 0], // + 1 from rain = 1 total
      maxHoldDays: CROP_MAX_HOLD_DAYS.onion,
    });
    expect(oneSignal?.action).toBe("sell");
    expect(oneSignal?.holdDays).toBe(0);
    expect(advice?.action).toBe("hold"); // sanity check on the 2-signal case above
  });

  it("all down-signals sells now, with the opposing reasons", () => {
    const advice = advise({
      history: historyWithSignal("down"),
      rainMmNext3Days: [0, 0, 0],
      maxHoldDays: CROP_MAX_HOLD_DAYS.onion,
    });
    expect(advice).toEqual({
      action: "sell",
      holdDays: 0,
      reasons: expect.arrayContaining(["priceFalling", "noRain", "arrivalsRising"]),
    });
  });

  it("holdDays never exceeds maxHoldDays, across every crop and signal combination", () => {
    for (const maxHoldDays of Object.values(CROP_MAX_HOLD_DAYS)) {
      for (const direction of ["up", "down"] as const) {
        for (const rain of [
          [0, 0, 0],
          [5, 0, 0],
        ]) {
          const advice = advise({
            history: historyWithSignal(direction),
            rainMmNext3Days: rain,
            maxHoldDays,
          });
          expect(advice?.holdDays ?? 0).toBeLessThanOrEqual(maxHoldDays);
        }
      }
    }
  });

  it("a crop with maxHoldDays 0 never holds, even with all up-signals", () => {
    const advice = advise({
      history: historyWithSignal("up"),
      rainMmNext3Days: [5, 0, 0],
      maxHoldDays: 0,
    });
    expect(advice?.action).toBe("sell");
  });
});
