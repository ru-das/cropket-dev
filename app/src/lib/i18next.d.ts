// Types t() from the shape of en.json, so a typo'd or missing key fails
// `pnpm typecheck` instead of silently rendering the raw key on screen.
import type en from "../locales/en.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
    };
  }
}
