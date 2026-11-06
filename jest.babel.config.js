// Babel só para o Jest: o app é compilado pelo SWC/Turbopack do Next. O nome não é
// babel.config.js de propósito; na raiz, esse nome faria o Next trocar o SWC pelo Babel.
// Os aliases @/... dos testes são resolvidos pelo moduleNameMapper do jest.config.js.
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }]
  ]
}
