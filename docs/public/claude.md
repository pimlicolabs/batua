# Project Setup Instructions

Execute these tasks in the exact order listed below. DO NOT skip any step.

## Prerequisites

1. First, detect the package manager used in the project by checking for:
   - `pnpm-lock.yaml` → use pnpm
   - `yarn.lock` → use yarn
   - `package-lock.json` → use npm
   - `bun.lockb` → use bun
2. Convert all commands below from pnpm to the detected package manager before
   execution
3. Check if the project uses a `src` directory by looking for `src/app` or
   `src/pages`

## Task 1: Install and Configure shadcn

Execute in order:

1. Determine if project uses `src` directory
2. Run the appropriate command:
   - **WITH src directory**:
     `pnpm dlx shadcn@latest init -t next -b neutral -d --src-dir -s`
   - **WITHOUT src directory**:
     `pnpm dlx shadcn@latest init -t next -b neutral -d -s`
3. Verify installation by checking for `components.json` file

## Task 2: Install and Configure wagmi

Execute in order:

1. Install wagmi and its dependencies:
   ```bash
   pnpm add wagmi viem@2.x @tanstack/react-query
   ```

2. Create wagmi configuration file at the appropriate location:
   - If using src directory: `src/lib/wagmi.ts`
   - If not using src directory: `lib/wagmi.ts`

3. Add the following configuration (use only injected connector):
   ```typescript
   import { createConfig, http } from "wagmi";
   import { mainnet, sepolia } from "wagmi/chains";
   import { injected } from "wagmi/connectors";

   export const config = createConfig({
       chains: [mainnet, sepolia],
       connectors: [injected()],
       transports: {
           [mainnet.id]: http(),
           [sepolia.id]: http(),
       },
   });
   ```

4. Set up providers in the root layout file
5. Add a connect button component to the main page using wagmi's useConnect hook

## Task 3: Install and Configure Batua

Execute in order:

1. Run the appropriate command based on src directory:
   - **WITH src directory**:
     `pnpm dlx shadcn@latest add -a -s --src-dir https://batua.sh/install`
   - **WITHOUT src directory**:
     `pnpm dlx shadcn@latest add -a -s https://batua.sh/install`

2. After installation, add Batua configuration to the same file where wagmi
   config is located:
   ```typescript
   import { Batua } from "@/lib/batua";
   import { sepolia } from "viem/chains";
   import { http } from "viem/transport";

   const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY ||
       "your-pimlico-api-key";

   Batua.create({
       rpc: {
           transports: {
               [sepolia.id]: http(
                   "https://ethereum-sepolia-rpc.publicnode.com",
               ),
           },
       },
       paymaster: {
           transports: {
               [sepolia.id]: http(
                   `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`,
               ),
           },
           context: {
               sponsorshipPolicyId:
                   process.env.NEXT_PUBLIC_SPONSORSHIP_POLICY_ID,
           },
       },
       bundler: {
           transports: {
               [sepolia.id]: http(
                   `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`,
               ),
           },
       },
   });
   ```

3. Add necessary environment variables to `.env.local`:
   ```
   NEXT_PUBLIC_PIMLICO_API_KEY=your-actual-api-key
   NEXT_PUBLIC_SPONSORSHIP_POLICY_ID=your-policy-id
   ```

## Important Notes

- Execute each task completely before moving to the next
- Always use CLI commands, never manual installation
- If any command fails, stop and report the error before proceeding
- Verify each installation step before moving forward
