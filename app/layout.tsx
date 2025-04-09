import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Provider } from "@/app/provider"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"]
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"]
})

export const metadata: Metadata = {
    title: "Batua - Smart Account Wallet",
    description:
        "Seamlessly integrate smart accounts into your dApps without forcing users to change their workflow. Batua provides a non-custodial solution that enhances user experience while maintaining security and compatibility across the Ethereum ecosystem.",
    openGraph: {
        title: "Batua - Smart Account Wallet",
        description:
            "Seamlessly integrate smart accounts into your dApps without forcing users to change their workflow. Batua provides a non-custodial solution that enhances user experience while maintaining security and compatibility across the Ethereum ecosystem.",
        type: "website",
        url: "https://batua.sh",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Batua Smart Account Wallet"
            }
        ]
    }
}

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <Provider>{children}</Provider>
            </body>
        </html>
    )
}
