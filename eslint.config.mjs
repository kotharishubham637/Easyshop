import js from "@eslint/js";
import globals from "globals";

export default [
  // Ignore folders that don't need linting
  {
    ignores: ["node_modules/**"],
  },

  // Base recommended JavaScript rules
  js.configs.recommended,

  // Backend Node.js + CommonJS configuration (src/)
  {
    files: ["src/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow unused 'next' in Express error middleware: (err, req, res, next)
      "no-unused-vars": ["error", { argsIgnorePattern: "^next$" }],
    },
  },

  // Frontend Browser configuration (public/)
  {
    files: ["public/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: {
        ...globals.browser,
      },
    },
  },
];

