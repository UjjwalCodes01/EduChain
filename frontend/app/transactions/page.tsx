"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { API_ENDPOINTS } from "@/lib/api";

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: string;
  poolAddress: string;
  poolName: string;
  timestamp: string;
  txHash?: string | null;
  description: string;
  metadata?: {
    applicationId?: string;
    studentName?: string;
    institution?: string;
    program?: string;
  };
}

export default function TransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [userRole, setUserRole] = useState<"student" | "provider" | "">("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Check authentication
    const wallet = localStorage.getItem("userWallet");
    const role = localStorage.getItem("userRole") as "student" | "provider" | "";
    
    if (!wallet) {
      toast.error("Please connect your wallet first");
      router.push("/Home");
      return;
    }
    
    setWalletAddress(wallet);
    setUserRole(role);
    
    // Fetch transactions
    fetchTransactions(wallet, role);
  }, [router]);

  useEffect(() => {
    // Apply filters
    let filtered = transactions;
    
    if (filterType !== "all") {
      filtered = filtered.filter(tx => tx.type === filterType);
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(tx => tx.status === filterStatus);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(tx => 
        (tx.txHash && tx.txHash.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.poolName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.poolAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredTransactions(filtered);
  }, [filterType, filterStatus, searchQuery, transactions]);

  const fetchTransactions = async (wallet: string, role: string) => {
    try {
      setLoading(true);
      
      // Fetch transactions from API
      const response = await fetch(API_ENDPOINTS.GET_TRANSACTIONS_BY_WALLET(wallet));
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setFilteredTransactions(data.transactions || []);
      } else if (response.status === 404) {
        // No transactions found
        setTransactions([]);
        setFilteredTransactions([]);
      } else {
        console.error("Failed to fetch transactions");
        setTransactions([]);
        setFilteredTransactions([]);
      }
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast.error(error.message || "Failed to load transaction history. Please check your connection.");
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "scholarship_received":
        return "🎓";
      case "application_approved":
        return "✅";
      case "application_rejected":
        return "❌";
      case "application":
        return "📝";
      case "fund":
        return "💰";
      case "refund":
        return "↩️";
      case "donation":
        return "🎁";
      default:
        return "📝";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "scholarship_received":
        return "Scholarship Received";
      case "application_approved":
        return "Application Approved";
      case "application_rejected":
        return "Application Rejected";
      case "application":
        return "Application Submitted";
      case "fund":
        return "Pool Funding";
      case "refund":
        return "Refund";
      case "donation":
        return "Donation";
      default:
        return "Transaction";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">✓ Completed</span>;
      case "approved":
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">✓ Approved</span>;
      case "pending":
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">⏳ Pending</span>;
      case "rejected":
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">✗ Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">Unknown</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const openEtherscan = (txHash: string) => {
    // Replace with actual network (mainnet, sepolia, etc.)
    window.open(`https://etherscan.io/tx/${txHash}`, "_blank");
  };

  const calculateTotalVolume = () => {
    return transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0).toFixed(4);
  };

  const calculateTotalGasFees = () => {
    return "0.00000"; // Gas fees not tracked in backend
  };

  const exportToCSV = () => {
    const headers = ["Date", "Type", "Amount (ETH)", "Status", "Transaction Hash", "Pool Name", "Description"];
    const rows = filteredTransactions.map(tx => [
      formatDate(tx.timestamp),
      getTypeLabel(tx.type),
      tx.amount,
      tx.status,
      tx.txHash || "N/A",
      tx.poolName || "N/A",
      tx.description || "N/A"
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    
    toast.success("Transactions exported to CSV");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Transaction History</h1>
            <p className="text-sm text-gray-400">
              {userRole === "student" ? "Track received scholarships" : "Monitor pool funding and donations"}
            </p>
          </div>
          <button
            onClick={() => router.push("/Home")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Total Transactions</div>
            <div className="text-3xl font-bold text-white">{transactions.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Total Volume (ETH)</div>
            <div className="text-3xl font-bold text-purple-400">{calculateTotalVolume()}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Gas Fees Paid</div>
            <div className="text-3xl font-bold text-blue-400">{calculateTotalGasFees()} ETH</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Pending</div>
            <div className="text-3xl font-bold text-yellow-400">
              {transactions.filter(tx => tx.status === "pending").length}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                <option value="application">Applications</option>
                <option value="application_approved">Approved</option>
                <option value="application_rejected">Rejected</option>
                <option value="scholarship_received">Scholarships Received</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by hash, pool name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="w-full md:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold"
          >
            📊 Export to CSV
          </button>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Transactions Found</h3>
            <p className="text-gray-400">
              {searchQuery || filterType !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters"
                : "Your transaction history will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left: Transaction Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">{getTypeIcon(tx.type)}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{getTypeLabel(tx.type)}</h3>
                        <div className="text-sm text-gray-400">{formatDate(tx.timestamp)}</div>
                      </div>
                      {getStatusBadge(tx.status)}
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-2">
                      {tx.description}
                    </div>
                    
                    {tx.poolName && (
                      <div className="text-sm text-purple-400 mb-2">
                        📚 {tx.poolName}
                      </div>
                    )}
                    
                    {tx.metadata && (
                      <div className="text-sm text-gray-500 mt-2">
                        {tx.metadata.studentName && <div>Student: {tx.metadata.studentName}</div>}
                        {tx.metadata.institution && <div>Institution: {tx.metadata.institution}</div>}
                        {tx.metadata.program && <div>Program: {tx.metadata.program}</div>}
                      </div>
                    )}
                  </div>

                  {/* Right: Amount and Actions */}
                  <div className="flex flex-col items-end gap-3 lg:w-64">
                    {tx.amount !== "0" && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{tx.amount} ETH</div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {tx.txHash && (
                        <>
                          <button
                            onClick={() => openEtherscan(tx.txHash!)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                            title="View on Etherscan"
                          >
                            🔍 View
                          </button>
                          <button
                            onClick={() => copyToClipboard(tx.txHash!, "Transaction hash")}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                            title="Copy hash"
                          >
                            📋
                          </button>
                        </>
                      )}
                    </div>
                    
                    {tx.poolAddress && (
                      <button
                        onClick={() => router.push(`/pool/${tx.poolAddress}`)}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        View Pool Details →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
}