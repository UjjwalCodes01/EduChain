"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { API_ENDPOINTS } from "@/lib/api";

interface ApplicationModalProps {
  pool: {
    address: string;
    poolName: string;
    scholarshipAmount: string;
    applicationDeadline: number;
  };
  walletAddress: string;
  onClose: () => void;
}

export default function ApplicationModal({ pool, walletAddress, onClose }: ApplicationModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    institution: "",
    program: "",
    year: "",
    gpa: "",
    additionalInfo: "",
  });
  const [document, setDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate application first
    try {
      const checkResponse = await fetch(
        API_ENDPOINTS.CHECK_APPLICATION_EXISTS(walletAddress.toLowerCase(), pool.address.toLowerCase())
      );
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.exists) {
          toast.error(
            "You have already applied to this scholarship pool. You can only submit one application per pool.",
            { duration: 5000 }
          );
          return;
        }
      }
    } catch (error) {
      console.error("Error checking for duplicate application:", error);
      // Continue with submission even if check fails - backend will handle it
    }

    // Validation
    if (!formData.name || !formData.email || !formData.institution || !formData.program) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!document) {
      toast.error("Please upload a supporting document");
      return;
    }

    try {
      setSubmitting(true);
      const loadingToast = toast.loading("Submitting application...");

      const formDataToSend = new FormData();
      formDataToSend.append("walletAddress", walletAddress.toLowerCase());
      formDataToSend.append("poolAddress", pool.address.toLowerCase());
      formDataToSend.append("poolId", pool.address.toLowerCase());
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email.toLowerCase());
      formDataToSend.append("studentId", formData.studentId);
      formDataToSend.append("institution", formData.institution);
      formDataToSend.append("program", formData.program);
      formDataToSend.append("year", formData.year);
      formDataToSend.append("gpa", formData.gpa);
      formDataToSend.append("additionalInfo", formData.additionalInfo);
      formDataToSend.append("document", document);

      const response = await fetch(API_ENDPOINTS.SUBMIT_APPLICATION, {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        toast.error(result.error || result.message || "Failed to submit application", { duration: 5000 });
        return;
      }

      toast.success("Application submitted! Check your email for verification.", { id: loadingToast });
      onClose();
      router.push("/my-applications");
    } catch (error: any) {
      console.error("Application submission error:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{pool.poolName}</h2>
            <p className="text-gray-400 text-sm mt-1">Scholarship Amount: {pool.scholarshipAmount} ETH</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="john@university.edu"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Student ID</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="STU123456"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Institution <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="institution"
                value={formData.institution}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="University Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Program/Major <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="program"
                value={formData.program}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Computer Science"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Year of Study</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5+">5th Year+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">GPA</label>
              <input
                type="text"
                name="gpa"
                value={formData.gpa}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="3.5"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                disabled
                className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Additional Information</label>
            <textarea
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Tell us why you deserve this scholarship..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Supporting Document (Transcript, ID, etc.) <span className="text-red-400">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700"
              required
            />
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 10MB)</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
