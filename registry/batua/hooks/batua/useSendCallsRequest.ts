import { useChain } from "@/registry/batua/hooks/batua/useChain"
import { Internal, QueuedRequest } from "@/registry/batua/lib/batua/type"
import { Provider, RpcRequest } from "ox"
import { useMemo } from "react"
import { RpcSchema } from "ox"

export const useSendCallsRequest = ({
    internal,
    queueRequest
}: {
    internal: Internal
    queueRequest: QueuedRequest
}) => {
    const chain = useChain(internal)

    const { request, hasPaymaster } = useMemo(() => {
        const requestStore = RpcRequest.createStore()
        const request = requestStore.prepare(
            queueRequest.request
        ) as RpcRequest.RpcRequest<
            RpcSchema.ExtractItem<RpcSchema.Default, "wallet_sendCalls">
        >

        if (request.method !== "wallet_sendCalls") {
            throw new Provider.UnsupportedMethodError()
        }

        const capabilities = request.params[0].capabilities

        const hasPaymaster =
            internal.config.paymaster?.transports[chain.id] !== undefined ||
            capabilities?.paymasterService?.url !== undefined

        return { request, hasPaymaster }
    }, [queueRequest.request, internal])

    return { request, hasPaymaster }
}
