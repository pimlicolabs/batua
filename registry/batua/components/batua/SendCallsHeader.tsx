import {
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { CopyAddress } from "@/registry/batua/components/batua/CopyAddress"
import { Bug } from "lucide-react"
import { useEffect, useState } from "react"
import { UserOperation } from "viem/account-abstraction"

export const SendCallsHeader = ({
    userOperation
}: {
    userOperation: UserOperation<"0.7"> | null
}) => {
    const [senderHost, setSenderHost] = useState("")

    useEffect(() => {
        setSenderHost(window.location.host)
    }, [])

    // const [currentDateTime, setCurrentDateTime] = useState("")

    // useEffect(() => {
    //     setCurrentDateTime(format(new Date(), "MMM d, yyyy h:mm a"))
    // }, [])

    return (
        <div className="bg-muted/10 rounded-t-lg mb-4">
            <DialogHeader className="gap-0 border-b pb-2">
                <div>
                    <DialogTitle className="text-xl font-semibold flex items-center justify-start">
                        Send Transaction
                    </DialogTitle>
                    <DialogDescription className="text-sm w-full flex items-center justify-between">
                        <span>{senderHost}</span>
                        <span className="text-muted-foreground">
                            <CopyAddress
                                name={
                                    <Bug className="h-4 w-4 text-muted-foreground" />
                                }
                                tooltip={`Click to copy raw transaction data`}
                                value={userOperation?.callData ?? "0x"}
                            />
                        </span>
                    </DialogDescription>
                </div>
                {/* <div className="bg-muted/20 p-2 rounded-full">
                        <SendIcon className="h-5 w-5" />
                    </div> */}
            </DialogHeader>
        </div>
    )
}
