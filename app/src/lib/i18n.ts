// The only file that sets up i18next (CLAUDE.md §4 "reading keys and
// settings" pattern - one file owns one job). Imported once for its side
// effect from main.tsx. Translations are bundled (not fetched), so they
// work offline - SPEC.md §1.3.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import hi from "../locales/hi.json";
import mr from "../locales/mr.json";
import { config } from "./config";

export type Lang = "en" | "hi" | "mr";

const STORAGE_KEY = "cropket.lang";

function isLang(value: unknown): value is Lang {
  return value === "en" || value === "hi" || value === "mr";
}

// localStorage can throw (locked-down WebView, private mode) - a language
// preference is never worth crashing the app over.
function readStoredLang(): Lang | undefined {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLang(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function writeStoredLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore - see readStoredLang
  }
}

const startLang = readStoredLang() ?? config.defaultLang;

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
    },
    lng: startLang,
    fallbackLng: "en",
    interpolation: { escapeValue: false }, // React already escapes
  });

document.documentElement.lang = startLang;

/** Changes the active language, keeping the current page (SPEC.md §5.1 LanguageSwitch). */
export function setLang(lang: Lang) {
  void i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
  writeStoredLang(lang);
}

export default i18n;
