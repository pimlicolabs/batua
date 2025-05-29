"use client"

import { Button } from "@/components/ui/button"
import * as React from "react"

import { Highlight, themes } from "prism-react-renderer"
import { ExternalLink, File } from "lucide-react"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
                        {tokens.map((line, lineIdx) => (
                            <div
                                key={`line-${lineIdx}`}
                                {...getLineProps({
                                    line,
                                    key: `line-${lineIdx}`
                                })}
                                className="flex"
                            >
                                <span>
                                    {line.map((token, tokenIdx) => (
                                        <span
                                            key={`token-${lineIdx}-${tokenIdx}`}
                                            {...getTokenProps({
                                                token,
                                                key: `token-${lineIdx}-${tokenIdx}`
                                            })}
                                        />
                                    ))}
                                </span>
                            </div>
                        ))}
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

export default function Installation() {
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

    return (
        <div className="mt-10">
            <div className="mt-12">
                <Alert variant="destructive" className="text-sm">
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                        Do not use in production environments as of now.
                    </AlertDescription>
                </Alert>
            </div>
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
                        <strong>Note:</strong> After creating Batua, you can use
                        your regular wagmi/ethers libraries and Batua will
                        behave like an injected wallet compatible with EIP-6963.
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
    )
}
