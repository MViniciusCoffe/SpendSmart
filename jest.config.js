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
  // "html" gera coverage/index.html, que mostra linha a linha e nomeia as funcoes sem
  // cobertura. O "text" so agrega por arquivo: diz 3 de 4 funcoes, mas nao diz quais
  coverageReporters: ["text", "html", "json-summary", "lcov"],
  testTimeout: 30000
}
