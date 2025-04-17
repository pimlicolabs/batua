import { NextResponse } from "next/server"
import { PostHog } from "posthog-node"
import { batuaData } from "./batua-data"

// Initialize server-side PostHog client
const serverPosthog = process.env.NEXT_PUBLIC_POSTHOG_KEY
    ? new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          host:
              process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com"
      })
    : null

export async function GET(request: Request) {
    try {
        // Track the access to the JSON file with server-side analytics
        if (serverPosthog) {
            const url = new URL(request.url)
            serverPosthog.capture({
                distinctId:
                    request.headers.get("x-forwarded-for") || "anonymous",
                event: "batua_json_accessed",
                properties: {
                    url: request.url,
                    path: url.pathname,
                    referrer: request.headers.get("referer") || "unknown",
                    userAgent: request.headers.get("user-agent") || "unknown",
                    timestamp: new Date().toISOString(),
                    source: "install-endpoint"
                }
            })

            // Ensure the event is sent immediately
            serverPosthog.flush()
        }

        // Use the data from the TypeScript file that was generated during build
        // This approach works reliably with Vercel Edge functions
        const jsonData = batuaData;

        // Return the JSON data
        return NextResponse.json(jsonData, {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=3600" // Cache for 1 hour
            }
        })
    } catch (error) {
        console.error("Error serving batua.json:", error)
        return NextResponse.json(
            { error: "Failed to serve batua.json" },
            { status: 500 }
        )
    }
}
