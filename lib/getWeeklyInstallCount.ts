/**
 * Returns the number of `batua_install` PostHog events since Monday 00:00 UTC
 * of the current ISO week.
 *
 * Reads PostHog credentials from the provided arguments or from environment
 * variables:
 *   - POSTHOG_KEY  (aka personal API key)
 *   - POSTHOG_HOST (defaults https://app.posthog.com )
 *   - POSTHOG_PROJECT_ID (numeric project id)
 */
export async function getWeeklyInstallCount(options: {
  posthogKey?: string
  posthogHost?: string
  posthogProjectId?: string
} = {}): Promise<number> {
  const POSTHOG_KEY = options.posthogKey || process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY || ''
  const POSTHOG_HOST = options.posthogHost || process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
  const POSTHOG_PROJECT_ID = options.posthogProjectId || process.env.POSTHOG_PROJECT_ID || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID || ''

  if (!POSTHOG_KEY || !POSTHOG_HOST || !POSTHOG_PROJECT_ID) {
    throw new Error('Missing PostHog credentials (POSTHOG_KEY, POSTHOG_HOST, POSTHOG_PROJECT_ID)')
  }

  const mondayIso = getMondayOfThisWeek().toISOString().slice(0, 19)

  const hogqlQuery = `SELECT count() FROM events WHERE event = 'batua_install' AND timestamp >= toDateTime('${mondayIso}')`
  const queryBody = {
    query: { kind: 'HogQLQuery', query: hogqlQuery },
  }

  const resp = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${POSTHOG_KEY}`,
    },
    body: JSON.stringify(queryBody),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`PostHog query failed: ${resp.status} ${text}`)
  }

  const json = (await resp.json()) as { results?: Array<Array<number>> }
  return Array.isArray(json.results) && json.results.length && json.results[0].length ? json.results[0][0] : 0
}

// --- internal helpers ------------------------------------------------------
function getMondayOfThisWeek(): Date {
  const now = new Date()
  const day = now.getUTCDay() // 0 (Sun)..6 (Sat)
  const diffToMonday = (day === 0 ? -6 : 1) - day
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  monday.setUTCDate(monday.getUTCDate() + diffToMonday)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
} 