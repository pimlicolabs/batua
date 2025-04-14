"use client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import type { Internal, QueuedRequest } from "@/registry/batua/lib/batua/type"
import { Provider, RpcRequest } from "ox"
import { Button } from "@/components/ui/button"
import { toKernelSmartAccount } from "permissionless/accounts"
import { getClient } from "@/registry/batua/lib/batua/helpers/getClient"
import { getSmartAccountClient } from "@/registry/batua/lib/batua/helpers/getSmartAccountClient"
import {
    entryPoint07Address,
    toWebAuthnAccount
} from "viem/account-abstraction"
import { useState } from "react"
import { AlertCircle, Loader2, SendIcon, Copy, Check } from "lucide-react"
import { formatEther } from "ox/Value"
import type { Address, Hex } from "viem"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

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
        try {
            setError(null)
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
        } catch (error) {
            console.error("Transaction error:", error)
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to send transaction. Please try again."
            )
        } finally {
            setSendingTransaction(false)
        }
    }

    const params = queueRequest?.request.params as [
        {
            from: Address
            calls: { to: Address; data: Hex; value: bigint }[]
        }
    ]

    const from = params[0].from
    const calls = params[0].calls

    return (
        <Dialog open={!!queueRequest} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] scroll-auto p-0">
                <div className="bg-primary/5 p-6 rounded-t-lg">
                    <DialogHeader className="pb-0 space-y-2">
                        <div className="flex items-center gap-2">
                            <SendIcon className="h-5 w-5 text-primary" />
                            <DialogTitle>Send Transaction</DialogTitle>
                        </div>
                        <DialogDescription>
                            Review and confirm this transaction from your wallet
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 pt-2">
                    {error && (
                        <Alert variant="destructive" className="mb-5">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-5">
                        <div className="space-y-2.5">
                            <h3 className="text-sm font-medium">
                                Your Wallet Address
                            </h3>
                            <div className="border rounded-md p-4 bg-muted/10">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium flex-1">
                                        <span className="font-mono text-xs break-all">
                                            {from}
                                        </span>
                                    </p>
                                    <button
                                        type="button"
                                        className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                                        onClick={() => {
                                            navigator.clipboard.writeText(from)
                                            setCopied(true)
                                            setTimeout(
                                                () => setCopied(false),
                                                2000
                                            )
                                        }}
                                        title="Copy address to clipboard"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <h3 className="text-sm font-medium">
                                Transaction Details
                            </h3>
                            <div className="space-y-3">
                                {calls.map((call, index: number) => (
                                    <div
                                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                        key={index}
                                        className="border rounded-md p-4 bg-muted/10"
                                    >
                                        <div className="mb-2.5">
                                            <span className="text-xs font-medium">
                                                To:
                                            </span>
                                            <div className="font-mono text-xs break-all mt-1">
                                                {call.to}
                                            </div>
                                        </div>
                                        <div className="mb-2.5">
                                            <span className="text-xs font-medium">
                                                Value:
                                            </span>
                                            <div className="font-mono text-xs mt-1">
                                                {formatEther(
                                                    call.value ?? BigInt(0)
                                                )}{" "}
                                                ETH
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium">
                                                Data:
                                            </span>
                                            <div className="font-mono text-xs text-muted-foreground break-all mt-1">
                                                {(call.data || "0x").length >
                                                400
                                                    ? `${(call.data || "0x").substring(0, 400)}...`
                                                    : call.data || "0x"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            className="w-full justify-center h-11"
                            onClick={sendTransaction}
                            disabled={sendingTransaction}
                        >
                            {sendingTransaction ? (
                                <>
                                    <Loader2 className="mr-2.5 h-4 w-4 animate-spin" />
                                    Sending Transaction...
                                </>
                            ) : (
                                <>
                                    <SendIcon className="mr-2.5 h-4 w-4" />
                                    Confirm and Send
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
