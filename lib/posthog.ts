// lib/posthog.ts
import posthog from "posthog-js"

// You should set POSTHOG_KEY and POSTHOG_HOST in your .env file
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || ""
const POSTHOG_HOST =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com"

if (typeof window !== "undefined" && POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        loaded: () => {
            // Optionally identify user or set properties here
            // ph.identify('user_id');
        }
    })
}

export default posthog
