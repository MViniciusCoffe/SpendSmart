module.exports = {
  projects: [
    {
      displayName: "unit",
      testEnvironment: "node",
      roots: ["<rootDir>/tests/unit", "<rootDir>/services"],
      testMatch: ["**/*.test.js"],
      transform: {
        "^.+\\.jsx?$": [
          "babel-jest",
          { presets: [["@babel/preset-env", { targets: { node: "current" } }]] }
        ]
      },
      collectCoverageFrom: ["services/**/*.js"],
      coverageDirectory: "coverage/unit",
      testTimeout: 10000
    },
    {
      displayName: "integration-pgmem",
      testEnvironment: "node",
      roots: ["<rootDir>/tests/integration/postgres"],
      testMatch: ["**/*.test.js"],
      transform: {
        "^.+\\.jsx?$": [
          "babel-jest",
          { presets: [["@babel/preset-env", { targets: { node: "current" } }]] }
        ]
      },
      setupFiles: ["<rootDir>/tests/setup.js"],
      testTimeout: 30000
    },
    {
      displayName: "integration-supabase",
      testEnvironment: "node",
      roots: ["<rootDir>/tests/integration/supabase"],
      testMatch: ["**/*.test.js"],
      transform: {
        "^.+\\.jsx?$": [
          "babel-jest",
          { presets: [["@babel/preset-env", { targets: { node: "current" } }]] }
        ]
      },
      setupFiles: ["<rootDir>/tests/setup.js"],
      testTimeout: 60000
    },
    {
      displayName: "regression",
      testEnvironment: "node",
      roots: ["<rootDir>/tests/regression"],
      testMatch: ["**/*.test.js"],
      transform: {
        "^.+\\.jsx?$": [
          "babel-jest",
          { presets: [["@babel/preset-env", { targets: { node: "current" } }]] }
        ]
      },
      testTimeout: 30000
    }
  ],
  coverageReporters: ["text", "html", "json-summary", "lcov"],
  coverageDirectory: "coverage"
}
