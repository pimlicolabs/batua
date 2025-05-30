import React from "react"
import type { QueuedRequest, Internal } from "@/registry/batua/lib/batua/type"
import { Login } from "@/registry/batua/components/batua/Login"
import { SendCalls } from "@/registry/batua/components/batua/SendCalls"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Provider } from "ox"

export const Local = ({ internal }: { internal: Internal }) => {
    const [queueRequest, setQueueRequest] =
        React.useState<QueuedRequest | null>(null)

    React.useEffect(() => {
        const unsubscribe = internal.store.subscribe(
            (x) => x.requestQueue,
            (requestQueue) => {
                const requests = requestQueue
                    .map((x) => (x.status === "pending" ? x : undefined))
                    .filter(Boolean) as readonly QueuedRequest[]
                if (requests.length === 0) return
                if (requests[0].request.id === queueRequest?.request.id) return
                setQueueRequest(requests[0])
            }
        )

        return () => {
            unsubscribe()
        }
    }, [internal.store, queueRequest])

    const onComplete = ({ queueRequest }: { queueRequest: QueuedRequest }) => {
        setQueueRequest(null)
        internal.store.setState((x) => ({
            ...x,
            requestQueue: x.requestQueue.map((req) =>
                req.request.id === queueRequest.request.id ? queueRequest : req
            )
        }))
    }

    if (!queueRequest) return null

    const onOpenChange = (open: boolean) => {
        if (!open) {
            onComplete({
                queueRequest: {
                    request: queueRequest.request,
                    status: "error",
                    error: new Provider.UserRejectedRequestError()
                }
            })
        }
    }

    if (queueRequest?.request.method === "eth_requestAccounts") {
        return (
            <Dialog open={!!queueRequest} onOpenChange={onOpenChange}>
                <DialogContent
                    className={"sm:max-w-[325px] p-0"}
                    style={{ zIndex: 4294967290 }}
                >
                    <Login
                        internal={internal}
                        queueRequest={queueRequest}
                        onComplete={onComplete}
                    />
                </DialogContent>
            </Dialog>
        )
    }

    if (queueRequest?.request.method === "wallet_sendCalls") {
        return (
            <Dialog open={!!queueRequest} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[400px] p-0 h-[75vh] flex justify-start flex-col">
                    <SendCalls
                        internal={internal}
                        queueRequest={queueRequest}
                        onComplete={onComplete}
                    />
                </DialogContent>
            </Dialog>
        )
    }

    return null
}
