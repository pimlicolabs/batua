import type { Transport } from "viem"
import type { Internal } from "@/registry/batua/batua/type"
import {
    createPaymasterClient,
    type PaymasterClient
} from "viem/account-abstraction"

const clientCache = new Map<string, PaymasterClient<Transport>>()

export const getPaymasterClient = ({
    internal,
    chainId
}: {
    internal: Internal
    chainId: number | undefined
}): PaymasterClient<Transport> | null => {
    const { config, id, store } = internal
    const { chains } = config

    const state = store.getState()
    const chain = chains.find((chain) => chain.id === chainId || state.chain.id)
    if (!chain) throw new Error("chain not found")

    const transport = config.transports[chain.id]
    if (!transport) throw new Error("transport not found")
    if (!transport.paymaster) {
        return null
    }

    const key = [id, chainId].filter(Boolean).join(":")
    if (clientCache.has(key)) {
        const client = clientCache.get(key)

        // should never happen but TS
        if (!client) {
            throw new Error("client not found")
        }

        return client
    }
    const client = createPaymasterClient({
        transport: transport.paymaster,
        pollingInterval: 1_000
    })
    clientCache.set(key, client)
    return client
}
