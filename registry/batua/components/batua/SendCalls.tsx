"use client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import type {
    Account,
    Internal,
    QueuedRequest
} from "@/registry/batua/lib/batua/type"
import { Provider, RpcRequest } from "ox"
import { Button } from "@/components/ui/button"
import {
    type KernelSmartAccountImplementation,
    toKernelSmartAccount
} from "permissionless/accounts"
import { getClient } from "@/registry/batua/lib/batua/helpers/getClient"
import { getSmartAccountClient } from "@/registry/batua/lib/batua/helpers/getSmartAccountClient"
import {
    entryPoint07Address,
    type SmartAccount,
    toWebAuthnAccount,
    type UserOperation
} from "viem/account-abstraction"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
    AlertCircle,
    Braces,
    Check,
    Code,
    File,
    Fingerprint,
    Loader2,
    Parentheses,
    SendIcon
} from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion"
import { formatEther } from "ox/Value"
import {
    type Address,
    zeroAddress,
    type Hex,
    type Transport,
    type Chain,
    parseEther
} from "viem"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { decodeCallData } from "@/registry/batua/lib/batua/helpers/decoder"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import type { SmartAccountClient } from "permissionless"
import { sepolia } from "viem/chains"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"

type DecodedCallData = {
    functionName?: string
    args?: unknown[]
} | null

const SendCallsHeader = () => {
    return (
        <div className="bg-muted/10 rounded-t-lg">
            <DialogHeader className="pb-0 gap-0">
                <div className="flex items-center gap-3">
                    <div className="bg-muted/20 p-2 rounded-full">
                        <SendIcon className="h-5 w-5" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">
                        Send Transaction
                    </DialogTitle>
                </div>
                <DialogDescription className="text-sm">
                    Review and confirm this transaction from your wallet
                </DialogDescription>
            </DialogHeader>
        </div>
    )
}

