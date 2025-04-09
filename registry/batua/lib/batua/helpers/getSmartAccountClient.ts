import { http, type WalletCapabilities, type Chain, type Transport } from "viem"
import type { Internal } from "@/registry/batua/lib/batua/type"
import {
    createPaymasterClient,
    type PaymasterClient,
    type SmartAccount
} from "viem/account-abstraction"
import type { KernelSmartAccountImplementation } from "permissionless/accounts"
import {
    createSmartAccountClient,
    type SmartAccountClient
} from "permissionless"
import { createPimlicoClient } from "permissionless/clients/pimlico"
import { getPaymasterClient } from "@/registry/batua/lib/batua/helpers/getPaymasterClient"

const clientCache = new Map<
    string,
    SmartAccountClient<
        Transport,
        Chain,
        SmartAccount<KernelSmartAccountImplementation<"0.7">>
    >
>()

export const getSmartAccountClient = ({
    account,
    internal,
    chainId,
    capabilities
}: {
    account: SmartAccount<KernelSmartAccountImplementation<"0.7">>
    internal: Internal
    chainId: number | undefined
    capabilities: WalletCapabilities | undefined
}): SmartAccountClient<
    Transport,
    Chain,
    SmartAccount<KernelSmartAccountImplementation<"0.7">>
> => {
    const { config, id, store } = internal
    const { chains } = config

    const state = store.getState()
    const chain = chains.find((chain) => chain.id === chainId || state.chain.id)
    if (!chain) throw new Error("chain not found")

    const transport = config.bundler.transports[chain.id]
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

    const pimlicoClient = createPimlicoClient({
        chain,
        transport: transport
    })

    let paymaster: PaymasterClient | undefined

    if (capabilities?.paymasterService?.url) {
        paymaster = createPaymasterClient({
            transport: http(capabilities.paymasterService.url)
        })
    }

    if (!paymaster) {
        paymaster =
            getPaymasterClient({
                internal,
                chainId: internal.store.getState().chain.id
            }) ?? undefined
    }

    const client = createSmartAccountClient({
        chain,
        bundlerTransport: transport,
        account,
        paymaster,
        paymasterContext: config.paymaster?.context,
        userOperation: {
            estimateFeesPerGas: async () =>
                (await pimlicoClient.getUserOperationGasPrice()).fast
        }
    })
    clientCache.set(key, client)
    return client
}
