"use client"

import posthog from "@/lib/posthog"
import { Button } from "@/components/ui/button"
import * as React from "react"
import { useCallback } from "react"
import {
    useConfig,
    useConnect,
    usePublicClient,
    useSendTransaction,
    useWaitForTransactionReceipt
} from "wagmi"
import { useAccount, useDisconnect } from "wagmi"
import { Highlight, themes } from "prism-react-renderer"
import { encodeFunctionData, erc20Abi, parseUnits } from "viem"
import { ExternalLink, File, Loader2 } from "lucide-react"
import Image from "next/image"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { useSendCalls, useWaitForCallsStatus } from "wagmi/experimental"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"

const TEST_ERC20_TOKEN_ADDRESS =
    "0xFC3e86566895Fb007c6A0d3809eb2827DF94F751" as const

const BatchCode = `import { useSendCalls } from "wagmi/experimental"

const account = useAccount()
const { sendCalls, data: callStatus } = useSendCalls()

const { data: callReceipts } = useWaitForCallsStatus({
    id: callStatus?.id
})

const callSucceeded = callReceipts.status === "success"
const callPending = callReceipts.status === "pending"

if (callSucceeded) {
    const transactionHash = callReceipts.receipts[0].transactionHash
}

const sendBatchTransactionCallback = useCallback(async () => {
    if (!account.address) return

    sendCalls({
        calls: [
            {
                to: TEST_ERC20_TOKEN_ADDRESS,
                data: encodeFunctionData({
                    abi: erc20Abi,
                    functionName: "transfer",
                    args: [randomAddressOne, parseUnits("1", 6)]
                })
            },
            {
                to: TEST_ERC20_TOKEN_ADDRESS,
                data: encodeFunctionData({
                    abi: erc20Abi,
                    functionName: "transfer",
                    args: [randomAddressTwo, parseUnits("1", 6)]
                })
            }
        ]
    })
}, [account.address, sendCalls])`

const UsageCode = `import { Batua } from "@/lib/batua"
import { sepolia } from "viem/chains"
import { http } from "viem/transport"

const pimlicoApiKey = "your-pimlico-api-key"

Batua.create({
    rpc: {
        transports: {
            [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com")
        }
    },
    // optional
    paymaster: {
        transports: {
            [sepolia.id]: http(
                \`https://api.pimlico.io/v2/\${sepolia.id}/rpc?apikey=\${pimlicoApiKey}\`
            )
        },
        // optional
        context: {
            sponsorshipPolicyId: process.env.NEXT_PUBLIC_SPONSORSHIP_POLICY_ID
        }
    },
    bundler: {
        transports: {
            [sepolia.id]: http(
                \`https://api.pimlico.io/v2/\${sepolia.id}/rpc?apikey=\${pimlicoApiKey}\`
            )
        }
    }
})`

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const RenderCode = ({ code }: { code: string }) => {
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!copied) return
        const timeout = setTimeout(() => setCopied(false), 1500)
        return () => clearTimeout(timeout)
    }, [copied])

    return (
        <Highlight theme={themes.vsLight} code={code} language="tsx">
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <div className="relative">
                    <pre
                        className={`${className} border-1 overflow-auto`}
                        style={{
                            ...style,
                            margin: 0,
                            padding: "1rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                            maxWidth: "100%"
                        }}
                    >
                        {tokens.map((line, lineIdx) => {
                            const lineKey = `line-${lineIdx}`
                            const { className, style } = getLineProps({
                                line,
                                key: lineKey
                            })
                            return (
                                <div
                                    key={lineKey}
                                    className={`flex ${className}`}
                                    style={style}
                                >
                                    <span>
                                        {line.map((token, tokenIdx) => {
                                            const tokenKey = `token-${lineIdx}-${tokenIdx}`
                                            const {
                                                className,
                                                style,
                                                children
                                            } = getTokenProps({
                                                token,
                                                key: tokenKey
                                            })
                                            return (
                                                <span
                                                    key={tokenKey}
                                                    className={className}
                                                    style={style}
                                                >
                                                    {children}
                                                </span>
                                            )
                                        })}
                                    </span>
                                </div>
                            )
                        })}
                    </pre>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                            navigator.clipboard.writeText(code)
                            setCopied(true)
                        }}
                        aria-label="Copy code"
                    >
                        <File className="h-4 w-4" />
                    </Button>
                    {copied && (
                        <span className="absolute top-2 right-12 bg-zinc-800 text-white text-xs px-2 py-1 rounded shadow">
                            Copied!
                        </span>
                    )}
                </div>
            )}
        </Highlight>
    )
}

