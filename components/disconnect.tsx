import { Button } from "@/components/ui/button"
import { useDisconnect } from "wagmi"

export default function Disconnect() {
    const { disconnect } = useDisconnect()

    return (
        <Button
            onClick={() => disconnect()}
            type="button"
            variant="outline"
            className="w-full"
        >
            Disconnect
        </Button>
    )
}
