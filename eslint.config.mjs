import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * Flat config (ESLint 9). `next/core-web-vitals` carries the React and
 * accessibility rules plus Next's own checks; `next/typescript` layers on
 * typescript-eslint. Both still ship as eslintrc-style configs, hence
 * FlatCompat.
 */
const eslintConfig = [
  {
    // Build output and Next's generated ambient types are not ours to lint.
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
