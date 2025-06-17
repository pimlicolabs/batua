import { WagmiProvider } from "wagmi"
import { config } from "./wagmi"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PermissionlessProvider } from "@permissionless/wagmi"
import { capabilities } from "./wagmi"
import { ThemeProvider } from "next-themes"
import { ThemeVarsProvider } from "@/lib/theme-vars"

const queryClient = new QueryClient()

export const Provider = ({ children }: { children: React.ReactNode }) => {
    return (
        <React.StrictMode>
            <WagmiProvider config={config}>
            <ThemeVarsProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                disableTransitionOnChange
                enableSystem
            >
                <QueryClientProvider client={queryClient}>
                    <PermissionlessProvider capabilities={capabilities}>
                        {children}
                    </PermissionlessProvider>
                </QueryClientProvider>
                </ThemeProvider>
                </ThemeVarsProvider>
            </WagmiProvider>
        </React.StrictMode>
    )
}
