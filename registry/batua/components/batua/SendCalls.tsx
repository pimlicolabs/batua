"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { Internal, QueuedRequest } from "@/registry/batua/lib/batua/type"
import { Provider } from "ox"
import { Button } from "@/components/ui/button"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, Bug, Fingerprint, Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSmartAccount } from "@/registry/batua/hooks/batua/useSmartAccount"
import { useSendCallsRequest } from "@/registry/batua/hooks/batua/useSendCallsRequest"
import { useUserOperation } from "@/registry/batua/hooks/batua/useUserOperation"
import { useEthPrice } from "@/registry/batua/hooks/batua/useEthPrice"
import { useChain } from "@/registry/batua/hooks/batua/useChain"
import { useDecodedCallData } from "@/registry/batua/hooks/batua/useDecodedCallData"
import { useGasCost } from "@/registry/batua/hooks/batua/useGasCost"
import { useBalance } from "@/registry/batua/hooks/batua/useBalance"
import { useAssetChangeEvents } from "@/registry/batua/hooks/batua/useAssetChangeEvents"
import { useClient } from "@/registry/batua/hooks/batua/useClient"
import { SendCallsHeader } from "@/registry/batua/components/batua/SendCallsHeader"
import { NetworkInformation } from "@/registry/batua/components/batua/NetworkInformation"
import { CopyAddress } from "@/registry/batua/components/batua/CopyAddress"
import { AssetChangeEvents } from "@/registry/batua/components/batua/AssetChangeEvents"

export const SendCalls = ({
    onComplete,
    queueRequest,
    internal,
    dummy
}: {
    onComplete: (args: { queueRequest: QueuedRequest }) => void | Promise<void>
    queueRequest: QueuedRequest
    internal: Internal
    dummy?: boolean
}) => {
    const { request, hasPaymaster } = useSendCallsRequest({
        internal,
        queueRequest
    })

    const chain = useChain(internal)
    const client = useClient({ internal, chain: chain })

    const smartAccountClient = useSmartAccount({
        internal,
        accountAddress: request.params[0].from,
        capabilities: request.params[0].capabilities,
        client: client
    })

    const { userOperation, updating: refreshingGasCost } = useUserOperation({
        smartAccountClient,
        request
    })

    // const decodedCallData = useDecodedCallData({
    //     calls: request.params[0].calls
    // })

    const ethPrice = useEthPrice(internal)
    const gasCost = useGasCost(userOperation)
    const balance = useBalance({
        address: userOperation?.sender,
        client: client
    })

    const hasEnoughBalance = useMemo(
        () =>
            balance !== null && gasCost !== null
                ? hasPaymaster || balance > gasCost
                : true,
        [balance, gasCost, hasPaymaster]
    )

    const [sendingTransaction, setSendingTransaction] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const assetChangeEvents = useAssetChangeEvents({
        userOperation,
        client,
        smartAccountClient
    })

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

    // Scroll to top when error occurs
    useEffect(() => {
        if (error) {
            const dialogContent = document.querySelector(".overflow-y-scroll")
            if (dialogContent) {
                dialogContent.scrollTop = 0
            }
        }
    }, [error])

    const sendTransaction = useCallback(async () => {
        if (dummy) {
            return
        }
        try {
            if (!smartAccountClient || !userOperation) {
                return
            }
            setError(null)

            setSendingTransaction(true)

            const signature =
                await smartAccountClient.account.signUserOperation({
                    ...userOperation
                })

            const userOpHash = await smartAccountClient.sendUserOperation({
                ...userOperation,
                signature
            })

            onComplete({
                queueRequest: {
                    request: queueRequest.request,
                    status: "success",
                    result: userOpHash
                }
            })
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to send transaction. Please try again."
            )
        } finally {
            setSendingTransaction(false)
        }
    }, [
        dummy,
        onComplete,
        queueRequest.request,
        smartAccountClient,
        userOperation
    ])

    return (
        <Dialog open={!!queueRequest} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] flex justify-start gap-0 flex-col max-h-[75vh] overflow-y-scroll transition-[max-height] duration-500">
                <SendCallsHeader userOperation={userOperation} />

                {error && (
                    <Alert variant="destructive" className="mb-5">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <NetworkInformation
                    chainName={chain.name}
                    dappName={internal.config.dappName}
                    hasPaymaster={hasPaymaster}
                    refreshingGasCost={refreshingGasCost}
                    gasCost={gasCost}
                    ethPrice={ethPrice}
                />

                <hr className="my-4" />

                {assetChangeEvents === null ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <AssetChangeEvents
                        assetChangeEvents={assetChangeEvents}
                        smartAccountAddress={
                            smartAccountClient?.account.address
                        }
                    />
                )}

                {!hasEnoughBalance && (
                    <Alert variant="destructive" className="mb-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Insufficient balance to cover gas fees for this
                            transaction
                        </AlertDescription>
                    </Alert>
                )}
                <Button
                    variant="default"
                    className="w-full mt-8 justify-center h-12 text-base font-medium shadow-sm hover:shadow transition-all"
                    onClick={sendTransaction}
                    disabled={
                        sendingTransaction ||
                        !hasEnoughBalance ||
                        !userOperation
                    }
                >
                    {sendingTransaction ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            <span>Processing Transaction...</span>
                        </>
                    ) : (
                        <>
                            <Fingerprint className="h-4 w-4" />
                            <span>Confirm and Send</span>
                        </>
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    )
}
