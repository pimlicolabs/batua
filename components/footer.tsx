import Image from "next/image"

export default function Footer() {
    return (
        <div className="mt-12 flex justify-center">
            <a
                href="https://github.com/pimlicolabs/batua"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="View Batua on GitHub"
            >
                <Image
                    src="/github.svg"
                    alt="GitHub"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                    aria-hidden="true"
                />
                <span className="font-medium">View on GitHub</span>
            </a>
        </div>
    )
}
