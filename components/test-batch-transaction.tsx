import { Button } from "@/components/ui/button"
import * as React from "react"
import { useCallback } from "react"
import { useAccount } from "wagmi"
import { encodeFunctionData, erc20Abi, parseUnits } from "viem"
import { ExternalLinkIcon, Loader2 } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { useSendCalls, useWaitForCallsStatus } from "wagmi/experimental"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import Disconnect from "@/components/disconnect"
import { TEST_ERC20_TOKEN_ADDRESS } from "@/lib/utils"
import Link from "next/link"

export default function TestBatchTransaction({
    erc20Balance
}: {
    erc20Balance: bigint
}) {
    const account = useAccount()
    const { sendCalls, data: callStatus } = useSendCalls()

    const { data: callReceipts } = useWaitForCallsStatus({
        id: callStatus?.id
    })

    const sendBatchTransactionCallback = useCallback(async () => {
        if (!account.address) return

        const randomAddressOne = privateKeyToAccount(
            generatePrivateKey()
        ).address

        const randomAddressTwo = privateKeyToAccount(
            generatePrivateKey()
        ).address

        sendCalls({
            calls: [
                {
                    to: TEST_ERC20_TOKEN_ADDRESS,
                    data: encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "transfer",
                        args: [randomAddressOne, parseUnits("10", 6)] // erc20 has 6 decimals
                    })
                },
                {
                    to: TEST_ERC20_TOKEN_ADDRESS,
                    data: encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "transfer",
                        args: [randomAddressTwo, parseUnits("10", 6)] // erc20 has 6 decimals
                    })
                }
            ]
        })
    }, [account.address, sendCalls])

    return (
        <>
            <div className="flex gap-3">
                <Disconnect />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="w-full">
                                <Button
                                    onClick={sendBatchTransactionCallback}
                                    type="button"
                                    disabled={!erc20Balance}
                                    className="w-full"
                                >
                                    Test batch transaction
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {erc20Balance === BigInt(0)
                                ? "Your ERC20 balance is 0. Mint test ERC20 before sending it."
                                : "This will send a batch transaction to send ERC20 tokens to two random addresses"}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {callStatus?.id && !callReceipts?.receipts && (
                <div className="mt-4 flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending batch transaction...
                </div>
            )}
            {callReceipts && (
                <div className="mt-4 space-y-1">
                    {callReceipts.receipts?.[0]?.transactionHash && (
                        <div className="text-sm overflow-hidden text-ellipsis">
                            <span className="font-semibold">
                                Transaction hash:
                            </span>{" "}
                            <Link
                                href={`https://sepolia.etherscan.io/tx/${callReceipts.receipts[0].transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs hover:underline text-blue-600 dark:text-blue-400 inline-flex items-center gap-1"
                            >
                                {callReceipts.receipts[0].transactionHash}
                                <ExternalLinkIcon className="h-3 w-3" />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
