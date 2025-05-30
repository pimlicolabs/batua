"use client"

import type { Config } from "@/registry/batua/batua"
import { idb } from "@/registry/batua/lib/batua/storage"
import { Login } from "@/registry/batua/components/batua/Login"
import type {
    Internal,
    QueuedRequest,
    State
} from "@/registry/batua/lib/batua/type"
import { base } from "viem/chains"
import { baseSepolia } from "viem/chains"
import { useCallback, useEffect, useState } from "react"
import { sepolia } from "viem/chains"
import { http } from "viem"
import { local } from "@/registry/batua/lib/batua/implementations/local"
import { coingeckoPriceManager } from "@/registry/batua/lib/batua/coingeckoPriceManager"
import { createStore } from "zustand/vanilla"
import { persist, subscribeWithSelector } from "zustand/middleware"
import { SendCalls } from "@/registry/batua/components/batua/SendCalls"
import { getBundlerClient } from "@/registry/batua/lib/batua/helpers/getBundlerClient"
import type { Hex } from "ox"
import { GrantPermissions } from "@/registry/batua/components/batua/GrantPermissions"

const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY || ""

const config = {
    dappName: "Dapp",
    walletName: "Batua",
    chains: [sepolia, baseSepolia, base],
    announceProvider: true,
    storage: idb(),
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
            sponsorshipPolicyId: process.env.NEXT_PUBLIC_SPONSORSHIP_POLICY_ID
        }
    },
    bundler: {
        transports: {
            [sepolia.id]: http(
                `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`
            )
        }
    },
    implementation: local(),
    priceManager: coingeckoPriceManager()
} as const satisfies Config

const store = createStore(
    subscribeWithSelector(
        persist<State>(
            () => ({
                accounts: [],
                chain: config.chains[0],
                requestQueue: [],
                price: undefined
            }),
            {
                name: "batua.external.store",
                partialize(state) {
                    return {
                        accounts: state.accounts.map((account) => ({
                            ...account,
                            sign: undefined
                        })),
                        chain: state.chain,
                        price: state.price
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
        throw new Error("Implementation not set")
    },
    setImplementation() {
        throw new Error("Implementation not set")
    },
    getPriceManager() {
        return config.priceManager
    },
    setPriceManager() {
        throw new Error("Price manager not set")
    },
    store
}

export default function Iframe() {
    const [queueRequest, setQueueRequest] = useState<QueuedRequest | null>(null)

    useEffect(() => {
        // Post message to parent window that iframe has loaded
        window.parent.postMessage({ type: "batua-iframe-loaded" }, "*")

        const handleMessage = (event: MessageEvent) => {
            if (event.data.type !== "batua-iframe-request") return
            setQueueRequest(event.data.request)
        }

        window.addEventListener("message", handleMessage)

        return () => {
            window.removeEventListener("message", handleMessage)
        }
    }, [])

    const onComplete = useCallback(
        ({ queueRequest }: { queueRequest: QueuedRequest }) => {
            internal.store.persist.rehydrate()
            window.parent.postMessage(
                {
                    type: "batua-iframe-response",
                    request: queueRequest
                },
                "*"
            )
            setQueueRequest(null)
        },
        []
    )

    useEffect(() => {
        const getCallsStatus = async ({
            userOperationHash,
            timeout
        }: {
            userOperationHash: Hex.Hex
            timeout: number
        }) => {
            const bundlerClient = getBundlerClient({
                internal
            })

            const chainId = store.getState().chain.id
            try {
                const receipt = await bundlerClient.waitForUserOperationReceipt(
                    {
                        hash: userOperationHash,
                        timeout: timeout ?? 1_000 // 1 second
                    }
                )
                const userOpStatus = receipt.success
                return {
                    id: userOperationHash,
                    version: "1.0",
                    chainId,
                    status: userOpStatus ? 200 : 500,
                    atomic: true,
                    receipts: [
                        {
                            status: receipt.receipt.status,
                            logs: receipt.receipt.logs,
                            blockHash: receipt.receipt.blockHash,
                            blockNumber: receipt.receipt.blockNumber,
                            gasUsed: receipt.receipt.gasUsed,
                            transactionHash: receipt.receipt.transactionHash
                        }
                    ]
                }
            } catch {
                return {
                    id: userOperationHash,
                    version: "1.0",
                    chainId,
                    atomic: true,
                    status: 100
                }
            }
        }

        if (queueRequest?.request.method === "wallet_getCallsStatus") {
            getCallsStatus({
                userOperationHash: (
                    queueRequest?.request?.params as unknown as Hex.Hex[]
                )[0] as Hex.Hex,
                timeout: 10_000
            }).then((result) => {
                onComplete({
                    queueRequest: {
                        request: queueRequest.request,
                        status: "success",
                        result: result
                    }
                })
            })
        }
    }, [queueRequest, onComplete])

    if (queueRequest?.request.method === "eth_requestAccounts") {
        return (
            <Login
                internal={internal}
                queueRequest={queueRequest}
                onComplete={onComplete}
            />
        )
    }

    if (queueRequest?.request.method === "wallet_sendCalls") {
        return (
            <SendCalls
                internal={internal}
                queueRequest={queueRequest}
                onComplete={onComplete}
            />
        )
    }

    if (queueRequest?.request.method === "wallet_grantPermissions") {
        return (
            <GrantPermissions
                internal={internal}
                queueRequest={queueRequest}
                onComplete={onComplete}
            />
        )
    }

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
    )
}
