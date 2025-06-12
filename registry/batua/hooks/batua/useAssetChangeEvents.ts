import { KernelSmartAccount } from "@/registry/batua/hooks/batua/useSmartAccount"
import { useEffect, useState } from "react"
import {
    erc721Abi,
    erc20Abi,
    Log,
    Chain,
    PublicClient,
    Transport,
    parseEther,
    parseEventLogs,
    Address
} from "viem"
import { UserOperation } from "viem/account-abstraction"

export type TokenInfo = {
    name?: string
    symbol?: string
    decimals?: number
    logo?: string
}

export type NftInfo = {
    name?: string
    description?: string
    image?: string
}

export type AssetChangeEvent<
    T extends "Approval" | "ApprovalForAll" | "Transfer" =
        | "Approval"
        | "ApprovalForAll"
        | "Transfer"
> = Log<
    bigint,
    number,
    false,
    undefined,
    true,
    typeof erc20Abi | typeof erc721Abi,
    T
> & {
    tokenInfo?: TokenInfo
    nftInfo?: NftInfo
}

const getErc20Info = async ({
    client,
    events
}: {
    client: PublicClient<Transport, Chain>
    events: AssetChangeEvent[]
}): Promise<AssetChangeEvent[]> => {
    const erc20ContractAddresses = [
        ...new Set(events.map((event) => event.address))
    ]
    const tokenInfoMap = new Map<Address, TokenInfo>()

    await Promise.all(
        erc20ContractAddresses.map(async (address) => {
            try {
                const [name, symbol, decimals] = await Promise.all([
                    client.readContract({
                        address,
                        abi: erc20Abi,
                        functionName: "name"
                    }),
                    client.readContract({
                        address,
                        abi: erc20Abi,
                        functionName: "symbol"
                    }),
                    client.readContract({
                        address,
                        abi: erc20Abi,
                        functionName: "decimals"
                    })
                ])

                // const logo =
                //     "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"

                const logo = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

                tokenInfoMap.set(address, {
                    name,
                    symbol,
                    decimals,
                    logo
                })
            } catch {
                // Ignore errors, might not be an ERC20 token
            }
        })
    )

    return events.map((event) => ({
        ...event,
        tokenInfo: tokenInfoMap.get(event.address)
    }))
}

const getErc721Info = async ({
    client,
    events
}: {
    client: PublicClient<Transport, Chain>
    events: AssetChangeEvent[]
}) => {
    // Process ERC721 events
    const erc721ContractAddresses = [
        ...new Set(events.map((event) => event.address))
    ]
    const nftContractInfoMap = new Map<
        Address,
        { name?: string; symbol?: string }
    >()

    const erc721ContractPromises = erc721ContractAddresses.map(
        async (address) => {
            try {
                const [name, symbol] = await Promise.all([
                    client
                        .readContract({
                            address,
                            abi: erc721Abi,
                            functionName: "name"
                        })
                        .catch(() => undefined),
                    client
                        .readContract({
                            address,
                            abi: erc721Abi,
                            functionName: "symbol"
                        })
                        .catch(() => undefined)
                ])
                nftContractInfoMap.set(address, { name, symbol })
            } catch (e) {
                // Ignore errors
            }
        }
    )

    await Promise.all(erc721ContractPromises)

    const enrichedEvents = await Promise.all(
        events.map(async (event) => {
            const enrichedEvent: AssetChangeEvent = { ...event }
            const contractInfo = nftContractInfoMap.get(event.address)
            if (contractInfo) {
                enrichedEvent.tokenInfo = {
                    name: contractInfo.name,
                    symbol: contractInfo.symbol
                }
            }

            if (event.eventName === "Transfer" && "tokenId" in event.args) {
                try {
                    const tokenId = event.args.tokenId
                    const tokenURI = await client.readContract({
                        address: event.address,
                        abi: erc721Abi,
                        functionName: "tokenURI",
                        args: [tokenId]
                    })

                    if (tokenURI) {
                        const metadataUrl = tokenURI.startsWith("ipfs://")
                            ? `https://ipfs.io/ipfs/${tokenURI.substring(7)}`
                            : tokenURI

                        try {
                            const response = await fetch(metadataUrl)
                            if (response.ok) {
                                const metadata = await response.json()
                                const imageUrl = metadata.image
                                enrichedEvent.nftInfo = {
                                    name: metadata.name,
                                    description: metadata.description,
                                    image: imageUrl?.startsWith("ipfs://")
                                        ? `https://ipfs.io/ipfs/${imageUrl.substring(7)}`
                                        : imageUrl
                                }
                            }
                        } catch (e) {
                            // fetch metadata failed
                        }
                    }
                } catch (e) {
                    // tokenURI failed
                }
            }
            return enrichedEvent
        })
    )

    return enrichedEvents
}

const simulate = async ({
    userOperation,
    client,
    smartAccountClient
}: {
    userOperation: UserOperation<"0.7">
    client: PublicClient<Transport, Chain>
    smartAccountClient: KernelSmartAccount
}) => {
    const decodedCalls = await smartAccountClient.account.decodeCalls?.(
        userOperation.callData
    )

    const { results } = await client
        .simulateCalls({
            account: userOperation.sender,
            calls: decodedCalls ?? [
                {
                    to: userOperation.sender,
                    data: userOperation.callData
                }
            ],
            stateOverrides: [
                {
                    address: userOperation.sender,
                    balance: parseEther("10000")
                }
            ]
        })
        .catch(() => {
            return {
                results: []
            }
        })

    const erc20Events: AssetChangeEvent[] = []
    const erc721Events: AssetChangeEvent[] = []

    for (const result of results) {
        if (!result.logs) {
            continue
        }

        erc20Events.push(
            ...parseEventLogs({
                logs: result.logs,
                abi: erc20Abi
            })
        )

        erc721Events.push(
            ...parseEventLogs({
                logs: result.logs,
                abi: erc721Abi
            })
        )
    }

    const [erc20Info, erc721Info] = await Promise.all([
        getErc20Info({ client, events: erc20Events }),
        getErc721Info({ client, events: erc721Events })
    ])

    return [...erc20Info, ...erc721Info]
}

export const useAssetChangeEvents = ({
    userOperation,
    client,
    smartAccountClient
}: {
    userOperation: UserOperation<"0.7"> | null
    client: PublicClient<Transport, Chain>
    smartAccountClient: KernelSmartAccount | null
}) => {
    const [assetChangeEvents, setAssetChangeEvents] = useState<
        AssetChangeEvent[] | null
    >(null)

    useEffect(() => {
        if (
            !userOperation ||
            assetChangeEvents !== null ||
            !smartAccountClient
        ) {
            return
        }

        simulate({ userOperation, client, smartAccountClient })
            .then((assetChangeEvents) => {
                setAssetChangeEvents(assetChangeEvents)
            })
            .catch((e) => {
                console.error(e)
                setAssetChangeEvents([])
            })
    }, [userOperation, client, assetChangeEvents, smartAccountClient])

    return assetChangeEvents
}
