import { createClient, type Chain, type Client, type Transport } from "viem"
import type { Internal } from "../type"

const clientCache = new Map<string, Client<Transport, Chain>>()

export const getClient = ({
    internal,
    chainId
}: { internal: Internal; chainId: number | undefined }): Client<
    Transport,
    Chain
> => {
    const { config, id, store } = internal
    const { chains } = config

    const state = store.getState()
    const chain = chains.find((chain) => chain.id === chainId || state.chain.id)
    if (!chain) throw new Error("chain not found")

    const transport = config.transports[chain.id]
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
    const client = createClient({
        chain,
        transport: transport.rpc,
        pollingInterval: 1_000
    })
    clientCache.set(key, client)
    return client
}
