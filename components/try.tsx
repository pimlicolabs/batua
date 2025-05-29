"use client"

import posthog from "@/lib/posthog"
import TryBatchTransactions from "@/components/try-batch-transactions"
import AccountDisconnected from "@/components/account-disconnected"
import { useEffect } from "react"
import TryPermissions from "@/components/try-permissions"

export default function Try() {
    useEffect(() => {
        posthog.capture("pageview", { page: "home" })
    }, [])

    return (
        <div className="mt-14 space-y-6">
            <div className="space-y-4">
                <h2 className="text-xl font-bold">Try Batua</h2>
                <p className="text-muted-foreground">
                    Batua will work along side all the other injected and
                    external wallets.
                </p>
            </div>
            <TryBatchTransactions />
            <TryPermissions />
            <AccountDisconnected />
        </div>
    )
}
