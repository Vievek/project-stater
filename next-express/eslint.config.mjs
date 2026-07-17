import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import js from "@eslint/js";

export default [
  // Base JS config
  js.configs.recommended,

  // TypeScript config
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: [
          "./apps/backend/tsconfig.json",
          "./apps/frontend/tsconfig.json",
        ],
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      "max-lines-per-function": [
        "error",
        {
          max: 30,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "max-lines": [
        "error",
        {
          max: 200,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "max-depth": ["error", 3],
      "max-params": ["error", 4],
      complexity: ["error", 10],
      "no-magic-numbers": [
        "error",
        {
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          enforceConst: true,
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "SwitchStatement[cases.length>5]",
          message:
            "Long switch statement - Use polymorphism instead to follow Open/Closed Principle",
        },
        {
          selector: "IfStatement > IfStatement > IfStatement",
          message:
            "Deeply nested if statements - Use guard clauses or extract conditions",
        },
        {
          selector:
            "IfStatement:has(Alternate[type='IfStatement']):has(Alternate[type='IfStatement']):has(Alternate[type='IfStatement'])",
          message:
            "Long if-else-if chain (4+ levels) - Consider using polymorphism, lookup tables, or extract to separate validation/decision functions",
        },
        {
          selector: "ForStatement",
          message:
            "Avoid for loops - Use functional array methods like .map(), .filter(), .reduce()",
        },
        {
          selector: "ForInStatement",
          message:
            "Avoid for...in loops - Use Object.keys/values/entries with .forEach()",
        },
        {
          selector: "WhileStatement, DoWhileStatement",
          message:
            "Avoid while loops - Use functional array methods or recursion",
        },
      ],
      "no-duplicate-imports": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "max-classes-per-file": ["error", 1],
      "max-nested-callbacks": ["error", 2],
      "prefer-const": "error",
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "error",
      "no-throw-literal": "error",
      "prefer-promise-reject-errors": "error",
      "consistent-return": "error",
      "default-param-last": "error",
      "dot-notation": "error",
      eqeqeq: ["error", "always"],
      "prefer-arrow-callback": "error",
      "arrow-body-style": ["error", "as-needed"],
      "prefer-template": "error",
      "prefer-spread": "error",
      "prefer-rest-params": "error",
      "no-else-return": "error",
      "no-empty-function": ["error", { allow: ["arrowFunctions"] }],
      "no-underscore-dangle": "warn",
      "no-duplicate-case": "error",
      "no-var": "error",
      "prefer-destructuring": [
        "error",
        {
          array: true,
          object: true,
        },
      ],
      "no-multiple-empty-lines": ["error", { max: 2 }],
      "prefer-object-spread": "error",
      "no-return-assign": "error",
      "no-useless-concat": "error",
      "no-useless-return": "error",
    },
  },
  // Test file overrides
  {
    files: ["**/*.test.*", "**/*.spec.*", "**/test/**"],
    rules: {
      "max-lines-per-function": "off",
      "max-lines": "off",
      "max-params": ["warn", 6],
      "max-depth": ["warn", 4],
      "no-console": "off",
      "no-magic-numbers": "off",
      "max-classes-per-file": "off",
      "no-restricted-syntax": "off",
    },
  },
  // Config file overrides
  {
    files: ["*.config.*", ".*rc.*", "**/config/**", "**/scripts/**"],
    rules: {
      "no-console": "off",
      "no-magic-numbers": "off",
      "max-classes-per-file": "off",
      "no-restricted-syntax": "off",
    },
  },
  // Ignore patterns
  {
    ignores: [
      "node_modules/",
      "dist/",
      ".next/",
      "build/",
      "apps/backend/scripts/**",
      "docs/**",
      "README.md",
    ],
  },
];
