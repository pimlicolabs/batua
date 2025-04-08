import { sepolia } from "viem/chains"
import { http, createConfig } from "wagmi"
import { coinbaseWallet } from "wagmi/connectors"
import { Batua } from "@/registry/batua"

const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY || ""

Batua.use({
    transports: {
        [sepolia.id]: {
            rpc: http("https://ethereum-sepolia-rpc.publicnode.com"),
            bundler: http(
                `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`
            ),
            paymaster: http(
                `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`
            )
        }
    }
})

export const config = createConfig({
    chains: [sepolia],
    connectors: [
        coinbaseWallet({
            appName: "Pimlico Test",
            preference: "smartWalletOnly"
        })
    ],
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
