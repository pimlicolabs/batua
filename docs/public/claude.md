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
       ssr: true,
       connectors: [injected()],
       transports: {
           [mainnet.id]: http(),
           [sepolia.id]: http(),
       },
   });
   ```

4. Create a client-side providers component:
   - If using src directory: `src/components/providers.tsx`
   - If not using src directory: `components/providers.tsx`

   ```typescript
   "use client";

   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
   import { WagmiProvider } from "wagmi";
   import { config } from "@/lib/wagmi";
   import { ReactNode } from "react";

   const queryClient = new QueryClient();

   export function Providers({ children }: { children: ReactNode }) {
       return (
           <WagmiProvider config={config}>
               <QueryClientProvider client={queryClient}>
                   {children}
               </QueryClientProvider>
           </WagmiProvider>
       );
   }
   ```

5. Update the root layout to use the providers (keep it as a server component):
   ```typescript
   import { Providers } from "@/components/providers";

   export default function RootLayout({
       children,
   }: {
       children: React.ReactNode;
   }) {
       return (
           <html lang="en">
               <body>
                   <Providers>{children}</Providers>
               </body>
           </html>
       );
   }
   ```

6. Create a client-side connect button component:
   - If using src directory: `src/components/connect-button.tsx`
   - If not using src directory: `components/connect-button.tsx`

   ```typescript
   "use client";

   import { useAccount, useConnect, useDisconnect } from "wagmi";
   import { Button } from "@/components/ui/button";

   export function ConnectButton() {
       const { address, isConnected } = useAccount();
       const { connect, connectors } = useConnect();
       const { disconnect } = useDisconnect();

       if (isConnected && address) {
           return (
               <div className="flex items-center gap-2">
                   <span className="text-sm">
                       {address.slice(0, 6)}...{address.slice(-4)}
                   </span>
                   <Button onClick={() => disconnect()} variant="outline">
                       Disconnect
                   </Button>
               </div>
           );
       }

       return (
           <Button onClick={() => connect({ connector: connectors[0] })}>
               Connect Wallet
           </Button>
       );
   }
   ```

7. Add the connect button to your main page (can be a server component):
   ```typescript
   import { ConnectButton } from "@/components/connect-button";

   export default function HomePage() {
       return (
           <main>
               <ConnectButton />
               {/* Rest of your page content */}
           </main>
       );
   }
   ```

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
       chains: [sepolia],
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
- **CRITICAL for Next.js**: All wagmi hooks and components MUST be in client
  components (files with 'use client' directive)
- The root layout should remain a server component and only wrap children with
  the client-side Providers component
