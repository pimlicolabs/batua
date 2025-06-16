"use client"

import { Button } from "@/components/ui/button";
import { lazy, Suspense, useEffect, useState } from "react"

const Provider = lazy(() => import("@/docs/provider").then(mod => ({ default: mod.Provider })))
const ConnectButton = lazy(() => import("@/docs/connectButton").then(mod => ({ default: mod.ConnectButton })))

export default function TryBatua() {

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="px-4 py-12 border-dashed border-ring border-2 rounded-lg -mx-50 min-h-96 flex items-center justify-center">
            <div className="mx-auto w-fit">
                <Suspense fallback={<Button>Loading...</Button>}>
                {isClient && <Provider><ConnectButton /></Provider>}
                </Suspense>
            </div>
        </div>
    )
}