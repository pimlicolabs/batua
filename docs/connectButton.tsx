import { useConfig, useConnect, useDisconnect, usePublicClient, useSendCalls, useSendTransaction, useWaitForCallsStatus, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { useCallback, useEffect, useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CopyAddress } from "@/registry/batua/components/batua/CopyAddress";

const TEST_ERC20_TOKEN_ADDRESS =
    "0xFC3e86566895Fb007c6A0d3809eb2827DF94F751" as const

    import { useThemeVars } from '@/lib/theme-vars'

    function ThemeCustomizer() {
  const { themeVars, setThemeVars } = useThemeVars()

  return (
    <button
      onClick={() =>
        setThemeVars({ primary: '#e11d48', foreground: '#ffffff' })
      }
    >
      Make it pink
    </button>
  )
}


export function ConnectButton() {
    const account = useAccount()
    const { disconnect } = useDisconnect()
    const { connectors, connect, error } = useConnect()
    const config = useConfig()

    const client = usePublicClient({
        chainId: config.state.chainId
    })
    

    const {
        sendTransaction,
        data: transactionReference,
        isPending
    } = useSendTransaction()

    const { sendCalls, data: callStatus } = useSendCalls()

    const { data: receipt } = useWaitForTransactionReceipt({
        hash: transactionReference
    })

    const { data: callReceipts } = useWaitForCallsStatus({
        id: callStatus?.id
    })

    // Installation tab state
    const [activeTab, setActiveTab] = useState<
        "pnpm" | "npm" | "yarn" | "bun"
    >("pnpm")

    // Toast notification state
    const [showToast, setShowToast] = useState(false)

    // Command mapping for different package managers
    const installCommands = {
        pnpm: "pnpm dlx shadcn@latest add https://batua.sh/install",
        npm: "npx shadcn@latest add https://batua.sh/install",
        yarn: "yarn dlx shadcn@latest add https://batua.sh/install",
        bun: "bunx --bun shadcn@latest add https://batua.sh/install"
    } as const

    // Copy to clipboard function
    const copyToClipboard = () => {
        navigator.clipboard
            .writeText(installCommands[activeTab])
            .then(() => {
                setShowToast(true)
                setTimeout(() => setShowToast(false), 2000)
            })
            .catch((err) => console.error("Failed to copy: ", err))
    }

    const [erc20Balance, setErc20Balance] = useState<bigint | undefined>(
        undefined
    )

    useEffect(() => {
        const fetchErc20Balance = async () => {
            if (!account.address) return

            const balance = await client.readContract({
                address: TEST_ERC20_TOKEN_ADDRESS,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [account.address]
            })
            setErc20Balance(balance)
        }

        fetchErc20Balance()

        const interval = setInterval(() => {
            fetchErc20Balance()
        }, 5_000)

        return () => clearInterval(interval)
    }, [account.address, client])

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
                        functionName: "approve",
                        args: [randomAddressOne, parseUnits("100", 6)] // erc20 has 6 decimals
                    })
                },
                {
                    to: TEST_ERC20_TOKEN_ADDRESS,
                    data: encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "transfer",
                        args: [randomAddressOne, parseUnits("1", 6)] // erc20 has 6 decimals
                    })
                },
                {
                    to: TEST_ERC20_TOKEN_ADDRESS,
                    data: encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "approve",
                        args: [randomAddressOne, parseUnits("100", 6)] // erc20 has 6 decimals
                    })
                },
                {
                    to: TEST_ERC20_TOKEN_ADDRESS,
                    data: encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "transfer",
                        args: [randomAddressTwo, parseUnits("1", 6)] // erc20 has 6 decimals
                    })
                },
                {
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
                }
            ]
        })
    }, [account.address, sendCalls])

    return (
        <div className="w-fit flex items-center flex-col gap-2 max-w-[90vw]">
            {/* <ThemeCustomizer /> */}
                {account.status === "connected" && (
                    <div className="p-4 border rounded-lg bg-card shadow-sm max-w-[90vw]">
                        <div className="mb-3 text-sm">
                            {/* <span className="font-semibold">Address:</span>{" "} */}
                            <CopyAddress className="py-2 text-2xl w-98 max-w-[80vw]" name={account.addresses[0]} value={account.addresses[0]} />
                        </div>
                        {/* <div className="mb-3 text-sm">
                            <span className="font-semibold">Chain ID:</span>{" "}
                            {account.chainId}
                        </div> */}
                        {isPending && (
                            <div className="flex items-center gap-2 text-amber-500 mb-2">
                                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                                Sending transaction...
                            </div>
                        )}

                        {receipt && (
                            <div className="mb-2 text-sm">
                                <span className="font-semibold">Status:</span>{" "}
                                <span
                                    className={
                                        receipt.status
                                            ? "text-green-500"
                                            : "text-red-500"
                                    }
                                >
                                    {receipt.status ? "Success" : "Failed"}
                                </span>
                            </div>
                        )}
                        {receipt?.transactionHash && (
                            <div className="mb-3 text-sm overflow-hidden text-ellipsis">
                                <span className="font-semibold">
                                    Transaction hash:
                                </span>{" "}
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${receipt.transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline text-blue-600 hover:text-blue-800 break-all"
                                >
                                    {receipt.transactionHash}
                                </a>
                            </div>
                        )}

                        {callStatus?.id && !callReceipts?.receipts && (
                            <div className="flex items-center gap-2 text-amber-500 mb-2">
                                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                                Sending batch...
                            </div>
                        )}
                        {callReceipts && (
                            <div className="mb-2 text-sm">
                                <span className="font-semibold">Status:</span>{" "}
                                <span
                                    className={
                                        callReceipts.status === "success"
                                            ? "text-green-500"
                                            : callReceipts.status === "pending"
                                              ? "text-yellow-500"
                                              : "text-red-500"
                                    }
                                >
                                    {callReceipts.status === "success"
                                        ? "Success"
                                        : callReceipts.status === "pending"
                                          ? "Pending"
                                          : "Failed"}
                                </span>
                            </div>
                        )}
                        {callReceipts?.receipts && (
                            <div className="mb-3 text-sm overflow-hidden text-ellipsis">
                                <span className="font-semibold">
                                    Transaction hash:
                                </span>{" "}
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${callReceipts.receipts[0].transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline text-blue-600 hover:text-blue-800 break-all"
                                >
                                    {callReceipts.receipts[0].transactionHash}
                                </a>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-4">
                            <div className="flex gap-3">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="w-full">
                                                <Button
                                                    onClick={
                                                        sendBatchTransactionCallback
                                                    }
                                                    type="button"
                                                    disabled={
                                                        isPending ||
                                                        !erc20Balance
                                                    }
                                                    className="w-full"
                                                    variant="outline"
                                                >
                                                    Send Batch
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
                                <Button
                                    onClick={sendTransactionCallback}
                                    type="button"
                                    disabled={isPending}
                                    className="w-full"
                                >
                                    Mint ERC-20
                                </Button>
                            </div>
                            <Button
                                onClick={() => disconnect()}
                                type="button"
                                variant="outline"
                                className="w-full"
                            >
                                Disconnect
                            </Button>
                        </div>
                    </div>
                )}
                {account.status !== "connected" && (
                    <div className="flex flex-wrap gap-3 w-fit max-w-[90vw]">
                        {Array.from(
                            new Map(connectors.map(c => [c.id, c])).values()
                        ).map(
                            (connector) =>
                                connector.name === "Batua" && (
                                    <Button
                                        key={connector.uid}
                                        onClick={() => connect({ connector })}
                                        type="button"
                                        className="flex items-center gap-2 w-40"
                                        variant={
                                            connector.name === "Batua"
                                                ? "default"
                                                : "outline"
                                        }
                                    >
                                        {connector.name === "Batua" ? "Try Batua" : connector.name}
                                    </Button>
                                )
                        )}
                    </div>
                )}
                {error && (
                    <div className="text-sm text-destructive">
                        {error.message}
                    </div>
                )}
            </div>
    )
}

export default ConnectButton;

