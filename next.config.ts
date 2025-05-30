/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: "/iframe", // Or '/:path*' if you want to apply to all paths
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "" // Or 'ALLOW-FROM https://your-specific-domain.com' or remove the header entirely by setting value to ''
                    }
                ]
            }
        ]
    },
    /* config options here */
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: true
    },
    experimental: {
        ppr: "incremental",
        typedRoutes: true
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "avatar.vercel.sh"
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com"
            },
            {
                protocol: "https",
                hostname: "s3.amazonaws.com"
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com"
            }
        ]
    },
    env: {
        NEXT_PUBLIC_PIMLICO_API_KEY: process.env.NEXT_PUBLIC_PIMLICO_API_KEY,
        NEXT_PUBLIC_SPONSORSHIP_POLICY_ID:
            process.env.NEXT_PUBLIC_SPONSORSHIP_POLICY_ID
    },
    eslint: {
        ignoreDuringBuilds: true
    },
    compiler: {
        styledComponents: true,
        paths: {
            "@/*": ["./*"]
        }
    },
    transpilePackages: ["@uniswap/widgets", "@uniswap/conedison"]
}

export default nextConfig
