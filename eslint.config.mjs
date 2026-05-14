import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Disable newer react-hooks rules that flag pre-existing patterns
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      // Allow explicit any in test files and specific internal files
      "@typescript-eslint/no-explicit-any": "off",
      // Allow require() in .js config files
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
