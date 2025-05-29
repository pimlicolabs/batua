import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { erc7715Actions } from "viem/experimental"
import { useAccount, useWalletClient } from "wagmi"
import { privateKeyToAccount } from "viem/accounts"
import { TEST_ERC20_TOKEN_ADDRESS } from "@/lib/utils"
import { parseUnits } from "viem"

const accountWithPermissions = privateKeyToAccount(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // anvil private keys
)

export default function GrantPermissions({
    erc20Balance
}: {
    erc20Balance: bigint
}) {
    const { data } = useWalletClient()
    const account = useAccount()

    const requestPermissions = async () => {
        if (!data || !account) return

        const walletClient = data.extend(erc7715Actions())

        try {
            const response = await walletClient.grantPermissions({
                expiry: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days,
                account: accountWithPermissions,
                permissions: [
                    {
                        type: "erc20-token-transfer",
                        data: {
                            address: TEST_ERC20_TOKEN_ADDRESS,
                            ticker: "PIM"
                        },
                        policies: [
                            {
                                type: "token-allowance",
                                data: {
                                    allowance: parseUnits("1000", 6)
                                }
                            }
                        ]
                    }
                ]
            })
            console.log(response)
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <>
            <div className="flex gap-3 mt-6 mb-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="w-full">
                                <Button
                                    onClick={requestPermissions}
                                    type="button"
                                    disabled={!erc20Balance}
                                    className="w-full"
                                >
                                    Grant permissions from Batua
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            This will request permissions to spend your ERC20
                            balance
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </>
    )
}
