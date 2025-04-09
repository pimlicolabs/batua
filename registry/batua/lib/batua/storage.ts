import { createStore, del, get, set } from "idb-keyval"
import type { Storage } from "@/registry/batua/lib/batua/type"

export const idb = (): Storage => {
    const store =
        typeof indexedDB !== "undefined"
            ? createStore("batua", "store")
            : undefined
    return {
        async getItem(name) {
            const value = await get(name, store)
            if (value === null) return null
            return value
        },
        async removeItem(name) {
            await del(name, store)
        },
        async setItem(name, value) {
            await set(name, value, store)
        }
    }
}
