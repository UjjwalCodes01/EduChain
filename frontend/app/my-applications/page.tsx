"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import "../Style.css";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "../../components/ui/stateful-button";
import { API_ENDPOINTS } from "@/lib/api";

interface Application {
    _id: string;
    walletAddress: string;
    email: string;
    poolId: string;
    poolAddress: string;
    poolName?: string;
    ipfsHash: string;
    applicationData: {
        name: string;
        studentId: string;
        institution: string;
        program: string;
        year: string;
        gpa: string;
        additionalInfo: string;
    };
    emailVerified: boolean;
    verificationToken?: string;
    adminApproved: boolean;
    isPaid: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function MyApplicationsPage() {
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const router = useRouter();

    useEffect(() => {
        checkWallet();
    }, []);

    useEffect(() => {
        if (walletAddress) {
            fetchApplications();
        }
    }, [walletAddress]);

    const checkWallet = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0].address);
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

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                API_ENDPOINTS.GET_APPLICATIONS_BY_WALLET(walletAddress)
            );

            if (!response.ok) {
                throw new Error("Failed to fetch applications");
            }

            const data = await response.json();
            console.log("Fetched applications:", data); // Debug log
            setApplications(data.data || []); // Backend returns data.data
        } catch (error) {
            console.error("Error fetching applications:", error);
            toast.error("Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    const resendVerification = async (email: string) => {
        try {
            // Validate email before sending
            if (!email || typeof email !== 'string') {
                toast.error("Invalid email address");
                return;
            }

            const loadingToast = toast.loading(
                "Resending verification email..."
            );

            const response = await fetch(API_ENDPOINTS.RESEND_VERIFICATION, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.toLowerCase() }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to resend verification email");
            }

            toast.success("Verification email sent! Check your inbox.", {
                id: loadingToast,
            });
        } catch (error: any) {
            console.error("Error resending verification:", error);
            toast.error(error.message || "Failed to resend verification email");
        }
    };

    const getStatusBadge = (app: Application) => {
        if (app.isPaid) {
            return (
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
                    Paid
                </span>
            );
        }
        if (app.adminApproved) {
            return (
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">
                    Approved
                </span>
            );
        }
        if (!app.emailVerified) {
            return (
                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-semibold">
                    Pending Verification
                </span>
            );
        }
        return (
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                Under Review
            </span>
        );
    };

    const getFilteredApplications = () => {
        switch (filter) {
            case "pending":
                return applications.filter((app) => !app.emailVerified);
            case "verified":
                return applications.filter(
                    (app) => app.emailVerified && !app.adminApproved
                );
            case "approved":
                return applications.filter(
                    (app) => app.adminApproved && !app.isPaid
                );
            case "paid":
                return applications.filter((app) => app.isPaid);
            default:
                return applications;
        }
    };

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const filteredApplications = getFilteredApplications();

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
                        onClick={() => router.push("/Home")}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all cursor-pointer active:scale-95 duration-300 flex gap-1"
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
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all cursor-pointer active:scale-95 duration-300 flex gap-1"
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
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all cursor-pointer active:scale-95 duration-300 flex gap-1"
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
                        My Applications
                    </h1>
                    <p className="text-gray-400">
                        Track your scholarship applications and their status
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto">
                    {[
                        { value: "all", label: "All" },
                        { value: "pending", label: "Pending Verification" },
                        { value: "verified", label: "Under Review" },
                        { value: "approved", label: "Approved" },
                        { value: "paid", label: "Paid" },
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilter(tab.value)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                                filter === tab.value
                                    ? "bg-linear-to-r btn transition-all active:scale-90 duration-300 ease-in-out cursor-pointer from-purple-600 to-blue-600 text-white"
                                    : "bg-white/5 cursor-pointer btn active:scale-90 text-gray-400 hover:bg-white/10"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Applications List */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="max-w-md mx-auto space-y-4 flex flex-col items-center">
                            <div className="text-6xl">📝</div>
                            <h3 className="text-2xl font-bold text-white">
                                No Applications Yet
                            </h3>
                            <p className="text-gray-400">
                                {filter === "all"
                                    ? "You haven't applied to any scholarships yet. Browse available pools and apply!"
                                    : `No applications found in the "${filter}" category.`}
                            </p>
                            <Button className="w-3/5" onClick={() => router.push("/Home")}>
                                Browse Scholarship Pools
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredApplications.map((app) => (
                            <div
                                key={app._id}
                                className="p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:border-purple-500/50 transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    {/* Left Section */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">
                                                    {app.poolName ||
                                                        "Scholarship Pool"}
                                                </h3>
                                                <p className="text-sm text-gray-400">
                                                    Pool:{" "}
                                                    {truncateAddress(
                                                        app.poolAddress
                                                    )}
                                                </p>
                                            </div>
                                            {getStatusBadge(app)}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Applicant Name
                                                </p>
                                                <p className="text-white">
                                                    {app.applicationData.name}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Institution
                                                </p>
                                                <p className="text-white">
                                                    {
                                                        app.applicationData
                                                            .institution
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Program
                                                </p>
                                                <p className="text-white">
                                                    {
                                                        app.applicationData
                                                            .program
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Applied On
                                                </p>
                                                <p className="text-white">
                                                    {formatDate(app.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Details */}
                                        <div className="pt-3 border-t border-white/10">
                                            <div className="flex items-center gap-6 text-sm flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    {app.emailVerified ? (
                                                        <>
                                                            <svg
                                                                className="w-5 h-5 text-green-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                            <span className="text-green-400">
                                                                Email Verified
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg
                                                                className="w-5 h-5 text-yellow-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            </svg>
                                                            <span className="text-yellow-400">
                                                                Email Not
                                                                Verified
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {app.adminApproved ? (
                                                        <>
                                                            <svg
                                                                className="w-5 h-5 text-green-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            </svg>
                                                            <span className="text-green-400">
                                                                Admin Approved
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg
                                                                className="w-5 h-5 text-gray-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            </svg>
                                                            <span className="text-gray-400">
                                                                Pending Approval
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {app.isPaid ? (
                                                        <>
                                                            <svg
                                                                className="w-5 h-5 text-purple-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                                                />
                                                            </svg>
                                                            <span className="text-purple-400">
                                                                Scholarship Paid
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg
                                                                className="w-5 h-5 text-gray-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            </svg>
                                                            <span className="text-gray-400">
                                                                Payment Pending
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Section - Actions */}
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        {!app.emailVerified && (
                                            <Button
                                                onClick={() =>
                                                    resendVerification(
                                                        app.email
                                                    )
                                                }
                                                className="w-full"
                                            >
                                                Resend Verification
                                            </Button>
                                        )}
                                        {app.ipfsHash && (
                                            <a
                                                href={`https://ipfs.io/ipfs/${app.ipfsHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-white text-center transition-all"
                                            >
                                                View Document
                                            </a>
                                        )}
                                    </div>
                                </div>
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
