import { CopyAddress } from "@/registry/batua/components/batua/CopyAddress"
import { EventRow } from "@/registry/batua/components/batua/EventRow"
import { AssetChangeEvent } from "@/registry/batua/hooks/batua/useAssetChangeEvents"
import { shortenAddress } from "@/registry/batua/lib/batua/utils"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { useMemo } from "react"
import { Address, formatUnits } from "viem"

const useAggregatedTransfers = (transfers: AssetChangeEvent<"Transfer">[]) => {
    const aggregatedTransfers = useMemo(() => {
        const aggregatedTransfersMap = new Map<
            string,
            AssetChangeEvent<"Transfer">
        >()

        for (const transfer of transfers) {
            const key = `${transfer.address}-${transfer.args.to}`
            if (aggregatedTransfersMap.has(key) && "value" in transfer.args) {
                const existingTransfer = aggregatedTransfersMap.get(key)
                if (existingTransfer && "value" in existingTransfer.args) {
                    existingTransfer.args.value += transfer.args.value
                }
            } else {
                aggregatedTransfersMap.set(key, transfer)
            }
        }

        return Array.from(aggregatedTransfersMap.values())
    }, [transfers])

    return aggregatedTransfers
}

export const TransferEvents = ({
    transfers,
    smartAccountAddress
}: {
    transfers: AssetChangeEvent<"Transfer">[]
    smartAccountAddress: Address
}) => {
    if (transfers.length === 0) {
        return null
    }

    const aggregatedTransfers = useAggregatedTransfers(transfers)

    return (
        // <div className="space-y-2">
        // <div className="space-y-1">
        aggregatedTransfers.map((event, idx) => {
            const isOutgoingTransfer = event.args.from === smartAccountAddress
            const isIncomingTransfer = event.args.to === smartAccountAddress

            // Handle ERC20 transfers
            if ("value" in event.args && event.tokenInfo) {
                const amount = event.tokenInfo.decimals
                    ? formatUnits(event.args.value, event.tokenInfo.decimals)
                    : undefined
                const tokenSymbol = event.tokenInfo.symbol || "Unknown"

                return (
                    <EventRow
                        key={`${event.address}-${event.args.to}`}
                        icon={
                            isOutgoingTransfer ? (
                                <ArrowUpRight className="h-4 w-4" />
                            ) : (
                                <ArrowDownRight className="h-4 w-4" />
                            )
                        }
                        name={`${
                            amount !== undefined
                                ? Number(amount).toLocaleString("en-US", {
                                      maximumFractionDigits: 0
                                  })
                                : "?"
                        } ${tokenSymbol}`}
                        address={event.args.to}
                    />
                )
            }

            // Handle ERC721 transfers
            if ("tokenId" in event.args && event.nftInfo) {
                return (
                    <EventRow
                        key={`${event.address}-${event.args.to}`}
                        icon={
                            isOutgoingTransfer ? (
                                <ArrowUpRight className="h-4 w-4" />
                            ) : (
                                <ArrowDownRight className="h-4 w-4" />
                            )
                        }
                        name={event.nftInfo.name ?? "NFT"}
                        address={event.args.to}
                    />
                )
            }

            // Fallback for unknown transfer types
            return (
                <EventRow
                    key={`${event.address}-${event.args.to}`}
                    icon={
                        isOutgoingTransfer ? (
                            <ArrowUpRight className="h-4 w-4" />
                        ) : (
                            <ArrowDownRight className="h-4 w-4" />
                        )
                    }
                    name={event.address}
                    address={event.args.to}
                />
            )
        })
        // </div>
        // </div>
    )
}
