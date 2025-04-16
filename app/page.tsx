"use client"
import { Button } from "@/components/ui/button"
import * as React from "react"
import { useCallback } from "react"
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Highlight, themes } from "prism-react-renderer"
import { encodeFunctionData, erc20Abi, zeroAddress } from "viem"
import { Loader2 } from "lucide-react"

export default function Home() {
    const account = useAccount()
    const { disconnect } = useDisconnect()
    const { connectors, connect, error } = useConnect()

    const {
        sendTransaction,
        data: transactionReference,
        isPending
    } = useSendTransaction()

    const { data: receipt } = useWaitForTransactionReceipt({
        hash: transactionReference
    })

    // Installation tab state
    const [activeTab, setActiveTab] = React.useState<
        "pnpm" | "npm" | "yarn" | "bun"
    >("pnpm")

    // Toast notification state
    const [showToast, setShowToast] = React.useState(false)

    // Command mapping for different package managers
    const installCommands = {
        pnpm: "pnpm dlx shadcn@latest add https://www.batua.sh/r/batua.json",
        npm: "npx shadcn@latest add https://www.batua.sh/r/batua.json",
        yarn: "yarn dlx shadcn@latest add https://www.batua.sh/r/batua.json",
        bun: "bunx --bun shadcn@latest add https://www.batua.sh/r/batua.json"
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

    const sendTransactionCallback = useCallback(async () => {
        sendTransaction({
            to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            data: encodeFunctionData({
                abi: erc20Abi,
                functionName: "transfer",
                args: [zeroAddress, BigInt(1)]
            })
        })
    }, [sendTransaction])

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-4 font-mono">batua.sh</h1>

            <div className="text-base mb-8 font-mono">
                <div className="mb-6">
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            Easy to integrate embedded smart account secured by
                            passkeys
                        </li>
                        <li>Support for sponsoring transactions</li>
                        <li>Support for batching multiple transactions</li>
                        <li>You have the ownership of the complete code</li>
                        <li>
                            Embeds into your application&apos;s theme due to
                            shadcn
                        </li>
                        <li>
                            Works with wagmi, viem, ethers or any other
                            blockchain library
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
                        {transactionReference && !receipt?.transactionHash && (
                            <div className="mb-2 text-sm">
                                <span className="font-semibold">
                                    Awaiting confirmation:
                                </span>{" "}
                                {transactionReference}
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
                        <div className="flex flex-col gap-3 mt-4">
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => disconnect()}
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                >
                                    Disconnect
                                </Button>{" "}
                                <Button
                                    onClick={sendTransactionCallback}
                                    type="button"
                                    disabled={isPending}
                                    className="w-full"
                                >
                                    Send Transaction
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                {account.status === "disconnected" && (
                    <div className="flex flex-wrap gap-3">
                        {connectors.map((connector) => (
                            <Button
                                key={connector.uid}
                                onClick={() => connect({ connector })}
                                type="button"
                                className="flex items-center gap-2"
                                variant={
                                    connector.name === "Batua"
                                        ? "default"
                                        : "outline"
                                }
                            >
                                {connector.name}
                            </Button>
                        ))}
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

            <div className="mt-12 text-sm text-gray-600">
                <p>
                    Published April 9th 2025
                    {/* <a href="#" className="underline">
                        PDF
                    </a>{" "}
                    |{" "}
                    <a href="#" className="underline">
                        Listen
                    </a> */}
                </p>
            </div>

            <div className="mt-10">
                <h2 className="text-4xl font-bold mb-6">Documentation</h2>

                <p className="text-xl mb-6">
                    Experience the future of Web3 development with seamless
                    account abstraction.
                </p>

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
                                    className={`absolute -top-10 right-0 bg-green-100 text-green-800 px-3 py-1 rounded shadow-md text-sm transition-opacity duration-300 ${showToast ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                                >
                                    Copied to clipboard!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-4">Usage</h3>
                    <p className="mb-4">Use batua like:</p>
                    <div className="rounded-lg overflow-x-auto">
                        <Highlight
                            theme={themes.vsLight}
                            code={`import { Batua } from "@/lib/batua"
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
})`}
                            language="tsx"
                        >
                            {({
                                className,
                                style,
                                tokens,
                                getLineProps,
                                getTokenProps
                            }) => (
                                <pre
                                    className={className}
                                    style={{
                                        ...style,
                                        margin: 0,
                                        padding: "1rem",
                                        borderRadius: "0.5rem",
                                        fontSize: "0.875rem"
                                    }}
                                >
                                    {tokens.map((line, lineIdx) => (
                                        <div
                                            key={`line-${
                                                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                                lineIdx
                                            }`}
                                            {...getLineProps({
                                                line,
                                                key: `line-${lineIdx}`
                                            })}
                                        >
                                            {line.map((token, tokenIdx) => (
                                                <span
                                                    key={`token-${lineIdx}-${
                                                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                                        tokenIdx
                                                    }`}
                                                    {...getTokenProps({
                                                        token,
                                                        key: `token-${lineIdx}-${tokenIdx}`
                                                    })}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </pre>
                            )}
                        </Highlight>
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
            </div>
        </div>
    )
}
