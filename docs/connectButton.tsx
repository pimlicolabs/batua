import { useConnect } from "wagmi";
import { useAccount, useDisconnect } from "wagmi";
import { useState } from "react";

export function ConnectButton() {
    const { connectors, connect, isPending, error } = useConnect();
    const { isConnected, address } = useAccount();
    const { disconnect } = useDisconnect();
    const [isConnecting, setIsConnecting] = useState(false);

    // Find the Batua connector
    const batuaConnector = connectors.find(connector => connector.name === "Batua");

    const handleConnect = async () => {
        if (!batuaConnector) {
            console.error("Batua connector not found");
            return;
        }

        try {
            setIsConnecting(true);
            await connect({ connector: batuaConnector });
        } catch (err) {
            console.error("Failed to connect:", err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        disconnect();
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (isConnected && address) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700">
                        Connected: {formatAddress(address)}
                    </span>
                </div>
                <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleConnect}
                disabled={!batuaConnector || isPending || isConnecting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                {(isPending || isConnecting) ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Connecting...
                    </>
                ) : (
                    "Connect to Batua"
                )}
            </button>
            
            {!batuaConnector && (
                <p className="text-sm text-red-600">
                    Batua connector not found. Make sure Batua is properly configured.
                </p>
            )}
            
            {error && (
                <p className="text-sm text-red-600">
                    Connection failed: {error.message}
                </p>
            )}
        </div>
    );
}

export default ConnectButton;

