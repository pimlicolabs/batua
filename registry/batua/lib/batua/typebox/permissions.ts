import * as Key from "@/registry/batua/lib/batua/typebox/key"
import * as Primitive from "@/registry/batua/lib/batua/typebox/primitive"
import * as Schema from "@/registry/batua/lib/batua/typebox/schema"
import { Type } from "@/registry/batua/lib/batua/typebox/schema"

export const Permissions = Type.Object({
    address: Primitive.Address,
    chainId: Schema.Optional(Primitive.TypeboxNumber),
    expiry: Type.Number(),
    id: Primitive.Hex,
    key: Type.Pick(Key.Base, ["publicKey", "type"]),
    permissions: Type.Object({
        calls: Key.CallPermissions,
        signatureVerification: Schema.Optional(
            Key.SignatureVerificationPermission
        ),
        spend: Schema.Optional(Key.SpendPermissions)
    })
})
export type Permissions = Schema.StaticDecode<typeof Permissions>

export const Request = Type.Object({
    address: Schema.Optional(Primitive.Address),
    chainId: Schema.Optional(Primitive.TypeboxNumber),
    expiry: Type.Number({ minimum: 1 }),
    key: Schema.Optional(Permissions.properties.key),
    permissions: Permissions.properties.permissions
})
export type Request = Schema.StaticDecode<typeof Request>

export const GrantPermissions = Type.Object({
    expiry: Type.Number({ minimum: 1 }),
    permissions: Type.Array(
        Type.Object({
            type: Type.Literal("erc20-token-transfer"),
            data: Type.Object({
                address: Primitive.Address,
                ticker: Type.String()
            }),
            policies: Type.Array(
                Type.Object({
                    type: Type.Literal("token-allowance"),
                    data: Type.Object({
                        allowance: Primitive.TypeboxBigInt
                    })
                })
            )
        })
    ),
    signer: Type.Object({
        data: Type.Object({
            id: Primitive.Address
        }),
        type: Type.Literal("account")
    })
})
export type GrantPermissions = Schema.StaticDecode<typeof GrantPermissions>

export const RequestGrantPermissions = Type.Object({
    expiry: Type.Number({ minimum: 1 }),
    signer: GrantPermissions.properties.signer,
    permissions: GrantPermissions.properties.permissions
})
export type RequestGrantPermissions = Schema.StaticDecode<
    typeof RequestGrantPermissions
>
