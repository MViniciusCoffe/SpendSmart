#!/usr/bin/env node
// AGENTS.md enforcement checks
// Run in CI to enforce project rules

const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()
const EXTENSIONS = [".js", ".jsx", ".json", ".md"]
const IGNORE_DIRS = [
  "node_modules",
  ".next",
  "coverage",
  ".git",
  ".husky",
  "reports",
  ".stryker-tmp"
]
const IGNORE_FILES = ["AGENTS.md", "scripts/check-agents.js", "docs/"]

function walk(dir, ext) {
  let files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (IGNORE_DIRS.includes(entry.name) || entry.name === "docs") continue
    if (IGNORE_FILES.includes(entry.name)) continue
    if (entry.isDirectory()) {
      files.push(...walk(full, ext))
    } else if (ext.some(e => entry.name.endsWith(e))) {
      files.push(full)
    }
  }
  return files
}

function checkFile(file) {
  if (file.includes("check-agents.js")) return []

  const content = fs.readFileSync(file, "utf8")
  const lines = content.split("\n")
  const violations = []

  lines.forEach((line, i) => {
    const lineNum = i + 1

    // 1. No hardcoded secrets (basic patterns)
    if (/sb_secret_[a-zA-Z0-9_-]{20,}/.test(line)) {
      violations.push(`${file}:${lineNum}: Possível service_role key hardcoded`)
    }
    if (/eyJ[a-zA-Z0-9_-]{20,}\./.test(line)) {
      violations.push(`${file}:${lineNum}: Possível JWT hardcoded`)
    }

    // 2. No console.error with sensitive data patterns
    if (/console\.error\(.*(password|token|secret|key|authorization)/i.test(line)) {
      violations.push(`${file}:${lineNum}: console.error com possível dado sensível`)
    }

    // 3. No dangerouslySetInnerHTML, innerHTML, eval
    if (/dangerouslySetInnerHTML|innerHTML|eval\(/.test(line)) {
      violations.push(`${file}:${lineNum}: Uso proibido (dangerouslySetInnerHTML/innerHTML/eval)`)
    }

    // 4. No alert/confirm
    if (/window\.alert\(|window\.confirm\(|alert\(|confirm\(/.test(line)) {
      violations.push(`${file}:${lineNum}: Uso de alert/confirm (use toast)`)
    }

    // 5. No select("*") in services (should be explicit)
    if (/\.select\(\s*["']\*["']\s*\)/.test(line) && file.includes("services/")) {
      violations.push(`${file}:${lineNum}: select("*") em service - use campos explícitos`)
    }
  })

  return violations
}

function main() {
  console.log("🔍 AGENTS.md enforcement checks...\n")

  const files = walk(ROOT, EXTENSIONS)
  let totalViolations = 0

  for (const file of files) {
    const violations = checkFile(file)
    if (violations.length > 0) {
      console.log(`\n${file}:`)
      violations.forEach(v => console.log(`  ❌ ${v}`))
      totalViolations += violations.length
    }
  }

  if (totalViolations > 0) {
    console.log(`\n❌ ${totalViolations} violação(ões) do AGENTS.md encontradas`)
    process.exit(1)
  } else {
    console.log("✅ Nenhuma violação do AGENTS.md encontrada")
    process.exit(0)
  }
}

main()
