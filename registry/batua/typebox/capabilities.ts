import * as Permissions from "./permissions"
import * as Primitive from "./primitive"
import * as Schema from "./schema"
import { Type } from "./schema"

export namespace createAccount {
    export const Request = Type.Union([
        Type.Boolean(),
        Type.Object({
            chainId: Schema.Optional(Primitive.Number),
            label: Schema.Optional(Type.String())
        })
    ])
    export type Request = Schema.StaticDecode<typeof Request>
}

export namespace grantPermissions {
    export const Request = Permissions.Request
    export type Request = Schema.StaticDecode<typeof Request>
}

export namespace permissions {
    export const Request = Type.Object({
        id: Schema.Optional(Primitive.Hex)
    })
    export type Request = Schema.StaticDecode<typeof Request>

    export const Response = Type.Array(Permissions.Permissions)
    export type Response = Schema.StaticDecode<typeof Response>
}
