import { CopyAddress } from "@/registry/batua/components/batua/CopyAddress"
import { shortenAddress } from "@/registry/batua/lib/batua/utils"
import { Address } from "viem"

export const EventRow = ({
    icon,
    name,
    address
}: {
    icon: React.ReactNode
    name: string
    address: Address
}) => {
    return (
        <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
                {icon}
                <span className="font-mono w-30">{name}</span>
            </div>
            <CopyAddress
                name={shortenAddress(address)}
                value={address}
                className="font-mono w-full"
            />
        </div>
    )
}
