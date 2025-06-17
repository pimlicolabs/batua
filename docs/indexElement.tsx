export const IndexElement = ({ contents }: { contents: React.ReactNode }) => {
    return <div className="col-span-1 sm:col-span-1 md:col-span-6 xl:col-span-6">
        <div className="border-black/10 dark:border-white/10 border border-solid rounded-lg p-4 w-full h-full">
        {contents}

        </div>
    </div>
}