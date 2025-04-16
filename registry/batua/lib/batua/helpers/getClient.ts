import {
    type PublicClient,
    type Chain,
    type Transport,
    createPublicClient
} from "viem"
import type { Internal } from "@/registry/batua/lib/batua/type"

const clientCache = new Map<string, PublicClient<Transport, Chain>>()

export const getClient = ({
    internal,
    chainId
}: { internal: Internal; chainId: number | undefined }): PublicClient<
    Transport,
    Chain
> => {
    const { config, id, store } = internal
    const { chains } = config

    const state = store.getState()
    const chain = chains.find((chain) => chain.id === chainId || state.chain.id)
    if (!chain) throw new Error("chain not found")

    const transport = config.rpc.transports[chain.id]
    if (!transport) throw new Error("transport not found")

    const key = [id, chainId].filter(Boolean).join(":")
    if (clientCache.has(key)) {
        const client = clientCache.get(key)

        // should never happen but TS
        if (!client) {
            throw new Error("client not found")
        }

        return client
    }
    const client = createPublicClient({
        chain,
        transport: transport,
        pollingInterval: 1_000
    })
    clientCache.set(key, client)
    return client
}
