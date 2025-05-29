export default function Intro() {
    return (
        <>
            <h1 className="text-4xl font-bold mb-10 font-mono">batua.sh</h1>

            <div className="text-base mb-8 font-mono">
                <div className="mb-6">
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            Easy to integrate embedded smart account secured by
                            passkeys
                        </li>
                        <li>Support for sponsoring transactions</li>
                        <li>Support for batching multiple transactions</li>
                        <li>You have the complete ownership of the code</li>
                        <li>
                            Embeds into your application&apos;s theme due to
                            shadcn
                        </li>
                        <li>
                            Works with wagmi, viem, ethers, privy, dynamic, and
                            more
                        </li>
                    </ul>
                    <p className="mt-10 text-sm">Made with ❤️ from Pimlico</p>
                </div>
            </div>
        </>
    )
}
