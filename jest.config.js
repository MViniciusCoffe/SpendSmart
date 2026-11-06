module.exports = {
  projects: [
    {
      displayName: "unit",
      testEnvironment: "node",
      roots: ["<rootDir>/tests/unit", "<rootDir>/src/services", "<rootDir>/src"],
      testMatch: ["**/*.test.js"],
      transform: {
        "^.+\\.jsx?$": ["babel-jest", { configFile: "./jest.babel.config.js" }]
      },
      testTimeout: 10000,
      setupFiles: ["<rootDir>/tests/setupEnv.js"],
      moduleNameMapper: {
        "^@/tests/(.*)$": "<rootDir>/tests/$1",
        "^@/(.*)$": "<rootDir>/src/$1"
      }
    },
    {
      displayName: "integration-pgmem",
      testEnvironment: "node",
      roots: ["<rootDir>/tests/integration/postgres"],
      testMatch: ["**/*.test.js"],
      transform: {
        "^.+\\.jsx?$": ["babel-jest", { configFile: "./jest.babel.config.js" }]
      },
      setupFiles: ["<rootDir>/tests/setupEnv.js", "<rootDir>/tests/setup.js"],
      testTimeout: 30000,
      moduleNameMapper: {
        "^@/tests/(.*)$": "<rootDir>/tests/$1",
        "^@/(.*)$": "<rootDir>/src/$1"
      }
    },
    {
      displayName: "integration-supabase",
      testEnvironment: "node",
      roots: ["<rootDir>/tests/integration/supabase"],
      testMatch: ["**/*.test.js"],
      transform: {
        "^.+\\.jsx?$": ["babel-jest", { configFile: "./jest.babel.config.js" }]
      },
      setupFiles: ["<rootDir>/tests/setupEnv.js", "<rootDir>/tests/setup.js"],
      testTimeout: 60000,
      moduleNameMapper: {
        "^@/tests/(.*)$": "<rootDir>/tests/$1",
        "^@/(.*)$": "<rootDir>/src/$1"
      }
    },
    {
      displayName: "regression",
      testEnvironment: "node",
      roots: ["<rootDir>/tests/regression"],
      testMatch: ["**/*.test.js"],
      transform: {
        "^.+\\.jsx?$": ["babel-jest", { configFile: "./jest.babel.config.js" }]
      },
      testTimeout: 30000,
      moduleNameMapper: {
        "^@/tests/(.*)$": "<rootDir>/tests/$1",
        "^@/(.*)$": "<rootDir>/src/$1"
      }
    }
  ],
  // Opções de cobertura são globais: dentro de um project o Jest as ignora (estavam no "unit" e
  // nenhuma valia). O escopo é o mesmo do Sonar (sonar.sources=src/services); o front-end é medido
  // por fluxos E2E, não por linhas (docs/test-plan.md §2.1.2)
  collectCoverageFrom: ["src/services/**/*.js"],
  coverageReporters: ["text", "html", "json-summary", "lcov"],
  coverageDirectory: "coverage"
}
