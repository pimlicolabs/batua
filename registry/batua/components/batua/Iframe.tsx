import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { QueuedRequest, Internal } from "@/registry/batua/lib/batua/type"
import { DialogContent, Dialog } from "@/components/ui/dialog"
import { Provider } from "ox"
import { DialogTitle } from "@radix-ui/react-dialog"

const InnerIframe = ({
    onComplete,
    queueRequest,
    url
}: {
    onComplete: (args: { queueRequest: QueuedRequest }) => void
    queueRequest: QueuedRequest | null
    url: string
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [isIframeLoaded, setIsIframeLoaded] = useState(false)

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (
                event.source === iframeRef.current?.contentWindow &&
                event.data?.type === "batua-iframe-loaded"
            ) {
                setIsIframeLoaded(true)
            }

            if (
                event.source === iframeRef.current?.contentWindow &&
                event.data?.type === "batua-iframe-response"
            ) {
                onComplete({ queueRequest: event.data.request })
            }
        }

        window.addEventListener("message", handleMessage)

        return () => {
            window.removeEventListener("message", handleMessage)
        }
    }, [onComplete]) // Empty dependency array ensures this runs only once on mount and unmount

    useEffect(() => {
        if (
            iframeRef.current?.contentWindow &&
            queueRequest &&
            isIframeLoaded
        ) {
            iframeRef.current.contentWindow.postMessage({
                request: queueRequest,
                type: "batua-iframe-request"
            })
        }
    }, [queueRequest, isIframeLoaded]) // Depends on queueRequest and isIframeLoaded

    return (
        <iframe
            className="w-[352px] h-[75vh]"
            ref={iframeRef}
            src={`${url}`}
            title="Batua"
        />
    )
}

export const Iframe = ({
    internal,
    url
}: {
    internal: Internal
    url: string
}) => {
    const [queueRequest, setQueueRequest] = useState<QueuedRequest | null>(null)

    const onComplete = useCallback(
        ({ queueRequest }: { queueRequest: QueuedRequest }) => {
            setQueueRequest(null) // Reset queueRequest after completion
            internal.store.setState((x) => ({
                ...x,
                requestQueue: x.requestQueue.map((req) =>
                    req.request.id === queueRequest.request.id
                        ? queueRequest
                        : req
                )
            }))
        },
        [internal.store] // Dependency for onComplete
    )

    useEffect(() => {
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
    }, [internal.store, queueRequest]) // Dependencies for the subscription logic

    const onOpenChange = useCallback(
        (open: boolean) => {
            if (!queueRequest) return
            if (!open) {
                onComplete({
                    queueRequest: {
                        request: queueRequest.request,
                        status: "error",
                        error: new Provider.UserRejectedRequestError()
                    }
                })
            }
        },
        [onComplete, queueRequest] // Dependencies for onOpenChange
    )

    const popupNeeded = useMemo(() => {
        if (!queueRequest) return false
        if (queueRequest.request.method === "eth_requestAccounts") return true
        if (queueRequest.request.method === "wallet_sendCalls") return true
        if (queueRequest.request.method === "wallet_getCallsStatus")
            return false
        if (queueRequest.request.method === "wallet_grantPermissions")
            return true
        return false
    }, [queueRequest])

    return (
        <>
            <Dialog
                open={popupNeeded && Boolean(queueRequest)}
                onOpenChange={onOpenChange}
            >
                <DialogContent
                    className={"w-[400px] p-0"}
                    style={{ zIndex: 4294967290 }}
                >
                    <DialogTitle className="hidden">batua</DialogTitle>
                    <InnerIframe
                        onComplete={onComplete}
                        url={url}
                        queueRequest={queueRequest}
                    />
                </DialogContent>
            </Dialog>
            {!popupNeeded && queueRequest && (
                <InnerIframe
                    onComplete={onComplete}
                    url={url}
                    queueRequest={queueRequest}
                />
            )}
        </>
    )
}
