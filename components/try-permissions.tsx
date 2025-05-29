import * as React from "react"
import { useAccount } from "wagmi"
import MintErc20Token from "@/components/mint-erc20-token"
import useErc20Balance from "@/hooks/erc20-balance"
import GrantPermissions from "@/components/grant-permissions"

export default function TryPermissions() {
    const account = useAccount()
    const { erc20Balance, balanceChange } = useErc20Balance()

    if (account.status !== "connected") {
        return null
    }

    return (
        <div className="mt-6 p-6 border rounded-lg bg-card shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Try permissions</h3>
            <dl className="space-y-2">
                <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Address:
                    </dt>
                    <dd className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {account.addresses[0]}
                    </dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Chain ID:
                    </dt>
                    <dd className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {account.chainId}
                    </dd>
                </div>
                <MintErc20Token
                    erc20Balance={erc20Balance}
                    balanceChange={balanceChange}
                />
            </dl>

            <GrantPermissions erc20Balance={erc20Balance} />
        </div>
    )
}
