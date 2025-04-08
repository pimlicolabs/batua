"use client"

import { WagmiProvider } from "wagmi"
import { config } from "@/app/wagmi"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PermissionlessProvider } from "@permissionless/wagmi"
import { capabilities } from "@/app/wagmi"

const queryClient = new QueryClient()

export const Provider = ({ children }: { children: React.ReactNode }) => {
    return (
        <React.StrictMode>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    <PermissionlessProvider capabilities={capabilities}>
                        {children}
                    </PermissionlessProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </React.StrictMode>
    )
}
