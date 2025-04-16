import type { Transport } from "viem"
import type { Internal } from "@/registry/batua/lib/batua/type"
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
    if (!chain) return null

    const transport = config.paymaster?.transports[chain.id]
    if (!transport) return null

    const key = [id, chainId].filter(Boolean).join(":")
    if (clientCache.has(key)) {
        const client = clientCache.get(key)

        // should never happen but TS
        if (!client) {
            return null
        }

        return client
    }
    const client = createPaymasterClient({
        transport: transport,
        pollingInterval: 1_000
    })
    clientCache.set(key, client)
    return client
}
