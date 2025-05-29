import * as Json from "ox/Json"
import * as RpcResponse from "ox/RpcResponse"

import type { Union } from "@sinclair/typebox/type"
import * as RpcRequest from "@/registry/batua/lib/batua/typebox/request"
import {
    type StaticDecode,
    type StaticEncode,
    Type,
    Value
} from "@/registry/batua/lib/batua/typebox/schema"

import { eth_accounts } from "@/registry/batua/lib/batua/typebox/request"
import { eth_chainId } from "@/registry/batua/lib/batua/typebox/request"
import { eth_requestAccounts } from "@/registry/batua/lib/batua/typebox/request"
import { eth_sendTransaction } from "@/registry/batua/lib/batua/typebox/request"
import { eth_signTypedData_v4 } from "@/registry/batua/lib/batua/typebox/request"
import { experimental_permissions } from "@/registry/batua/lib/batua/typebox/request"
import { experimental_createAccount } from "@/registry/batua/lib/batua/typebox/request"
import { experimental_grantPermissions } from "@/registry/batua/lib/batua/typebox/request"
import { experimental_prepareUpgradeAccount } from "@/registry/batua/lib/batua/typebox/request"
import { experimental_revokePermissions } from "@/registry/batua/lib/batua/typebox/request"
import { experimental_upgradeAccount } from "@/registry/batua/lib/batua/typebox/request"
import { personal_sign } from "@/registry/batua/lib/batua/typebox/request"
import { batua_ping } from "@/registry/batua/lib/batua/typebox/request"
import { wallet_connect } from "@/registry/batua/lib/batua/typebox/request"
import { wallet_disconnect } from "@/registry/batua/lib/batua/typebox/request"
import { wallet_getCallsStatus } from "@/registry/batua/lib/batua/typebox/request"
import { wallet_getCapabilities } from "@/registry/batua/lib/batua/typebox/request"
import { wallet_prepareCalls } from "@/registry/batua/lib/batua/typebox/request"
import { wallet_sendCalls } from "@/registry/batua/lib/batua/typebox/request"
import { wallet_sendPreparedCalls } from "@/registry/batua/lib/batua/typebox/request"
import { wallet_revokePermissions } from "@/registry/batua/lib/batua/typebox/request"

export {
    eth_accounts,
    eth_chainId,
    eth_requestAccounts,
    eth_sendTransaction,
    eth_signTypedData_v4,
    experimental_permissions,
    experimental_createAccount,
    experimental_grantPermissions,
    experimental_prepareUpgradeAccount,
    experimental_revokePermissions,
    experimental_upgradeAccount,
    personal_sign,
    batua_ping,
    wallet_connect,
    wallet_disconnect,
    wallet_getCallsStatus,
    wallet_getCapabilities,
    wallet_prepareCalls,
    wallet_sendCalls,
    wallet_sendPreparedCalls,
    wallet_revokePermissions
}

export const Request = Type.Union([
    RpcRequest.eth_accounts.Request,
    RpcRequest.eth_chainId.Request,
    RpcRequest.eth_requestAccounts.Request,
    RpcRequest.eth_sendTransaction.Request,
    RpcRequest.eth_signTypedData_v4.Request,
    RpcRequest.experimental_permissions.Request,
    RpcRequest.experimental_createAccount.Request,
    RpcRequest.experimental_grantPermissions.Request,
    RpcRequest.experimental_prepareUpgradeAccount.Request,
    RpcRequest.experimental_revokePermissions.Request,
    RpcRequest.experimental_upgradeAccount.Request,
    RpcRequest.personal_sign.Request,
    RpcRequest.batua_ping.Request,
    RpcRequest.wallet_connect.Request,
    RpcRequest.wallet_disconnect.Request,
    RpcRequest.wallet_getCallsStatus.Request,
    RpcRequest.wallet_getCapabilities.Request,
    RpcRequest.wallet_prepareCalls.Request,
    RpcRequest.wallet_sendCalls.Request,
    RpcRequest.wallet_sendPreparedCalls.Request,
    RpcRequest.wallet_revokePermissions.Request,
    RpcRequest.wallet_grantPermissions.Request
])

export function parseRequest(request: unknown): parseRequest.ReturnType {
    const raw = Value.Convert(Request, request)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const method = RpcRequest[(raw as any).method as keyof typeof RpcRequest]
    if (method) {
        const error = Value.Errors(method.Request, raw).First()
        const message = [
            error?.message,
            "",
            `Path: ${error?.path.slice(1).replaceAll("/", ".")}`,
            error?.value && `Value: ${Json.stringify(error.value)}`
        ]
            .filter((x) => typeof x === "string")
            .join("\n")
        if (error) throw new RpcResponse.InvalidParamsError({ message })
    }

    Value.Assert(Request, raw)

    const _decoded = Value.Decode(Request, raw)

    return {
        ...raw,
        _decoded
    } as never
}

/* eslint-disable @typescript-eslint/no-namespace */
export declare namespace parseRequest {
    export type ReturnType = typeof Request extends Union<infer U>
        ? {
              [K in keyof U]: StaticEncode<U[K]> & {
                  _decoded: StaticDecode<U[K]>
              }
          }[number]
        : never
}
