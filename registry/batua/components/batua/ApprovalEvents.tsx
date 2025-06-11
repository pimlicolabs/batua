import { CopyAddress } from "@/registry/batua/components/batua/CopyAddress"
import { EventRow } from "@/registry/batua/components/batua/EventRow"
import { AssetChangeEvent } from "@/registry/batua/hooks/batua/useAssetChangeEvents"
import { shortenAddress } from "@/registry/batua/lib/batua/utils"
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
    const aggregatedApprovals = useMemo(() => {
        const aggregatedApprovalsMap: Record<
            string,
            AssetChangeEvent<"Approval" | "ApprovalForAll">
        > = {}

        for (const approval of approvals) {
            const key = `${approval.address}-${getSpender(approval)}`

            if (aggregatedApprovalsMap[key] && "value" in approval.args) {
                if ("value" in aggregatedApprovalsMap[key].args) {
                    aggregatedApprovalsMap[key].args.value =
                        (aggregatedApprovalsMap[key].args.value as bigint) +
                        (approval.args.value as bigint)
                }
            } else {
                aggregatedApprovalsMap[key] = approval
            }
        }

        return Object.values(aggregatedApprovalsMap)
    }, [approvals])

    return aggregatedApprovals
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

    const result = useMemo(() => {
        return aggregatedApprovals.map((event, idx) => {
            const key = (() => {
                if (event.eventName === "Approval") {
                    return `${event.address}-${event.args.spender}`
                }
                if (event.eventName === "ApprovalForAll") {
                    return "operator" in event.args
                        ? (event.args.operator as Address)
                        : zeroAddress
                }
                return null
            })()
            const name = (() => {
                if (event.eventName === "Approval") {

                    

                    return `${event.tokenInfo?.symbol ?? ""} ${event.args.spender}`
                }
                if (event.eventName === "ApprovalForAll") {
                    return `All NFTs ${event.nftInfo?.name ?? event.address}`
                }
                return null
            })()
        })
    }, [aggregatedApprovals])

    return (
        // <div className="bg-muted/5 flex flex-col">
        // <div className="flex flex-col gap-2">
        aggregatedApprovals.map((event, idx) => {
            // ERC20 Approval
            if (event.eventName === "Approval") {
                const amount =
                    "value" in event.args &&
                    typeof event.args.value === "bigint"
                        ? formatUnits(
                              event.args.value,
                              event.tokenInfo?.decimals ?? 18
                          )
                        : undefined
                const spender = event.args.spender
                const tokenSymbol = event.tokenInfo?.symbol ?? ""
                return (
                    <EventRow
                        key={`${event.address}-${event.args.spender}`}
                        icon={<ListCheck className="h-4 w-4" />}
                        name={`${
                            amount !== undefined
                                ? Number(amount).toLocaleString("en-US", {
                                      maximumFractionDigits: 0
                                  })
                                : "?"
                        } ${tokenSymbol}`}
                        address={spender}
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
                        address={operator}
                    />
                )
            }
            return null
        })
        // </div>
        // </div>
    )
}
