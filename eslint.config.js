const next = require("eslint-config-next")

module.exports = [
  { ignores: [".next/**", "coverage/**", "node_modules/**", "next-env.d.ts"] },
  ...next,
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
