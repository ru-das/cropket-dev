// SPEC.md §5.9 "only one sound plays at a time" + the confirmed voice-fallback
// rule: mr borrows a hi voice (same script), but a Devanagari language never
// borrows an en voice. speechSynthesis doesn't exist in Vitest's node
// environment, so a minimal fake stands in via vi.stubGlobal.
import { afterEach, describe, expect, it, vi } from "vitest";
import { pickVoice, speak } from "@/lib/voice/speak";

function makeVoice(lang: string): SpeechSynthesisVoice {
  return {
    lang,
    name: lang,
    default: false,
    localService: true,
    voiceURI: lang,
  } as SpeechSynthesisVoice;
}

class FakeUtterance {
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  voice: SpeechSynthesisVoice | null = null;
  lang = "";
  text: string;
  constructor(text: string) {
    this.text = text;
  }
}

function makeFakeSynth(voices: SpeechSynthesisVoice[]) {
  const utterances: FakeUtterance[] = [];
  let cancelCount = 0;
  return {
    getVoices: () => voices,
    speak: (u: FakeUtterance) => utterances.push(u),
    cancel: () => cancelCount++,
    addEventListener: () => {},
    utterances,
    get cancelCount() {
      return cancelCount;
    },
  };
}

// Lets the microtask queue drain so the async speak() body runs past its
// `await getVoices()` before the test inspects what it did.
const flush = () => Promise.resolve().then(() => Promise.resolve());

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pickVoice", () => {
  it("picks the exact-language voice when one exists", () => {
    const voices = [makeVoice("en-US"), makeVoice("mr-IN")];
    expect(pickVoice(voices, "mr")?.lang).toBe("mr-IN");
  });

  it("falls back to a Hindi voice for Marathi when no Marathi voice exists", () => {
    const voices = [makeVoice("en-US"), makeVoice("hi-IN")];
    expect(pickVoice(voices, "mr")?.lang).toBe("hi-IN");
  });

  it("never falls back to an English voice for Marathi or Hindi", () => {
    const voices = [makeVoice("en-US"), makeVoice("en-GB")];
    expect(pickVoice(voices, "mr")).toBeUndefined();
    expect(pickVoice(voices, "hi")).toBeUndefined();
  });
});

describe("speak", () => {
  it("speaks nothing and resolves false when no usable voice exists", async () => {
    const synth = makeFakeSynth([makeVoice("en-US")]);
    vi.stubGlobal("window", { speechSynthesis: synth });
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);

    const spoke = await speak({ text: "मराठी मजकूर", lang: "mr" });

    expect(spoke).toBe(false);
    expect(synth.utterances).toHaveLength(0);
  });

  it("cancels any speech already in progress before starting the next one", async () => {
    const synth = makeFakeSynth([makeVoice("hi-IN")]);
    vi.stubGlobal("window", { speechSynthesis: synth });
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);

    const first = speak({ text: "one", lang: "hi" });
    await flush();
    synth.utterances[0].onend?.();
    await first;
    expect(synth.cancelCount).toBe(1);

    const second = speak({ text: "two", lang: "hi" });
    await flush();
    expect(synth.cancelCount).toBe(2); // starting a new utterance cancelled the old one
    synth.utterances[1].onend?.();
    await second;
  });
});
