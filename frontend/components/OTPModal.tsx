"use client";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { API_ENDPOINTS } from "@/lib/api";

interface OTPModalProps {
  email: string;
  walletAddress: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function OTPModal({ email, walletAddress, onVerified, onCancel }: OTPModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Send OTP when modal opens
    sendOTP();
  }, []);

  useEffect(() => {
    // Timer countdown
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const sendOTP = async () => {
    try {
      setSending(true);
      const loadingToast = toast.loading("Sending OTP to your email...");

      const response = await fetch(API_ENDPOINTS.SEND_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, walletAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      toast.success("OTP sent to your email!", { id: loadingToast });
      
      // Show OTP in development mode
      if (data.data?.otp) {
        toast.success(`Development Mode - OTP: ${data.data.otp}`, { duration: 10000 });
      }

      setTimeLeft(600); // Reset timer
      setCanResend(false);
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("").concat(Array(6 - pastedData.length).fill(""));
    setOtp(newOtp);

    // Focus last filled input or last input
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const verifyOTP = async () => {
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    try {
      setVerifying(true);
      const loadingToast = toast.loading("Verifying OTP...");

      const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, walletAddress, otp: otpString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      toast.success("OTP verified successfully!", { id: loadingToast });
      onVerified();
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast.error(error.message || "Failed to verify OTP");
      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-white/10 max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verification</h2>
          <p className="text-gray-400 text-sm">
            We've sent a 6-digit code to<br />
            <span className="text-purple-400 font-semibold">{email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
                disabled={verifying}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center">
            {timeLeft > 0 ? (
              <p className="text-gray-400 text-sm">
                Code expires in <span className="text-purple-400 font-semibold">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-red-400 text-sm font-semibold">OTP expired. Please request a new one.</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={verifyOTP}
            disabled={verifying || otp.some((d) => !d) || timeLeft === 0}
            className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            onClick={sendOTP}
            disabled={sending || !canResend && timeLeft > 0}
            className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Resend OTP"}
          </button>

          <button
            onClick={onCancel}
            className="w-full px-6 py-3 bg-transparent hover:bg-white/5 rounded-lg text-gray-400 hover:text-white font-semibold transition-all"
          >
            Cancel
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <p className="text-blue-300 text-xs text-center">
            💡 Didn't receive the code? Check your spam folder or click Resend OTP
          </p>
        </div>
      </div>
    </div>
  );
}
