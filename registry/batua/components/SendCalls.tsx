"use client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import type { Internal, QueuedRequest } from "../type"
import { Provider, PublicKey, RpcRequest } from "ox"
import { Button } from "@/components/ui/button"
import { toKernelSmartAccount } from "permissionless/accounts"
import { getClient } from "../helpers/getClient"
import { getSmartAccountClient } from "../helpers/getSmartAccountClient"
import {
    entryPoint07Address,
    toWebAuthnAccount
} from "viem/account-abstraction"
import { useState } from "react"
import { Loader } from "lucide-react"
import { formatEther } from "ox/Value"
import { getPaymasterClient } from "@/registry/batua/helpers/getPaymasterClient"

export const SendCalls = ({
    onComplete,
    queueRequest,
    internal
}: {
    onComplete: (args: {
        queueRequest: QueuedRequest
    }) => void | Promise<void>
    queueRequest: QueuedRequest
    internal: Internal
}) => {
    const [sendingTransaction, setSendingTransaction] = useState(false)

    const onOpenChange = (open: boolean) => {
        if (!open) {
            onComplete({
                queueRequest: {
                    request: queueRequest.request,
                    status: "error",
                    error: new Provider.UserRejectedRequestError()
                }
            })
        }
    }

    const sendTransaction = async () => {
        const requestStore = RpcRequest.createStore()
        const request = requestStore.prepare(queueRequest.request)

        if (request.method !== "wallet_sendCalls") {
            throw new Error("Invalid request")
        }

        const from = request.params[0].from
        const capabilities = request.params[0].capabilities
        const account = internal.store
            .getState()
            .accounts.find((account) => account.address === from)
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

        const client = getClient({
            internal,
            chainId: internal.store.getState().chain.id
        })

        setSendingTransaction(true)

        const smartAccount = await toKernelSmartAccount({
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
        })

        const smartAccountClient = getSmartAccountClient({
            account: smartAccount,
            internal,
            capabilities,
            chainId: internal.store.getState().chain.id
        })

        const userOpHash = await smartAccountClient.sendUserOperation({
            callData: await smartAccountClient.account.encodeCalls(
                request.params[0].calls.map((call) => ({
                    to: call.to ?? "0x",
                    data: call.data ?? "0x",
                    value: call.value ? BigInt(call.value) : undefined
                }))
            )
        })

        onComplete({
            queueRequest: {
                request: queueRequest.request,
                status: "success",
                result: userOpHash
            }
        })

        setSendingTransaction(false)
    }

    let calls = (queueRequest?.request.params as any)[0].calls as any

    return (
        <Dialog open={!!queueRequest} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Send transaction</DialogTitle>
                    <DialogDescription>
                        Send a transaction from your smart account.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {calls.map((call: any, index: number) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        <div key={index} className="border rounded-md p-3">
                            <p className="text-sm font-medium">
                                To:{" "}
                                <span className="font-mono text-xs">
                                    {call.to}
                                </span>
                            </p>
                            <p className="text-sm font-medium mt-2">
                                Value:{" "}
                                <span className="text-xs font-mono">
                                    {formatEther(call.value ?? BigInt(0))}
                                </span>
                            </p>
                            <p className="text-sm font-medium truncate mt-2">
                                Data:{" "}
                                <span className="text-xs text-muted-foreground font-mono">
                                    {call.data || "0x"}
                                </span>
                            </p>
                        </div>
                    ))}
                    <Button
                        type="submit"
                        onClick={sendTransaction}
                        disabled={sendingTransaction}
                    >
                        {sendingTransaction && (
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {sendingTransaction ? "Sending..." : "Send transaction"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
