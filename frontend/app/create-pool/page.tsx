"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "../../components/ui/stateful-button";

export default function CreatePoolPage() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [formData, setFormData] = useState({
    poolName: "",
    poolDescription: "",
    scholarshipAmount: "",
    applicationDeadline: "",
    initialFunding: "",
  });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  // PoolFactory contract address (UPDATE THIS after deployment)
  const POOL_FACTORY_ADDRESS = "0x0000000000000000000000000000000000000000"; // TODO: Update with deployed address
  
  const POOL_FACTORY_ABI = [
    "function createPool(string memory _poolName, string memory _poolDescription, uint256 _scholarshipAmount, uint256 _applicationDeadline) external returns (address poolAddress)",
    "event PoolCreated(address indexed poolAddress, address indexed creator, string poolName, uint256 scholarshipAmount, uint256 applicationDeadline, uint256 timestamp)"
  ];

  useEffect(() => {
    checkWallet();
  }, []);

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
            toast.error("Only scholarship providers can create pools");
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.poolName || !formData.poolDescription || !formData.scholarshipAmount || !formData.applicationDeadline) {
      toast.error("Please fill all required fields");
      return;
    }

    if (parseFloat(formData.scholarshipAmount) <= 0) {
      toast.error("Scholarship amount must be greater than 0");
      return;
    }

    const deadlineDate = new Date(formData.applicationDeadline);
    if (deadlineDate <= new Date()) {
      toast.error("Application deadline must be in the future");
      return;
    }

    // Check if PoolFactory is deployed
    if (POOL_FACTORY_ADDRESS === "0x0000000000000000000000000000000000000000") {
      toast.error("PoolFactory contract not deployed yet. Please deploy the contract first.");
      return;
    }

    try {
      setCreating(true);
      const loadingToast = toast.loading("Creating scholarship pool...");

      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const poolFactory = new ethers.Contract(POOL_FACTORY_ADDRESS, POOL_FACTORY_ABI, signer);

      // Convert values
      const scholarshipAmountWei = ethers.parseEther(formData.scholarshipAmount);
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);

      // Create pool transaction
      const tx = await poolFactory.createPool(
        formData.poolName,
        formData.poolDescription,
        scholarshipAmountWei,
        deadlineTimestamp
      );

      toast.loading("Waiting for transaction confirmation...", { id: loadingToast });
      const receipt = await tx.wait();

      // Get pool address from event
      const poolCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = poolFactory.interface.parseLog(log);
          return parsed?.name === "PoolCreated";
        } catch {
          return false;
        }
      });

      let poolAddress = "";
      if (poolCreatedEvent) {
        const parsed = poolFactory.interface.parseLog(poolCreatedEvent);
        poolAddress = parsed?.args[0];
      }

      // Fund the pool if initial funding is provided
      if (formData.initialFunding && parseFloat(formData.initialFunding) > 0) {
        toast.loading("Adding initial funding...", { id: loadingToast });
        
        const fundTx = await signer.sendTransaction({
          to: poolAddress,
          value: ethers.parseEther(formData.initialFunding)
        });
        await fundTx.wait();
      }

      toast.success(`Pool created successfully! Address: ${poolAddress}`, { id: loadingToast });
      
      // Reset form
      setFormData({
        poolName: "",
        poolDescription: "",
        scholarshipAmount: "",
        applicationDeadline: "",
        initialFunding: "",
      });

      // Redirect to My Pools
      setTimeout(() => {
        router.push("/my-pools");
      }, 2000);

    } catch (error: any) {
      console.error("Error creating pool:", error);
      toast.error(error.message || "Failed to create pool");
    } finally {
      setCreating(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-black">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />

      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/Home')} className="hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-bold text-white">EduChain</h1>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/my-pools')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all"
          >
            My Pools
          </button>
          <button
            onClick={() => router.push('/Home')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-white transition-all"
          >
            ← Back
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
        <div className="max-w-3xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Create Scholarship Pool</h1>
            <p className="text-gray-400">Set up a new scholarship pool on the blockchain</p>
          </div>

          {/* Info Banner */}
          <div className="mb-8 p-4 bg-blue-500/10 rounded-xl border border-blue-500/30 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-white font-semibold mb-1">Creating a Pool</h3>
                <p className="text-gray-300 text-sm">
                  Your pool will be deployed as a smart contract on the blockchain. You'll need to pay gas fees for deployment.
                  After creation, you can fund your pool and manage applications.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-8 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
              {/* Pool Name */}
              <div className="mb-6">
                <label className="block text-sm text-gray-300 mb-2">
                  Pool Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="poolName"
                  value={formData.poolName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Tech Excellence Scholarship 2025"
                  required
                />
              </div>

              {/* Pool Description */}
              <div className="mb-6">
                <label className="block text-sm text-gray-300 mb-2">
                  Pool Description & Eligibility Criteria <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="poolDescription"
                  value={formData.poolDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe your scholarship pool, eligibility requirements, and what students should know..."
                  required
                />
              </div>

              {/* Scholarship Amount */}
              <div className="mb-6">
                <label className="block text-sm text-gray-300 mb-2">
                  Scholarship Amount (ETH) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="scholarshipAmount"
                  value={formData.scholarshipAmount}
                  onChange={handleInputChange}
                  step="0.001"
                  min="0"
                  className="w-full px-4 py-3 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 1.0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Amount each selected student will receive</p>
              </div>

              {/* Application Deadline */}
              <div className="mb-6">
                <label className="block text-sm text-gray-300 mb-2">
                  Application Deadline <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Students can apply until this date</p>
              </div>

              {/* Initial Funding */}
              <div className="mb-6">
                <label className="block text-sm text-gray-300 mb-2">
                  Initial Funding (ETH) <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  name="initialFunding"
                  value={formData.initialFunding}
                  onChange={handleInputChange}
                  step="0.001"
                  min="0"
                  className="w-full px-4 py-3 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 5.0"
                />
                <p className="text-xs text-gray-500 mt-1">Fund your pool now or add funds later</p>
              </div>

              {/* Summary */}
              {formData.poolName && formData.scholarshipAmount && (
                <div className="mt-8 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <h4 className="text-white font-semibold mb-2">Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">
                      <span className="text-gray-500">Pool Name:</span> {formData.poolName}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500">Scholarship per Student:</span> {formData.scholarshipAmount} ETH
                    </p>
                    {formData.initialFunding && parseFloat(formData.initialFunding) > 0 && (
                      <p className="text-gray-300">
                        <span className="text-gray-500">Initial Funding:</span> {formData.initialFunding} ETH
                        <span className="text-purple-400 ml-2">
                          (≈ {Math.floor(parseFloat(formData.initialFunding) / parseFloat(formData.scholarshipAmount))} scholarships)
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/Home')}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white transition-all"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={creating}
                className="flex-1"
              >
                {creating ? "Creating Pool..." : "Create Pool"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-gray-500 border-t border-white/10 mt-12">
        <p>© 2025 EduChain. Powered by Blockchain Technology.</p>
      </footer>
    </div>
  );
}
