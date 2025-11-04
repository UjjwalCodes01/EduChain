"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "../../components/ui/stateful-button";
import { API_ENDPOINTS } from "@/lib/api";

interface PoolData {
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
}

interface Application {
    _id: string;
    walletAddress: string;
    email: string;
    applicationData: {
        name: string;
        institution: string;
        program: string;
    };
    emailVerified: boolean;
    adminApproved: boolean;
    isPaid: boolean;
    createdAt: string;
}

export default function MyPoolsPage() {
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [pools, setPools] = useState<PoolData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPool, setSelectedPool] = useState<string | null>(null);
    const [poolApplications, setPoolApplications] = useState<Application[]>([]);
    const [loadingApplications, setLoadingApplications] = useState(false);
    const router = useRouter();

    // PoolFactory contract address (UPDATE THIS after deployment)
    const POOL_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_POOL_FACTORY_ADDRESS || "0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a";

    const POOL_FACTORY_ABI = [
        "function poolsByCreator(address creator, uint256 index) external view returns (address)",
        "function poolInfo(address pool) external view returns (address poolAddress, address admin, string poolName, uint256 scholarshipAmount, uint256 applicationDeadline, uint256 createdAt)",
    ];

    const POOL_ABI = [
        "function poolName() external view returns (string)",
        "function poolDescription() external view returns (string)",
        "function scholarshipAmount() external view returns (uint256)",
        "function applicationDeadline() external view returns (uint256)",
        "function totalFunds() external view returns (uint256)",
        "function availableFunds() external view returns (uint256)",
        "function totalScholarshipsAwarded() external view returns (uint256)",
        "function applicants(uint256) external view returns (address)",
        "function paused() external view returns (bool)",
        "function fundPool() external payable",
        "function pause() external",
        "function unpause() external",
        "function updateScholarshipAmount(uint256 newAmount) external",
        "function updateDeadline(uint256 newDeadline) external",
        "function withdrawFunds(uint256 amount) external",
    ];

    useEffect(() => {
        checkWallet();
    }, []);

    useEffect(() => {
        if (walletAddress) {
            fetchPools();
        }
    }, [walletAddress]);

    const checkWallet = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0].address);

                    // Check if user is registered as provider
                    const userRole = localStorage.getItem("userRole");
                    if (userRole !== "provider") {
                        toast.error(
                            "Only scholarship providers can access this page"
                        );
                        router.push("/Home");
                    }
                } else {
                    router.push("/");
                }
            } catch (error) {
                console.error("Error checking wallet:", error);
                router.push("/");
            }
        } else {
            toast.error("Please install MetaMask");
            router.push("/");
        }
    };

    const fetchPools = async () => {
        try {
            setLoading(true);

            if (!window.ethereum) {
                throw new Error("MetaMask is not installed");
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const poolFactory = new ethers.Contract(
                POOL_FACTORY_ADDRESS,
                POOL_FACTORY_ABI,
                provider
            );

            // Fetch pools created by this wallet
            const poolAddresses: string[] = [];
            let index = 0;

            try {
                while (true) {
                    const poolAddress = await poolFactory.poolsByCreator(
                        walletAddress,
                        index
                    );
                    poolAddresses.push(poolAddress);
                    index++;
                }
            } catch {
                // No more pools
            }

            // Fetch details for each pool
            const poolsData: PoolData[] = [];
            for (const poolAddress of poolAddresses) {
                const poolContract = new ethers.Contract(
                    poolAddress,
                    POOL_ABI,
                    provider
                );

                const [
                    poolName,
                    poolDescription,
                    scholarshipAmount,
                    applicationDeadline,
                    totalFunds,
                    availableFunds,
                    totalScholarshipsAwarded,
                    isPaused,
                ] = await Promise.all([
                    poolContract.poolName(),
                    poolContract.poolDescription(),
                    poolContract.scholarshipAmount(),
                    poolContract.applicationDeadline(),
                    poolContract.totalFunds(),
                    poolContract.availableFunds(),
                    poolContract.totalScholarshipsAwarded(),
                    poolContract.paused(),
                ]);

                // Count applicants
                let applicantCount = 0;
                try {
                    while (true) {
                        await poolContract.applicants(applicantCount);
                        applicantCount++;
                    }
                } catch {
                    // No more applicants
                }

                poolsData.push({
                    address: poolAddress,
                    poolName,
                    poolDescription,
                    scholarshipAmount: ethers.formatEther(scholarshipAmount),
                    applicationDeadline: Number(applicationDeadline),
                    totalFunds: ethers.formatEther(totalFunds),
                    availableFunds: ethers.formatEther(availableFunds),
                    totalScholarshipsAwarded: Number(totalScholarshipsAwarded),
                    applicantCount,
                    isPaused,
                });
            }

            setPools(poolsData);
        } catch (error) {
            console.error("Error fetching pools:", error);
            toast.error("Failed to load pools");
        } finally {
            setLoading(false);
        }
    };

    const fetchPoolApplications = async (poolAddress: string) => {
        try {
            setLoadingApplications(true);
            setSelectedPool(poolAddress);

            const response = await fetch(
                API_ENDPOINTS.GET_APPLICATIONS_BY_POOL(poolAddress)
            );

            if (!response.ok) {
                throw new Error("Failed to fetch applications");
            }

            const data = await response.json();
            setPoolApplications(data.applications || []);
        } catch (error) {
            console.error("Error fetching applications:", error);
            toast.error("Failed to load applications");
        } finally {
            setLoadingApplications(false);
        }
    };

    const handleFundPool = async (poolAddress: string) => {
        const amount = prompt("Enter amount to fund (ETH):");
        if (!amount || parseFloat(amount) <= 0) return;

        try {
            const loadingToast = toast.loading("Funding pool...");

            if (!window.ethereum) {
                throw new Error("MetaMask is not installed");
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const tx = await signer.sendTransaction({
                to: poolAddress,
                value: ethers.parseEther(amount),
            });

            await tx.wait();
            toast.success(`Pool funded with ${amount} ETH!`, {
                id: loadingToast,
            });
            fetchPools(); // Refresh data
        } catch (error: any) {
            console.error("Error funding pool:", error);
            toast.error(error.message || "Failed to fund pool");
        }
    };

    const handlePausePool = async (poolAddress: string, isPaused: boolean) => {
        try {
            const loadingToast = toast.loading(
                isPaused ? "Unpausing pool..." : "Pausing pool..."
            );

            if (!window.ethereum) {
                throw new Error("MetaMask is not installed");
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const poolContract = new ethers.Contract(
                poolAddress,
                POOL_ABI,
                signer
            );

            const tx = isPaused
                ? await poolContract.unpause()
                : await poolContract.pause();
            await tx.wait();

            toast.success(isPaused ? "Pool unpaused!" : "Pool paused!", {
                id: loadingToast,
            });
            fetchPools(); // Refresh data
        } catch (error: any) {
            console.error("Error pausing/unpausing pool:", error);
            toast.error(error.message || "Failed to update pool status");
        }
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const isDeadlinePassed = (deadline: number) => {
        return deadline <= Date.now() / 1000;
    };

    return (
        <div className="min-h-screen bg-black">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "#1f2937",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                    },
                }}
            />

            {/* Header */}
            <header className="px-8 py-6 flex justify-between items-center border-b border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push("/Home")}
                        className="hover:opacity-80 transition-opacity"
                    >
                        <h1 className="text-2xl font-bold text-white cursor-pointer">
                            EduChain
                        </h1>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/create-pool")}
                        className="px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all font-semibold"
                    >
                        + Create New Pool
                    </button>
                    <button
                        onClick={() => router.push("/Home")}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all flex"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            className="lucide lucide-piggy-bank-icon lucide-piggy-bank"
                        >
                            <path d="M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" />
                            <path d="M16 10h.01" />
                            <path d="M2 8v1a2 2 0 0 0 2 2h1" />
                        </svg>
                        Browse Pools
                    </button>
                    <button
                        onClick={() => router.push("/profile")}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all flex"
                        title="View Profile"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            className="lucide lucide-user-icon lucide-user"
                        >
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        Profile
                    </button>
                    <button
                        onClick={() => router.push("/transactions")}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all flex"
                        title="View Transactions"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            className="lucide lucide-wallet-icon lucide-wallet"
                        >
                            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                        </svg>
                        Transactions
                    </button>
                    {walletAddress && (
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white">
                            {truncateAddress(walletAddress)}
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-8 py-12">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        My Scholarship Pools
                    </h1>
                    <p className="text-gray-400">
                        Manage your scholarship pools and review applications
                    </p>
                </div>

                {/* Stats Overview */}
                {pools.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                            <p className="text-gray-400 text-sm mb-1">
                                Total Pools
                            </p>
                            <p className="text-3xl font-bold text-white">
                                {pools.length}
                            </p>
                        </div>
                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                            <p className="text-gray-400 text-sm mb-1">
                                Total Applications
                            </p>
                            <p className="text-3xl font-bold text-blue-400">
                                {pools.reduce(
                                    (sum, p) => sum + p.applicantCount,
                                    0
                                )}
                            </p>
                        </div>
                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                            <p className="text-gray-400 text-sm mb-1">
                                Scholarships Awarded
                            </p>
                            <p className="text-3xl font-bold text-green-400">
                                {pools.reduce(
                                    (sum, p) =>
                                        sum + p.totalScholarshipsAwarded,
                                    0
                                )}
                            </p>
                        </div>
                        <div className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                            <p className="text-gray-400 text-sm mb-1">
                                Total Funds
                            </p>
                            <p className="text-3xl font-bold text-purple-400">
                                {pools
                                    .reduce(
                                        (sum, p) =>
                                            sum + parseFloat(p.totalFunds),
                                        0
                                    )
                                    .toFixed(2)}{" "}
                                ETH
                            </p>
                        </div>
                    </div>
                )}

                {/* Pools List */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : pools.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="text-6xl">🎓</div>
                            <h3 className="text-2xl font-bold text-white">
                                No Pools Yet
                            </h3>
                            <p className="text-gray-400">
                                You haven't created any scholarship pools.
                                Create your first pool to start helping
                                students!
                            </p>
                            <Button onClick={() => router.push("/create-pool")}>
                                Create Your First Pool
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {pools.map((pool) => (
                            <div
                                key={pool.address}
                                className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:border-purple-500/50 transition-all"
                            >
                                {/* Pool Header */}
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-white">
                                                {pool.poolName}
                                            </h3>
                                            {pool.isPaused && (
                                                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-semibold">
                                                    Paused
                                                </span>
                                            )}
                                            {isDeadlinePassed(
                                                pool.applicationDeadline
                                            ) ? (
                                                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold">
                                                    Closed
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">
                                                    Open
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-sm mb-2">
                                            {pool.poolDescription}
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            Contract:{" "}
                                            {truncateAddress(pool.address)}
                                        </p>
                                    </div>
                                </div>

                                {/* Pool Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Scholarship Amount
                                        </p>
                                        <p className="text-white font-semibold">
                                            {pool.scholarshipAmount} ETH
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Available Funds
                                        </p>
                                        <p className="text-purple-400 font-semibold">
                                            {pool.availableFunds} ETH
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Total Funds
                                        </p>
                                        <p className="text-white font-semibold">
                                            {pool.totalFunds} ETH
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Applications
                                        </p>
                                        <p className="text-blue-400 font-semibold">
                                            {pool.applicantCount}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Deadline
                                        </p>
                                        <p className="text-white font-semibold">
                                            {formatDate(
                                                pool.applicationDeadline
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() =>
                                            fetchPoolApplications(pool.address)
                                        }
                                        className="px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-semibold transition-all"
                                    >
                                        View Applications ({pool.applicantCount}
                                        )
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleFundPool(pool.address)
                                        }
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-white transition-all"
                                    >
                                        💰 Add Funds
                                    </button>
                                    <button
                                        onClick={() =>
                                            handlePausePool(
                                                pool.address,
                                                pool.isPaused
                                            )
                                        }
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-white transition-all"
                                    >
                                        {pool.isPaused
                                            ? "▶️ Resume"
                                            : "⏸️ Pause"}
                                    </button>
                                    <a
                                        href={`https://etherscan.io/address/${pool.address}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-white transition-all"
                                    >
                                        🔗 View on Explorer
                                    </a>
                                </div>

                                {/* Applications Section */}
                                {selectedPool === pool.address && (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <h4 className="text-xl font-bold text-white mb-4">
                                            Applications
                                        </h4>
                                        {loadingApplications ? (
                                            <div className="flex justify-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                                            </div>
                                        ) : poolApplications.length === 0 ? (
                                            <p className="text-gray-400 text-center py-8">
                                                No applications yet
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {poolApplications.map((app) => (
                                                    <div
                                                        key={app._id}
                                                        className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="text-white font-semibold">
                                                                {
                                                                    app
                                                                        .applicationData
                                                                        .name
                                                                }
                                                            </p>
                                                            <p className="text-gray-400 text-sm">
                                                                {
                                                                    app
                                                                        .applicationData
                                                                        .institution
                                                                }{" "}
                                                                -{" "}
                                                                {
                                                                    app
                                                                        .applicationData
                                                                        .program
                                                                }
                                                            </p>
                                                            <p className="text-gray-500 text-xs">
                                                                {truncateAddress(
                                                                    app.walletAddress
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {app.isPaid ? (
                                                                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
                                                                    Paid
                                                                </span>
                                                            ) : app.adminApproved ? (
                                                                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">
                                                                    Approved
                                                                </span>
                                                            ) : app.emailVerified ? (
                                                                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                                                                    Under Review
                                                                </span>
                                                            ) : (
                                                                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-semibold">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-8 px-4 text-center text-gray-500 border-t border-white/10 mt-12">
                <p>© 2025 EduChain. Powered by Blockchain Technology.</p>
            </footer>
        </div>
    );
}
