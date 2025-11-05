export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-200 mb-2">Loading Home...</h2>
                <p className="text-gray-400">Fetching scholarship pools</p>
            </div>
        </div>
    );
}
