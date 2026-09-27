module.exports = {
  testEnvironment: "node",
  // "services" precisa estar em "roots" alem de "collectCoverageFrom": o glob de
  // cobertura e resolvido contra os arquivos que o Jest vasculhou, e o que ele
  // vasculha sao exatamente as pastas de "roots". Sem esta pasta, o filtro de
  // cobertura casa com nada, sem aviso, e arquivos sem nenhum teste ficam invisiveis
  roots: ["<rootDir>/tests", "<rootDir>/services"],
  transform: {
    "^.+\\.jsx?$": [
      "babel-jest",
      { presets: [["@babel/preset-env", { targets: { node: "current" } }]] }
    ]
  },
  collectCoverageFrom: ["services/**/*.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "json-summary", "lcov"],
  testTimeout: 30000
}
