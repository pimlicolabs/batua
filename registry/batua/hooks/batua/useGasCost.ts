import { useEffect, useState } from "react"
import { UserOperation } from "viem/account-abstraction"

export const useGasCost = (userOperation: UserOperation<"0.7"> | null) => {
    const [gasCost, setGasCost] = useState<bigint | null>(null)

    useEffect(() => {
        if (!userOperation) {
            return
        }

        const gasLimit =
            userOperation.callGasLimit +
            userOperation.verificationGasLimit +
            userOperation.preVerificationGas +
            (userOperation.paymasterPostOpGasLimit ?? BigInt(0)) +
            (userOperation.preVerificationGas ?? BigInt(0))

        const costInEther = gasLimit * userOperation.maxFeePerGas

        setGasCost(costInEther)
    }, [userOperation])

    return gasCost
}
