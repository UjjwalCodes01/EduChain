"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import ApplicationModal from "../../../components/ApplicationModal";
import { Button } from "../../../components/ui/stateful-button";
import { POOL_ABI } from "@/lib/contracts";

interface PoolDetails {
  address: string;
  poolName: string;
  poolDescription: string;
  scholarshipAmount: string;
  applicationDeadline: number;
  totalFunds: string;
  availableFunds: string;
  totalScholarshipsAwarded: number;
  applicantCount: number;
  isPaused: boolean;
  creator: string; // Changed from 'admin' to 'creator' for role-based system
}

export default function PoolDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const poolAddress = params.address as string;

  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pool, setPool] = useState<PoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [funding, setFunding] = useState(false);

  const POOL_ABI = [
    "function poolName() view returns (string)",
    "function poolDescription() view returns (string)",
    "function scholarshipAmount() view returns (uint256)",
    "function applicationDeadline() view returns (uint256)",
    "function totalFunds() view returns (uint256)",
    "function availableFunds() view returns (uint256)",
    "function totalScholarshipsAwarded() view returns (uint256)",
    "function paused() view returns (bool)",
    "function owner() view returns (address)",
    "function fundPool() payable"
  ];

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    checkWallet();
    fetchPoolDetails();
  }, [poolAddress]);

  const checkWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
        }
      } catch (error) {
        console.error("Error checking wallet:", error);
      }
    }
  };

  const fetchPoolDetails = async () => {
    try {
      setLoading(true);

      // Fetch from blockchain
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(poolAddress, POOL_ABI, provider);

        // Fetch pool data (updated for new ABI)
        const [name, desc, amount, deadline, totalFunds, availableFunds, awarded, paused] = await Promise.all([
          contract.poolName(),
          contract.poolDescription(),
          contract.scholarshipAmount(),
          contract.applicationDeadline(),
          contract.totalFunds(),
          contract.availableFunds(),
          contract.totalScholarshipsAwarded(),
          contract.paused()
        ]);
        
        const applicantCount = await contract.getApplicantCount();

        setPool({
          address: poolAddress,
          poolName: name,
          poolDescription: desc,
          scholarshipAmount: ethers.formatEther(amount),
          applicationDeadline: Number(deadline),
          totalFunds: ethers.formatEther(totalFunds),
          availableFunds: ethers.formatEther(availableFunds),
          totalScholarshipsAwarded: Number(awarded),
          applicantCount: Number(applicantCount),
          isPaused: paused,
          creator: poolAddress // Pool address for now (role-based system)
        });
      } else {
        throw new Error("MetaMask not installed");
      }
    } catch (error) {
      console.error("Error fetching pool:", error);
      toast.error("Failed to load pool details from blockchain");
    } finally {
      setLoading(false);
    }
  };

  const handleFundPool = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setFunding(true);
      const loadingToast = toast.loading("Processing transaction...");

      if (!window.ethereum) {
        throw new Error("Please install MetaMask to fund the pool");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: poolAddress,
        value: ethers.parseEther(fundAmount)
      });

      await tx.wait();
      
      toast.success(`Successfully funded ${fundAmount} ETH!`, { id: loadingToast });
      setFundAmount("");
      fetchPoolDetails();
    } catch (error: any) {
      console.error("Error funding pool:", error);
      toast.error(error?.message || "Failed to fund pool");
    } finally {
      setFunding(false);
    }
  };

  const calculateScholarshipsAvailable = () => {
    if (!pool) return 0;
    return Math.floor(parseFloat(pool.availableFunds) / parseFloat(pool.scholarshipAmount));
  };

  const getDaysRemaining = () => {
    if (!pool) return 0;
    const now = Date.now() / 1000;
    const remaining = pool.applicationDeadline - now;
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60)));
  };

  const isDeadlinePassed = () => {
    if (!pool) return false;
    return pool.applicationDeadline * 1000 < Date.now();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Pool Not Found</h2>
          <p className="text-gray-400 mb-4">The scholarship pool you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/Home")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1f2937', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)' }
      }} />

      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center border-b border-white/10 backdrop-blur-md">
        <button onClick={() => router.push("/Home")} className="hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold text-white">← Back to Pools</h1>
        </button>
        {walletAddress && (
          <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white">
            {truncateAddress(walletAddress)}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 md:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Pool Header */}
          <div className="mb-8 p-8 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{pool.poolName}</h1>
                <p className="text-gray-400 text-sm">Contract: {truncateAddress(pool.address)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {pool.isPaused ? (
                  <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/30 font-semibold">
                    ⏸️ Paused
                  </span>
                ) : isDeadlinePassed() ? (
                  <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 font-semibold">
                    🔒 Closed
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30 font-semibold">
                    ✅ Open
                  </span>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400 text-sm mb-1">Scholarship Amount</p>
                <p className="text-2xl font-bold text-white">{pool.scholarshipAmount} ETH</p>
                <p className="text-gray-500 text-xs">≈ ${(parseFloat(pool.scholarshipAmount) * 2000).toFixed(0)} USD</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400 text-sm mb-1">Available Scholarships</p>
                <p className="text-2xl font-bold text-purple-400">{calculateScholarshipsAvailable()}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400 text-sm mb-1">Days Remaining</p>
                <p className={`text-2xl font-bold ${getDaysRemaining() < 7 ? 'text-red-400' : 'text-blue-400'}`}>
                  {getDaysRemaining()}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400 text-sm mb-1">Total Applicants</p>
                <p className="text-2xl font-bold text-cyan-400">{pool.applicantCount}</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Description */}
              <div className="p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-lg">
                <h2 className="text-2xl font-bold text-white mb-4">📋 About This Scholarship</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {pool.poolDescription}
                </p>
              </div>

              {/* Eligibility */}
              <div className="p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-lg">
                <h2 className="text-2xl font-bold text-white mb-4">✅ Eligibility Criteria</h2>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Must be enrolled in an accredited institution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Demonstrate academic excellence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Submit all required documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Meet application deadline</span>
                  </li>
                </ul>
              </div>

              {/* Timeline */}
              <div className="p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-lg">
                <h2 className="text-2xl font-bold text-white mb-4">📅 Important Dates</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Application Deadline</span>
                    <span className="text-white font-semibold">
                      {new Date(pool.applicationDeadline * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Days Remaining</span>
                    <span className={`font-semibold ${getDaysRemaining() < 7 ? 'text-red-400' : 'text-green-400'}`}>
                      {getDaysRemaining()} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400">Scholarships Awarded</span>
                    <span className="text-white font-semibold">{pool.totalScholarshipsAwarded}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              
              {/* Apply Card */}
              <div className="p-6 bg-linear-to-br from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/30 backdrop-blur-lg">
                <h3 className="text-xl font-bold text-white mb-4">💎 Award Amount</h3>
                <div className="mb-6">
                  <p className="text-4xl font-bold text-white mb-1">{pool.scholarshipAmount} ETH</p>
                  <p className="text-gray-400 text-sm">≈ ${(parseFloat(pool.scholarshipAmount) * 2000).toFixed(2)} USD</p>
                </div>
                
                {userRole === "student" ? (
                  !isDeadlinePassed() && !pool.isPaused ? (
                    <Button
                      onClick={() => setShowApplicationModal(true)}
                      className="w-full"
                    >
                      Submit Application
                    </Button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-600 rounded-lg text-gray-400 font-semibold cursor-not-allowed"
                    >
                      {pool.isPaused ? "Applications Paused" : "Applications Closed"}
                    </button>
                  )
                ) : userRole === "provider" ? (
                  <button
                    disabled
                    className="w-full py-3 bg-gray-600/50 rounded-lg text-gray-400 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Provider Account
                  </button>
                ) : (
                  <Button onClick={() => router.push("/details")} className="w-full">
                    Register to Apply
                  </Button>
                )}
              </div>

              {/* Fund Pool Card */}
              <div className="p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-lg">
                <h3 className="text-xl font-bold text-white mb-4">💰 Support This Scholarship</h3>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Total Funds</span>
                    <span className="text-white font-semibold">{pool.totalFunds} ETH</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-linear-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${(parseFloat(pool.availableFunds) / parseFloat(pool.totalFunds)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-400">Available</span>
                    <span className="text-purple-400 font-semibold">{pool.availableFunds} ETH</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount in ETH"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Button
                    onClick={handleFundPool}
                    disabled={funding || !fundAmount}
                    className="w-full"
                  >
                    {funding ? "Processing..." : "Fund Pool"}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Your contribution helps students achieve their dreams
                </p>
              </div>

              {/* Pool Stats */}
              <div className="p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-lg">
                <h3 className="text-xl font-bold text-white mb-4">📊 Pool Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pool Creator</span>
                    <span className="text-white font-mono text-sm">{truncateAddress(pool.creator)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Awarded</span>
                    <span className="text-green-400 font-semibold">{pool.totalScholarshipsAwarded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Applicants</span>
                    <span className="text-blue-400 font-semibold">{pool.applicantCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-semibold ${pool.isPaused ? 'text-yellow-400' : isDeadlinePassed() ? 'text-red-400' : 'text-green-400'}`}>
                      {pool.isPaused ? 'Paused' : isDeadlinePassed() ? 'Closed' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Application Modal */}
      {showApplicationModal && (
        <ApplicationModal
          pool={{
            address: pool.address,
            poolName: pool.poolName,
            scholarshipAmount: pool.scholarshipAmount,
            applicationDeadline: pool.applicationDeadline
          }}
          walletAddress={walletAddress}
          onClose={() => setShowApplicationModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-gray-500 border-t border-white/10 mt-12">
        <p>© 2025 EduChain. Powered by Blockchain Technology.</p>
      </footer>
    </div>
  );
}
