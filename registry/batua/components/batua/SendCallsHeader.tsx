import {
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { useEffect, useState } from "react"

export const SendCallsHeader = () => {
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
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <DialogTitle className="text-xl font-semibold">
                            Send Transaction
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            {senderHost}
                        </DialogDescription>
                    </div>
                    {/* <div className="bg-muted/20 p-2 rounded-full">
                        <SendIcon className="h-5 w-5" />
                    </div> */}
                </div>
            </DialogHeader>
        </div>
    )
}
