/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable Turbopack to use webpack config for path aliases
  turbopack: {},
  // Explicitly set the project root
  outputFileTracingRoot: __dirname,
  experimental: {
    // Enable App Router features (already using Pages Router but good to have)
  },
  // Ensure path aliases work with webpack
  webpack: (config, { isServer }) => {
    const path = require("path")

    // Add src to module resolution paths
    config.resolve.modules = [path.resolve(__dirname, "src"), ...config.resolve.modules]

    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
      "@/components": path.resolve(__dirname, "src/components"),
      "@/components/ui": path.resolve(__dirname, "src/components/ui"),
      "@/components/layout": path.resolve(__dirname, "src/components/layout"),
      "@/components/forms": path.resolve(__dirname, "src/components/forms"),
      "@/components/feedback": path.resolve(__dirname, "src/components/feedback"),
      "@/app": path.resolve(__dirname, "src/app"),
      "@/styles": path.resolve(__dirname, "src/styles"),
      "@/styles/tokens": path.resolve(__dirname, "src/styles/tokens"),
      "@/lib": path.resolve(__dirname, "src/lib"),
      "@/hooks": path.resolve(__dirname, "src/hooks"),
      "@/contexts": path.resolve(__dirname, "src/contexts"),
      "@/services": path.resolve(__dirname, "src/services"),
      "@/utils": path.resolve(__dirname, "src/utils"),
      "@/types": path.resolve(__dirname, "src/types"),
      "@/config": path.resolve(__dirname, "src/config")
    }

    return config
  },
  // Image optimization (optional, for future use)
  images: {
    domains: ["localhost"]
  }
}

module.exports = nextConfig
