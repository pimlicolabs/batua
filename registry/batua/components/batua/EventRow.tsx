import { CopyAddress } from "@/registry/batua/components/batua/CopyAddress"
import { Address } from "viem"

export const EventRow = ({
    icon,
    name,
    address
}: {
    icon: React.ReactNode
    name: React.ReactNode
    address: Address
}) => {
    return (
        <>
            {/* Icon cell */}
            <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center justify-center">{icon}</div>

                {/* Amount / token symbol (or NFT name) with optional logo */}
                <div className="font-mono text-sm whitespace-nowrap max-w-[10rem] truncate overflow-hidden flex items-center">
                    {name}
                </div>
            </div>

            {/* Address cell – fills remaining space and truncates if required */}
            <CopyAddress
                name={address}
                value={address}
                className="font-mono text-xs truncate w-full"
            />
        </>
    )
}
