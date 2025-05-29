import type { Chain } from "viem/chains"
import type { Config } from "@/registry/batua/batua"
import type { Mutate, StoreApi } from "zustand/vanilla"
import type { Address, RpcRequest, RpcResponse } from "ox"
import type * as Rpc from "@/registry/batua/lib/batua/typebox/rpc"
import type { Hex } from "ox"
import type {
    Client,
    MaybePromise,
    OneOf,
    WalletCapabilities,
    WalletGrantPermissionsParameters,
    WalletGrantPermissionsReturnType
} from "viem"
import type { GetCallsStatusReturnType } from "viem/experimental"

export type Storage = {
    getItem: <value>(name: string) => MaybePromise<value | null>
    removeItem: (name: string) => MaybePromise<void>
    setItem: (name: string, value: unknown) => MaybePromise<void>
}

export type Call = {
    to: Address.Address
    value?: bigint | undefined
    data?: Hex.Hex | undefined
}

export type Implementation = {
    actions: {
        loadAccounts: (parameters: {
            client: Client
            config: Config
            request: Rpc.parseRequest.ReturnType
            store: Store
        }) => Promise<{ accounts: readonly Omit<Account, "name">[] }>

        sendCalls: (parameters: {
            calls: readonly Call[]
            account: Account
            client: Client
            config: Config
            capabilities?: WalletCapabilities | undefined
            request: Rpc.parseRequest.ReturnType
            store: Store
        }) => Promise<Hex.Hex>

        getCallsStatus: (parameters: {
            client: Client
            config: Config
            request: Rpc.parseRequest.ReturnType
            store: Store
            userOperationHash: Hex.Hex
            timeout?: number
        }) => Promise<
            Omit<GetCallsStatusReturnType, "status" | "statusCode"> & {
                status: number
            }
        >

        grantPermissions: (parameters: {
            client: Client
            config: Config
            request: Rpc.parseRequest.ReturnType
            store: Store
            permission: WalletGrantPermissionsParameters
        }) => Promise<WalletGrantPermissionsReturnType>
    }
    setup: (_: { internal: Internal }) => () => void
}

export type PriceManager = {
    setup: (_: { internal: Internal }) => () => void
}

export type Compute<type> = { [key in keyof type]: type[key] } & unknown
export type Undefined<type> = {
    [key in keyof type]?: undefined
}

export type BaseKey<type extends string, properties = {}> = Compute<
    {
        type: type
    } & OneOf<
        | ({
              canSign: true
          } & properties)
        | ({
              canSign: false
          } & Undefined<properties>)
    >
>

export type WebAuthnKey = BaseKey<
    "webauthn-p256",
    {
        credential: {
            id: string
            publicKey: Hex.Hex
        }
        rpId: string | undefined
    }
>

export type Key = OneOf<WebAuthnKey>

export type Account = {
    address: Address.Address
    key?: Key
    type: "smartAccount"
    name: string
}

export type QueuedRequest<result = unknown> = {
    request: RpcRequest.RpcRequest
} & OneOf<
    | {
          status: "pending"
      }
    | {
          result: result
          status: "success"
      }
    | {
          error: RpcResponse.ErrorObject
          status: "error"
      }
>

export type State<
    chains extends readonly [Chain, ...Chain[]] = readonly [Chain, ...Chain[]]
> = {
    accounts: readonly Account[]
    chain: chains[number]
    requestQueue: readonly QueuedRequest[]
    price: number | undefined
}

export type Store<
    chains extends readonly [Chain, ...Chain[]] = readonly [Chain, ...Chain[]]
> = Mutate<
    StoreApi<State<chains>>,
    [["zustand/subscribeWithSelector", never], ["zustand/persist", any]]
>

export type Renderer = {
    setup: (parameters: { internal: Internal }) => {
        close: () => void
        destroy: () => void
        open: () => void
        syncRequests: (requests: readonly QueuedRequest[]) => Promise<void>
    }
}

export type Internal<
    chains extends readonly [Chain, ...Chain[]] = readonly [Chain, ...Chain[]]
> = {
    config: Config<chains>
    id: string
    getImplementation: () => Implementation
    setImplementation: (i: Implementation) => void
    store: Store<chains>
    getPriceManager: () => PriceManager
    setPriceManager: (p: PriceManager) => void
}
