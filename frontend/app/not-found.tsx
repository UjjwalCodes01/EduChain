"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/Home");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl">
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 animate-gradient mb-4">
            404
          </h1>
          <div className="text-6xl mb-6 animate-bounce">🔍</div>
        </div>

        {/* Error Message */}
        <div className="space-y-4 mb-8">
          <h2 className="text-3xl font-bold text-white">Page Not Found</h2>
          <p className="text-gray-400 text-lg">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-gray-500 text-sm">
            It might be a scholarship that was removed, or a pool that no longer exists.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button
            onClick={() => router.push("/Home")}
            className="px-8 py-4 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Go to Home
          </button>
          <button
            onClick={() => router.back()}
            className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-lg transition-all"
          >
            Go Back
          </button>
        </div>

        {/* Auto Redirect Info */}
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Redirecting to home in {countdown} seconds...</span>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-gray-400 mb-4">Quick Links:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => router.push("/Home")}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Browse Scholarships
            </button>
            <button
              onClick={() => router.push("/my-applications")}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              My Applications
            </button>
            <button
              onClick={() => router.push("/create-pool")}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Create Pool
            </button>
            <button
              onClick={() => router.push("/details")}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Register
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
