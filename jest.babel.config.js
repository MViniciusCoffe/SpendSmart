module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }]
  ],
  plugins: [
    [
      "module-resolver",
      {
        root: ["./src", "./tests"],
        alias: {
          // "@/tests" antes de "@": o primeiro prefixo que casa vence
          "@/tests": "./tests",
          "@": "./src"
        }
      }
    ]
  ]
}
