import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    outputFileTracingIncludes: { registry: ["./registry/**/*"] },

    async headers() {
        return [
            // 1️⃣  Pages under /iframe/** can be embedded anywhere
            {
                source: "/iframe/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "ALLOWALL" // or drop this and use the CSP line below
                    }
                    // If you prefer the modern spec-compliant header instead:
                    // {
                    //   key: 'Content-Security-Policy',
                    //   value: 'frame-ancestors *',
                    // },
                ]
            },

            // 2️⃣  Everything else is SAMEORIGIN (or DENY, if you prefer)
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN"
                    }
                    // …or omit this entire block to leave the rest
                    // of the site without any X-Frame-Options header.
                ]
            }
        ]
    }
}

export default nextConfig
