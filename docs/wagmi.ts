
import { sepolia } from "viem/chains"
import { http, createConfig } from "wagmi"
import { Batua } from "@/registry/batua/batua"

const pimlicoApiKey =  process.env.VITE_PUBLIC_PIMLICO_API_KEY ?? ""

Batua.create({
    dappName: "Pimlico",
    chains: [sepolia],
    rpc: {
        transports: {
            [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com")
        }
    },
    paymaster: {
        transports: {
            [sepolia.id]: http(
                `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`
            )
        },
        context: {
            sponsorshipPolicyId: process.env.VITE_PUBLIC_SPONSORSHIP_POLICY_ID ?? ""
        }
    },
    bundler: {
        transports: {
            [sepolia.id]: http(
                `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`
            )
        }
    }
})

export const config = createConfig({
    chains: [sepolia],
    ssr: true,
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
