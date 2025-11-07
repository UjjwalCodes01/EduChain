"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { ethers } from "ethers";
import { POOL_FACTORY_ADDRESS, FACTORY_ABI, POOL_ABI } from "@/lib/contracts";
import { API_ENDPOINTS } from "@/lib/api";

interface Application {
  _id: string;
  walletAddress: string;
  poolAddress: string;
  email: string;
  poolId: string;
  ipfsHash?: string;
  applicationData: {
    name?: string;
    studentId?: string;
    institution?: string;
    program?: string;
    year?: string;
    gpa?: string;
    additionalInfo?: string;
  };
  emailVerified: boolean;
  verifiedAt?: string;
  status: 'pending' | 'verified' | 'approved' | 'rejected' | 'paid';
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Pool {
  address: string;
  name: string;
  scholarshipAmount: string;
  totalFunds: string;
  applicants: number;
}

interface Statistics {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalPools: number;
  totalScholarshipsAwarded: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [myPools, setMyPools] = useState<Pool[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [viewAllMode, setViewAllMode] = useState(false);
  
  // Batch approve state
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [batchApproving, setBatchApproving] = useState(false);

  useEffect(() => {
    // Check wallet and role
    const wallet = localStorage.getItem("userWallet");
    const role = localStorage.getItem("userRole");
    
    if (!wallet) {
      toast.error("Please connect your wallet first");
      router.push("/Home");
      return;
    }
    
    if (role !== "provider") {
      toast.error("Access denied. Only providers can access admin dashboard.");
      router.push("/Home");
      return;
    }
    
    setWalletAddress(wallet);
    setUserRole(role);
    
    // Fetch pools owned by this wallet
    fetchMyPools(wallet);
  }, [router]);

  useEffect(() => {
    // Apply filters
    let filtered = applications;
    
    if (selectedPool !== "all") {
      filtered = filtered.filter(app => app.poolAddress.toLowerCase() === selectedPool.toLowerCase());
    }
    
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "pending":
          filtered = filtered.filter(app => app.status === 'pending' || app.status === 'verified');
          break;
        case "approved":
          filtered = filtered.filter(app => app.status === 'approved');
          break;
        case "rejected":
          filtered = filtered.filter(app => app.status === 'rejected');
          break;
        case "unverified":
          filtered = filtered.filter(app => !app.emailVerified);
          break;
        case "paid":
          filtered = filtered.filter(app => app.status === 'paid');
          break;
      }
    }
    
    setFilteredApplications(filtered);
  }, [selectedPool, statusFilter, applications]);