export default function Home() {
    const account = useAccount()
    const { disconnect } = useDisconnect()
    const { connectors, connect, error } = useConnect()
    React.useEffect(() => {
        posthog.capture("pageview", { page: "home" })
    }, [])
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
    const [activeTab, setActiveTab] = React.useState<
        "pnpm" | "npm" | "yarn" | "bun"
    >("pnpm")

    // Toast notification state
    const [showToast, setShowToast] = React.useState(false)

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

    const [erc20Balance, setErc20Balance] = React.useState<bigint | undefined>(
        undefined
    )

    React.useEffect(() => {
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
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-10 font-mono">batua.sh</h1>

            <div className="text-base mb-8 font-mono">
                <div className="mb-6">
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            Easy to integrate embedded smart account secured by
                            passkeys
                        </li>
                        <li>Support for sponsoring transactions</li>
                        <li>Support for batching multiple transactions</li>
                        <li>You have the complete ownership of the code</li>
                        <li>
                            Embeds into your application&apos;s theme due to
                            shadcn
                        </li>
                        <li>
                            Works with wagmi, viem, ethers, privy, dynamic, and
                            more
                        </li>
                    </ul>
                    <p className="mt-10 text-sm">Made with ❤️ from Pimlico</p>
                </div>
            </div>

            <div className="mt-14 space-y-6">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Try Batua</h2>
                    <p className="text-muted-foreground">
                        Batua will work along side all the other injected and
                        external wallets.
                    </p>
                </div>
                {account.status === "connected" && (
                    <div className="mt-6 p-4 border rounded-lg bg-card shadow-sm">
                        <div className="mb-3 text-sm">
                            <span className="font-semibold">Address:</span>{" "}
                            {account.addresses[0]}
                        </div>
                        <div className="mb-3 text-sm">
                            <span className="font-semibold">Chain ID:</span>{" "}
                            {account.chainId}
                        </div>
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
                                {receipt.transactionHash}
                            </div>
                        )}

                        {callStatus?.id && !callReceipts?.receipts && (
                            <div className="flex items-center gap-2 text-amber-500 mb-2">
                                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                                Sending batch transaction...
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
                                {callReceipts.receipts[0].transactionHash}
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
                                <Button
                                    onClick={sendTransactionCallback}
                                    type="button"
                                    disabled={isPending}
                                    className="w-full"
                                >
                                    Mint test erc20 tokens
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
                {account.status === "disconnected" && (
                    <div className="flex flex-wrap gap-3">
                        {connectors.map(
                            (connector) =>
                                connector.name === "Batua" && (
                                    <Button
                                        key={connector.uid}
                                        onClick={() => connect({ connector })}
                                        type="button"
                                        className="flex items-center gap-2 w-60"
                                        variant={
                                            connector.name === "Batua"
                                                ? "default"
                                                : "outline"
                                        }
                                    >
                                        {connector.name}
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

            {/* <div className="flex flex-wrap gap-4">
                <a
                    href="#what"
                    className="border border-black px-6 py-3 rounded hover:bg-gray-100 transition-colors"
                >
                    What is this?
                </a>
                <a
                    href="#how"
                    className="border border-black px-6 py-3 rounded hover:bg-gray-100 transition-colors"
                >
                    How does it work?
                </a>
                <a
                    href="#why"
                    className="border border-black px-6 py-3 rounded hover:bg-gray-100 transition-colors"
                >
                    Why is it valuable?
                </a>
                <a
                    href="#who"
                    className="border border-black px-6 py-3 rounded hover:bg-gray-100 transition-colors"
                >
                    Who are we?
                </a>
            </div> */}

            <div className="mt-12">
                <Alert variant="destructive" className="text-sm">
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                        Do not use in production environments as of now.
                    </AlertDescription>
                </Alert>
            </div>

            <div className="mt-10">
                <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-4">Installation</h3>
                    <div className="border rounded-lg mb-6">
                        <h4 className="text-xl font-semibold mb-4 p-6 pb-0">
                            Install using the CLI
                        </h4>
                        <p className="mb-4 px-6">
                            To install a registry item using the{" "}
                            <code className="bg-gray-100 px-2 py-1 rounded">
                                shadcn
                            </code>{" "}
                            CLI, use the{" "}
                            <code className="bg-gray-100 px-2 py-1 rounded">
                                add
                            </code>{" "}
                            command followed by the URL of the registry item.
                        </p>

                        <div className="mt-6">
                            <div className="border-b flex">
                                {(
                                    Object.keys(installCommands) as Array<
                                        keyof typeof installCommands
                                    >
                                ).map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        className={`px-4 py-2 focus:outline-none ${activeTab === tab ? "border-b-2 border-black font-medium" : ""}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <div className="p-4 bg-gray-100 rounded-b-md flex justify-between items-center relative">
                                <code className="font-mono text-sm">
                                    {installCommands[activeTab]}
                                </code>
                                <button
                                    type="button"
                                    className="p-2 hover:bg-gray-200 rounded"
                                    aria-label="Copy to clipboard"
                                    onClick={copyToClipboard}
                                >
                                    <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 15 15"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                    >
                                        <title>Copy</title>
                                        <path
                                            d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V1H3.5C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V2.5C13 1.67157 12.3284 1 11.5 1H11V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM11 2V2.25C11 2.66421 10.6642 3 10.25 3H4.75C4.33579 3 4 2.66421 4 2.25V2H3.5C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V2.5C12 2.22386 11.7761 2 11.5 2H11Z"
                                            fill="currentColor"
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                                <div
                                    className={`absolute -top-10 right-0 bg-zinc-800 text-white text-xs px-2 py-1 rounded shadow transition-opacity duration-300 ${showToast ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                                >
                                    Copied to clipboard!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-4">Usage</h3>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xl font-semibold mb-2">
                                Step 1: Set up Passkey Server
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                                Go to{" "}
                                <a
                                    href="https://dashboard.pimlico.io/passkey-server"
                                    className="text-blue-600 hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    https://dashboard.pimlico.io/passkey-server
                                </a>{" "}
                                and configure your passkey server.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xl font-semibold mb-2">
                                Step 2: Implement Batua
                            </h4>
                            <div className="rounded-lg overflow-x-auto">
                                <RenderCode code={UsageCode} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">
                            <strong>Note:</strong> After creating Batua, you can
                            use your regular wagmi/ethers libraries and Batua
                            will behave like an injected wallet compatible with
                            EIP-6963.
                        </p>
                    </div>
                </div>
                <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-4">Customise Batua</h3>
                    <Button
                        variant={"outline"}
                        asChild
                        className="gap-1 bg-pink-50 hover:bg-pink-100 text-pink-500 border-pink-200 shadow-sm transition-all duration-300"
                    >
                        <a
                            href="https://tweak.batua.sh/"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 justify-center"
                        >
                            <span>Customise Batua</span>
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                </div>

                <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-4">
                        Send batch transactions
                    </h3>
                    <RenderCode code={BatchCode} />
                </div>
            </div>
            <div className="mt-12 flex justify-center">
                <a
                    href="https://github.com/pimlicolabs/batua"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="View Batua on GitHub"
                >
                    <Image
                        src="/github.svg"
                        alt="GitHub"
                        width={24}
                        height={24}
                        className="w-6 h-6 fill-current"
                        aria-hidden="true"
                    />
                    <span className="font-medium">View on GitHub</span>
                </a>
            </div>
        </div>
    )
}
