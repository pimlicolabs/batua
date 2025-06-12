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
    value: Hex
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
                        className={`relative flex items-center justify-center font-mono text-xs bg-muted/10 hover:bg-muted px-3 py-0.5 rounded-md border-dashed border cursor-pointer transition-colors min-w-0 ${className}`}
                        title=""
                    >
                        {typeof name === "string" ? (
                            <div
                                className={`flex max-w-full text-muted-foreground truncate min-w-0 ${
                                    copied ? "invisible" : "visible"
                                }`}
                            >
                                {name}
                            </div>
                        ) : (
                            <span
                                className={`truncate ${copied ? "invisible" : "visible"}`}
                            >
                                {name}
                            </span>
                        )}
                        <Check
                            className={`h-5 w-5 text-green-500 absolute ${copied ? "visible" : "invisible"}`}
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
