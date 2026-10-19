import js from "@eslint/js";
import globals from "globals";
import next from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["public/**/*.js"], languageOptions: { globals: globals.browser } },
  { files: ["scripts/**/*.mjs"], languageOptions: { globals: globals.node } },
  { plugins: { "@next/next": next }, rules: next.configs.recommended.rules },
  { rules: { "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], "no-control-regex": "off" } },
];
