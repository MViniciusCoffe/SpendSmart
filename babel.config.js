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
          "@/tests": "./tests",
          "@/components": "./src/components",
          "@/components/ui": "./src/components/ui",
          "@/components/layout": "./src/components/layout",
          "@/components/forms": "./src/components/forms",
          "@/components/feedback": "./src/components/feedback",
          "@/app": "./src/app",
          "@/styles": "./src/styles",
          "@/styles/tokens": "./src/styles/tokens",
          "@/lib": "./src/lib",
          "@/hooks": "./src/hooks",
          "@/contexts": "./src/contexts",
          "@/services": "./src/services",
          "@/utils": "./src/utils",
          "@/types": "./src/types",
          "@/config": "./src/config",
          "@": "./src"
        }
      }
    ]
  ]
}
