import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { Check } from "lucide-react"
import { useState } from "react"
import { Hex } from "viem"

export const CopyAddress = ({
    name,
    value,
    className,
    maxLength = 30
}: {
    name: string | React.ReactNode
    value: Hex
    className?: string
    maxLength?: number
}) => {
    const [copied, setCopied] = useState(false)
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={() => {
                            navigator.clipboard.writeText(value)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 1000)
                        }}
                        className={`relative flex items-center justify-center font-mono text-xs truncate bg-muted/10 hover:bg-muted px-3 py-0.5 rounded-md border-dashed border cursor-pointer transition-colors ${className}`}
                        title="Click to copy address"
                    >
                        <span
                            style={{
                                visibility: copied ? "hidden" : "visible"
                            }}
                        >
                            {name}
                        </span>
                        <Check
                            className={`h-4 w-4 text-green-500 absolute ${copied ? "visible" : "invisible"}`}
                        />
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    {value.slice(0, maxLength)}
                    {value.length > maxLength && "..."}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
