import eslintJs from "@eslint/js";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import perfectionistPlugin from "eslint-plugin-perfectionist";
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

  // Base TS rules
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

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

  // JSX Accessibility rules
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "jsx-a11y": jsxA11yPlugin,
    },
    rules: jsxA11yPlugin.configs.recommended.rules,
  },

  // Perfectionist rules (for sorting imports, etc.) - Recommended config
  {
    plugins: {
      perfectionist: perfectionistPlugin,
    },
    rules: perfectionistPlugin.configs["recommended-natural"].rules,
  },

  // Project-specific TS rules configuration
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.node.json"], // Explicitly list relevant tsconfigs
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Add any specific rule overrides here if needed later
      // Example: turning off a specific strict rule if necessary
      // "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Disable type-aware linting for JS files (like config files)
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  }
);