const CommonCallsSection = ({
    chainName,
    dappName,
    hasPaymaster,
    refreshingGasCost,
    gasCost: costInEther,
    ethPrice
}: {
    chainName: string
    dappName: string
    hasPaymaster: boolean
    refreshingGasCost: boolean
    gasCost: bigint | null
    ethPrice: number
}) => {
    const gasCost = costInEther
        ? Number(costInEther * BigInt(ethPrice)) / (100 * 10 ** 18)
        : null

    return (
        <div className="border rounded-lg p-4 bg-muted/5 mb-5">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Network
                </div>
                <div className="flex items-center bg-muted/10 rounded-full">
                    <span className="text-sm font-medium">{chainName}</span>
                </div>
            </div>

            <div className="flex flex-col w-full">
                <div className="flex items-start justify-between w-full">
                    <div className="text-sm font-medium flex items-center gap-2">
                        Network fee (est.)
                    </div>

                    <div className="text-sm flex items-center gap-1">
                        {!gasCost && (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Calculating...
                            </>
                        )}
                        {gasCost && (
                            <div
                                className={`flex gap-2 justify-center items-center  ${hasPaymaster ? "line-through" : ""} ${refreshingGasCost ? "text-muted-foreground" : ""}`}
                            >
                                {hasPaymaster && (
                                    <span>
                                        {gasCost.toLocaleString("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                            maximumFractionDigits: 2
                                        })}
                                    </span>
                                )}

                                {!hasPaymaster && costInEther && (
                                    <div
                                        className={`flex flex-col justify-end ${refreshingGasCost ? "text-muted-foreground" : ""}`}
                                    >
                                        <div className="flex justify-end">
                                            {gasCost.toLocaleString("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                                maximumFractionDigits: 2
                                            })}
                                        </div>
                                        <div className="flex justify-end text-xs text-muted-foreground">
                                            (
                                            {Number(
                                                formatEther(costInEther)
                                            ).toFixed(5)}{" "}
                                            ETH)
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {hasPaymaster && (
                    <div className="flex justify-end">
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full mt-2 font-medium">
                            Sponsored by {dappName}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const CopyAddress = ({ name, value }: { name: string; value: Hex }) => {
    const [copied, setCopied] = useState(false)
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={() => {
                            navigator.clipboard.writeText(value)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 1000)
                        }}
                        className="relative flex items-center justify-center font-mono text-xs truncate bg-muted/10 hover:bg-muted px-3 py-1.5 rounded-md border-dashed border cursor-pointer transition-colors"
                        title="Click to copy address"
                    >
                        <span
                            style={{
                                visibility: copied ? "hidden" : "visible"
                            }}
                        >
                            {name}
                        </span>
                        <Check
                            className={`h-4 w-4 text-green-500 absolute ${copied ? "visible" : "invisible"}`}
                        />
                    </button>
                </TooltipTrigger>
                <TooltipContent>{value}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

const RenderArg = ({
    arg,
    argIdx
}: {
    arg: unknown
    argIdx: number
}) => {
    return (
        <div className="flex items-center justify-between gap-2 bg-black/5 dark:bg-white/5 px-2 py-1.5 rounded-md">
            <span className="text-xs font-medium px-1.5 py-0.5 bg-muted/20 rounded-full min-w-[40px] text-center whitespace-nowrap">
                Arg {argIdx + 1}
            </span>
            <span className="font-mono text-xs px-2 py-1 rounded truncate flex-shrink">
                {(() => {
                    const argStr =
                        typeof arg === "bigint" ? arg.toString() : String(arg)
                    if (argStr.length > 30 && argStr.startsWith("0x")) {
                        return `${argStr.substring(0, 30)}...`
                    }
                    return argStr
                })()}
            </span>
        </div>
    )
}
const RenderArgs = ({ args }: { args: unknown[] }) => {
    return (
        <div className="mt-3 space-y-2 bg-muted/5 p-3 rounded-md border">
            <div className="text-xs font-medium flex items-center gap-1.5">
                <Parentheses className="h-4 w-4" />
                Arguments
            </div>
            <div className="flex flex-col gap-2 mt-2">
                {args.map((arg, argIdx) => {
                    const key =
                        typeof arg === "string" && arg.startsWith("0x")
                            ? arg
                            : argIdx
                    return <RenderArg key={key} arg={arg} argIdx={argIdx} />
                })}
            </div>
        </div>
    )
}

const RawCallData = ({ data }: { data: Hex }) => {
    const displayData = data || "0x"

    return (
        <div className="flex flex-col mt-3">
            <Accordion type="single" collapsible className="text-xs w-full">
                <AccordionItem value="data" className="border-none">
                    <AccordionTrigger className="font-mono text-xs truncate bg-muted/10 px-3 py-2 rounded-md border border-muted/20 hover:bg-muted/20 transition-colors hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            <div className="text-xs font-medium">
                                Raw Transaction Data
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="font-mono text-xs bg-muted/10 px-3 py-2 rounded-md border border-muted/20 hover:bg-muted/20 transition-colors hover:no-underline break-all">
                        {displayData}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}

const TransactionDetail = ({
    index,
    call,
    decodedCallData,
    account
}: {
    index: number
    call: {
        to?: Address | undefined
        data?: Hex | undefined
        value?: Hex | undefined
    }
    decodedCallData: DecodedCallData[]
    account: Account
}) => {
    return (
        <div className="border rounded-md p-4 bg-muted/5 hover:bg-muted/10 transition-colors">
            {/* Compact transaction diagram */}
            <div className="flex flex-col space-y-2">
                {/* From address */}
                <div className="flex items-center gap-2 justify-between">
                    <div className="w-16 text-xs font-medium flex-1">From:</div>
                    <CopyAddress name={account.name} value={account.address} />
                </div>
                {/* To address */}
                <div className="flex items-center gap-2 justify-between">
                    <div className="w-16 text-xs font-medium">To:</div>
                    <CopyAddress
                        name={`${call.to?.slice(0, 6)}...${call.to?.slice(-4)}`}
                        value={call.to ?? zeroAddress}
                    />
                </div>
                {/* Transaction value */}
                <div className="flex items-center gap-2">
                    <div className="w-16 text-xs font-medium">Value:</div>
                    <div className="font-mono text-xs truncate bg-muted/10 px-3 py-1.5 rounded-md flex-1 border border-muted/20 flex justify-end gap-2">
                        <span>{formatEther(BigInt(call.value ?? 0))}</span>
                        <span className="font-semibold text-xs">ETH</span>
                    </div>
                </div>
                {/* Decoded Data */}
                {call.data && call.data !== "0x" && decodedCallData[index] && (
                    <div className="mt-3 border-t pt-3">
                        <div className="flex items-start gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                                <Braces className="h-4 w-4" />
                                <div className="text-sm font-medium">
                                    Function
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 pl-0">
                            <div className="font-mono text-xs bg-muted/10 px-3 py-2 rounded-md border border-muted/20 font-semibold">
                                {decodedCallData[index]?.functionName ||
                                    "Unknown Function"}
                            </div>
                            {decodedCallData[index]?.args && (
                                <RenderArgs
                                    args={decodedCallData[index]?.args}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Raw Data */}
                {call.data && call.data !== "0x" && (
                    <RawCallData data={call.data} />
                )}
            </div>
        </div>
    )
}

export const SendCalls = ({
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
    const [sendingTransaction, setSendingTransaction] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [decodedCallData, setDecodedCallData] = useState<
        DecodedCallData[] | null
    >(null)
    const [isLoading, setIsLoading] = useState(true)
    const [smartAccountClient, setSmartAccountClient] =
        useState<SmartAccountClient<
            Transport,
            Chain,
            SmartAccount<KernelSmartAccountImplementation<"0.7">>
        > | null>(null)
    const [userOperation, setUserOperation] =
        useState<UserOperation<"0.7"> | null>(null)
    const [refreshingGasCost, setRefreshingGasCost] = useState(false)
    const [ethPrice, setEthPrice] = useState(1500 * 100)
    const [gasCost, setGasCost] = useState<bigint | null>(null)
    const [hasEnoughBalance, setHasEnoughBalance] = useState<boolean>(true)
    const [paused, setPaused] = useState(false)

    const { request, account, chain, hasPaymaster, calls } = useMemo(() => {
        setIsLoading(true)
        const requestStore = RpcRequest.createStore()
        const request = requestStore.prepare(queueRequest.request)
        if (request.method !== "wallet_sendCalls") {
            throw new Provider.UnsupportedMethodError()
        }

        const calls = request.params[0].calls

        const decodedCallDataPromises = Promise.all(
            calls.map((call) => decodeCallData(call.data as Hex))
        )

        decodedCallDataPromises.then((results) => {
            setDecodedCallData(results as DecodedCallData[])
            setTimeout(() => setIsLoading(false), 500)
        })
        const chain = (() => {
            if (dummy) {
                return sepolia
            }
            const store = internal.store.getState()
            return store.chain
        })()

        const hasPaymaster =
            internal.config.paymaster?.transports[chain.id] !== undefined
        if (dummy) {
            setIsLoading(false)
            return {
                request,
                account: {
                    address: privateKeyToAccount(generatePrivateKey()).address,
                    type: "smartAccount",
                    name: "ambitious_deadpool"
                } as const,
                chain: sepolia,
                hasPaymaster: true,
                calls: calls
            }
        }

        const store = internal.store.getState()

        const account = store.accounts.find(
            (account) => account.address === request.params[0].from
        )

        if (!account) {
            throw new Provider.UnauthorizedError()
        }

        const capabilities = request.params[0].capabilities

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

        return { request, account, chain, hasPaymaster, calls }
    }, [dummy, queueRequest.request, internal])

    useEffect(() => {
        if (dummy) {
            return
        }
        const unsubscribe = internal.store.subscribe(
            (x) => x.price,
            (price) => {
                setEthPrice(Number(BigInt((price ?? 1500) * 100)))
            }
        )

        return () => {
            unsubscribe()
        }
    }, [dummy, internal.store])

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

    useEffect(() => {
        if (
            dummy ||
            !smartAccountClient ||
            !request.params ||
            !chain.id ||
            !hasPaymaster
        ) {
            const costInEther = parseEther("0.000075")

            let timer: NodeJS.Timeout | undefined = undefined

            const setCostInEther = () => {
                setRefreshingGasCost(true)
                timer = setTimeout(() => {
                    setGasCost(costInEther)
                    setRefreshingGasCost(false)
                }, 1000)
            }

            const interval = setInterval(() => {
                setCostInEther()
            }, 10_000) // updates every 10 seconds

            setCostInEther()

            // cleanup on unmount
            return () => {
                clearInterval(interval)
                if (timer) {
                    clearTimeout(timer)
                }
            }
        }
        const estimateUserOperation = async () => {
            if (!smartAccountClient || paused) {
                return
            }
            try {
                const client = getClient({ internal, chainId: chain.id })
                const [userOperation, balance] = await Promise.all([
                    await smartAccountClient.prepareUserOperation({
                        calls: request.params[0].calls.map((call) => ({
                            to: call.to ?? "0x",
                            data: call.data ?? "0x",
                            value: call.value ? BigInt(call.value) : undefined
                        })),
                        stateOverride: [
                            {
                                address: smartAccountClient.account.address,
                                balance: parseEther("100")
                            }
                        ]
                    }),
                    await client.getBalance({
                        address: smartAccountClient.account.address
                    })
                ])

                const gasLimit =
                    userOperation.callGasLimit +
                    userOperation.verificationGasLimit +
                    userOperation.preVerificationGas +
                    (userOperation.paymasterPostOpGasLimit ?? BigInt(0)) +
                    (userOperation.preVerificationGas ?? BigInt(0))

                const costInEther = gasLimit * userOperation.maxFeePerGas

                if (balance < costInEther && !hasPaymaster) {
                    setHasEnoughBalance(false)
                } else {
                    setHasEnoughBalance(true)
                }

                setUserOperation(userOperation)
                setGasCost(costInEther)
                setRefreshingGasCost(false)
            } catch (e) {
                setError(
                    e instanceof Error ? e.message : "Failed to estimate gas"
                )
                setRefreshingGasCost(false)
            }
        }

        const interval = setInterval(() => {
            setRefreshingGasCost(true)
            estimateUserOperation()
        }, 10_000) // updates every 10 seconds

        estimateUserOperation()

        // cleanup on unmount
        return () => clearInterval(interval)
    }, [
        dummy,
        request.params,
        smartAccountClient,
        internal,
        chain.id,
        hasPaymaster,
        paused
    ])

    // Scroll to top when error occurs
    useEffect(() => {
        if (error) {
            const dialogContent = document.querySelector(".overflow-y-auto")
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
            setPaused(true)
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
            setPaused(false)
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
            <DialogContent className="sm:max-w-[400px] p-6 h-[75vh] flex justify-start flex-col">
                <SendCallsHeader />
                <div
                    className={`overflow-y-auto pr-2${!hasEnoughBalance ? " pb-36" : ""}`}
                >
                    {error && (
                        <Alert variant="destructive" className="mb-5">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <CommonCallsSection
                        chainName={chain.name}
                        dappName={internal.config.dappName}
                        hasPaymaster={hasPaymaster}
                        refreshingGasCost={refreshingGasCost}
                        gasCost={gasCost}
                        ethPrice={ethPrice}
                    />

                    <div className="space-y-3">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                            <div className="bg-muted/20 p-1 rounded-sm">
                                <File className="h-4 w-4" />
                            </div>
                            Transaction Details
                        </h3>
                        {!isLoading && decodedCallData ? (
                            <div className="space-y-6 pb-20">
                                {calls.map((call, index: number) => (
                                    <TransactionDetail
                                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                        key={index}
                                        call={call}
                                        decodedCallData={decodedCallData}
                                        account={account}
                                        index={index}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
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
                        className="w-full justify-center h-12 text-base font-medium shadow-sm hover:shadow transition-all"
                        onClick={sendTransaction}
                        disabled={sendingTransaction || !hasEnoughBalance}
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
                </div>
            </DialogContent>
        </Dialog>
    )
}
