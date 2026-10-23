/**
 * Fail Parameter Utility - Shared between API and Client
 * Parses and validates the ?fail= query parameter
 */

const VALID_FAILURES = [
  "database",
  "db",
  "auth",
  "authentication",
  "realtime",
  "realtime-engine",
  "storage",
  "file-storage",
  "api",
  "api-gateway",
  "cdn",
  "edge"
]

/**
 * Parse fail parameter from request (server) or searchParams (client)
 * Returns a Set of normalized failure keys
 */
export function getSimulatedFailures(requestOrParams) {
  let searchParams

  if (requestOrParams instanceof Request) {
    searchParams = new URL(requestOrParams.url).searchParams
  } else if (requestOrParams instanceof URLSearchParams) {
    searchParams = requestOrParams
  } else if (typeof requestOrParams === "string") {
    searchParams = new URLSearchParams(requestOrParams)
  } else {
    return new Set()
  }

  const failParam = searchParams.get("fail")
  if (!failParam) return new Set()

  return new Set(
    failParam
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0)
  )
}

/**
 * Check if a specific failure is simulated
 */
export function isFailureSimulated(requestOrParams, failureKey) {
  const failures = getSimulatedFailures(requestOrParams)
  return failures.has(failureKey.toLowerCase())
}

/**
 * Get all valid failure keys for documentation/validation
 */
export function getValidFailures() {
  return VALID_FAILURES
}

/**
 * Normalize a failure key (e.g., "database" -> "db", "authentication" -> "auth")
 */
export function normalizeFailureKey(key) {
  const normalized = key.toLowerCase().trim()
  switch (normalized) {
    case "database":
    case "db":
      return "database"
    case "auth":
    case "authentication":
      return "auth"
    case "realtime":
    case "realtime-engine":
      return "realtime"
    case "storage":
    case "file-storage":
      return "storage"
    case "api":
    case "api-gateway":
      return "api"
    case "cdn":
    case "edge":
      return "cdn"
    default:
      return normalized
  }
}

/**
 * Create a failure simulation URL for testing
 */
export function createFailureUrl(baseUrl, failures) {
  const normalized = failures.map(normalizeFailureKey).join(",")
  const separator = baseUrl.includes("?") ? "&" : "?"
  return `${baseUrl}${separator}fail=${normalized}`
}
