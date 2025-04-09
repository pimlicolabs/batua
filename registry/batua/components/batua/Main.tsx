import React from "react"
import type { QueuedRequest, Internal } from "@/registry/batua/lib/batua/type"
import { Login } from "@/registry/batua/components/batua/Login"
import { SendCalls } from "@/registry/batua/components/batua/SendCalls"

export const Main = ({ internal }: { internal: Internal }) => {
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

    if (queueRequest?.request.method === "eth_requestAccounts") {
        return (
            <Login
                internal={internal}
                queueRequest={queueRequest}
                onComplete={onComplete}
            />
        )
    }

    if (queueRequest?.request.method === "wallet_sendCalls") {
        return (
            <SendCalls
                internal={internal}
                queueRequest={queueRequest}
                onComplete={onComplete}
            />
        )
    }

    return (
        <div>{queueRequest ? JSON.stringify(queueRequest) : "No request"}</div>
    )
}
