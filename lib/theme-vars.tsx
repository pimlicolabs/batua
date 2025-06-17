export type ThemeVariables = Record<string, string>

/**
 * Inject (or override) CSS variables on the provided element (defaults to :root).
 * Pass an object whose keys are variable names WITHOUT the leading `--`.
 */
export function injectThemeVariables(
    vars: Partial<ThemeVariables>,
    target: HTMLElement | null = null
) {
    if (typeof document === "undefined") return // Guard for SSR/SSG.
    const root = target ?? document.documentElement

    for (const [key, value] of Object.entries(vars)) {
        if (typeof value === "string") {
            root.style.setProperty(`--${key}`, value)
        }
    }
}

// ---------------------------------------------------------------------------
// React helpers to make working with runtime theme overrides convenient.
// ---------------------------------------------------------------------------
import React from "react"

interface ThemeVarsContextValue {
    themeVars: Partial<ThemeVariables>
    setThemeVars: (vars: Partial<ThemeVariables>) => void
}

const ThemeVarsContext = React.createContext<ThemeVarsContextValue | undefined>(
    undefined
)

export function ThemeVarsProvider({ children }: { children: React.ReactNode }) {
    const [themeVars, setThemeVarsState] = React.useState<
        Partial<ThemeVariables>
    >({})

    const setThemeVars = React.useCallback((vars: Partial<ThemeVariables>) => {
        setThemeVarsState((prev) => {
            const merged = { ...prev, ...vars }
            injectThemeVariables(vars)
            return merged
        })
    }, [])

    React.useEffect(() => {
        injectThemeVariables(themeVars)
    }, [themeVars])

    return (
        <ThemeVarsContext.Provider value={{ themeVars, setThemeVars }}>
            {children}
        </ThemeVarsContext.Provider>
    )
}

export function useThemeVars() {
    const context = React.useContext(ThemeVarsContext)
    if (!context) {
        throw new Error("useThemeVars must be used within a ThemeVarsProvider")
    }
    return context
}
