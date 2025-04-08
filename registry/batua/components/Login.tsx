"use client"
import { type Bytes, Hex, WebAuthnP256 } from "ox"
import type { QueuedRequest, Internal } from "../type"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { AlertCircle, LogIn } from "lucide-react"
import { Provider } from "ox"
import { toKernelSmartAccount } from "permissionless/accounts"
import { getClient } from "../helpers/getClient"
import {
    createWebAuthnCredential,
    entryPoint07Address,
    toWebAuthnAccount
} from "viem/account-abstraction"
import { createPasskeyServerClient } from "permissionless/clients/passkeyServer"
import * as Key from "../key"
import { useCallback, useState } from "react"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Errors } from "ox"
import { BaseError } from "viem"

function toBytes(input: ArrayBufferView | ArrayBuffer): Uint8Array {
    if (input instanceof ArrayBuffer) {
        return new Uint8Array(input)
    }
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
}

export const Login = ({
    onComplete,
    queueRequest,
    internal
}: {
    onComplete: (args: {
        queueRequest: QueuedRequest
    }) => void | Promise<void>
    queueRequest: QueuedRequest
    internal: Internal
}) => {
    const [error, setError] = useState<string | null>(null)
    const [isShaking, setIsShaking] = useState(false)

    const triggerShake = useCallback(() => {
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500) // Reset shake after animation completes
    }, [])

    const createCredential = useCallback(async () => {
        const client = getClient({
            internal,
            chainId: internal.store.getState().chain.id
        })
        const credential = await (async () => {
            try {
                const passkeyServerClient = createPasskeyServerClient({
                    chain: client.chain,
                    transport:
                        internal.config.transports[client.chain.id].bundler
                })

                const userName = crypto.randomUUID()

                const credential = await createWebAuthnCredential(
                    // Start the registration process
                    await passkeyServerClient.startRegistration({
                        context: {
                            // userName that will be shown to the user when creating the passkey
                            userName
                        }
                    })
                )

                // Verify the registration
                const verifiedCredential =
                    await passkeyServerClient.verifyRegistration({
                        credential,
                        context: {
                            // userName that will be shown to the user when creating the passkey
                            userName
                        }
                    })

                if (!verifiedCredential.success) {
                    throw new Error("Failed to verify registration")
                }

                return {
                    id: verifiedCredential.id,
                    publicKey: verifiedCredential.publicKey
                }
            } catch (error) {
                onComplete({
                    queueRequest: {
                        request: queueRequest.request,
                        status: "error",
                        error: new Provider.UserRejectedRequestError()
                    }
                })
            }
        })()
        if (!credential) return
        const smartAccount = await toKernelSmartAccount({
            client,
            version: "0.3.1",
            owners: [toWebAuthnAccount({ credential })],
            entryPoint: {
                address: entryPoint07Address,
                version: "0.7"
            }
        })
        internal.store.setState((x) => ({
            ...x,
            accounts: [
                ...x.accounts,
                {
                    address: smartAccount.address,
                    key: Key.fromWebAuthnP256({
                        credential: credential,
                        //todo: use rpId
                        rpId: undefined
                    }),
                    type: "smartAccount"
                }
            ]
        }))
        onComplete({
            queueRequest: {
                request: queueRequest.request,
                status: "success",
                result: [smartAccount.address]
            }
        })
    }, [internal, onComplete, queueRequest])

    const signIn = useCallback(async () => {
        try {
            const client = getClient({
                internal,
                chainId: internal.store.getState().chain.id
            })
            const passkeyServerClient = createPasskeyServerClient({
                chain: client.chain,
                transport: internal.config.transports[client.chain.id].bundler
            })

            const challenge = await passkeyServerClient.startAuthentication()

            const signature = await WebAuthnP256.sign(challenge)

            const verifiedCredential =
                await passkeyServerClient.verifyAuthentication({
                    ...signature,
                    uuid: challenge.uuid
                })

            if (!verifiedCredential.success) {
                throw new Error("Failed to verify authentication")
            }

            const credential = {
                id: verifiedCredential.id,
                publicKey: verifiedCredential.publicKey
            }

            const smartAccount = await toKernelSmartAccount({
                client,
                version: "0.3.1",
                owners: [toWebAuthnAccount({ credential })],
                entryPoint: {
                    address: entryPoint07Address,
                    version: "0.7"
                }
            })
            internal.store.setState((x) => ({
                ...x,
                accounts: [
                    ...x.accounts,
                    {
                        address: smartAccount.address,
                        key: Key.fromWebAuthnP256({
                            credential: credential,
                            //todo: use rpId
                            rpId: undefined
                        }),
                        type: "smartAccount"
                    }
                ]
            }))
            onComplete({
                queueRequest: {
                    request: queueRequest.request,
                    status: "success",
                    result: [smartAccount.address]
                }
            })
        } catch (error) {
            const { code, errorMessage } = (() => {
                if (
                    error instanceof Error &&
                    error.message === "Failed to verify authentication"
                ) {
                    return {
                        code: "INVALID_SIGNATURE",
                        errorMessage: "Failed to verify authentication"
                    }
                }

                if (
                    error instanceof BaseError ||
                    error instanceof Errors.BaseError
                ) {
                    const notAllowedError = error.walk(
                        (e) =>
                            e instanceof Error && e.name === "NotAllowedError"
                    )

                    if (notAllowedError) {
                        return {
                            code: "NOT_ALLOWED",
                            errorMessage: "User rejected the request"
                        }
                    }

                    const e = error.walk(
                        (e) =>
                            e instanceof BaseError &&
                            e.name === "InternalRpcError"
                    ) as BaseError | undefined

                    if (e?.details) {
                        return {
                            errorMessage:
                                e.details === "Passkey not found"
                                    ? "Invalid passkey, please try again with a different passkey or sign up"
                                    : "Failed to sign in, please try using correct passkey"
                        }
                    }
                }

                return {
                    errorMessage:
                        "Failed to sign in, please try using correct passkey"
                }
            })()

            if (code === "NOT_ALLOWED") {
                onComplete({
                    queueRequest: {
                        request: queueRequest.request,
                        status: "error",
                        error: new Provider.UserRejectedRequestError()
                    }
                })
                return
            }

            setError(errorMessage)
            triggerShake()
            return
        }
    }, [internal, onComplete, queueRequest, triggerShake])

    const onOpenChange = useCallback(
        (open: boolean) => {
            if (!open) {
                onComplete({
                    queueRequest: {
                        request: queueRequest.request,
                        status: "error",
                        error: new Provider.UserRejectedRequestError()
                    }
                })
            }
        },
        [onComplete, queueRequest]
    )

    return (
        <Dialog open={!!queueRequest} onOpenChange={onOpenChange}>
            <DialogContent
                className={`sm:max-w-[425px] p-6 ${isShaking ? "animate-shake" : ""}`}
            >
                <DialogHeader className="pb-4">
                    <DialogTitle>Sign in</DialogTitle>
                    <DialogDescription>
                        Sign in to your wallet with your passkey.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-5 py-2">
                    <div className="grid grid-cols-2 items-center gap-4">
                        <Button type="submit" onClick={signIn}>
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign in
                        </Button>
                        <Button
                            variant="outline"
                            type="submit"
                            onClick={() => {
                                setError(null)
                                createCredential()
                            }}
                        >
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign up
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
