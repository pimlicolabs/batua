"use client"
import { WebAuthnP256 } from "ox"
import type { QueuedRequest, Internal } from "@/registry/batua/lib/batua/type"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import {
    AlertCircle,
    LogIn,
    KeyRound,
    Fingerprint,
    Loader2,
    HelpCircle
} from "lucide-react"
import { Provider } from "ox"
import { toKernelSmartAccount } from "permissionless/accounts"
import { getClient } from "@/registry/batua/lib/batua/helpers/getClient"
import {
    createWebAuthnCredential,
    entryPoint07Address,
    type SmartAccount,
    toWebAuthnAccount
} from "viem/account-abstraction"
import { createPasskeyServerClient } from "permissionless/clients/passkeyServer"
import * as Key from "@/registry/batua/lib/batua/key"
import { useCallback, useMemo, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { Errors } from "ox"
import { BaseError } from "viem"
import { Separator } from "@/components/ui/separator"
import {
    randomAdjective,
    randomNoun
} from "@/registry/batua/lib/batua/helpers/randomWords"

export const Login = ({
    onComplete,
    queueRequest,
    internal,
    dummy
}: {
    onComplete: (args: {
        queueRequest: QueuedRequest
    }) => void | Promise<void>
    queueRequest: QueuedRequest
    internal: Internal
    dummy?: boolean
}) => {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<"signin" | "signup" | null>(null)

    const walletName = useMemo(
        () => internal.config.walletName,
        [internal.config]
    )

    const setAccountInStore = useCallback(
        ({
            smartAccount,
            credential
        }: {
            smartAccount: SmartAccount
            credential: {
                id: string
                publicKey: `0x${string}`
                userName: string
            }
        }) => {
            internal.store.setState((x) => {
                const existingAccountIndex = x.accounts.findIndex(
                    (account) => account.address === smartAccount.address
                )

                if (existingAccountIndex !== -1) {
                    // Update existing account
                    const updatedAccounts = [...x.accounts]
                    updatedAccounts[existingAccountIndex] = {
                        address: smartAccount.address,
                        key: Key.fromWebAuthnP256({
                            credential: credential,
                            //todo: use rpId
                            rpId: undefined
                        }),
                        type: "smartAccount",
                        name: credential.userName
                    }

                    return {
                        ...x,
                        accounts: updatedAccounts
                    }
                }

                // Add new account
                return {
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
                            type: "smartAccount",
                            name: credential.userName
                        }
                    ]
                }
            })
        },
        [internal.store]
    )

    const createCredential = useCallback(async () => {
        if (dummy) {
            return
        }
        try {
            setIsLoading("signup")
            const client = getClient({
                internal,
                chainId: internal.store.getState().chain.id
            })
            const credential = await (async () => {
                try {
                    const passkeyServerClient = createPasskeyServerClient({
                        chain: client.chain,
                        transport:
                            internal.config.bundler.transports[client.chain.id]
                    })

                    const userName = `${randomAdjective()}_${randomNoun()}`

                    const credential = await createWebAuthnCredential(
                        // Start the registration process
                        await passkeyServerClient.startRegistration({
                            context: {
                                userName
                            }
                        })
                    )

                    // Verify the registration
                    const verifiedCredential =
                        await passkeyServerClient.verifyRegistration({
                            credential,
                            context: {
                                userName
                            }
                        })

                    if (!verifiedCredential.success) {
                        throw new Error("Failed to verify registration")
                    }

                    return {
                        id: verifiedCredential.id,
                        publicKey: verifiedCredential.publicKey,
                        userName
                    }
                } catch {
                    onComplete({
                        queueRequest: {
                            request: queueRequest.request,
                            status: "error",
                            error: new Provider.UserRejectedRequestError()
                        }
                    })
                    return null
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

            setAccountInStore({
                smartAccount,
                credential
            })

            onComplete({
                queueRequest: {
                    request: queueRequest.request,
                    status: "success",
                    result: [smartAccount.address]
                }
            })
        } catch (error) {
            console.error("Error creating credential:", error)
            setError("Failed to create passkey. Please try again.")
            // triggerShake()
        } finally {
            setIsLoading(null)
        }
    }, [dummy, internal, onComplete, queueRequest.request, setAccountInStore])

    const signIn = useCallback(async () => {
        if (dummy) {
            return
        }
        try {
            setIsLoading("signin")
            const client = getClient({
                internal,
                chainId: internal.store.getState().chain.id
            })
            const passkeyServerClient = createPasskeyServerClient({
                chain: client.chain,
                transport: internal.config.bundler.transports[client.chain.id]
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
                publicKey: verifiedCredential.publicKey,
                userName: verifiedCredential.userName
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
            setAccountInStore({
                smartAccount,
                credential
            })

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
                                    ? "Invalid passkey, please sign up or try again with a different passkey"
                                    : "Failed to sign in, please sign up or try using correct passkey"
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
            // triggerShake()
            return
        } finally {
            setIsLoading(null)
        }
    }, [dummy, internal, onComplete, queueRequest, setAccountInStore])

    return (
        <>
            <div className="bg-primary/5 p-6 rounded-t-lg">
                <div className="flex flex-col gap-2 text-center sm:text-left pb-0">
                    <div className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        <h2 className="text-lg leading-none font-semibold">
                            Sign in
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Create or access your wallet securely with your passkey
                    </p>
                </div>
            </div>

            <div className="p-6 pt-5">
                {error && (
                    <Alert variant="destructive" className="mb-5">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-5">
                    <div className="space-y-2.5">
                        <h3 className="text-sm font-medium flex items-center gap-1">
                            Already have a {walletName}?
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent
                                        className="max-w-[220px]"
                                        style={{ zIndex: 4294967294 }}
                                    >
                                        <p>
                                            {walletName} is an embedded smart
                                            account that secures your account
                                            with passkeys.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </h3>
                        <Button
                            className="w-full h-11"
                            variant="outline"
                            onClick={signIn}
                            disabled={isLoading !== null}
                        >
                            {isLoading === "signin" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Fingerprint className="h-4 w-4 text-primary" />
                            )}
                            Sign in with passkey
                        </Button>
                    </div>

                    <div className="relative py-1">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <h3 className="text-sm font-medium flex items-center gap-1">
                            New to {walletName}?
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent
                                        className="max-w-[220px]"
                                        style={{ zIndex: 4294967294 }}
                                    >
                                        <p>
                                            {walletName} is an embedded smart
                                            account that secures your account
                                            with passkeys.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </h3>
                        <Button
                            className="w-full h-11"
                            onClick={() => {
                                setError(null)
                                createCredential()
                            }}
                            disabled={isLoading !== null}
                        >
                            {isLoading === "signup" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogIn className="h-4 w-4" />
                            )}
                            Create new wallet
                        </Button>
                    </div>
                </div>
            </div>

            <DialogFooter className="bg-muted/20 px-6 py-4 border-t">
                <div className="w-full text-xs text-center text-muted-foreground">
                    Your credentials are stored securely and never leave your
                    device
                </div>
            </DialogFooter>
        </>
    )
}