  const fetchMyPools = async (wallet: string) => {
    try {
      // Fetch pools from blockchain
      if (!window.ethereum) {
        toast.error("Please install MetaMask");
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const factory = new ethers.Contract(POOL_FACTORY_ADDRESS, FACTORY_ABI, provider);
      const poolAddresses = await factory.getPoolsByCreator(wallet);
      
      const poolsData: Pool[] = [];
      
      for (const poolAddress of poolAddresses) {
        const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
        
        const [name, scholarshipAmount, balance, totalApplications] = await Promise.all([
          poolContract.poolName(),
          poolContract.scholarshipAmount(),
          poolContract.balance(),
          poolContract.totalApplications()
        ]);
        
        poolsData.push({
          address: poolAddress,
          name: name,
          scholarshipAmount: ethers.formatEther(scholarshipAmount),
          totalFunds: ethers.formatEther(balance),
          applicants: Number(totalApplications)
        });
      }
      
      setMyPools(poolsData);
      
      // Fetch all applications for these pools
      if (poolsData.length > 0) {
        fetchApplications(poolsData.map(p => p.address));
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching pools:", error);
      toast.error("Failed to load your pools from blockchain");
      setLoading(false);
    }
  };

  const fetchApplications = async (poolAddresses: string[]) => {
    try {
      setLoading(true);
      
      // Fetch applications for all pool addresses
      const allApplications: Application[] = [];
      
      for (const poolAddr of poolAddresses) {
        const response = await fetch(API_ENDPOINTS.GET_APPLICATIONS_BY_POOL(poolAddr));
        
        if (response.ok) {
          const data = await response.json();
          // Backend returns { success, count, data: [...applications] }
          const apps = data.data || data.applications || [];
          allApplications.push(...apps);
        }
      }
      
      console.log('Fetched applications:', allApplications.length);
      setApplications(allApplications);
      setFilteredApplications(allApplications);
      
      // Fetch statistics
      fetchStatistics();
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_STATISTICS, {
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      // Statistics are not critical, don't show error to user
    }
  };

  const fetchAllApplications = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(API_ENDPOINTS.ADMIN_APPLICATIONS, {
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch all applications");
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
      setFilteredApplications(data.applications || []);
      
      // Fetch statistics
      fetchStatistics();
    } catch (error) {
      console.error("Error fetching all applications:", error);
      toast.error("Failed to load all applications");
    } finally {
      setLoading(false);
    }
  };

  const toggleViewAllMode = () => {
    const newMode = !viewAllMode;
    setViewAllMode(newMode);
    setSelectedPool("all"); // Reset pool filter
    
    if (newMode) {
      // Fetch all applications
      fetchAllApplications();
    } else {
      // Fetch only my pools' applications
      if (myPools.length > 0) {
        fetchApplications(myPools.map(p => p.address));
      }
    }
  };

  const approveApplication = async (applicationId: string) => {
    try {
      const loadingToast = toast.loading("Approving application...");
      
      const response = await fetch(API_ENDPOINTS.APPROVE_APPLICATION(applicationId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminWallet: walletAddress
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve application");
      }
      
      toast.success("Application approved successfully!", { id: loadingToast });
      
      // Refresh applications
      if (myPools.length > 0) {
        fetchApplications(myPools.map(p => p.address));
      }
      
      setSelectedApplication(null);
    } catch (error: any) {
      console.error("Error approving application:", error);
      toast.error(error.message || "Failed to approve application");
    }
  };

  const rejectApplication = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    
    try {
      const loadingToast = toast.loading("Rejecting application...");
      
      const response = await fetch(API_ENDPOINTS.REJECT_APPLICATION(selectedApplication._id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminWallet: walletAddress,
          reason: rejectionReason
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject application");
      }
      
      toast.success("Application rejected", { id: loadingToast });
      
      // Refresh applications
      if (myPools.length > 0) {
        fetchApplications(myPools.map(p => p.address));
      }
      
      setShowRejectModal(false);
      setSelectedApplication(null);
      setRejectionReason("");
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      toast.error(error.message || "Failed to reject application");
    }
  };

  const markAsPaid = async (applicationId: string) => {
    try {
      const loadingToast = toast.loading("Marking as paid...");
      
      const response = await fetch(API_ENDPOINTS.MARK_PAID(applicationId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminWallet: walletAddress
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mark as paid");
      }
      
      toast.success("Application marked as paid!", { id: loadingToast });
      
      // Refresh applications
      if (myPools.length > 0) {
        fetchApplications(myPools.map(p => p.address));
      }
      
      setSelectedApplication(null);
    } catch (error: any) {
      console.error("Error marking as paid:", error);
      toast.error(error.message || "Failed to mark as paid");
    }
  };

  const payScholarship = async (application: Application) => {
    try {
      if (!window.ethereum) {
        toast.error("Please install MetaMask");
        return;
      }

      const loadingToast = toast.loading("Initiating blockchain payment...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const poolContract = new ethers.Contract(application.poolAddress, POOL_ABI, signer);
      
      // Call payScholarship on the contract
      const tx = await poolContract.payScholarship(application.applicantWallet);
      
      toast.loading("Waiting for transaction confirmation...", { id: loadingToast });
      await tx.wait();
      
      toast.success("Payment sent on blockchain!", { id: loadingToast });
      
      // Mark as paid in backend
      await markAsPaid(application._id);
      
    } catch (error: any) {
      console.error("Error paying scholarship:", error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(error.message || "Failed to send payment");
      }
    }
  };

  const batchPayScholarships = async () => {
    if (selectedApplications.size === 0) {
      toast.error("No applications selected");
      return;
    }
    
    // Filter to only approved, unpaid applications
    const applicationsToP = filteredApplications.filter(
      app => selectedApplications.has(app._id) && app.adminApproved && !app.paid
    );
    
    if (applicationsToP.length === 0) {
      toast.error("No approved unpaid applications selected");
      return;
    }
    
    // Group by pool address
    const applicationsByPool = applicationsToP.reduce((acc, app) => {
      if (!acc[app.poolAddress]) {
        acc[app.poolAddress] = [];
      }
      acc[app.poolAddress].push(app);
      return acc;
    }, {} as Record<string, Application[]>);
    
    try {
      if (!window.ethereum) {
        toast.error("Please install MetaMask");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      let totalPaid = 0;
      
      for (const [poolAddress, apps] of Object.entries(applicationsByPool)) {
        const loadingToast = toast.loading(`Processing ${apps.length} payment(s) for pool...`);
        
        try {
          const poolContract = new ethers.Contract(poolAddress, POOL_ABI, signer);
          const recipients = apps.map(app => app.walletAddress);
          
          // Call batchPayScholarships
          const tx = await poolContract.batchPayScholarships(recipients);
          
          toast.loading("Waiting for transaction confirmation...", { id: loadingToast });
          await tx.wait();
          
          toast.success(`${apps.length} payment(s) sent!`, { id: loadingToast });
          
          // Mark all as paid in backend
          for (const app of apps) {
            await markAsPaid(app._id);
          }
          
          totalPaid += apps.length;
        } catch (error: any) {
          console.error(`Error batch paying for pool ${poolAddress}:`, error);
          toast.error(`Failed to pay for some applications in pool`, { id: loadingToast });
        }
      }
      
      if (totalPaid > 0) {
        toast.success(`Successfully paid ${totalPaid} scholarship(s)!`);
        setSelectedApplications(new Set());
        
        // Refresh applications
        if (myPools.length > 0) {
          fetchApplications(myPools.map(p => p.address));
        }
      }
    } catch (error: any) {
      console.error("Error in batch payment:", error);
      toast.error(error.message || "Failed to process batch payments");
    }
  };

  const handleBatchApprove = async () => {
    if (selectedApplications.size === 0) {
      toast.error("No applications selected");
      return;
    }
    
    try {
      setBatchApproving(true);
      const loadingToast = toast.loading(`Approving ${selectedApplications.size} application(s)...`);
      
      const response = await fetch(API_ENDPOINTS.BATCH_APPROVE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationIds: Array.from(selectedApplications),
          adminWallet: walletAddress
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve applications");
      }
      
      const result = await response.json();
      
      toast.success(
        `Successfully approved ${result.approved} application(s)${result.failed > 0 ? `, ${result.failed} failed` : ""}`,
        { id: loadingToast }
      );
      
      // Clear selection and refresh
      setSelectedApplications(new Set());
      if (myPools.length > 0) {
        fetchApplications(myPools.map(p => p.address));
      }
    } catch (error: any) {
      console.error("Error batch approving:", error);
      toast.error(error.message || "Failed to approve applications");
    } finally {
      setBatchApproving(false);
    }
  };

  const toggleSelectApplication = (applicationId: string) => {
    const newSelection = new Set(selectedApplications);
    if (newSelection.has(applicationId)) {
      newSelection.delete(applicationId);
    } else {
      newSelection.add(applicationId);
    }
    setSelectedApplications(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map(app => app._id)));
    }
  };

  const getStatusBadge = (application: Application) => {
    if (application.status === 'paid') {
      return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Paid</span>;
    }
    if (application.status === 'rejected') {
      return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">Rejected</span>;
    }
    if (application.status === 'approved') {
      return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">Approved</span>;
    }
    if (!application.emailVerified) {
      return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">Unverified Email</span>;
    }
    return <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">Pending Review</span>;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
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
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Manage scholarship applications</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/my-pools")}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              My Pools
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title="View Profile"
            >
              👤 Profile
            </button>
            <button
              onClick={() => router.push("/transactions")}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              title="View Transactions"
            >
              📊 Transactions
            </button>
            <button
              onClick={() => router.push("/Home")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Total Applications</div>
            <div className="text-3xl font-bold text-white">
              {statistics?.totalApplications ?? applications.length}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Pending Review</div>
            <div className="text-3xl font-bold text-purple-400">
              {statistics?.pendingApplications ?? 
                applications.filter(app => app.emailVerified && !app.adminApproved && !app.rejectionReason).length}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Approved</div>
            <div className="text-3xl font-bold text-green-400">
              {statistics?.approvedApplications ?? applications.filter(app => app.adminApproved).length}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Scholarships Paid</div>
            <div className="text-3xl font-bold text-blue-400">
              {applications.filter(app => app.paid).length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          {/* View All Mode Toggle */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-white font-semibold">Application Scope</h3>
              <p className="text-sm text-gray-400 mt-1">
                {viewAllMode 
                  ? "Viewing all applications across the platform" 
                  : "Viewing applications from your pools only"}
              </p>
            </div>
            <button
              onClick={toggleViewAllMode}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                viewAllMode
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
              }`}
            >
              {viewAllMode ? "🌍 View All Mode" : "📁 My Pools Only"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Filter by Pool</label>
              <select
                value={selectedPool}
                onChange={(e) => setSelectedPool(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={viewAllMode}
              >
                <option value="all">All Pools</option>
                {myPools.map(pool => (
                  <option key={pool.address} value={pool.address}>
                    {pool.name} ({pool.applicants} applicants)
                  </option>
                ))}
              </select>
              {viewAllMode && (
                <p className="text-xs text-gray-500 mt-1">Pool filter disabled in View All mode</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="unverified">Unverified Email</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Batch Actions */}
        {filteredApplications.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  {selectedApplications.size === filteredApplications.length ? (
                    <>
                      <span>☑</span> Deselect All
                    </>
                  ) : (
                    <>
                      <span>☐</span> Select All
                    </>
                  )}
                </button>
                {selectedApplications.size > 0 && (
                  <span className="text-gray-400 text-sm">
                    {selectedApplications.size} application(s) selected
                  </span>
                )}
              </div>
              {selectedApplications.size > 0 && (
                <>
                  <button
                    onClick={handleBatchApprove}
                    disabled={batchApproving}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {batchApproving ? "Approving..." : `✓ Approve Selected (${selectedApplications.size})`}
                  </button>
                  <button
                    onClick={batchPayScholarships}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    💸 Pay Selected on Blockchain
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Applications Found</h3>
            <p className="text-gray-400">
              {selectedPool !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Applications will appear here once students apply"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const canBeSelected = application.emailVerified && !application.adminApproved && !application.rejectionReason;
              const isSelected = selectedApplications.has(application._id);
              
              return (
              <div
                key={application._id}
                className={`bg-white/5 border ${isSelected ? 'border-purple-500' : 'border-white/10'} rounded-xl p-6 hover:bg-white/10 transition-colors`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Checkbox for batch selection */}
                  {canBeSelected && (
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectApplication(application._id)}
                        className="w-5 h-5 mt-1 rounded border-white/20 bg-black/50 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{application.applicationData?.name || 'N/A'}</h3>
                      {getStatusBadge(application)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                      <div>📧 {application.email}</div>
                      <div>🎓 {application.applicationData?.institution || 'N/A'}</div>
                      <div>📚 {application.applicationData?.program || 'N/A'}</div>
                      <div>📊 GPA: {application.applicationData?.gpa || 'N/A'}</div>
                      <div>🆔 {application.applicationData?.studentId || 'N/A'}</div>
                      <div>📅 Applied: {formatDate(application.createdAt)}</div>
                    </div>
                    {application.status === 'rejected' && application.adminNotes && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="text-xs text-red-400 font-semibold mb-1">Rejection Reason:</div>
                        <div className="text-sm text-red-300">{application.adminNotes}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 lg:w-48">
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      View Details
                    </button>
                    {application.emailVerified && application.status !== 'approved' && application.status !== 'rejected' && (
                      <>
                        <button
                          onClick={() => approveApplication(application._id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowRejectModal(true);
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                        >
                          ✗ Reject
                        </button>
                      </>
                    )}
                    {application.status === 'approved' && application.status !== 'paid' && (
                      <>
                        <button
                          onClick={() => payScholarship(application)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold"
                        >
                          💸 Pay on Blockchain
                        </button>
                        <button
                          onClick={() => markAsPaid(application._id)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
                        >
                          ✓ Mark as Paid
                        </button>
                      </>
                    )}
                    {application.documents && (
                      <a
                        href={application.documents}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm text-center"
                      >
                        📄 View Documents
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </main>

      {/* Application Details Modal */}
      {selectedApplication && !showRejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-900">
              <h2 className="text-2xl font-bold text-white">Application Details</h2>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Applicant Name</div>
                <div className="text-lg text-white font-semibold">{selectedApplication.applicationData?.name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Email</div>
                <div className="text-white">{selectedApplication.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Wallet Address</div>
                <div className="text-white font-mono text-sm break-all">{selectedApplication.walletAddress}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Student ID</div>
                <div className="text-white">{selectedApplication.applicationData?.studentId || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Institution</div>
                <div className="text-white">{selectedApplication.applicationData?.institution || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Program</div>
                <div className="text-white">{selectedApplication.applicationData?.program || 'N/A'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Year</div>
                  <div className="text-white">{selectedApplication.applicationData?.year || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">GPA</div>
                  <div className="text-white">{selectedApplication.applicationData?.gpa || 'N/A'}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Additional Info</div>
                <div className="text-white bg-black/50 p-4 rounded-lg whitespace-pre-wrap">{selectedApplication.applicationData?.additionalInfo || 'No additional information provided'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <div>{getStatusBadge(selectedApplication)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Email Verified</div>
                  <div className={selectedApplication.emailVerified ? "text-green-400" : "text-red-400"}>
                    {selectedApplication.emailVerified ? "✓ Yes" : "✗ No"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Status</div>
                  <div className={selectedApplication.status === 'approved' ? "text-green-400" : "text-gray-400"}>
                    {selectedApplication.status === 'approved' ? "✓ Approved" : selectedApplication.status === 'rejected' ? "✗ Rejected" : "Pending"}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 flex gap-3">
                {selectedApplication.emailVerified && selectedApplication.status !== 'approved' && selectedApplication.status !== 'rejected' && (
                  <>
                    <button
                      onClick={() => approveApplication(selectedApplication._id)}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      ✓ Approve Application
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      ✗ Reject Application
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Reject Application</h2>
              <p className="text-sm text-gray-400 mt-2">Please provide a reason for rejection</p>
            </div>
            <div className="p-6">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason (required)..."
                rows={4}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={rejectApplication}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
