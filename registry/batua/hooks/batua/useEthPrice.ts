import { Internal } from "@/registry/batua/lib/batua/type"
import { useEffect, useState } from "react"

export const useEthPrice = (internal: Internal) => {
    const [ethPrice, setEthPrice] = useState(1500 * 100)

    useEffect(() => {
        const unsubscribe = internal.store.subscribe(
            (x) => x.price,
            (price) => {
                setEthPrice(Number(BigInt((price ?? 1500) * 100)))
            }
        )

        return () => {
            unsubscribe()
        }
    }, [internal])

    return ethPrice
}
