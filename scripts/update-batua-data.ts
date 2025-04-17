#!/usr/bin/env node

/**
 * This script reads the generated batua.json file and creates a TypeScript file
 * that exports the data. This approach works better with Edge functions as it
 * doesn't rely on filesystem access at runtime.
 */

import fs from "node:fs"
import path from "node:path"

// Paths
const sourceJsonPath = path.join(process.cwd(), "public", "r", "batua.json")
const targetTsPath = path.join(process.cwd(), "app", "install", "batua-data.ts")

// Read the JSON file
try {
    console.log(`Reading JSON from ${sourceJsonPath}...`)
    const jsonData = fs.readFileSync(sourceJsonPath, "utf8")
    const parsedData = JSON.parse(jsonData)

    // Create TypeScript content
    const tsContent = `// This file is auto-generated during build - do not edit manually
// Generated on: ${new Date().toISOString()}

export const batuaData = ${JSON.stringify(parsedData, null, 2)};
`

    // Write the TypeScript file
    console.log(`Writing TypeScript to ${targetTsPath}...`)
    fs.writeFileSync(targetTsPath, tsContent)

    console.log("Successfully updated batua-data.ts")
} catch (error) {
    console.error("Error updating batua data:", error)
    process.exit(1)
}
