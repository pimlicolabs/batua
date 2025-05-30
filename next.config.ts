import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    outputFileTracingIncludes: { registry: ["./registry/**/*"] },

    async headers() {
        return [
            {
                // 🔓  Only paths that start with /iframe/…
                source: "/iframe/:path*",
                headers: [
                    // Legacy header – still respected by Chrome, Edge, Firefox
                    { key: "X-Frame-Options", value: "ALLOWALL" },

                    // Modern, spec-compliant header – overrides XFO when both are present
                    {
                        key: "Content-Security-Policy",
                        value: "frame-ancestors *"
                    }
                ]
            }
        ]
    }
}

export default nextConfig
