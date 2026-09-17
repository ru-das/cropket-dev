// SPEC.md §2.4 Net-₹ formula. Edge cases: zero, a loss-making sale (never
// clamped - CLAUDE.md §6 formulas edge cases).
import { describe, expect, it } from "vitest";
import { CROPKET_CHARGES, MANDI_CHARGES, netRupee } from "@shared/netRupee.ts";

describe("netRupee", () => {
  it("the parts sum exactly to youKeep, to the paisa", () => {
    const result = netRupee({
      pricePerQuintalPaise: 185000,
      quantityKg: 500,
      routeKm: 12,
      ratePerKmPaise: 1500,
      charges: MANDI_CHARGES,
      transitLossPct: 2,
    });
    expect(result.grossPaise - result.transportPaise - result.feesPaise - result.lossPaise).toBe(
      result.youKeepPaise,
    );
  });

  it("Cropket charges nothing - fees are zero", () => {
    const result = netRupee({
      pricePerQuintalPaise: 185000,
      quantityKg: 500,
      routeKm: 5,
      ratePerKmPaise: 1500,
      charges: CROPKET_CHARGES,
      transitLossPct: 2,
    });
    expect(result.feesPaise).toBe(0);
  });

  it("zero quantity zeroes gross, fees and loss (transport still costs - it depends on the route, not the load)", () => {
    const result = netRupee({
      pricePerQuintalPaise: 185000,
      quantityKg: 0,
      routeKm: 10,
      ratePerKmPaise: 1500,
      charges: MANDI_CHARGES,
      transitLossPct: 2,
    });
    expect(result.grossPaise).toBe(0);
    expect(result.feesPaise).toBe(0);
    expect(result.lossPaise).toBe(0);
    expect(result.transportPaise).toBe(15000);
    expect(result.youKeepPaise).toBe(-15000);
  });

  it("zero quantity and zero route distance gives all zeros", () => {
    const result = netRupee({
      pricePerQuintalPaise: 185000,
      quantityKg: 0,
      routeKm: 0,
      ratePerKmPaise: 1500,
      charges: MANDI_CHARGES,
      transitLossPct: 2,
    });
    expect(result).toEqual({
      grossPaise: 0,
      transportPaise: 0,
      feesPaise: 0,
      lossPaise: 0,
      youKeepPaise: 0,
    });
  });

  it("a tiny lot sent far can lose money - youKeep is not clamped at zero", () => {
    const result = netRupee({
      pricePerQuintalPaise: 185000, // ₹1,850/quintal
      quantityKg: 5, // a tiny lot: gross = ₹92.50
      routeKm: 200, // far away
      ratePerKmPaise: 1500, // ₹15/km
      charges: MANDI_CHARGES,
      transitLossPct: 2,
    });
    expect(result.transportPaise).toBe(300000); // ₹3,000, far more than the gross
    expect(result.youKeepPaise).toBeLessThan(0);
  });

  it("a flat-only charge depends on quantity, not price", () => {
    const charges = { commissionPct: 0, flatPaisePerQuintal: 1200 };
    const cheap = netRupee({
      pricePerQuintalPaise: 100000,
      quantityKg: 500,
      routeKm: 0,
      ratePerKmPaise: 0,
      charges,
      transitLossPct: 0,
    });
    const expensive = netRupee({
      pricePerQuintalPaise: 300000, // 3x the price, same quantity
      quantityKg: 500,
      routeKm: 0,
      ratePerKmPaise: 0,
      charges,
      transitLossPct: 0,
    });
    expect(cheap.feesPaise).toBe(6000); // 1200 × 500/100
    expect(expensive.feesPaise).toBe(6000); // unchanged by price
  });

  it("a commission-only charge depends on price, not a flat per-quintal amount", () => {
    const charges = { commissionPct: 10, flatPaisePerQuintal: 0 };
    const result = netRupee({
      pricePerQuintalPaise: 100000,
      quantityKg: 1000,
      routeKm: 0,
      ratePerKmPaise: 0,
      charges,
      transitLossPct: 0,
    });
    expect(result.grossPaise).toBe(1000000);
    expect(result.feesPaise).toBe(100000); // 10% of gross
  });
});
