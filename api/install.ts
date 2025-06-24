import batuaConfig from '../docs/public/install/batua.json'
import { PostHog } from "posthog-node"

const POSTHOG_KEY = process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY || ""
const POSTHOG_HOST = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com"

let posthog: PostHog | null = null
if (POSTHOG_KEY) {
  posthog = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST })
}

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
    if (posthog) {
      const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('cf-connecting-ip');
      
      const installData = {
        userAgent: request.headers.get('user-agent'),
        country: (request as any).geo?.country,
        city: (request as any).geo?.city,
        region: (request as any).geo?.region,
        packageManager: getUserPackageManager(
          request.headers.get('user-agent') || '',
        ),
      }

      posthog.capture({
        distinctId: ip || 'anonymous',
        event: 'batua_install',
        properties: installData,
        timestamp: new Date(),
      })
    }

    // Serve the JSON config
    return new Response(JSON.stringify(batuaConfig), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Cache for 5 minutes
        'Cache-Control': 'public, max-age=300',
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