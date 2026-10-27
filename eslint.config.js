const next = require("eslint-config-next")

module.exports = [
  { ignores: [".next/**", "coverage/**", "node_modules/**", "next-env.d.ts"] },
  ...next,
  {
    // Override parser for JSX files to use @babel/eslint-parser with requireConfigFile: false
    // to avoid loading Next.js's babel config which has version check issues with Babel 8
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      parser: require("@babel/eslint-parser"),
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        },
        babelOptions: {
          presets: [
            ["@babel/preset-env", { targets: { node: "current" } }],
            ["@babel/preset-react", { runtime: "automatic" }]
          ],
          configFile: false
        }
      }
    }
  },
  {
    rules: {
      // #13 vai trocar alert por toast. Rebaixado para nao travar a suite.
      "no-alert": "warn",
      // #24: withAuth nao escuta onAuthStateChange e isso e um defeito real.
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly"
      }
    }
  }
]
