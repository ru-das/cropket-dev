// CLAUDE.md §6 "Locales": en, hi, mr must have exactly the same keys, and
// no value should be an empty placeholder. Also checks the endonyms
// (lang.en/hi/mr, lang.short.*) are identical across files - they must
// never get "translated" into the target language.
import { describe, expect, it } from "vitest";
import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import mr from "@/locales/mr.json";

type Json = { [key: string]: string | Json };

function flattenKeys(obj: Json, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [path] : flattenKeys(value, path);
  });
}

function flattenValues(obj: Json, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === "string"
        ? [[path, value]]
        : Object.entries(flattenValues(value, path));
    }),
  );
}

const locales = { en, hi, mr } as Record<string, Json>;

describe("locales", () => {
  it("have exactly the same keys in en, hi and mr", () => {
    const enKeys = new Set(flattenKeys(en));
    for (const [name, locale] of Object.entries(locales)) {
      if (name === "en") continue;
      const keys = new Set(flattenKeys(locale));
      const missing = [...enKeys].filter((k) => !keys.has(k));
      const extra = [...keys].filter((k) => !enKeys.has(k));
      expect(missing, `${name}.json is missing keys`).toEqual([]);
      expect(extra, `${name}.json has extra keys not in en.json`).toEqual([]);
    }
  });

  it("has no empty or whitespace-only values", () => {
    for (const [name, locale] of Object.entries(locales)) {
      const values = flattenValues(locale);
      const blank = Object.entries(values)
        .filter(([, v]) => v.trim() === "")
        .map(([k]) => k);
      expect(blank, `${name}.json has blank values`).toEqual([]);
    }
  });

  it("keeps language endonyms identical across en, hi and mr", () => {
    const enValues = flattenValues(en);
    const endonymKeys = Object.keys(enValues).filter(
      (k) => k.startsWith("lang.short.") || ["lang.en", "lang.hi", "lang.mr"].includes(k),
    );
    expect(endonymKeys.length).toBeGreaterThan(0);
    for (const [name, locale] of Object.entries(locales)) {
      const values = flattenValues(locale);
      for (const key of endonymKeys) {
        expect(values[key], `${name}.json ${key}`).toBe(enValues[key]);
      }
    }
  });
});
