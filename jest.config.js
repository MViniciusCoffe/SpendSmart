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
      collectCoverageFrom: ["services/**/*.js", "src/**/*.js"],
      coverageDirectory: "coverage/unit",
      testTimeout: 10000,
      setupFiles: ["<rootDir>/tests/setupEnv.js"],
      moduleNameMapper: {
        "^@/components/(.*)$": "<rootDir>/src/components/$1",
        "^@/styles/(.*)$": "<rootDir>/src/styles/$1",
        "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
        "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
        "^@/services/(.*)$": "<rootDir>/src/services/$1",
        "^@/contexts/(.*)$": "<rootDir>/src/contexts/$1",
        "^@/utils/(.*)$": "<rootDir>/src/utils/$1",
        "^@/tests/helpers/(.*)$": "<rootDir>/tests/helpers/$1",
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
        "^@/components/(.*)$": "<rootDir>/src/components/$1",
        "^@/styles/(.*)$": "<rootDir>/src/styles/$1",
        "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
        "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
        "^@/services/(.*)$": "<rootDir>/src/services/$1",
        "^@/contexts/(.*)$": "<rootDir>/src/contexts/$1",
        "^@/utils/(.*)$": "<rootDir>/src/utils/$1",
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
        "^@/components/(.*)$": "<rootDir>/src/components/$1",
        "^@/styles/(.*)$": "<rootDir>/src/styles/$1",
        "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
        "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
        "^@/services/(.*)$": "<rootDir>/src/services/$1",
        "^@/contexts/(.*)$": "<rootDir>/src/contexts/$1",
        "^@/utils/(.*)$": "<rootDir>/src/utils/$1",
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
        "^@/components/(.*)$": "<rootDir>/src/components/$1",
        "^@/styles/(.*)$": "<rootDir>/src/styles/$1",
        "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
        "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
        "^@/services/(.*)$": "<rootDir>/src/services/$1",
        "^@/contexts/(.*)$": "<rootDir>/src/contexts/$1",
        "^@/utils/(.*)$": "<rootDir>/src/utils/$1",
        "^@/tests/(.*)$": "<rootDir>/tests/$1",
        "^@/(.*)$": "<rootDir>/src/$1"
      }
    }
  ],
  coverageReporters: ["text", "html", "json-summary", "lcov"],
  coverageDirectory: "coverage"
}
