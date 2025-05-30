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
                        key: "Content-Security-Policy",
                        value: "frame-ancestors *" // lets any site embed you
                    }
                ]
            }
        ]
    }
}

export default nextConfig
