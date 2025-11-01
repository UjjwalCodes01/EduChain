"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import Threads from "../../components/Threads";
import { Button } from "../../components/ui/stateful-button";
import ApplicationModal from "../../components/ApplicationModal";
import { POOL_FACTORY_ADDRESS, FACTORY_ABI, POOL_ABI } from "@/lib/contracts";
import { API_ENDPOINTS } from "@/lib/api";

// Pool interface
interface Pool {
    address: string;
    poolName: string;
    scholarshipAmount: string;
    applicationDeadline: number;
    totalFunds: string;
    availableFunds: string;
    totalScholarshipsAwarded: number;
    applicantCount: number;
    admin: string;
}

const HomePage = () => {
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [pools, setPools] = useState<Pool[]>([]);
    const [filteredPools, setFilteredPools] = useState<Pool[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [userRole, setUserRole] = useState<string | null>(null);
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    
    // Advanced filters
    const [minAmount, setMinAmount] = useState<string>("");
    const [maxAmount, setMaxAmount] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("newest");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    const router = useRouter();

    // Check wallet connection and user role
    useEffect(() => {
        checkWalletConnection();
        // Get user role from localStorage
        const role = localStorage.getItem("userRole");
        setUserRole(role);
    }, []);

    // Fetch pools when wallet is connected
    useEffect(() => {
        if (walletAddress) {
            fetchPools();
        }
    }, [walletAddress]);

    // Filter pools based on search and status
    useEffect(() => {
        let filtered = [...pools];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(pool =>
                pool.poolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pool.admin.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (filterStatus === "open") {
            filtered = filtered.filter(pool => pool.applicationDeadline > Date.now() / 1000);
        } else if (filterStatus === "closed") {
            filtered = filtered.filter(pool => pool.applicationDeadline <= Date.now() / 1000);
        }

        // Amount range filter
        if (minAmount) {
            filtered = filtered.filter(pool => parseFloat(pool.scholarshipAmount) >= parseFloat(minAmount));
        }
        if (maxAmount) {
            filtered = filtered.filter(pool => parseFloat(pool.scholarshipAmount) <= parseFloat(maxAmount));
        }

        // Sort
        if (sortBy === "newest") {
            filtered.sort((a, b) => b.applicationDeadline - a.applicationDeadline);
        } else if (sortBy === "amount-high") {
            filtered.sort((a, b) => parseFloat(b.scholarshipAmount) - parseFloat(a.scholarshipAmount));
        } else if (sortBy === "amount-low") {
            filtered.sort((a, b) => parseFloat(a.scholarshipAmount) - parseFloat(b.scholarshipAmount));
        } else if (sortBy === "deadline") {
            filtered.sort((a, b) => a.applicationDeadline - b.applicationDeadline);
        }

        setFilteredPools(filtered);
    }, [searchQuery, filterStatus, pools, minAmount, maxAmount, sortBy]);

    const checkWalletConnection = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    const walletAddr = accounts[0].address;
                    setWalletAddress(walletAddr);
                    
                    // Check if user data is in localStorage
                    const storedRole = localStorage.getItem("userRole");
                    const storedWallet = localStorage.getItem("userWallet");
                    
                    // If no localStorage data, check backend
                    if (!storedRole || !storedWallet) {
                        try {
                            const response = await fetch(API_ENDPOINTS.AUTH_CHECK(walletAddr));
                            const data = await response.json();
                            
                            if (data.registered && data.user) {
                                // Auto-login: Set user data in localStorage
                                localStorage.setItem("userWallet", data.user.wallet);
                                localStorage.setItem("userRole", data.user.role);
                                localStorage.setItem("userEmail", data.user.email);
                                setUserRole(data.user.role);
                            }
                        } catch (error) {
                            console.error("Error checking wallet registration:", error);
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking wallet connection:", error);
            }
        }
        setLoading(false);
    };

    const connectWallet = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            try {
                const loadingToast = toast.loading("Connecting wallet...");
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                const walletAddr = accounts[0];
                
                setWalletAddress(walletAddr);
                
                // Check if wallet is already registered
                try {
                    const response = await fetch(API_ENDPOINTS.AUTH_CHECK(walletAddr));
                    const data = await response.json();
                    
                    if (data.registered && data.user) {
                        // Auto-login: Set user data in localStorage
                        localStorage.setItem("userWallet", data.user.wallet);
                        localStorage.setItem("userRole", data.user.role);
                        localStorage.setItem("userEmail", data.user.email);
                        
                        toast.success(`Welcome back! Logged in as ${data.user.role}`, { id: loadingToast });
                    } else {
                        // New user - needs to complete registration
                        toast.success("Wallet connected! Please complete your registration.", { id: loadingToast });
                        
                        // Redirect to registration page after a short delay
                        setTimeout(() => {
                            router.push("/details");
                        }, 1500);
                    }
                } catch (error) {
                    console.error("Error checking wallet registration:", error);
                    toast.success("Wallet connected successfully!", { id: loadingToast });
                }
            } catch (error) {
                console.error("Error connecting wallet:", error);
                toast.error("Failed to connect wallet. Please try again.");
            }
        } else {
            toast.error("Please install MetaMask to use this application!");
            window.open("https://metamask.io/download/", "_blank");
        }
    };

    const disconnectWallet = () => {
        setWalletAddress("");
        setPools([]);
        setFilteredPools([]);
        localStorage.removeItem("userRole");
        localStorage.removeItem("userWallet");
        toast.success("Wallet disconnected");
    };

    const fetchPools = async () => {
        try {
            setLoading(true);
            
            if (!window.ethereum) {
                toast.error("Please install MetaMask to view pools");
                setLoading(false);
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const factory = new ethers.Contract(POOL_FACTORY_ADDRESS, FACTORY_ABI, provider);
            const poolAddresses = await factory.getAllPools();
            
            const poolsData: Pool[] = [];
            
            for (const poolAddress of poolAddresses) {
                const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
                
                // Fetch pool data (updated for new ABI)
                const [name, amount, deadline, totalFunds, availableFunds, awarded] = await Promise.all([
                    poolContract.poolName(),
                    poolContract.scholarshipAmount(),
                    poolContract.applicationDeadline(),
                    poolContract.totalFunds(),
                    poolContract.availableFunds(),
                    poolContract.totalScholarshipsAwarded()
                ]);
                
                const applicantCount = await poolContract.getApplicantCount();
                
                poolsData.push({
                    address: poolAddress,
                    poolName: name,
                    scholarshipAmount: ethers.formatEther(amount),
                    applicationDeadline: Number(deadline),
                    totalFunds: ethers.formatEther(totalFunds),
                    availableFunds: ethers.formatEther(availableFunds),
                    totalScholarshipsAwarded: Number(awarded),
                    applicantCount: Number(applicantCount),
                    creator: poolAddress // Pool address is sufficient for display
                });
            }

            setPools(poolsData);
            setFilteredPools(poolsData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching pools:", error);
            toast.error("Failed to load pools from blockchain");
            setLoading(false);
        }
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatEther = (amount: string) => {
        return `${parseFloat(amount).toFixed(2)} ETH`;
    };

    const isDeadlinePassed = (deadline: number) => {
        return deadline <= Date.now() / 1000;
    };

    const formatDeadline = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    return (
        <div className="min-h-screen bg-black overflow-x-hidden">
            {/* Toast Notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#1f2937',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            
            {/* Background Animation */}
            <div className="fixed inset-0 z-0">
                <Threads amplitude={1.5} distance={0} enableMouseInteraction={false} />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <header className="px-8 py-6 flex justify-between items-center border-b border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.push('/')} className="hover:opacity-80 transition-opacity">
                            <h1 className="text-2xl font-bold text-white">EduChain</h1>
                        </button>
                    </div>

                    {/* Navigation & Wallet */}
                    <div className="flex items-center gap-4">
                        {walletAddress && (
                            <>
                                {userRole === "provider" ? (
                                    <>
                                        <button
                                            onClick={() => router.push('/create-pool')}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all"
                                        >
                                            Create Pool
                                        </button>
                                        <button
                                            onClick={() => router.push('/my-pools')}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all"
                                        >
                                            My Pools
                                        </button>
                                    </>
                                ) : userRole === "student" ? (
                                    <>
                                        <button
                                            onClick={() => router.push('/my-applications')}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all"
                                        >
                                            My Applications
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => router.push('/details')}
                                        className="px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all font-semibold"
                                    >
                                        Complete Registration
                                    </button>
                                )}
                                
                                {/* Profile & Transactions Links (Available for all roles) */}
                                {userRole && (
                                    <>
                                        <button
                                            onClick={() => router.push('/profile')}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all"
                                            title="View Profile"
                                        >
                                            👤 Profile
                                        </button>
                                        <button
                                            onClick={() => router.push('/transactions')}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all"
                                            title="View Transaction History"
                                        >
                                            📊 Transactions
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {walletAddress ? (
                            <div className="flex items-center gap-4">
                                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white">
                                    {truncateAddress(walletAddress)}
                                </div>
                                <Button onClick={disconnectWallet}>
                                    Disconnect
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={connectWallet}>
                                Connect Wallet
                            </Button>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-8 py-12">
                    {!walletAddress ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                            <div className="max-w-md space-y-4">
                                <h2 className="text-4xl font-bold text-white">Welcome to EduChain</h2>
                                <p className="text-gray-400 text-lg">
                                    Connect your wallet to view available scholarship pools and apply for funding.
                                </p>
                                <Button onClick={connectWallet} className="mt-6">
                                    Connect Wallet to Continue
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Page Title */}
                            <div className="mb-8">
                                <h1 className="text-4xl font-bold text-white mb-2">
                                    {userRole === "provider" 
                                        ? "Scholarship Pool Management"
                                        : userRole === "student"
                                        ? "Available Scholarship Pools"
                                        : "Explore Scholarship Opportunities"}
                                </h1>
                                <p className="text-gray-400">
                                    {userRole === "provider"
                                        ? "Manage your scholarship pools and review applications"
                                        : userRole === "student"
                                        ? "Browse and apply for scholarships that match your criteria"
                                        : "Complete your registration to get started"}
                                </p>
                            </div>

                            {/* Show registration prompt if no role */}
                            {!userRole && (
                                <div className="mb-8 p-6 bg-linear-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/30 backdrop-blur-md">
                                    <h3 className="text-xl font-semibold text-white mb-2">Complete Your Registration</h3>
                                    <p className="text-gray-400 mb-4">
                                        To access all features and apply for scholarships, please complete your registration as a student or scholarship provider.
                                    </p>
                                    <Button onClick={() => router.push('/details')}>
                                        Register Now
                                    </Button>
                                </div>
                            )}

                            {/* Search and Filter Bar */}
                            <div className="mb-8 space-y-4">
                                {/* Main Search Row */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Search */}
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Search by pool name or organization..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    {/* Status Filter */}
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="px-4 py-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="all">All Pools</option>
                                        <option value="open">Open</option>
                                        <option value="closed">Closed</option>
                                    </select>

                                    {/* Sort */}
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-4 py-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="deadline">Deadline Soon</option>
                                        <option value="amount-high">Highest Amount</option>
                                        <option value="amount-low">Lowest Amount</option>
                                    </select>

                                    {/* Advanced Filters Toggle */}
                                    <button
                                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                        className="px-4 py-3 bg-purple-600 hover:bg-purple-700 backdrop-blur-md rounded-lg border border-purple-500 text-white transition-all whitespace-nowrap"
                                    >
                                        {showAdvancedFilters ? "Hide" : "Show"} Filters 🔽
                                    </button>
                                </div>

                                {/* Advanced Filters */}
                                {showAdvancedFilters && (
                                    <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 space-y-4">
                                        <h3 className="text-lg font-semibold text-white mb-4">Advanced Filters</h3>
                                        
                                        {/* Amount Range */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-2">Min Amount (ETH)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="e.g., 0.1"
                                                    value={minAmount}
                                                    onChange={(e) => setMinAmount(e.target.value)}
                                                    className="w-full px-4 py-2 bg-black/50 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-2">Max Amount (ETH)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="e.g., 5.0"
                                                    value={maxAmount}
                                                    onChange={(e) => setMaxAmount(e.target.value)}
                                                    className="w-full px-4 py-2 bg-black/50 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Clear Filters Button */}
                                        <button
                                            onClick={() => {
                                                setSearchQuery("");
                                                setFilterStatus("all");
                                                setMinAmount("");
                                                setMaxAmount("");
                                                setSortBy("newest");
                                            }}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                                        >
                                            Clear All Filters
                                        </button>

                                        {/* Active Filters Count */}
                                        {(searchQuery || filterStatus !== "all" || minAmount || maxAmount) && (
                                            <div className="text-sm text-purple-400">
                                                {[searchQuery, filterStatus !== "all", minAmount, maxAmount].filter(Boolean).length} active filter(s)
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                                    <p className="text-gray-400 text-sm mb-1">Total Pools</p>
                                    <p className="text-3xl font-bold text-white">{pools.length}</p>
                                </div>
                                <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                                    <p className="text-gray-400 text-sm mb-1">Open Pools</p>
                                    <p className="text-3xl font-bold text-green-400">
                                        {pools.filter(p => !isDeadlinePassed(p.applicationDeadline)).length}
                                    </p>
                                </div>
                                <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                                    <p className="text-gray-400 text-sm mb-1">Total Scholarships Awarded</p>
                                    <p className="text-3xl font-bold text-purple-400">
                                        {pools.reduce((sum, p) => sum + p.totalScholarshipsAwarded, 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Pools List */}
                            {loading ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                                </div>
                            ) : filteredPools.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-400 text-lg">No pools found matching your criteria.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredPools.map((pool) => (
                                        <div
                                            key={pool.address}
                                            className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
                                            onClick={() => router.push(`/pool/${pool.address}`)}
                                        >
                                            {/* Status Badge */}
                                            <div className="flex justify-between items-start mb-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        isDeadlinePassed(pool.applicationDeadline)
                                                            ? "bg-red-500/20 text-red-300"
                                                            : "bg-green-500/20 text-green-300"
                                                    }`}
                                                >
                                                    {isDeadlinePassed(pool.applicationDeadline) ? "Closed" : "Open"}
                                                </span>
                                            </div>

                                            {/* Pool Name */}
                                            <h3 className="text-xl font-bold text-white mb-2">{pool.poolName}</h3>

                                            {/* Pool Details */}
                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400 text-sm">Scholarship Amount:</span>
                                                    <span className="text-white font-semibold">
                                                        {formatEther(pool.scholarshipAmount)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400 text-sm">Deadline:</span>
                                                    <span className="text-white font-semibold">
                                                        {formatDeadline(pool.applicationDeadline)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400 text-sm">Available Funds:</span>
                                                    <span className="text-purple-400 font-semibold">
                                                        {formatEther(pool.availableFunds)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400 text-sm">Applicants:</span>
                                                    <span className="text-white font-semibold">{pool.applicantCount}</span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (userRole === "student" && !isDeadlinePassed(pool.applicationDeadline)) {
                                                        setSelectedPool(pool);
                                                        setShowApplicationModal(true);
                                                    } else if (userRole === "provider") {
                                                        toast.error("Providers cannot apply for scholarships. Only students can apply.");
                                                    } else if (!userRole) {
                                                        toast.error("Please register as a student to apply for scholarships.");
                                                        router.push('/details');
                                                    }
                                                }}
                                                className={`w-full py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                                                    isDeadlinePassed(pool.applicationDeadline)
                                                        ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                                                        : userRole === "student"
                                                        ? "bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                                        : userRole === "provider"
                                                        ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                                                        : "bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                                }`}
                                                disabled={isDeadlinePassed(pool.applicationDeadline) || userRole === "provider"}
                                            >
                                                {isDeadlinePassed(pool.applicationDeadline) ? (
                                                    "Application Closed"
                                                ) : userRole === "student" ? (
                                                    "Apply Now"
                                                ) : userRole === "provider" ? (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        Provider Account - Cannot Apply
                                                    </>
                                                ) : (
                                                    "Register to Apply"
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Footer */}
                <footer className="py-8 px-4 text-center text-gray-500 border-t border-white/10 mt-12">
                    <p>© 2025 EduChain. Powered by Blockchain Technology.</p>
                </footer>
            </div>

            {/* Application Modal */}
            {showApplicationModal && selectedPool && (
                <ApplicationModal
                    pool={selectedPool}
                    walletAddress={walletAddress}
                    onClose={() => {
                        setShowApplicationModal(false);
                        setSelectedPool(null);
                    }}
                />
            )}
        </div>
    );
};

export default HomePage;