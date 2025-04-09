import { type Chain, base, baseSepolia, sepolia } from "viem/chains"
import { http, type Transport } from "viem"
import type {
    Implementation,
    Internal,
    State,
    Storage
} from "@/registry/batua/batua/type"
import { Provider } from "@/registry/batua/batua/provider"
import { local } from "@/registry/batua/batua/implementations/local"
import { createStore } from "zustand/vanilla"
import { persist, subscribeWithSelector } from "zustand/middleware"
import { idb } from "@/registry/batua/batua/storage"

const defaultConfig = {
    chains: [sepolia, baseSepolia, base],
    announceProvider: true,
    storage: idb(),
    transports: {
        // TODO: Add transports for all chains
        [sepolia.id]: {
            rpc: http(),
            bundler: http(`https://public.pimlico.io/v2/${sepolia.id}/rpc`)
        },
        [baseSepolia.id]: {
            rpc: http(),
            bundler: http(`https://public.pimlico.io/v2/${baseSepolia.id}/rpc`)
        },
        [base.id]: {
            rpc: http(),
            bundler: http(`https://public.pimlico.io/v2/${base.id}/rpc`)
        }
    },
    implementation: local()
} as const satisfies Config

export type Config<
    chains extends readonly [Chain, ...Chain[]] = readonly [Chain, ...Chain[]]
> = {
    announceProvider: boolean
    chains: chains | readonly [Chain, ...Chain[]]
    implementation: Implementation
    storage: Storage
    transports: Record<
        chains[number]["id"],
        {
            rpc: Transport
            bundler: Transport
            paymaster?: Transport
        }
    >
}

export const Batua = {
    create: <
        chains extends readonly [Chain, ...Chain[]] = readonly [
            Chain,
            ...Chain[]
        ]
    >(parameters?: {
        chains?: chains | readonly [Chain, ...Chain[]]
        announceProvider?: boolean
        storage?: Storage
        implementation?: Implementation | null
        transports?: Record<
            chains[number]["id"],
            {
                rpc?: Transport
                bundler?: Transport
                paymaster?: Transport
            }
        >
    }) => {
        const config: Config = {
            storage: parameters?.storage ?? defaultConfig.storage,
            chains: parameters?.chains ?? defaultConfig.chains,
            announceProvider: parameters?.announceProvider ?? true,
            transports: parameters?.transports ?? defaultConfig.transports,
            implementation:
                parameters?.implementation ?? defaultConfig.implementation
        }

        let implementation = config.implementation

        const store = createStore(
            subscribeWithSelector(
                persist<State>(
                    (_) => ({
                        accounts: [],
                        chain: config.chains[0],
                        requestQueue: []
                    }),
                    {
                        name: "batua.store",
                        partialize(state) {
                            return {
                                accounts: state.accounts.map((account) => ({
                                    ...account,
                                    sign: undefined
                                    // keys: account.keys?.map((key) => ({
                                    //     ...key,
                                    //     privateKey:
                                    //         typeof key.privateKey === "function"
                                    //             ? undefined
                                    //             : key.privateKey
                                    // }))
                                })),
                                chain: state.chain
                            } as unknown as State
                        },
                        storage: config.storage
                    }
                )
            )
        )

        const internal: Internal = {
            config,
            id: crypto.randomUUID(),
            getImplementation() {
                return implementation
            },
            setImplementation(i) {
                destroy?.()
                implementation = i
                destroy = i.setup({
                    internal
                })
                return destroy
            },
            store
        }

        const provider = Provider.from({ internal })

        let destroy = implementation.setup({
            internal
        })

        return {
            destroy: () => {
                provider.destroy()
                destroy()
            }
        }
    }
}
