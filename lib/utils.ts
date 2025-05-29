import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const TEST_ERC20_TOKEN_ADDRESS =
    "0xFC3e86566895Fb007c6A0d3809eb2827DF94F751" as const
