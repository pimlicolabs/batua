import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { cn, TEST_ERC20_TOKEN_ADDRESS } from "@/lib/utils"
import { ArrowUp, ArrowDown, Loader2, ExternalLinkIcon } from "lucide-react"
import Link from "next/link"
import { useCallback } from "react"
import { encodeFunctionData, formatUnits, parseUnits } from "viem"
import {
    useAccount,
    useSendTransaction,
    useWaitForTransactionReceipt
} from "wagmi"

export default function MintErc20Token({
    erc20Balance,
    balanceChange
}: {
    erc20Balance: bigint
    balanceChange: "increased" | "decreased" | "none"
}) {
    const account = useAccount()

    const {
        sendTransaction,
        data: transactionReference,
        isPending
    } = useSendTransaction()

    const { data: receipt } = useWaitForTransactionReceipt({
        hash: transactionReference
    })

    const sendTransactionCallback = useCallback(async () => {
        if (!account.address) return
        sendTransaction({
            to: TEST_ERC20_TOKEN_ADDRESS,
            data: encodeFunctionData({
                abi: [
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "to",
                                type: "address"
                            },
                            {
                                internalType: "uint256",
                                name: "amount",
                                type: "uint256"
                            }
                        ],
                        name: "mint",
                        outputs: [],
                        stateMutability: "nonpayable",
                        type: "function"
                    }
                ],
                functionName: "mint",
                args: [account.address, parseUnits("100", 6)] // erc20 has 6 decimals
            })
        })
    }, [account.address, sendTransaction])

    return (
        <div className="">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Test ERC20 Balance:
                </div>
                <div className="text-sm flex items-center gap-2 ">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="p-0 h-auto text-muted-foreground hover:text-foreground"
                                    onClick={sendTransactionCallback}
                                >
                                    Mint test erc20 tokens
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Mint 100 test tokens to smart account to
                                    test transactions
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <div
                        className={cn(
                            "text-sm font-mono px-2 py-1 rounded border-2 flex items-center gap-1",
                            "transition-all duration-500 ease-in-out",
                            balanceChange === "increased" &&
                                [
                                    "bg-green-200 dark:bg-green-700 border-green-500 dark:border-green-400",
                                    "animate-[colorChange_0.5s_ease-in-out]"
                                ].join(" "),
                            balanceChange === "decreased" &&
                                [
                                    "bg-red-200 dark:bg-red-700 border-red-500 dark:border-red-400",
                                    "animate-[colorChange_0.5s_ease-in-out]"
                                ].join(" "),
                            balanceChange === "none" &&
                                [
                                    "bg-muted border-muted-foreground",
                                    "animate-[colorChange_0.5s_ease-in-out]"
                                ].join(" ")
                        )}
                    >
                        {balanceChange === "increased" && (
                            <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400 animate-[fadeIn_0.3s_ease-in-out]" />
                        )}
                        {balanceChange === "decreased" && (
                            <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400 animate-[fadeIn_0.3s_ease-in-out]" />
                        )}
                        <span className="animate-[fadeIn_0.3s_ease-in-out]">
                            {formatUnits(erc20Balance ?? BigInt(0), 6)}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex justify-end">
                {isPending && (
                    <div className="mt-4 flex items-center gap-2 text-amber-600 dark:text-amber-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending transaction...
                    </div>
                )}

                {receipt && (
                    <div className="mt-4 space-y-1">
                        {receipt.transactionHash && (
                            <div className="text-sm overflow-hidden text-ellipsis flex justify-end items-center gap-2">
                                <span className="font-semibold">
                                    Transaction hash:
                                </span>{" "}
                                <Link
                                    href={`https://sepolia.etherscan.io/tx/${receipt.transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-xs hover:underline text-blue-600 dark:text-blue-400 inline-flex items-center gap-1"
                                >
                                    {receipt.transactionHash}
                                    <ExternalLinkIcon className="h-3 w-3" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
