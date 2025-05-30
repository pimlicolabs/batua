import { Button } from "@/components/ui/button"
import type { Internal, QueuedRequest } from "@/registry/batua/lib/batua/type"
import { Loader2, Copy, Check } from "lucide-react"
import { Provider } from "ox"
import { useState, useCallback } from "react"
import { formatUnits, type WalletGrantPermissionsParameters } from "viem"

export const GrantPermissions = ({
    onComplete,
    queueRequest,
    internal,
    dummy
}: {
    onComplete: (args: {
        queueRequest: QueuedRequest
    }) => void | Promise<void>
    queueRequest: QueuedRequest
    internal: Internal
    dummy?: boolean
}) => {
    const [isLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [justCopied, setJustCopied] = useState<"spender" | "token" | null>(
        null
    )

    const handleGrant = useCallback(async () => {
        if (dummy) return
        // try {
        //     setIsLoading(true)
        //     setError(null)

        //     const result =
        //         await internal.implementation.actions.grantPermissions({
        //             client: internal.client,
        //             config: internal.config,
        //             request: queueRequest.request,
        //             store: internal.store,
        //             permission: queueRequest.request.params[0] as WalletGrantPermissionsParameters
        //         })

        //     onComplete({
        //         queueRequest: {
        //             request: queueRequest.request,
        //             status: "success",
        //             result
        //         }
        //     })
        // } catch (err) {
        //     setError(
        //         err instanceof Error
        //             ? err.message
        //             : "Failed to grant permissions"
        //     )
        //     onComplete({
        //         queueRequest: {
        //             request: queueRequest.request,
        //             status: "error",
        //             error: {
        //                 code: "UNKNOWN_ERROR",
        //                 message: err instanceof Error ? err.message : "Failed to grant permissions"
        //             } as any
        //         }
        //     })
        // } finally {
        //     setIsLoading(false)
        // }
    }, [dummy])

    const handleCopy = useCallback(
        (textToCopy: string, type: "spender" | "token") => {
            if (textToCopy && textToCopy !== "N/A") {
                navigator.clipboard
                    .writeText(textToCopy)
                    .then(() => {
                        setJustCopied(type)
                        setTimeout(() => setJustCopied(null), 1500) // Reset after 1.5 seconds
                    })
                    .catch((err) => {
                        console.error("Failed to copy text: ", err)
                        // Optionally, handle copy error feedback here
                    })
            }
        },
        []
    )

    const handleReject = useCallback(() => {
        onComplete({
            queueRequest: {
                request: queueRequest.request,
                status: "error",
                error: new Provider.UserRejectedRequestError()
            }
        })
    }, [queueRequest, onComplete])

    if (
        !queueRequest ||
        !queueRequest.request ||
        !Array.isArray(queueRequest.request.params) ||
        queueRequest.request.params.length === 0
    )
        return null
    const permission = queueRequest.request
        .params[0] as WalletGrantPermissionsParameters

    console.log({ permission })

    const ticker =
        (
            permission?.permissions?.[0]?.data as unknown as {
                ticker: string
            }
        )?.ticker ?? "PIM"
    const spenderId =
        (
            permission?.signer?.data as unknown as {
                id: string
            }
        )?.id ?? "N/A"
    const tokenAddress =
        (
            permission?.permissions?.[0]?.data as unknown as {
                address: string
            }
        )?.address ?? "N/A"
    const allowance = formatUnits(
        (
            permission?.permissions?.[0]?.policies?.[0]?.data as unknown as {
                allowance: bigint
            }
        )?.allowance ?? BigInt(0),
        6
    )
    const expiryTimestamp = permission?.expiry
    let expiresInDays = "N/A"
    if (expiryTimestamp && !Number.isNaN(new Date(expiryTimestamp).getTime())) {
        const days = Math.ceil(
            (new Date(expiryTimestamp).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
        )
        expiresInDays = `${days} days`
    }

    // console.log({
    //     permission
    // })

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-center mb-4">
                    Token Permission Request
                </h2>
                <div className="text-sm text-muted-foreground mb-6">
                    <p className="text-center">
                        The application is requesting permission to spend your{" "}
                        <span className="font-semibold text-foreground">
                            {ticker}
                        </span>{" "}
                        tokens.
                    </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border border-border shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                            Spender Address:
                        </span>
                        <div className="flex items-center">
                            <span className="text-sm font-mono bg-background px-2 py-1 rounded border break-all">
                                {spenderId !== "N/A"
                                    ? `${spenderId.substring(0, 6)}...`
                                    : "N/A"}
                            </span>
                            {spenderId !== "N/A" && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        handleCopy(spenderId, "spender")
                                    }
                                    className="ml-2 h-7 w-7 flex-shrink-0"
                                    aria-label="Copy spender address"
                                >
                                    {justCopied === "spender" ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                            Token Address:
                        </span>
                        <div className="flex items-center">
                            <span className="text-sm font-mono bg-background px-2 py-1 rounded border break-all">
                                {tokenAddress !== "N/A"
                                    ? `${tokenAddress.substring(0, 6)}...`
                                    : "N/A"}
                            </span>
                            {tokenAddress !== "N/A" && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        handleCopy(tokenAddress, "token")
                                    }
                                    className="ml-2 h-7 w-7 flex-shrink-0"
                                    aria-label="Copy token address"
                                >
                                    {justCopied === "token" ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                            Allowance:
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                            {allowance} {ticker}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                            Expires in:
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                            {expiresInDays}
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mt-4">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-3 mt-6">
                <Button
                    onClick={handleGrant}
                    disabled={isLoading}
                    className="w-full"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Granting Permission...
                        </>
                    ) : (
                        "Grant Permission"
                    )}
                </Button>
                <Button
                    onClick={handleReject}
                    variant="outline"
                    disabled={isLoading}
                    className="w-full"
                >
                    Reject
                </Button>
            </div>
        </div>
    )
}
