import eslintJs from "@eslint/js";
import hooksPlugin from "eslint-plugin-react-hooks";
import reactJsxRuntime from "eslint-plugin-react/configs/jsx-runtime.js";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Global ignores
  {
    ignores: ["dist/**", "node_modules/**"],
  },

  // Base JS rules
  eslintJs.configs.recommended,

  // Base TS rules (lenient, non type-aware)
  ...tseslint.configs.recommended,

  // React rules
  {
    files: ["**/*.{ts,tsx}"],
    ...reactRecommended,
    ...reactJsxRuntime,
    languageOptions: {
      ...reactRecommended.languageOptions,
      globals: {
        ...globals.browser, // Add browser globals
      },
    },
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
    },
  },

  // React Hooks rules
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": hooksPlugin,
    },
    rules: hooksPlugin.configs.recommended.rules,
  },

  // No a11y or heavy stylistic plugin rules
  {
    files: ["**/*.{ts,tsx}"],
    rules: {},
  },

  // Project-wide lenient rules
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {},
    },
    rules: {
      // Keep it basic and lenient so the code can run
      "no-console": "off",
      "no-debugger": "off",
      "no-unused-vars": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      // React specific
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
  },

  // Disable type-aware linting for JS files (like config files)
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  }
);
