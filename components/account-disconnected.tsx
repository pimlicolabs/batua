"use client"

import { Button } from "@/components/ui/button"
import * as React from "react"
import { useConnect } from "wagmi"
import { useAccount } from "wagmi"

export default function AccountDisconnected() {
    const account = useAccount()
    const { connectors, connect, error } = useConnect()

    if (account.status !== "disconnected") {
        return null
    }

    return (
        <>
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
            {error && (
                <div className="text-sm text-destructive">{error.message}</div>
            )}
        </>
    )
}
