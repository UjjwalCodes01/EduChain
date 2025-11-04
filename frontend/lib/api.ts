/**
 * API Configuration
 * Centralized backend API URL configuration
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH_CHECK: (walletAddress: string) => `${API_URL}/api/auth/check/${walletAddress}`,
  
  // Application endpoints
  SUBMIT_APPLICATION: `${API_URL}/api/applications/submit`,
  GET_APPLICATIONS_BY_WALLET: (walletAddress: string) => `${API_URL}/api/applications/wallet/${walletAddress}`,
  GET_APPLICATIONS_BY_POOL: (poolAddress: string) => `${API_URL}/api/applications/pool/${poolAddress}`,
  CHECK_APPLICATION_EXISTS: (walletAddress: string, poolAddress: string) => 
    `${API_URL}/api/applications/wallet/${walletAddress}/pool/${poolAddress}`,
  RESEND_VERIFICATION: `${API_URL}/api/applications/resend-verification`,
  
  // Admin endpoints
  ADMIN_STATISTICS: `${API_URL}/api/admin/statistics`,
  ADMIN_APPLICATIONS: `${API_URL}/api/admin/applications`,
  APPROVE_APPLICATION: (applicationId: string) => `${API_URL}/api/admin/applications/${applicationId}/approve`,
  REJECT_APPLICATION: (applicationId: string) => `${API_URL}/api/admin/applications/${applicationId}/reject`,
  MARK_PAID: (applicationId: string) => `${API_URL}/api/admin/applications/${applicationId}/paid`,
  BATCH_APPROVE: `${API_URL}/api/admin/batch-approve`,
  
  // Onboarding endpoints
  ONBOARDING_RESEND_VERIFICATION: `${API_URL}/api/onboarding/resend-verification`,
  
  // Transaction endpoints
  GET_TRANSACTIONS_BY_WALLET: (walletAddress: string) => `${API_URL}/api/transactions/wallet/${walletAddress}`,
  
  // OTP endpoints
  SEND_OTP: `${API_URL}/api/otp/send`,
  VERIFY_OTP: `${API_URL}/api/otp/verify`,
  
  // User profile endpoints
  GET_USER_PROFILE: (walletAddress: string) => `${API_URL}/api/user/profile/${walletAddress}`,
  UPDATE_USER_PROFILE: (walletAddress: string) => `${API_URL}/api/user/profile/${walletAddress}`,
  GET_USER_PREFERENCES: (walletAddress: string) => `${API_URL}/api/user/preferences/${walletAddress}`,
  UPDATE_USER_PREFERENCES: (walletAddress: string) => `${API_URL}/api/user/preferences/${walletAddress}`,
};
