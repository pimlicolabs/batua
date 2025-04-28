import { announceProvider } from "mipd"
import { Address, Hex, Provider as ProviderOx } from "ox"
import type { Internal } from "@/registry/batua/lib/batua/type"
import { getClient as getClientHelper } from "@/registry/batua/lib/batua/helpers/getClient"
import * as Rpc from "@/registry/batua/lib/batua/typebox/rpc"

export const Provider = {
    from: ({ internal }: { internal: Internal }) => {
        const { store, getImplementation, config } = internal

        function getClient(chainId_?: Hex.Hex | number | undefined) {
            const chainId =
                typeof chainId_ === "string" ? Hex.toNumber(chainId_) : chainId_
            return getClientHelper({ internal, chainId })
        }

        const emitter = ProviderOx.createEmitter()
        const provider = ProviderOx.from({
            ...emitter,
            request: async (request_) => {
                let request: Rpc.parseRequest.ReturnType
                try {
                    request = Rpc.parseRequest(request_)
                } catch (e) {
                    const unsupportedCode = 62
                    if ((e as any).error?.type !== unsupportedCode) throw e

                    // catch unsupported methods
                    if (
                        (request_ as { method: string }).method.startsWith(
                            "wallet_"
                        )
                    )
                        throw new ProviderOx.UnsupportedMethodError()
                    return getClient().request(request_ as any)
                }

                const state = store.getState()

                switch (request.method) {
                    case "eth_accounts": {
                        if (state.accounts.length === 0)
                            throw new ProviderOx.DisconnectedError()
                        const response = state.accounts.map(
                            (account) => account.address
                        )
                        return response
                    }
                    case "eth_chainId": {
                        const response = Hex.fromNumber(state.chain.id)
                        return response
                    }
                    case "wallet_getCapabilities": {
                        const value = {
                            atomicBatch: {
                                supported: true
                            },
                            // createAccount: {
                            //     supported: true
                            // },
                            // permissions: {
                            //     supported: true
                            // },
                            paymasterService: {
                                supported: true
                            }
                        }

                        const capabilities = {} as Record<Hex.Hex, typeof value>
                        for (const chain of config.chains)
                            capabilities[Hex.fromNumber(chain.id)] = value

                        return capabilities
                    }
                    case "eth_requestAccounts": {
                        if (state.accounts.length > 0) {
                            return state.accounts.map(
                                (account) => account.address
                            )
                        }
                        const client = getClient()
                        const { accounts } =
                            await getImplementation().actions.loadAccounts({
                                client,
                                config,
                                request,
                                store
                            })

                        emitter.emit("connect", {
                            chainId: Hex.fromNumber(client.chain.id)
                        })
                        const response = accounts.map(
                            (account) => account.address
                        )
                        return response
                    }
                    case "eth_sendTransaction": {
                        if (state.accounts.length === 0)
                            throw new ProviderOx.DisconnectedError()

                        const [{ chainId, data = "0x", from, to, value }] =
                            request._decoded.params

                        const client = getClient(chainId)

                        if (chainId && chainId !== client.chain.id)
                            throw new ProviderOx.ChainDisconnectedError()

                        const account = state.accounts.find((account) =>
                            Address.isEqual(account.address, from)
                        )
                        if (!account) throw new ProviderOx.UnauthorizedError()

                        const hash =
                            await getImplementation().actions.sendCalls({
                                account,
                                calls: [
                                    {
                                        data,
                                        to,
                                        value
                                    }
                                ],
                                client,
                                config,
                                request,
                                store
                            })

                        let txHash: Hex.Hex | undefined

                        while (!txHash) {
                            const receipts =
                                await getImplementation().actions.getCallsStatus(
                                    {
                                        client,
                                        config,
                                        request,
                                        store,
                                        userOperationHash: hash,
                                        timeout: 60_000 // 1 minute
                                    }
                                )

                            if (receipts.status >= 200) {
                                txHash = receipts.receipts?.[0]?.transactionHash
                            }
                        }

                        return txHash
                    }
                    case "wallet_sendCalls": {
                        if (state.accounts.length === 0)
                            throw new ProviderOx.DisconnectedError()

                        const [{ chainId, calls }] = request._decoded.params

                        const from =
                            request._decoded.params[0].from ??
                            state.accounts[0].address

                        const client = getClient(chainId)

                        if (chainId && chainId !== client.chain.id)
                            throw new ProviderOx.ChainDisconnectedError()

                        const account = state.accounts.find((account) =>
                            Address.isEqual(account.address, from)
                        )
                        if (!account) throw new ProviderOx.UnauthorizedError()

                        const hash =
                            await getImplementation().actions.sendCalls({
                                account,
                                calls,
                                capabilities:
                                    request._decoded.params[0]?.capabilities ??
                                    undefined,
                                client,
                                config,
                                request,
                                store
                            })

                        return hash
                    }
                    case "wallet_getCallsStatus": {
                        if (state.accounts.length === 0)
                            throw new ProviderOx.DisconnectedError()

                        const [userOperationHash] = request._decoded.params

                        const client = getClient()

                        const receipts =
                            await getImplementation().actions.getCallsStatus({
                                client,
                                config,
                                request,
                                store,
                                userOperationHash
                            })

                        return receipts
                    }
                    case "wallet_revokePermissions": {
                        if (state.accounts.length === 0)
                            throw new ProviderOx.DisconnectedError()

                        internal.store.setState((x) => ({
                            ...x,
                            accounts: []
                        }))

                        return undefined
                    }
                }
            }
        })

        const setup = () => {
            const unsubscribe_accounts = store.subscribe(
                (state) => state.accounts,
                (accounts) => {
                    emitter.emit(
                        "accountsChanged",
                        accounts.map((account) => account.address)
                    )
                }
            )

            const unsubscribe_chain = store.subscribe(
                (state) => state.chain,
                (chain) => {
                    emitter.emit("chainChanged", Hex.fromNumber(chain.id))
                }
            )

            const unAnnounce =
                internal.config.announceProvider &&
                typeof window !== "undefined"
                    ? announceProvider({
                          info: {
                              name: "Batua",
                              icon: "data:image/png;base64,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AEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlCdwAAAAAOUJHAAAAEB5AgcAAABQnsABAAAAlPc/JTCo4d+4rjgAAAAASUVORK5CYII=",
                              rdns: "pimlico.io",
                              uuid: internal.id
                          },
                          // biome-ignore lint/suspicious/noExplicitAny: viem & announceProvider has different declaration but same thing
                          provider: provider as any
                      })
                    : () => {}
            return () => {
                unsubscribe_accounts()
                unsubscribe_chain()
                unAnnounce()
            }
        }

        const destroy = setup()

        return Object.assign(provider, {
            destroy
        })
    }
}
