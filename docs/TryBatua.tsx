
import { lazy, Suspense, useEffect, useState } from "react"

const Provider = lazy(() => import("@/docs/provider").then(mod => ({ default: mod.Provider })))
const ConnectButton = lazy(() => import("@/docs/connectButton").then(mod => ({ default: mod.ConnectButton })))

export default function TryBatua() {

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <Suspense fallback={null}>
           {isClient && <Provider><ConnectButton /></Provider>}
        </Suspense>
    )
}