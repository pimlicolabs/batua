import { decodeFunctionData, type Hex, parseAbiItem, slice } from "viem"
import { z } from "zod"

export async function decodeCallData(calldata: Hex) {
    try {
        return await decodeWithSelector(calldata)
    } catch {
        return null
    }
}

async function decodeWithSelector(calldata: Hex) {
    const selector = slice(calldata, 0, 4)
    try {
        // tries to find function signature from openchain and 4bytes
        const fnInterface = await fetchFunctionInterface({ selector })
        if (!fnInterface) {
            throw new Error("")
        }
        // decodes calldata with all possible function signatures
        const decodedTransactions = decodeAllPossibilities({
            functionSignatures: [fnInterface],
            calldata
        })

        if (decodedTransactions.length === 0) {
            throw new Error("Failed to decode calldata with function signature")
        }

        const result = decodedTransactions[0]
        return result
    } catch {
        throw new Error(
            `Failed to find function interface for selector ${selector}`
        )
    }
}

function decodeAllPossibilities({
    functionSignatures,
    calldata
}: {
    functionSignatures: string[]
    calldata: Hex
}) {
    const results: unknown[] = []
    for (const signature of functionSignatures) {
        try {
            const abi = parseAbiItem(`function ${signature}`)
            const parsedTransaction = decodeFunctionData({
                abi: [abi],
                data: calldata
            })
            if (parsedTransaction) {
                results.push(parsedTransaction)
            }
        } catch {}
    }
    return results
}

export async function fetchFunctionInterface({
    selector
}: {
    selector: string
}): Promise<string | null> {
    const openChainData = await fetchFunctionFromOpenchain({ selector })

    let result: string | null = null
    // giving priority to openchain data because it filters spam like: `mintEfficientN2M_001Z5BWH` for 0x00000000
    if (openChainData) {
        result = openChainData[0].name
    } else {
        const fourByteData = await fetchFunctionFrom4Bytes({ selector })
        if (fourByteData) {
            result = fourByteData[0].text_signature
        }
    }

    return result
}
export const fetchFunctionInterface4ByteSchema = z.object({
    count: z.number(),
    results: z.array(
        z.object({
            id: z.number(),
            created_at: z.string(),
            text_signature: z.string(),
            hex_signature: z.string()
        })
    )
})

async function fetchFunctionFrom4Bytes({ selector }: { selector: string }) {
    try {
        const requestUrl = new URL(
            "https://www.4byte.directory/api/v1/signatures/"
        )
        requestUrl.searchParams.append("hex_signature", selector)
        const response = await fetch(requestUrl)
        const data = await response.json()
        const parsedData = fetchFunctionInterface4ByteSchema.parse(data)
        if (parsedData.count === 0) {
            throw new Error(
                `4bytes API failed to find function interface with selector ${selector}`
            )
        }
        return parsedData.results
    } catch {
        return null
    }
}

export const fetchFunctionInterfaceOpenApiSchema = z.object({
    ok: z.boolean(),
    result: z.object({
        function: z.record(
            z
                .array(
                    z.object({
                        name: z.string(),
                        filtered: z.boolean()
                    })
                )
                .optional()
        ),
        event: z.record(
            z
                .array(
                    z.object({
                        name: z.string(),
                        filtered: z.boolean()
                    })
                )
                .optional()
        )
    })
})

async function fetchFunctionFromOpenchain({ selector }: { selector: string }) {
    try {
        const requestUrl = new URL(
            "https://api.openchain.xyz/signature-database/v1/lookup"
        )
        requestUrl.searchParams.append("function", selector)
        const response = await fetch(requestUrl)
        const data = await response.json()
        const parsedData = fetchFunctionInterfaceOpenApiSchema.parse(data)
        if (!parsedData.ok) {
            throw new Error(
                `Openchain API failed to find function interface with selector ${selector}`
            )
        }
        return parsedData.result.function[selector]
    } catch {
        return null
    }
}
