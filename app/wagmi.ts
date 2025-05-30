import { sepolia } from "viem/chains"
import { http, createConfig } from "wagmi"
import { Batua } from "@/registry/batua/batua"
import { iframe } from "@/registry/batua/lib/batua/implementations/iframe"

const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY || ""

Batua.create({
    dappName: "Pimlico",
    implementation: iframe(
        "https://batua-template-git-experiment-pimlico.vercel.app/iframe?_vercel_share=wo8IQcpBxkNKUjMm0TjI4WyVRJUT4ohV"
    )
})

export const config = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com")
    }
})

export const capabilities = {
    paymasterService: {
        [sepolia.id]: {
            url: `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`
        }
    }
}

declare module "wagmi" {
    interface Register {
        config: typeof config
    }
}

// rpc: {
//     transports: {
//         [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com")
//     }
// },
// paymaster: {
//     transports: {
//         [sepolia.id]: http(
//             `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`
//         )
//     },
//     context: {
//         sponsorshipPolicyId: process.env.NEXT_PUBLIC_SPONSORSHIP_POLICY_ID
//     }
// },
// bundler: {
//     transports: {
//         [sepolia.id]: http(
//             `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`
//         )
//     }
// }
