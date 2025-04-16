import type { Internal, PriceManager } from "@/registry/batua/lib/batua/type"
import { z } from "zod"

export const coingeckoPriceManager = (
    {
        url,
        pollingInterval = 30_000 // 30 seconds
    }: { url: string; pollingInterval?: number } = {
        url: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum&x_cg_demo_api_key"
    }
): PriceManager => {
    const fetchPrice = async (internal: Internal) => {
        const result = await fetch(url)
        if (!result.ok) {
            return
        }
        const data = await result.json()
        const priceSchema = z.array(
            z.object({
                current_price: z.number()
            })
        )
        const validatedData = priceSchema.safeParse(data)
        if (!validatedData.success) {
            return
        }
        internal.store.setState((x) => ({
            ...x,
            price: validatedData.data[0].current_price
        }))
        return
    }

    return {
        setup: ({ internal }) => {
            const interval = setInterval(() => {
                fetchPrice(internal)
            }, pollingInterval)

            // wait for store to be hydrated
            const timeout = setTimeout(() => {
                const existingPrice = internal.store.getState().price
                if (!existingPrice) {
                    fetchPrice(internal)
                }
            }, 100)

            return () => {
                clearInterval(interval)
                clearTimeout(timeout)
            }
        }
    }
}
