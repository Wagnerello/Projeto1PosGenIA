// Fast lint tier. Everything here runs without type information, which is
// what keeps it quick enough for a pre-commit hook. The rules that need the
// type checker live in eslint.typed.config.mjs and run on their own script.
//
// Adapt before use:
//   - the paths in the import-x zones and in quality/no-direct-data-access
//   - the framework blocks, commented out below
//   - the globalIgnores list
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importX from "eslint-plugin-import-x";
import tseslint from "typescript-eslint";

import quality from "./eslint-rules/index.cjs";

export default defineConfig([
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
      // js.configs.recommended turns on no-undef, which knows nothing about
      // the runtime this project targets -- without this, every console or
      // process reference is reported as an undefined variable. Declare what
      // the code actually uses. When the list outgrows a handful, install the
      // `globals` package and spread globals.node or globals.browser instead.
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        window: "readonly",
        document: "readonly",
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.strict,

  // Framework presets. Uncomment only what this project actually uses, and
  // add the matching import at the top of the file. Turning on a preset
  // wholesale is the opposite of what the rest of this config does -- prefer
  // a curated subset per plugin, added as its own files-scoped block below.
  //
  //   nextPlugin.configs["core-web-vitals"],
  //   reactPlugin.configs.flat["jsx-runtime"],
  //   reactHooks.configs.flat.recommended,

  {
    // import-x resolves TypeScript path aliases so no-unresolved is accurate.
    // The two no-restricted-paths entries are the architecture boundary: the
    // first plugin key carries what must never regress, the second carries
    // the debt that already exists.
    plugins: { "import-x": importX, "import-x-debt": importX },
    settings: {
      "import-x/resolver-next": [createTypeScriptImportResolver()],
    },
    rules: {
      "import-x/no-unresolved": "error",
      "import-x/no-duplicates": "error",
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            // Scope `from` as narrowly as the boundary actually needs.
            { target: ["./src/views/**/*", "./src/components/**/*"], from: "./src/lib/firebase.ts" },
            { target: ["./src/views/**/*", "./src/components/**/*"], from: "./src/lib/firestore.ts" },
          ],
        },
      ],
      // The same package, registered a second time under a different plugin
      // key. Flat config cannot mix severities inside one rule's `zones`
      // array, and two blocks matching the same files replace each other
      // rather than merging their zones -- so an aliased key is the only way
      // to run "error" zones and "warn" zones side by side. Put pre-existing
      // boundary debt here, fix it, then promote the zone into the block
      // above and delete it from this one.
      "import-x-debt/no-restricted-paths": [
        "warn",
        {
          zones: [
            // Nenhuma dívida pré-existente conhecida para este limite
            {
              target: "./src/views/**/*",
              from: ["./src/inexistente/**/*"],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    plugins: { quality },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-var": "error",
      "prefer-const": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // The size and complexity budget is all "warn" on purpose. These
      // numbers are a conversation starter about factoring, not a gate --
      // promote one to "error" once the count for it reaches zero.
      complexity: ["warn", 12],
      "max-depth": ["warn", 4],
      "max-statements": ["warn", 20],
      "max-params": ["warn", 4],
      "max-lines-per-function": [
        "warn",
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
      "max-nested-callbacks": ["warn", 3],
      // quality/max-lines: 12 arquivos legados acima do teto de 350
      "quality/max-lines": ["error", { max: 350 }],
      // quality/no-direct-console: Baseline de 50 violações
      "quality/no-direct-console": [
        "warn",
        { logger: "the project logging helper (when created)" },
      ],
      // quality/no-direct-data-access: Baseline de 4 violações
      "quality/no-direct-data-access": [
        "warn",
        {
          modules: ["@/lib/firebase", "@/lib/firestore", "../lib/firebase", "firebase/firestore"],
          bindings: ["db", "getDocs", "getDoc", "setDoc", "addDoc", "updateDoc", "deleteDoc"],
          layers: ["/src/views/", "/src/components/"],
          extensions: [".tsx"],
        },
      ],
    },
  },
  // No central log adapter configured yet.
  {
    // The same file budget for test files, at "warn". Also placed after the
    // "error" block for the same ordering reason. Two glob branches, because
    // a file counts as a test either by suffix or by directory -- and the
    // suffix branch alone misses test-support files that live in __tests__/
    // without being *.test.ts themselves.
    files: [
      "**/*.test.{ts,tsx}",
      "**/{__tests__,__mocks__,fixtures,mocks}/**/*.{ts,tsx}",
    ],
    plugins: { quality },
    rules: {
      "quality/max-lines": ["warn", { includeTests: true }],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      // These three fire heavily on describe/it nesting and on long arrange
      // sections without pointing at a real problem. complexity, max-depth
      // and max-params stay on for tests -- they were not part of the noise.
      "max-statements": "off",
      "max-lines-per-function": "off",
      "max-nested-callbacks": "off",
      // no-restricted-paths has no concept of a test file the way the
      // quality/* rules do, and fixtures legitimately import schema objects
      // directly.
      "import-x/no-restricted-paths": "off",
      "import-x-debt/no-restricted-paths": "off",
    },
  },
  {
    files: ["eslint-rules/**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { module: "readonly", require: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    // Agent harness files, vendored automation and standalone tooling are not
    // the application this config polices. Without these, Node-runtime
    // scripts that never declared Node globals drown real findings in
    // no-undef noise.
    ".claude/**",
    ".gemini/**",
    ".agents/**",
    ".github/agents/**",
    ".github/hooks/**",
    ".github/skills/**",
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "**/*.tsbuildinfo",
    "package-lock.json",
  ]),
]);
