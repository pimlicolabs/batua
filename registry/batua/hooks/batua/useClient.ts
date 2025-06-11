import { getClient } from "@/registry/batua/lib/batua/helpers/getClient"
import { Internal } from "@/registry/batua/lib/batua/type"
import { useMemo } from "react"
import { Chain } from "viem"

export const useClient = ({
    internal,
    chain
}: { internal: Internal; chain: Chain }) => {
    const client = useMemo(
        () => getClient({ internal, chainId: chain.id }),
        [internal, chain]
    )
    return client
}
