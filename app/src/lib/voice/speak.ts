// The only file that touches speechSynthesis (CLAUDE.md §4 "one file, one
// job"). SPEC.md §5.9 layer 3 (browser voice) - layer 3 is the only one in
// the prototype; layers 1 (bundled clips) and 2 (Bhashini `tts` function)
// are P1, out of scope (CLAUDE.md §9.5).
//
// Takes already-translated text so it stays plain TS (no React, no i18next
// import) and is easy to unit-test. VoiceButton does the t() call.
import type { Lang } from "@/lib/i18n";

export type SpeakInput = { text: string; lang: Lang };

// mr and hi share the Devanagari script, so a Hindi voice reading Marathi
// text is understandable - better than staying silent. en never borrows
// another language's voice (it would sound like gibberish).
const FALLBACK_LANG: Partial<Record<Lang, Lang>> = { mr: "hi" };

export function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: Lang,
): SpeechSynthesisVoice | undefined {
  const exact = voices.find((v) => v.lang.toLowerCase().startsWith(lang));
  if (exact) return exact;

  const fallback = FALLBACK_LANG[lang];
  return fallback ? voices.find((v) => v.lang.toLowerCase().startsWith(fallback)) : undefined;
}

// Chrome returns an empty list on the very first call and fires
// "voiceschanged" once the real list is ready. Some browsers never fire it
// (list was ready immediately), so this also resolves on a short timeout.
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const done = () => resolve(synth.getVoices());
    synth.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1000);
  });
}

/** Stops whatever is currently speaking. Safe to call when nothing is playing. */
export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

/**
 * Speaks `text` aloud. Resolves `true` once speech ends, `false` if no
 * usable voice was found (nothing was spoken). Only one utterance plays at a
 * time - starting a new one cancels whatever was playing.
 */
export async function speak({ text, lang }: SpeakInput): Promise<boolean> {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;

  const voice = pickVoice(await getVoices(), lang);
  if (!voice) return false;

  stopSpeaking();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(true); // cancel() fires "error" too - not a real failure
    window.speechSynthesis.speak(utterance);
  });
}
