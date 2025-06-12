import { EventRow } from "@/registry/batua/components/batua/EventRow"
import { AssetChangeEvent } from "@/registry/batua/hooks/batua/useAssetChangeEvents"
import { ListCheck } from "lucide-react"
import { useMemo } from "react"
import { Address, formatUnits, zeroAddress } from "viem"

const getSpender = (
    approval: AssetChangeEvent<"Approval" | "ApprovalForAll">
) => {
    if (approval.eventName === "Approval") {
        return approval.args.spender as Address
    }
    if ("operator" in approval.args) {
        return approval.args.operator as Address
    }
    return null
}

const useAggregatedApprovals = (
    approvals: AssetChangeEvent<"Approval" | "ApprovalForAll">[]
) => {
    /**
     * Re-compute the aggregated approvals every time the `approvals`
     * array changes. We intentionally **avoid** mutating any of the
     * objects that come from the parent so that successive renders
     * always start from a clean slate.
     */
    return useMemo(() => {
        const aggregatedApprovalsMap = new Map<
            string,
            AssetChangeEvent<"Approval" | "ApprovalForAll">
        >()

        for (const approval of approvals) {
            const spender = getSpender(approval)
            const key = `${approval.address}-${spender}`

            // Create a shallow clone so we never mutate the original object
            const clonedApproval = {
                ...approval,
                // spread preserves all original properties; cast back to the same type
                args: { ...approval.args }
            } as AssetChangeEvent<"Approval" | "ApprovalForAll">

            if (
                aggregatedApprovalsMap.has(key) &&
                "value" in clonedApproval.args
            ) {
                const existingTransfer = aggregatedApprovalsMap.get(key)!

                const existingValue = (existingTransfer.args as any).value
                const newValue = (clonedApproval.args as any).value

                if (
                    typeof existingValue === "bigint" &&
                    typeof newValue === "bigint"
                ) {
                    // Produce a new object rather than mutating the old one.
                    const updatedTransfer = {
                        ...existingTransfer,
                        args: {
                            ...existingTransfer.args,
                            value: existingValue + newValue
                        }
                    } as AssetChangeEvent<"Approval" | "ApprovalForAll">

                    aggregatedApprovalsMap.set(key, updatedTransfer)
                }
            } else {
                aggregatedApprovalsMap.set(key, clonedApproval)
            }
        }

        return Array.from(aggregatedApprovalsMap.values())
    }, [approvals])
}

export const ApprovalEvents = ({
    approvals
}: {
    approvals: AssetChangeEvent<"Approval" | "ApprovalForAll">[]
}) => {
    if (approvals.length === 0) {
        return null
    }

    const aggregatedApprovals = useAggregatedApprovals(approvals)

    return aggregatedApprovals.map((event) => {
        // ERC20 Approval
        if (event.eventName === "Approval") {
            const amount =
                "value" in event.args && typeof event.args.value === "bigint"
                    ? formatUnits(
                          event.args.value,
                          event.tokenInfo?.decimals ?? 18
                      )
                    : undefined
            const spender = event.args.spender
            const tokenSymbol = event.tokenInfo?.symbol ?? ""

            const formattedAmount =
                amount !== undefined
                    ? Number(amount).toLocaleString("en-US", {
                          maximumFractionDigits: 0
                      })
                    : "?"

            return (
                <EventRow
                    key={`${event.address}-${event.args.spender}`}
                    icon={<ListCheck className="h-4 w-4" />}
                    name={
                        <span className="inline-flex items-center gap-1">
                            {event.tokenInfo?.logo && (
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
                    thirdColumn={
                        <div className="text-sm text-muted-foreground">to</div>
                    }
                    address={event.ensName ?? spender}
                />
            )
        }
        // ERC721 ApprovalForAll
        if (event.eventName === "ApprovalForAll") {
            const operator =
                "operator" in event.args
                    ? (event.args.operator as Address)
                    : zeroAddress
            // const approved =
            //     "approved" in event.args
            //         ? (event.args.approved as boolean)
            //         : false

            return (
                <EventRow
                    key={`${event.address}-${operator}`}
                    icon={<ListCheck className="h-4 w-4" />}
                    name={`All NFTs ${event.nftInfo?.name ?? event.address}`}
                    address={event.ensName ?? operator}
                />
            )
        }
        return null
    })
}
