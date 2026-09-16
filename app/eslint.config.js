// ESLint flat config. `pnpm lint` runs this.
// Includes CLAUDE.md's "no hard-coded text" rule: components and routes must
// pull every user-facing string from t(), not write it inline.
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const noHardCodedText = [
  "error",
  {
    selector: "JSXText[value=/\\p{L}{2,}/u]",
    message: 'Use t("key") — no hard-coded text.',
  },
  {
    selector:
      "JSXAttribute[name.name=/^(placeholder|title|alt|aria-label)$/] > Literal[value=/\\p{L}{2,}/u]",
    message: 'Use t("key") — no hard-coded text.',
  },
];

export default tseslint.config([
  { ignores: ["dist", "coverage", "android"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactRefresh.configs.vite.rules,
    },
  },
  {
    // no hard-coded text: only enforced in components and routes (CLAUDE.md §4)
    files: ["src/components/**/*.tsx", "src/routes/**/*.tsx"],
    rules: {
      "no-restricted-syntax": noHardCodedText,
    },
  },
]);
