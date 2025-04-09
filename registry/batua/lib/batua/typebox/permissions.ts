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
