"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { API_ENDPOINTS } from "@/lib/api";

interface UserProfile {
  wallet: string;
  role: "student" | "provider";
  email: string;
  emailVerified: boolean;
  fullName?: string;
  institution?: string;
  organizationName?: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [userRole, setUserRole] = useState<"student" | "provider" | "">("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    institution: "",
    organizationName: "",
  });

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [applicationUpdates, setApplicationUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

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
    
    // Fetch user profile
    fetchProfile(wallet, role);
    
    // Load notification preferences from localStorage
    const savedPrefs = localStorage.getItem("notificationPrefs");
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setEmailNotifications(prefs.emailNotifications ?? true);
      setApplicationUpdates(prefs.applicationUpdates ?? true);
      setWeeklyDigest(prefs.weeklyDigest ?? false);
    }
  }, [router]);

  const fetchProfile = async (wallet: string, role: string) => {
    try {
      setLoading(true);
      
      // Fetch profile from API
      const response = await fetch(API_ENDPOINTS.GET_USER_PROFILE(wallet));
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setEditForm({
          fullName: data.profile.fullName || "",
          email: data.profile.email,
          institution: data.profile.institution || "",
          organizationName: data.profile.organizationName || "",
        });
        
        // Fetch notification preferences
        const prefsResponse = await fetch(API_ENDPOINTS.GET_USER_PREFERENCES(wallet));
        if (prefsResponse.ok) {
          const prefsData = await prefsResponse.json();
          setEmailNotifications(prefsData.preferences.emailNotifications);
          setApplicationUpdates(prefsData.preferences.applicationUpdates);
          setWeeklyDigest(prefsData.preferences.weeklyDigest);
        }
      } else if (response.status === 404) {
        // User not found - redirect to registration
        toast.error("Profile not found. Please complete registration first.");
        setTimeout(() => router.push("/details"), 2000);
      } else {
        throw new Error("Failed to load profile");
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error(error.message || "Failed to load profile. Please check your connection.");
      // Redirect to home if profile fetch fails
      setTimeout(() => router.push("/Home"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      setSaving(true);
      const loadingToast = toast.loading("Saving changes...");
      
      // Call API to update profile
      const response = await fetch(API_ENDPOINTS.UPDATE_USER_PROFILE(walletAddress), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: editForm.email,
          fullName: editForm.fullName,
          institution: editForm.institution,
          organizationName: editForm.organizationName,
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      
      // Update profile state
      if (profile) {
        setProfile({
          ...profile,
          email: data.profile.email,
          emailVerified: data.profile.emailVerified,
          fullName: data.profile.fullName,
          institution: data.profile.institution,
          organizationName: data.profile.organizationName,
        });
      }
      
      toast.success("Profile updated successfully!", { id: loadingToast });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationPreferences = async () => {
    try {
      const loadingToast = toast.loading("Saving preferences...");
      
      const response = await fetch(API_ENDPOINTS.UPDATE_USER_PREFERENCES(walletAddress), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailNotifications,
          applicationUpdates,
          weeklyDigest
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      // Also save to localStorage for quick access
      const prefs = {
        emailNotifications,
        applicationUpdates,
        weeklyDigest
      };
      localStorage.setItem("notificationPrefs", JSON.stringify(prefs));
      
      toast.success("Notification preferences saved", { id: loadingToast });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    }
  };

  const disconnectWallet = () => {
    localStorage.removeItem("userWallet");
    localStorage.removeItem("userRole");
    localStorage.removeItem("notificationPrefs");
    toast.success("Wallet disconnected");
    router.push("/");
  };

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success("Wallet address copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
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
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-sm text-gray-400">Manage your account settings</p>
          </div>
          <button
            onClick={() => router.push("/Home")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header Card */}
        <div className="bg-linear-to-r from-purple-600/20 to-blue-600/20 border border-white/10 rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-linear-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-4xl font-bold text-white">
              {profile?.fullName?.[0] || profile?.organizationName?.[0] || "U"}
            </div>
            
            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">
                {profile?.fullName || profile?.organizationName || "User"}
              </h2>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                  {profile?.role === "student" ? "🎓 Student" : "🏢 Provider"}
                </span>
                {profile?.emailVerified && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
            
            {/* Wallet Info */}
            <div className="bg-black/50 px-4 py-3 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Wallet Address</div>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <button
                  onClick={copyWalletAddress}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                  title="Copy address"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Profile Information</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleEditSubmit}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  {saving ? "Saving..." : "💾 Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      fullName: profile?.fullName || "",
                      email: profile?.email || "",
                      institution: profile?.institution || "",
                      organizationName: profile?.organizationName || "",
                    });
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <div className="text-white">{profile?.email}</div>
              )}
            </div>

            {/* Student-specific fields */}
            {profile?.role === "student" && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="text-white">{profile?.fullName || "Not set"}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Institution</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.institution}
                      onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="text-white">{profile?.institution || "Not set"}</div>
                  )}
                </div>
              </>
            )}

            {/* Provider-specific fields */}
            {profile?.role === "provider" && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Organization Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.organizationName}
                    onChange={(e) => setEditForm({ ...editForm, organizationName: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <div className="text-white">{profile?.organizationName || "Not set"}</div>
                )}
              </div>
            )}

            {/* Account Created */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Member Since</label>
              <div className="text-white">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                }) : "Unknown"}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Email Notifications</div>
                <div className="text-sm text-gray-400">Receive all email notifications</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Application Updates</div>
                <div className="text-sm text-gray-400">Get notified about application status changes</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={applicationUpdates}
                  onChange={(e) => setApplicationUpdates(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Weekly Digest</div>
                <div className="text-sm text-gray-400">Receive weekly summary of new scholarships</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          <button
            onClick={saveNotificationPreferences}
            className="mt-6 w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
          >
            Save Preferences
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile?.role === "student" && (
              <>
                <button
                  onClick={() => router.push("/my-applications")}
                  className="px-6 py-4 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all text-left"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-semibold">My Applications</div>
                  <div className="text-xs text-gray-400">View application status</div>
                </button>
                <button
                  onClick={() => router.push("/Home")}
                  className="px-6 py-4 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-all text-left"
                >
                  <div className="text-2xl mb-2">🎓</div>
                  <div className="font-semibold">Browse Scholarships</div>
                  <div className="text-xs text-gray-400">Find new opportunities</div>
                </button>
              </>
            )}
            
            {profile?.role === "provider" && (
              <>
                <button
                  onClick={() => router.push("/create-pool")}
                  className="px-6 py-4 bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 text-green-400 rounded-lg transition-all text-left"
                >
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-semibold">Create Pool</div>
                  <div className="text-xs text-gray-400">Launch new scholarship</div>
                </button>
                <button
                  onClick={() => router.push("/admin")}
                  className="px-6 py-4 bg-orange-600/20 border border-orange-500/30 hover:bg-orange-600/30 text-orange-400 rounded-lg transition-all text-left"
                >
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="font-semibold">Admin Dashboard</div>
                  <div className="text-xs text-gray-400">Manage applications</div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h3>
          <p className="text-gray-400 text-sm mb-4">
            Disconnecting your wallet will log you out and clear all local data.
          </p>
          <button
            onClick={disconnectWallet}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
          >
            🔌 Disconnect Wallet
          </button>
        </div>
      </main>
    </div>
  );
}
