import { Internal } from "@/registry/batua/lib/batua/type"
import { useMemo } from "react"

export const useChain = (internal: Internal) => {
    const chain = useMemo(() => {
        return internal.store.getState().chain
    }, [internal])

    return chain
}
