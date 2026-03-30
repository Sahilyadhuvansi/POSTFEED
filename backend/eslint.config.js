const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
    rules: {
      "no-console": "error",
      "no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "eqeqeq": ["error", "always"],
      "no-process-exit": "off",
      "strict": ["error", "global"],
    },
  },
  {
    ignores: ["node_modules/", "dist/", "scripts/"],
  },
];
