import { TEST_ERC20_TOKEN_ADDRESS } from "@/lib/utils"
import { useEffect } from "react"

import { useState } from "react"
import { erc20Abi } from "viem"
import { useAccount, useConfig, usePublicClient } from "wagmi"

export default function useErc20Balance() {
    const account = useAccount()
    const config = useConfig()
    const client = usePublicClient({
        chainId: config.state.chainId
    })

    const [erc20Balance, setErc20Balance] = useState<bigint>(BigInt(0))
    const [prevErc20Balance, setPrevErc20Balance] = useState<bigint>(BigInt(0))
    const [balanceChange, setBalanceChange] = useState<
        "increased" | "decreased" | "none"
    >("none")
    const [highlightTimeoutId, setHighlightTimeoutId] =
        useState<NodeJS.Timeout | null>(null)

    useEffect(() => {
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

    useEffect(() => {
        if (erc20Balance > prevErc20Balance) {
            setBalanceChange("increased")
        }

        if (erc20Balance < prevErc20Balance) {
            setBalanceChange("decreased")
        }

        if (erc20Balance !== prevErc20Balance) {
            if (highlightTimeoutId) {
                clearTimeout(highlightTimeoutId)
            }
            const timeoutId = setTimeout(() => {
                setBalanceChange("none")
            }, 2000) // Highlight for 2 seconds
            setHighlightTimeoutId(timeoutId)
        }
        setPrevErc20Balance(erc20Balance)

        // Cleanup timeout on component unmount
        return () => {
            if (highlightTimeoutId) {
                clearTimeout(highlightTimeoutId)
            }
        }
    }, [erc20Balance, prevErc20Balance, highlightTimeoutId])

    return {
        erc20Balance,
        balanceChange
    }
}
