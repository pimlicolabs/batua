import { NetworkFee } from "@/registry/batua/components/batua/NetworkFee"

export const NetworkInformation = ({
    chainName,
    hasPaymaster,
    refreshingGasCost,
    gasCost,
    ethPrice,
    dappName
}: {
    chainName: string
    hasPaymaster: boolean
    refreshingGasCost: boolean
    gasCost: bigint | null
    ethPrice: number
    dappName: string
}) => {
    return (
        <div className="bg-muted/5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="text-sm flex items-center gap-2">Network</div>
                <span className="text-sm">{chainName}</span>
            </div>
            <NetworkFee
                hasPaymaster={hasPaymaster}
                refreshingGasCost={refreshingGasCost}
                gasCost={gasCost}
                ethPrice={ethPrice}
                dappName={dappName}
            />
        </div>
    )
}
