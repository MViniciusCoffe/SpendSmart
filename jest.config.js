module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  transform: {
    "^.+\\.jsx?$": [
      "babel-jest",
      { presets: [["@babel/preset-env", { targets: { node: "current" } }]] }
    ]
  },
  collectCoverageFrom: [
    "services/**/*.js",
    "!services/categoriaService.js",
    "!services/authServices.js"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "json-summary", "lcov"],
  testTimeout: 30000
}
