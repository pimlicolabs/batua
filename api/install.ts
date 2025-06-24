import batuaConfig from '../docs/public/install/batua.json'

// Personal API key (used for Authorization header)
const POSTHOG_KEY = process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY || ""
// Project-level token (a "phc_..." value) sent in the request body
const POSTHOG_PROJECT_TOKEN =
  process.env.POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || ""
const POSTHOG_HOST = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com"

export const config = {
  runtime: 'edge',
}

// Helper function to detect package manager from the user-agent string.
function getUserPackageManager(userAgent: string): string | undefined {
  if (userAgent.includes('npm/')) return 'npm'
  if (userAgent.includes('yarn/')) return 'yarn'
  if (userAgent.includes('pnpm/')) return 'pnpm'
  if (userAgent.includes('bun/')) return 'bun'
  return undefined
}

export default async function handler(request: Request): Promise<Response> {
  // CORS pre-flight support
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  try {
    // Serve the JSON config
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip')
    const installData = {
      userAgent: request.headers.get('user-agent'),
      country: (request as any).geo?.country,
      city: (request as any).geo?.city,
      region: (request as any).geo?.region,
      packageManager: getUserPackageManager(request.headers.get('user-agent') || ''),
    }

    console.log('Sending install event to PostHog:', installData)

    if (POSTHOG_KEY) {
      try {
        const res = await fetch(`${POSTHOG_HOST}/capture/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Personal API key is provided via Authorization header, as recommended by PostHog
            ...(POSTHOG_KEY ? { Authorization: `Bearer ${POSTHOG_KEY}` } : {}),
          },
          body: JSON.stringify({
            // Project token identifies the workspace / project
            token: POSTHOG_PROJECT_TOKEN,
            event: 'batua_install',
            properties: installData,
            distinct_id: ip || 'anonymous',
            timestamp: new Date().toISOString(),
          }),
        })

        const text = await res.text()
        console.log('PostHog /capture response', res.status, text)
      } catch (e) {
        console.error('PostHog tracking fetch failed:', e)
      }
    }

    return new Response(JSON.stringify(batuaConfig), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Cache privately for 1 hour (browser-level only, no shared CDN caching)
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error in /api/install:', error)
    // Even if analytics fails, still respond with the JSON.
    return new Response(JSON.stringify(batuaConfig), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
} 