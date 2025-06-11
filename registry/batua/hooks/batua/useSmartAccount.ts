import { getClient } from "@/registry/batua/lib/batua/helpers/getClient"
import { getSmartAccountClient } from "@/registry/batua/lib/batua/helpers/getSmartAccountClient"
import { Internal } from "@/registry/batua/lib/batua/type"
import { Provider } from "ox"
import { SmartAccountClient } from "permissionless"
import {
    KernelSmartAccountImplementation,
    toKernelSmartAccount
} from "permissionless/accounts"
import { useEffect, useState } from "react"
import {
    Address,
    Chain,
    PublicClient,
    Transport,
    WalletCapabilities
} from "viem"
import {
    entryPoint07Address,
    SmartAccount,
    toWebAuthnAccount
} from "viem/account-abstraction"

export type KernelSmartAccount = SmartAccountClient<
    Transport,
    Chain,
    SmartAccount<KernelSmartAccountImplementation<"0.7">>
>
export const useSmartAccount = ({
    internal,
    accountAddress,
    capabilities,
    client
}: {
    internal: Internal
    accountAddress: Address
    capabilities: WalletCapabilities | undefined
    client: PublicClient<Transport, Chain>
}) => {
    const [smartAccountClient, setSmartAccountClient] =
        useState<KernelSmartAccount | null>(null)

    useEffect(() => {
        const store = internal.store.getState()

        const account = store.accounts.find(
            (account) => account.address === accountAddress
        )

        if (!account) {
            throw new Provider.UnauthorizedError()
        }

        const key = account.key
        if (!key) {
            throw new Provider.UnauthorizedError()
        }

        const credential = key.credential
        if (!credential) {
            throw new Provider.UnauthorizedError()
        }

        toKernelSmartAccount({
            client,
            version: "0.3.1",
            owners: [
                toWebAuthnAccount({
                    credential: {
                        id: credential.id,
                        publicKey: credential.publicKey
                    }
                })
            ],
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            }
        }).then((smartAccount) => {
            const smartAccountClient = getSmartAccountClient({
                account: smartAccount,
                internal,
                capabilities,
                chainId: internal.store.getState().chain.id
            })
            setSmartAccountClient(smartAccountClient)
        })
    }, [internal.store, accountAddress, capabilities])

    return smartAccountClient
}
