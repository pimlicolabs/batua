import { NextRequest, NextResponse } from "next/server"
import { PostHog } from "posthog-node"

import batuaData from "../../docs/public/install/batua.json"

// Create a single PostHog client instance.
// These environment variables should be provided in your hosting environment.
const POSTHOG_KEY = process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY || ""
const POSTHOG_HOST = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com"

let posthog: PostHog | null = null
if (POSTHOG_KEY) {
  posthog = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST })
}

function getIp(req: any): string | undefined {
  const xf = req?.headers?.["x-forwarded-for"] as string | undefined
  if (xf) return xf.split(",")[0].trim()
  if (typeof req?.ip === "string" && req.ip) return req.ip
  return undefined
}

function trackRequest(req: any) {
  if (!posthog) return
  const ip = getIp(req)
  posthog.capture({
    distinctId: "anonymous",
    event: "batua_download_requested",
    properties: ip ? { $ip: ip } : undefined,
    timestamp: new Date(),
  })
}

/**
 * Vite dev-server handler (used by vocs.config.ts plugin)
 */
export function handler(req: any, res: any) {
  trackRequest(req)
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(batuaData))
}

/**
 * Next.js App-Router API route (production / preview)
 */
export async function GET(req: NextRequest) {
  trackRequest(req)
  return NextResponse.json(batuaData)
} 