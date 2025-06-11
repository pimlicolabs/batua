import { useEffect, useState } from "react"
import { Address, Chain, PublicClient, Transport } from "viem"

export const useBalance = ({
    address,
    client
}: {
    address: Address | undefined
    client: PublicClient<Transport, Chain>
}) => {
    const [balance, setBalance] = useState<bigint | null>(null)

    useEffect(() => {
        if (!address) {
            return
        }
        client
            .getBalance({
                address: address
            })
            .then((balance) => {
                setBalance(balance)
            })
    }, [address, client])

    return balance
}
