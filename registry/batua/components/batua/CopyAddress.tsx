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
    tooltip = value,
    maxLength = 60
}: {
    name: string | React.ReactNode
    value: Hex | string
    className?: string
    maxLength?: number
    tooltip?: string
}) => {
    const [copied, setCopied] = useState(false)
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => {
                            navigator.clipboard.writeText(value)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 1000)
                        }}
                        className={`flex items-center justify-center font-mono text-xs bg-muted/10 hover:bg-muted px-3 py-0.5 rounded-md border-dashed border cursor-pointer min-w-0 ${className}`}
                        title=""
                    >
                        <span
                            className={`truncate ${copied ? "hidden" : "block"}`}
                        >
                            {name}
                        </span>
                        <Check
                            className={`h-4 w-4 text-green-500 ${copied ? "block" : "hidden"}`}
                        />
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    {tooltip.slice(0, maxLength)}
                    {tooltip.length > maxLength && "..."}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
