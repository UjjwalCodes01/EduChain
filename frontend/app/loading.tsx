export default function Loading() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-white mb-2">Loading EduChain...</h2>
                <p className="text-gray-400">Please wait while we prepare your experience</p>
            </div>
        </div>
    );
}
