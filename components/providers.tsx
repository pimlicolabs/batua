"use client"

import { ThemeProvider } from "next-themes"
import { ThemeVarsProvider } from "@/lib/theme-vars"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeVarsProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                disableTransitionOnChange
                enableSystem
            >
                {children}
            </ThemeProvider>
        </ThemeVarsProvider>
    )
}
