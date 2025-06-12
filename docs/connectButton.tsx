import { useConnect } from "wagmi";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";

export function ConnectButton() {
    const account = useAccount()
    const { connectors, connect, error } = useConnect()

    return (
        <div>
            {account.status != "connected" && (
                    <div className="flex flex-wrap gap-3">
                        {connectors.map(
                            (connector) =>
                                connector.name === "Batua" && (
                                    <Button
                                        key={connector.uid}
                                        onClick={() => connect({ connector })}
                                        type="button"
                                        className="flex items-center gap-2 w-60"
                                        variant={
                                            connector.name === "Batua"
                                                ? "default"
                                                : "outline"
                                        }
                                    >
                                        {connector.name}
                                    </Button>
                                )
                        )}
                    </div>
                )}
        </div>
    )
}

export default ConnectButton;

