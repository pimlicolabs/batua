import type { Hex, WebAuthnP256 } from "ox"
import type { Key } from "./type"

export const fromWebAuthnP256 = ({
    credential,
    rpId
}: {
    credential: {
        id: string
        publicKey: Hex.Hex
    }
    rpId: string | undefined
}): Key => {
    return {
        canSign: true,
        credential: {
            id: credential.id,
            publicKey: credential.publicKey
        },
        rpId,
        type: "webauthn-p256"
    }
}
