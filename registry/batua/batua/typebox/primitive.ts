import * as Hex_ox from "ox/Hex"

import { Type } from "@/registry/batua/batua/typebox/schema"

export const Address = Type.TemplateLiteral("0x${string}")
export const Hex = Type.TemplateLiteral("0x${string}")
export const TypeboxNumber = Type.Transform(Hex)
    .Decode((value) => Hex_ox.toNumber(value))
    .Encode((value) => Hex_ox.fromNumber(value))
export const TypeboxBigInt = Type.Transform(Hex)
    .Decode((value) => Hex_ox.toBigInt(value))
    .Encode((value) => Hex_ox.fromNumber(value))
