"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import Threads from "../../components/Threads";
import { Button } from "../../components/ui/stateful-button";
import OTPModal from "../../components/OTPModal";
import Button2 from "../../components/ui/Button2";
import { API_ENDPOINTS, API_URL } from "@/lib/api";

type Step = "role" | "student" | "provider";
type UserRole = "student" | "provider" | null;

export default function DetailsPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("role");

    const [walletAddress, setWalletAddress] = useState<string>("");
    const [connecting, setConnecting] = useState(false);
    // Student form state
    const [studentForm, setStudentForm] = useState({
        fullName: "",
        email: "",
        institute: "",
        program: "",
        graduationYear: "",
    });
    const [studentDoc, setStudentDoc] = useState<File | null>(null);
    const [studentSubmitting, setStudentSubmitting] = useState(false);

    // Provider form state
    const [providerForm, setProviderForm] = useState({
        organizationName: "",
        email: "",
        website: "",
        description: "",
        contactPerson: "",
    });
    const [providerDoc, setProviderDoc] = useState<File | null>(null);
    const [providerSubmitting, setProviderSubmitting] = useState(false);

    // OTP state
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [pendingEmail, setPendingEmail] = useState("");
    const [pendingRole, setPendingRole] = useState<
        "student" | "provider" | null
    >(null);
    const [otpVerified, setOTPVerified] = useState(false);

    // Registration success state
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [resendingVerification, setResendingVerification] = useState(false);

    // Wallet checking state
    const [checkingWallet, setCheckingWallet] = useState(true);

    useEffect(() => {
        checkWalletConnection();
    }, []);

    const resendVerificationEmail = async () => {
        try {
            setResendingVerification(true);
            const loadingToast = toast.loading(
                "Resending verification email..."
            );

            const response = await fetch(
                API_ENDPOINTS.ONBOARDING_RESEND_VERIFICATION,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: registeredEmail,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || "Failed to resend verification email"
                );
            }

            toast.success("Verification email sent! Check your inbox.", {
                id: loadingToast,
            });
        } catch (error: any) {
            console.error("Error resending verification:", error);
            toast.error(error.message || "Failed to resend verification email");
        } finally {
            setResendingVerification(false);
        }
    };

    const checkWalletConnection = async () => {
        setCheckingWallet(true);
        if (typeof window !== "undefined" && window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    const wallet = accounts[0].address;
                    setWalletAddress(wallet);

                    // Check if wallet is already registered
                    try {
                        const response = await fetch(
                            API_ENDPOINTS.AUTH_CHECK(wallet)
                        );
                        const data = await response.json();

                        console.log('Wallet check result:', data);

                        if (data.registered && data.user) {
                            // Wallet already registered - set localStorage and redirect to Home
                            localStorage.setItem(
                                "userWallet",
                                data.user.wallet
                            );
                            localStorage.setItem("userRole", data.user.role);
                            localStorage.setItem("userEmail", data.user.email);

                            console.log('Redirecting registered user to Home...');
                            
                            // Redirect immediately
                            router.replace("/Home");
                            return;
                        } else {
                            // Wallet not registered - stop loading and show registration form
                            console.log('Wallet not registered, showing registration form');
                            setCheckingWallet(false);
                        }
                    } catch (error) {
                        console.error(
                            "Error checking wallet registration:",
                            error
                        );
                        // Continue to registration page on error
                        setCheckingWallet(false);
                    }
                } else {
                    // No accounts connected
                    setCheckingWallet(false);
                }
            } catch (error) {
                console.error("Error checking wallet:", error);
                setCheckingWallet(false);
            }
        } else {
            // No ethereum provider
            setCheckingWallet(false);
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error("Please install MetaMask to continue.");
            window.open("https://metamask.io/download/", "_blank");
            return;
        }
        
        let isRedirecting = false;
        
        try {
            setConnecting(true);
            setCheckingWallet(true);
            const loadingToast = toast.loading("Connecting wallet...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const wallet = accounts[0];
            setWalletAddress(wallet);

            toast.loading("Checking wallet registration...", {
                id: loadingToast,
            });

            // Check if wallet is already registered
            try {
                const response = await fetch(
                    API_ENDPOINTS.AUTH_CHECK(wallet)
                );
                const data = await response.json();

                if (data.registered && data.user) {
                    // Wallet already registered - set localStorage and redirect to Home
                    localStorage.setItem("userWallet", data.user.wallet);
                    localStorage.setItem("userRole", data.user.role);
                    localStorage.setItem("userEmail", data.user.email);

                    toast.success("Welcome back! Redirecting to Home...", {
                        id: loadingToast,
                    });
                    
                    isRedirecting = true;
                    // Use replace instead of push to prevent back navigation to details page
                    setTimeout(() => {
                        router.replace("/Home");
                    }, 1000);
                    // Keep loading state until redirect completes
                    return;
                }
            } catch (error) {
                console.error("Error checking wallet registration:", error);
                // Continue to registration on error
            }

            // Not registered - stop loading and show registration form
            toast.success("Wallet connected!", { id: loadingToast });
        } catch (e) {
            console.error(e);
            toast.error("Failed to connect wallet.");
        } finally {
            // Only set to false if not redirecting
            if (!isRedirecting) {
                setConnecting(false);
                setCheckingWallet(false);
            }
        }
    };

    const disconnectWallet = () => {
        setWalletAddress("");
        toast.success("Wallet disconnected");
    };

    const onChooseRole = (role: "student" | "provider") => {
        setStep(role);
    };

    const handleStudentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
    };

    const handleProviderInput = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setProviderForm({ ...providerForm, [e.target.name]: e.target.value });
    };

    // Submit student registration
    const submitStudent = async () => {
        if (
            !studentForm.fullName ||
            !studentForm.email ||
            !studentForm.institute ||
            !studentForm.program ||
            !studentForm.graduationYear
        ) {
            toast.error("Please fill all required fields.");
            return;
        }
        if (!walletAddress) {
            toast.error("Please connect your wallet first.");
            return;
        }

        // Check if OTP is verified
        if (!otpVerified) {
            setPendingEmail(studentForm.email);
            setPendingRole("student");
            setShowOTPModal(true);
            return;
        }

        try {
            setStudentSubmitting(true);
            const loadingToast = toast.loading("Submitting registration...");

            const formData = new FormData();
            formData.append("wallet", walletAddress);
            formData.append("fullName", studentForm.fullName);
            formData.append("email", studentForm.email);
            formData.append("institute", studentForm.institute);
            formData.append("program", studentForm.program);
            formData.append("graduationYear", studentForm.graduationYear);
            if (studentDoc) formData.append("document", studentDoc);

            // Call backend API
            const res = await fetch(
                `${API_URL}/api/onboarding/student`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.message || "Failed to submit student registration"
                );
            }

            // Store user role in localStorage
            localStorage.setItem("userRole", "student");
            localStorage.setItem("userWallet", walletAddress);
            localStorage.setItem("userEmail", studentForm.email);

            // Show registration success screen
            setRegisteredEmail(studentForm.email);
            setRegistrationComplete(true);

            toast.success(
                "Registration submitted! Check your email for verification.",
                { id: loadingToast }
            );
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Submission failed. Please try again.");
        } finally {
            setStudentSubmitting(false);
        }
    };

    // Submit provider registration
    const submitProvider = async () => {
        if (
            !providerForm.organizationName ||
            !providerForm.email ||
            !providerForm.description ||
            !providerForm.contactPerson
        ) {
            toast.error("Please fill all required fields.");
            return;
        }
        if (!walletAddress) {
            toast.error("Please connect your wallet first.");
            return;
        }

        // Check if OTP is verified
        if (!otpVerified) {
            setPendingEmail(providerForm.email);
            setPendingRole("provider");
            setShowOTPModal(true);
            return;
        }

        try {
            setProviderSubmitting(true);
            const loadingToast = toast.loading("Submitting registration...");

            const formData = new FormData();
            formData.append("wallet", walletAddress);
            formData.append("organizationName", providerForm.organizationName);
            formData.append("email", providerForm.email);
            formData.append("website", providerForm.website);
            formData.append("description", providerForm.description);
            formData.append("contactPerson", providerForm.contactPerson);
            if (providerDoc) formData.append("document", providerDoc);

            // Call backend API
            const res = await fetch(
                `${API_URL}/api/onboarding/provider`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.message ||
                        "Failed to submit provider registration"
                );
            }

            // Store user role in localStorage
            localStorage.setItem("userRole", "provider");
            localStorage.setItem("userWallet", walletAddress);
            localStorage.setItem("userEmail", providerForm.email);

            // Show registration success screen
            setRegisteredEmail(providerForm.email);
            setRegistrationComplete(true);

            toast.success(
                "Provider registration submitted! Check your email for verification.",
                { id: loadingToast }
            );
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Submission failed. Please try again.");
        } finally {
            setProviderSubmitting(false);
        }
    };

    // Handle OTP verification success
    const handleOTPVerified = async () => {
        setOTPVerified(true);
        setShowOTPModal(false);
        toast.success("Email verified successfully!");

        // Continue with registration based on pending role
        if (pendingRole === "student") {
            await submitStudent();
            // Navigate to Home after successful registration
            setTimeout(() => {
                router.push("/Home");
            }, 2000);
        } else if (pendingRole === "provider") {
            await submitProvider();
            // Navigate to Home after successful registration
            setTimeout(() => {
                router.push("/Home");
            }, 2000);
        }
    };

    return (
        <div className="min-h-screen bg-black overflow-x-hidden flex flex-col">
            {/* Toast Notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "#1f2937",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                    },
                    success: {
                        iconTheme: {
                            primary: "#10b981",
                            secondary: "#fff",
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: "#ef4444",
                            secondary: "#fff",
                        },
                    },
                }}
            />

            {/* Background */}
            <div className="fixed inset-0 z-0">
                <Threads
                    amplitude={1.5}
                    distance={0}
                    enableMouseInteraction={false}
                />
            </div>

            {/* Wallet Checking Loader */}
            {checkingWallet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Checking Wallet Registration
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Verifying if your wallet is already registered...
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="relative z-10 px-8 py-6 flex justify-between items-center border-b border-white/10 backdrop-blur-md">
                <button
                    onClick={() => router.push("/")}
                    className="hover:opacity-80 transition-opacity"
                >
                    <h1 className="text-2xl font-bold text-white cursor-pointer">EduChain</h1>
                </button>

                <div className="flex items-center gap-3">
                    {walletAddress ? (
                        <>
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white text-sm">
                                {walletAddress.slice(0, 6)}...
                                {walletAddress.slice(-4)}
                            </div>
                            <Button onClick={disconnectWallet}>
                                Disconnect
                            </Button>
                        </>
                    ) : (
                        <Button onClick={connectWallet} disabled={connecting}>
                            {connecting ? "Connecting..." : "Connect Wallet"}
                        </Button>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 container mx-auto px-6 md:px-8 py-10 flex-1">
                {registrationComplete ? (
                    <div className="max-w-2xl mx-auto">
                        <div className="p-8 bg-white/5 rounded-xl border border-white/10 backdrop-blur-lg text-center">
                            {/* Success Icon */}
                            <div className="w-20 h-20 bg-linear-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg
                                    className="w-10 h-10 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>

                            <h2 className="text-3xl font-bold text-white mb-4">
                                ✅ Registration Complete!
                            </h2>
                            <p className="text-gray-300 mb-6">
                                We've sent a verification email to:
                            </p>
                            <div className="px-4 py-3 bg-white/10 rounded-lg border flex justify-center border-white/20 text-white mb-6">
                                {registeredEmail}
                            </div>

                            <p className="text-gray-400 mb-8">
                                Please check your inbox and click the
                                verification link to activate your account.
                                <br />
                                <span className="text-sm text-gray-500">
                                    (Don't forget to check your spam folder if
                                    you don't see it)
                                </span>
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    onClick={resendVerificationEmail}
                                    disabled={resendingVerification}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resendingVerification
                                        ? "Sending..."
                                        : "📧 Resend Verification Email"}
                                </Button>
                                <Button
                                    onClick={() => router.push("/Home")}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    Continue to Home
                                </Button>
                            </div>

                            {/* Help Text */}
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <p className="text-sm text-gray-500">
                                    💡 Tip: You can verify your email later from
                                    the "My Applications" page
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl font-bold text-white mb-2">
                            Get Started
                        </h2>
                        <p className="text-gray-400 mb-8">
                            Choose your role to continue and complete a quick
                            registration.
                        </p>

                        {step === "role" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Student card */}
                                <div className="p-8 bg-white/5 rounded-xl border border-white/10 backdrop-blur-lg hover:border-purple-500/50 transition-all cursor-pointer group">
                                    <div className="mb-4">
                                        <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                                            <svg
                                                className="w-8 h-8 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-semibold text-white mb-2">
                                        I am a Student
                                    </h3>
                                    <p className="text-gray-400 mb-6">
                                        Apply for scholarships, submit your
                                        documents, and receive funds directly to
                                        your wallet.
                                    </p>
                                    <Button
                                        onClick={() => onChooseRole("student")}
                                        className="w-full bg-[#282828]"
                                    >
                                        Continue as Student
                                    </Button>
                                </div>

                                {/* Provider card */}
                                <div className="p-8 bg-white/5 rounded-xl border border-white/10 backdrop-blur-lg hover:border-purple-500/50 transition-all cursor-pointer group">
                                    <div className="mb-4">
                                        <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
                                            <svg
                                                className="w-8 h-8 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-semibold text-white mb-2">
                                        I am a Scholarship Provider
                                    </h3>
                                    <p className="text-gray-400 mb-6">
                                        Create and manage scholarship pools with
                                        full transparency and on-chain
                                        disbursement.
                                    </p>
                                    <Button
                                        onClick={() => onChooseRole("provider")}
                                        className="w-full bg-[#282828]"
                                    >
                                        Continue as Provider
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "student" && (
                            <div className="mt-6 p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-semibold text-white">
                                        Student Registration
                                    </h3>
                                    <button
                                        className="text-sm text-gray-400 hover:text-white transition-colors"
                                        onClick={() => setStep("role")}
                                    >
                                        ← Back to role selection
                                    </button>
                                </div>

                                {!walletAddress && (
                                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <p className="text-yellow-300 text-sm">
                                            ⚠️ Please connect your wallet before
                                            completing the registration form.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Full Name"
                                        name="fullName"
                                        value={studentForm.fullName}
                                        onChange={handleStudentInput}
                                        required
                                    />
                                    <Input
                                        label="College Email"
                                        name="email"
                                        value={studentForm.email}
                                        onChange={handleStudentInput}
                                        type="email"
                                        required
                                    />
                                    <Input
                                        label="Institute / University"
                                        name="institute"
                                        value={studentForm.institute}
                                        onChange={handleStudentInput}
                                        required
                                    />
                                    <Input
                                        label="Program / Major"
                                        name="program"
                                        value={studentForm.program}
                                        onChange={handleStudentInput}
                                        required
                                    />
                                    <Input
                                        label="Expected Graduation Year"
                                        name="graduationYear"
                                        value={studentForm.graduationYear}
                                        onChange={handleStudentInput}
                                        type="number"
                                        placeholder="2026"
                                        required
                                    />
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-1">
                                            Connected Wallet
                                        </label>
                                        <div className="px-4 py-3 bg-white/10 rounded-lg border border-white/20 text-white">
                                            {walletAddress
                                                ? `${walletAddress.slice(
                                                      0,
                                                      6
                                                  )}...${walletAddress.slice(
                                                      -4
                                                  )}`
                                                : "Not connected"}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-gray-300 mb-1">
                                            Supporting Document (Student ID,
                                            Transcript, etc.)
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            onChange={(e) =>
                                                setStudentDoc(
                                                    e.target.files?.[0] || null
                                                )
                                            }
                                            className="w-full px-4 py-3 bg-white/5 rounded-lg border border-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Optional - Upload your student ID or
                                            transcript for faster verification
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <Button
                                        onClick={submitStudent}
                                        disabled={
                                            studentSubmitting || !walletAddress
                                        }
                                        className="flex-1"
                                    >
                                        {studentSubmitting
                                            ? "Submitting..."
                                            : !walletAddress
                                            ? "Connect Wallet First"
                                            : "Complete Registration"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "provider" && (
                            <div className="mt-6 p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-semibold text-white">
                                        Provider Registration
                                    </h3>
                                    <button
                                        className="text-sm text-gray-400 hover:text-white transition-colors"
                                        onClick={() => setStep("role")}
                                    >
                                        ← Back to role selection
                                    </button>
                                </div>

                                {!walletAddress && (
                                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <p className="text-yellow-300 text-sm">
                                            ⚠️ Please connect your wallet before
                                            completing the registration form.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Organization Name"
                                        name="organizationName"
                                        value={providerForm.organizationName}
                                        onChange={handleProviderInput}
                                        required
                                    />
                                    <Input
                                        label="Work Email"
                                        name="email"
                                        value={providerForm.email}
                                        onChange={handleProviderInput}
                                        type="email"
                                        required
                                    />
                                    <Input
                                        label="Website"
                                        name="website"
                                        value={providerForm.website}
                                        onChange={handleProviderInput}
                                        placeholder="https://example.org"
                                    />
                                    <Input
                                        label="Contact Person"
                                        name="contactPerson"
                                        value={providerForm.contactPerson}
                                        onChange={handleProviderInput}
                                        required
                                    />
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-gray-300 mb-1">
                                            Organization Description{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            name="description"
                                            value={providerForm.description}
                                            onChange={handleProviderInput}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Tell us about your scholarship program and goals..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-300 mb-1">
                                            Connected Wallet
                                        </label>
                                        <div className="px-4 py-3 bg-white/10 rounded-lg border border-white/20 text-white">
                                            {walletAddress
                                                ? `${walletAddress.slice(
                                                      0,
                                                      6
                                                  )}...${walletAddress.slice(
                                                      -4
                                                  )}`
                                                : "Not connected"}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-gray-300 mb-1">
                                            Verification Document (Business
                                            License, Certificate, etc.)
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            onChange={(e) =>
                                                setProviderDoc(
                                                    e.target.files?.[0] || null
                                                )
                                            }
                                            className="w-full px-4 py-3 bg-white/5 rounded-lg border border-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Optional - Upload verification
                                            documents for credibility
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <Button
                                        onClick={submitProvider}
                                        disabled={
                                            providerSubmitting || !walletAddress
                                        }
                                        className="flex-1"
                                    >
                                        {providerSubmitting
                                            ? "Submitting..."
                                            : !walletAddress
                                            ? "Connect Wallet First"
                                            : "Complete Registration"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-8 px-4 text-center text-gray-500 border-t border-white/10 mt-auto">
                <p>© 2025 EduChain. Powered by Blockchain Technology.</p>
            </footer>

            {/* OTP Modal */}
            {showOTPModal && (
                <OTPModal
                    email={pendingEmail}
                    walletAddress={walletAddress}
                    onVerified={handleOTPVerified}
                    onCancel={() => {
                        setShowOTPModal(false);
                        setPendingEmail("");
                        setPendingRole(null);
                    }}
                />
            )}
        </div>
    );
}

function Input({
    label,
    name,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
}: {
    label: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm text-gray-300 mb-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                type={type}
                className="w-full px-4 py-3 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
        </div>
    );
}
