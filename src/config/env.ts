const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!apiBaseUrl) {
  // Fail fast in dev so a missing .env is obvious rather than producing
  // confusing relative-URL request failures.
  throw new Error('VITE_API_BASE_URL is not set. Create a .env file (see .env.example).')
}

export const env = {
  apiBaseUrl,
} as const
