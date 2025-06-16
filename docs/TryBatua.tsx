import { Button } from "@/components/ui/button";
import React, { lazy, Suspense } from "react"

function lazyNoSSR<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>): React.LazyExoticComponent<T> {
    if (typeof window === "undefined") {
        return lazy(() => new Promise<never>(() => {/* intentionally never resolves */})) as any;
    }
    return lazy(factory);
}

const Provider = lazyNoSSR(() => import("@/docs/provider").then(mod => ({ default: mod.Provider })));
const ConnectButton = lazyNoSSR(() => import("@/docs/connectButton").then(mod => ({ default: mod.ConnectButton })));

export default function TryBatua() {

    return (
        <div className="px-4 py-12 border-dashed border-ring border-2 rounded-lg -mx-20 min-h-96 flex items-center justify-center">
            <Suspense fallback={<Button className="flex items-center gap-2 w-40">Try Batua</Button>}>
                <Provider><ConnectButton /></Provider>
            </Suspense>
        </div>
    )
}