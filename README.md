# Batua

Batua is an easy-to-integrate embedded smart account shadcn/ui component,
secured by passkeys. It is designed to work alongside injected and external
wallets, and provides powerful features for modern dApps.

## Features

- **Passkey-secured embedded smart accounts**
- **Transaction sponsorship** (paymaster integration)
- **Batching of multiple transactions**
- **Full code ownership** for developers
- **Seamless theming** via shadcn
- **Compatibility** with wagmi, viem, ethers, privy, dynamic, and more

## Installation

Install Batua in your React/Next.js project using your preferred package
manager:

```sh
# pnpm
pnpm dlx shadcn@latest add https://www.batua.sh/r/batua.json

# npm
npx shadcn@latest add https://www.batua.sh/r/batua.json

# yarn
yarn dlx shadcn@latest add https://www.batua.sh/r/batua.json

# bun
bunx --bun shadcn@latest add https://www.batua.sh/r/batua.json
```

## Usage Example

```tsx
import { Batua } from "@/lib/batua";
import { sepolia } from "viem/chains";
import { http } from "viem/transport";

const pimlicoApiKey = "your-pimlico-api-key";

Batua.create({
    rpc: {
        transports: {
            [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
        },
    },
    // optional
    paymaster: {
        transports: {
            [sepolia.id]: http(
                `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`,
            ),
        },
        // optional
        context: {
            sponsorshipPolicyId: process.env.NEXT_PUBLIC_SPONSORSHIP_POLICY_ID,
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

## Try Batua

Batua works alongside other wallets and provides UI components for connecting,
minting test ERC20 tokens, and sending batch transactions. All interactions are
designed to be simple and developer-friendly.

## Warning

> **Warning**
>
> Do not use Batua in production environments as of now.

---

Made with ❤️ from Pimlico.
