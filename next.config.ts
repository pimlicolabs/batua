import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    outputFileTracingIncludes: {
        registry: ["./registry/**/*"]
    },

    async headers() {
        return [
            {
                // apply to every path
                source: "/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "ALLOWALL" // allows the page to be framed anywhere
                    }
                    // — OPTIONAL, more modern and flexible —
                    // {
                    //   key: 'Content-Security-Policy',
                    //   value: "frame-ancestors *",  // lets any site embed you
                    // },
                ]
            }
        ]
    }
}

export default nextConfig
