# NOTES

1. The set of instructions are always written to be executed with pnpm.
2. But the environment where you will be executing these instructions might be
   using a different package manager.
3. Before executing any command listed below, first convert that command to the
   user's preferred package manager and then execute them.

# Instructions

Follow the instructions in order:

- Follow the instructions in <shadcn> section.
- Follow the instructions in <wagmi> section.
- Follow the instructions in <batua> section.

USE only cli and DO NOT manually install anything.

<shadcn>
    Follow the instructions in order:

    - Check if shadcn//ui is already installed or not. if installed, skip all the steps after this instructions and go back.
    - Check if the current project uses `src` directory or not.
    - If project uses `src` directory, then command to install shadcn is `pnpm dlx shadcn@latest init -t next -b neutral -d --src-dir -s`.
    - If the project does not use `src` directory, then command to install shadcn is `pnpm dlx shadcn@latest init -t next -b neutral -d -s`.

</shadcn>

<wagmi>
    Follow the instructions in order:

    - Check if wagmi is already installed or not. if installed, skip all the steps after this instructions and go back.
    - Following manual wagmi instructions at https://wagmi.sh/react/getting-started#manual-installation to install wagmi. Configure wagmi with only injected provider and no other provider
    - Add a connect button to the main page to allow users to connect to the website using their external wallets.

</wagmi>

<batua>
    Follow the instructions in order:

    - If project uses `src` directory, then command to install batua is `pnpm dlx shadcn@latest add -o --src-dir -s -a -o https://batua.sh/install`.
    - If the project does not use `src` directory, then command to install batua is `pnpm dlx shadcn@latest add -o -s -a -o https://batua.sh/install`.
    - Implement Batua:
        After installing Batua, you can integrate it into your application:
        ```
        import { Batua } from "@/lib/batua"
        import { sepolia } from "viem/chains"
        import { http } from "viem/transport"
        
        const pimlicoApiKey = "your-pimlico-api-key" // replace this with env variables
        
        Batua.create({
            rpc: {
                transports: {
                    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com")
                }
            },
            // optional
            paymaster: {
                transports: {
                    [sepolia.id]: http(
                        `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`
                    )
                },
                // optional
                context: {
                    sponsorshipPolicyId: process.env.NEXT_PUBLIC_SPONSORSHIP_POLICY_ID
                }
            },
            bundler: {
                transports: {
                    [sepolia.id]: http(
                        `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${pimlicoApiKey}`
                    )
                }
            }
        })
        ```
        The above code has to be in the same file where you have setup wagmi's config.

</batua>
