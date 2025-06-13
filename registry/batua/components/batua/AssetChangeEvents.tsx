import { AssetChangeEvent } from "@/registry/batua/hooks/batua/useAssetChangeEvents"
import { Address } from "viem"
import { ApprovalEvents } from "@/registry/batua/components/batua/ApprovalEvents"
import { TransferEvents } from "@/registry/batua/components/batua/TransferEvents"

export const AssetChangeEvents = ({
    assetChangeEvents,
    smartAccountAddress
}: {
    assetChangeEvents: AssetChangeEvent[] | null
    smartAccountAddress?: Address
}) => {
    if (
        !assetChangeEvents ||
        assetChangeEvents.length === 0 ||
        !smartAccountAddress
    ) {
        return null
    }

    const approvals = assetChangeEvents.filter(
        (event) =>
            event.eventName === "Approval" ||
            event.eventName === "ApprovalForAll"
    )
    const transfers = assetChangeEvents.filter(
        (event) => event.eventName === "Transfer"
    )

    return (
        <div className="bg-muted/5 grid grid-cols-[fit-content(60%)_30px_1fr] gap-y-3 gap-x-3">
            {approvals && approvals.length > 0 && (
                <div className="text-sm mb-2 col-span-3">Approvals</div>
            )}
            <ApprovalEvents approvals={approvals} />
            {transfers && transfers.length > 0 && (
                <div className="text-sm my-2 col-span-3">Transfers</div>
            )}
            <TransferEvents
                transfers={transfers}
                smartAccountAddress={smartAccountAddress}
            />
        </div>
    )
}
