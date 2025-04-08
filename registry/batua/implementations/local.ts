import { Hex, Provider, RpcRequest } from "ox"
import type { Implementation, Internal, QueuedRequest, Store } from "../type"

import ReactDOM from "react-dom/client"
import React from "react"
import { Main } from "../components/Main"
import type { GetCallsStatusReturnType } from "viem/experimental"
import { getBundlerClient } from "@/registry/batua/helpers/getBundlerClient"

export const local = (): Implementation => {
    const requestStore = RpcRequest.createStore()

    function getProvider(store: Store) {
        return Provider.from({
            async request(r) {
                const request = requestStore.prepare(r as any)

                // When we receive a request, we need to add it to the queue.
                store.setState((x) => ({
                    ...x,
                    requestQueue: [
                        ...x.requestQueue,
                        {
                            request,
                            status: "pending"
                        }
                    ]
                }))

                // We need to wait for the request to be resolved.
                return new Promise((resolve, reject) => {
                    const unsubscribe = store.subscribe(
                        (x) => x.requestQueue,
                        (requestQueue) => {
                            // If the queue is empty, reject the request as it will
                            // never be resolved.
                            if (requestQueue.length === 0) {
                                unsubscribe()
                                reject(new Provider.UserRejectedRequestError())
                            }

                            // Find the request in the queue based off its JSON-RPC identifier.
                            const queued = requestQueue.find(
                                (x) => x.request.id === request.id
                            )
                            if (!queued) return
                            if (
                                queued.status !== "success" &&
                                queued.status !== "error"
                            )
                                return

                            // We have a response, we can unsubscribe from the store.
                            unsubscribe()

                            // If the request was successful, resolve with the result.
                            if (queued.status === "success")
                                resolve(queued.result as any)
                            // Otherwise, reject with EIP-1193 Provider error.
                            else reject(Provider.parseError(queued.error))

                            // Remove the request from the queue.
                            store.setState((x) => ({
                                ...x,
                                requestQueue: x.requestQueue.filter(
                                    (x) => x.request.id !== request.id
                                )
                            }))
                        }
                    )
                })
            }
        })
    }

    let internal: Internal

    return {
        actions: {
            loadAccounts: async ({ request, store }) => {
                const provider = getProvider(store)

                const accounts = await (async () => {
                    if (request.method === "eth_requestAccounts") {
                        const address = await provider.request(request)
                        return address.map(
                            (address) =>
                                ({
                                    address,
                                    type: "smartAccount"
                                }) as const
                        )
                    }
                    throw new Error(
                        `Cannot load accounts for method: ${request.method}`
                    )
                })()
                return {
                    accounts
                }
            },
            getCallsStatus: async ({ userOperationHash, timeout }) => {
                const bundlerClient = getBundlerClient({
                    internal
                })

                try {
                    const receipt =
                        await bundlerClient.waitForUserOperationReceipt({
                            hash: userOperationHash,
                            timeout: timeout ?? 1_000 // 1 second
                        })
                    return {
                        status: "CONFIRMED",
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
                } catch (e) {
                    return {
                        status: "PENDING"
                    }
                }
            },
            sendCalls: async ({ account, store, calls, capabilities }) => {
                const provider = getProvider(store)
                return provider.request({
                    method: "wallet_sendCalls",
                    params: [
                        {
                            version: "1.0",
                            from: account.address,
                            chainId: Hex.fromNumber(store.getState().chain.id),
                            capabilities,
                            calls: calls.map((call) => ({
                                to: call.to,
                                value: call.value
                                    ? Hex.fromNumber(call.value)
                                    : undefined,
                                data: call.data
                            }))
                        }
                    ]
                }) as Promise<Hex.Hex>
            }
        },
        setup: ({ internal: internal_ }) => {
            internal = internal_
            if (typeof document === "undefined") return () => {}
            const root = document.createElement("div")
            root.id = internal.id
            document.body.appendChild(root)
            ReactDOM.createRoot(root).render(
                React.createElement(Main, {
                    internal
                })
            )

            return () => {
                ReactDOM.createRoot(root).unmount()
                document.body.removeChild(root)
            }
        }
    }
}
