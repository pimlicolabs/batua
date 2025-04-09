"use client"
import * as React from "react"
// import {
//     useSendTransaction,
//     useWaitForTransactionReceipt
// } from "@permissionless/wagmi"
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi"
import { useCallback } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"

// This page displays items from the custom registry.
// You are free to implement this with your own design as needed.

export default function Home() {
    const account = useAccount()
    const { connectors, connect, status, error } = useConnect()
    const { disconnect } = useDisconnect()

    const {
        sendTransaction,
        data: transactionReference,
        isPending
    } = useSendTransaction()

    const { data: receipt } = useWaitForTransactionReceipt({
        hash: transactionReference
    })

    // console.log({
    //     transactionHash: transactionReference,
    //     isPending,
    //     receipt,
    //     isReceiptPending
    // })

    const sendTransactionCallback = useCallback(async () => {
        sendTransaction({
            to: "0x433704c40F80cBff02e86FD36Bc8baC5e31eB0c1",
            data: "0x"
        })
    }, [sendTransaction])

    return (
        <>
            <div>
                <h2>Account</h2>

                <div>
                    status: {account.status}
                    <br />
                    addresses: {JSON.stringify(account.addresses)}
                    <br />
                    chainId: {account.chainId}
                </div>

                {account.status === "connected" && (
                    <button type="button" onClick={() => disconnect()}>
                        Disconnect
                    </button>
                )}
            </div>

            {account.status === "connected" && (
                <div style={{ marginTop: 60 }}>
                    {isPending && <div>Sending transaction...</div>}

                    {transactionReference && (
                        <div>Awaiting confirmation: {transactionReference}</div>
                    )}

                    {receipt && <div>{receipt.status}</div>}

                    {receipt?.transactionHash && (
                        <div>Transaction hash: {receipt.transactionHash}</div>
                    )}

                    <Button
                        onClick={sendTransactionCallback}
                        type="button"
                        disabled={isPending}
                    >
                        Send Transaction
                    </Button>
                </div>
            )}

            {account.status === "disconnected" && (
                <div style={{ marginTop: 60 }}>
                    <h2>Connect</h2>
                    {connectors.map((connector) => (
                        <Button
                            key={connector.uid}
                            onClick={() => connect({ connector })}
                            type="button"
                            style={{ marginRight: 10 }}
                        >
                            {connector.name}
                        </Button>
                    ))}
                    <div>{status}</div>
                    <div>{error?.message}</div>
                </div>
            )}
        </>
    )
}
