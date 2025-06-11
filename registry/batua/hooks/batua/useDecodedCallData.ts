import { decodeCallData } from "@/registry/batua/lib/batua/helpers/decoder"
import { useEffect, useState } from "react"
import { Address, Hex } from "viem"

export type DecodedCallData = {
    functionName?: string
    args?: unknown[]
} | null

export const useDecodedCallData = ({
    calls
}: {
    calls: readonly {
        to?: Address | undefined
        data?: Hex | undefined
        value?: Hex | undefined
    }[]
}) => {
    const [decodedCallData, setDecodedCallData] = useState<
        DecodedCallData[] | null
    >(null)

    useEffect(() => {
        const decodedCallDataPromises = Promise.all(
            calls.map((call) => decodeCallData(call.data as Hex))
        )

        decodedCallDataPromises.then((results) => {
            setDecodedCallData(results as DecodedCallData[])
        })
    }, [calls])

    return decodedCallData
}
