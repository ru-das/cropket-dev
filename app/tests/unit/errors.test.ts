// toAppError (CLAUDE.md §5 "In the app") - proves a raw fetch/PostgREST
// failure becomes NETWORK_ERROR (so the outbox retries it, see
// offline/outbox.test.ts's isRetryable), not a generic UNKNOWN.
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError, toAppError } from "@/lib/errors";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("toAppError", () => {
  it("passes an existing AppError through unchanged", () => {
    const err = new AppError("FORBIDDEN");
    expect(toAppError(err)).toBe(err);
  });

  it("is NETWORK_ERROR when the browser reports offline", () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(toAppError(new Error("boom")).code).toBe("NETWORK_ERROR");
  });

  it("is NETWORK_ERROR for a fetch failure even while online (a blocked CORS pre-flight)", () => {
    vi.stubGlobal("navigator", { onLine: true });
    expect(toAppError(new TypeError("Failed to fetch")).code).toBe("NETWORK_ERROR");
  });

  it("matches a PostgrestError too - a plain object, not an Error instance", () => {
    vi.stubGlobal("navigator", { onLine: true });
    expect(toAppError({ message: "TypeError: Failed to fetch" }).code).toBe("NETWORK_ERROR");
  });

  it("is UNKNOWN for an unrelated error while online", () => {
    vi.stubGlobal("navigator", { onLine: true });
    expect(toAppError(new Error("column does not exist")).code).toBe("UNKNOWN");
  });
});
