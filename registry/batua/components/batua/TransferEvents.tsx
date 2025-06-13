import { EventRow } from "@/registry/batua/components/batua/EventRow"
import { AssetChangeEvent } from "@/registry/batua/hooks/batua/useAssetChangeEvents"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { useMemo } from "react"
import { Address, formatUnits } from "viem"

export const useAggregatedTransfers = (
    transfers: AssetChangeEvent<"Transfer">[]
) => {
    const aggregatedTransfers = useMemo(() => {
        const aggregatedTransfersMap = new Map<
            string,
            AssetChangeEvent<"Transfer">
        >()

        for (const transfer of transfers) {
            const key = `${transfer.address}-${transfer.args.to}`

            // Clone the incoming event to guarantee immutability
            const clonedTransfer = {
                ...transfer,
                args: { ...transfer.args }
            } as AssetChangeEvent<"Transfer">

            if (
                aggregatedTransfersMap.has(key) &&
                "value" in clonedTransfer.args
            ) {
                const existingTransfer = aggregatedTransfersMap.get(key)!

                const existingValue = (existingTransfer.args as any).value
                const newValue = (clonedTransfer.args as any).value

                if (
                    typeof existingValue === "bigint" &&
                    typeof newValue === "bigint"
                ) {
                    const updatedTransfer = {
                        ...existingTransfer,
                        args: {
                            ...existingTransfer.args,
                            value: existingValue + newValue
                        }
                    } as AssetChangeEvent<"Transfer">

                    aggregatedTransfersMap.set(key, updatedTransfer)
                }
            } else {
                aggregatedTransfersMap.set(key, clonedTransfer)
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

    return aggregatedTransfers.map((event, idx) => {
        const isOutgoingTransfer = event.args.from === smartAccountAddress
        const isIncomingTransfer = event.args.to === smartAccountAddress

        // Handle ERC20 transfers
        if ("value" in event.args && event.tokenInfo) {
            const amount = event.tokenInfo.decimals
                ? formatUnits(event.args.value, event.tokenInfo.decimals)
                : undefined
            const tokenSymbol = event.tokenInfo.symbol || "Unknown"

            const formattedAmount =
                amount !== undefined
                    ? Number(amount).toLocaleString("en-US", {
                          maximumFractionDigits: 0
                      })
                    : "?"

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
                    name={
                        <span className="inline-flex items-center gap-1.5">
                            {event.tokenInfo.logo && (
                                <img
                                    src={event.tokenInfo.logo}
                                    alt={tokenSymbol}
                                    className="h-4 w-4"
                                    onError={(e) => {
                                        // hide image if the logo URL fails to load
                                        e.currentTarget.style.display = "none"
                                    }}
                                />
                            )}
                            <div className="flex gap-[5px]">
                                <span>{formattedAmount}</span>
                                <span>{tokenSymbol}</span>
                            </div>
                        </span>
                    }
                    address={event.ensName ?? event.args.to}
                    thirdColumn={
                        <div className="text-sm text-muted-foreground">
                            {isOutgoingTransfer ? "to" : "from"}
                        </div>
                    }
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
                    address={event.ensName ?? event.args.to}
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
                address={event.ensName ?? event.args.to}
            />
        )
    })
}
