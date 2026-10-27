/**
 * Fail Parameter Utility - Shared between API and Client
 * Parses and validates the ?fail= query parameter
 */

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
