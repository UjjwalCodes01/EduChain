'use client';

/**
 * useAPI Hook
 * React hook for making API calls to the backend
 */

import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api';

interface UseAPIOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAPI = useCallback(
    async <T = any>(
      url: string,
      options?: RequestInit,
      callbacks?: UseAPIOptions
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (callbacks?.onSuccess) {
          callbacks.onSuccess(data);
        }

        return data as T;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error);
        
        if (callbacks?.onError) {
          callbacks.onError(error);
        }
        
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Application endpoints
  const submitApplication = useCallback(
    async (applicationData: any, callbacks?: UseAPIOptions) => {
      return fetchAPI(
        API_ENDPOINTS.SUBMIT_APPLICATION,
        {
          method: 'POST',
          body: JSON.stringify(applicationData),
        },
        callbacks
      );
    },
    [fetchAPI]
  );

  const getApplicationsByWallet = useCallback(
    async (walletAddress: string, callbacks?: UseAPIOptions) => {
      return fetchAPI(
        API_ENDPOINTS.GET_APPLICATIONS_BY_WALLET(walletAddress),
        {},
        callbacks
      );
    },
    [fetchAPI]
  );

  const getApplicationsByPool = useCallback(
    async (poolAddress: string, callbacks?: UseAPIOptions) => {
      return fetchAPI(
        API_ENDPOINTS.GET_APPLICATIONS_BY_POOL(poolAddress),
        {},
        callbacks
      );
    },
    [fetchAPI]
  );

  const checkApplicationExists = useCallback(
    async (walletAddress: string, poolAddress: string, callbacks?: UseAPIOptions) => {
      return fetchAPI(
        API_ENDPOINTS.CHECK_APPLICATION_EXISTS(walletAddress, poolAddress),
        {},
        callbacks
      );
    },
    [fetchAPI]
  );

  // OTP endpoints
  const sendOTP = useCallback(
    async (email: string, type: string, callbacks?: UseAPIOptions) => {
      return fetchAPI(
        API_ENDPOINTS.SEND_OTP,
        {
          method: 'POST',
          body: JSON.stringify({ email, type }),
        },
        callbacks
      );
    },
    [fetchAPI]
  );

  const verifyOTP = useCallback(
    async (email: string, otp: string, callbacks?: UseAPIOptions) => {
      return fetchAPI(
        API_ENDPOINTS.VERIFY_OTP,
        {
          method: 'POST',
          body: JSON.stringify({ email, otp }),
        },
        callbacks
      );
    },
    [fetchAPI]
  );

  // Admin endpoints
  const approveApplication = useCallback(
    async (applicationId: string, adminWallet: string, callbacks?: UseAPIOptions) => {
      return fetchAPI(
        API_ENDPOINTS.APPROVE_APPLICATION(applicationId),
        {
          method: 'POST',
          body: JSON.stringify({ adminWallet }),
        },
        callbacks
      );
    },
    [fetchAPI]
  );

  const rejectApplication = useCallback(
    async (applicationId: string, adminWallet: string, reason: string, callbacks?: UseAPIOptions) => {
      return fetchAPI(
        API_ENDPOINTS.REJECT_APPLICATION(applicationId),
        {
          method: 'POST',
          body: JSON.stringify({ adminWallet, reason }),
        },
        callbacks
      );
    },
    [fetchAPI]
  );

  const markAsPaid = useCallback(
    async (applicationId: string, adminWallet: string, callbacks?: UseAPIOptions) => {
      return fetchAPI(
        API_ENDPOINTS.MARK_PAID(applicationId),
        {
          method: 'POST',
          body: JSON.stringify({ adminWallet }),
        },
        callbacks
      );
    },
    [fetchAPI]
  );

  const batchApprove = useCallback(
    async (applicationIds: string[], adminWallet: string, callbacks?: UseAPIOptions) => {
      return fetchAPI(
        API_ENDPOINTS.BATCH_APPROVE,
        {
          method: 'POST',
          body: JSON.stringify({ applicationIds, adminWallet }),
        },
        callbacks
      );
    },
    [fetchAPI]
  );

  const getStatistics = useCallback(
    async (callbacks?: UseAPIOptions) => {
      return fetchAPI(API_ENDPOINTS.ADMIN_STATISTICS, {}, callbacks);
    },
    [fetchAPI]
  );

  const getAllApplications = useCallback(
    async (callbacks?: UseAPIOptions) => {
      return fetchAPI(API_ENDPOINTS.ADMIN_APPLICATIONS, {}, callbacks);
    },
    [fetchAPI]
  );

  // Transaction endpoints
  const getTransactionsByWallet = useCallback(
    async (walletAddress: string, callbacks?: UseAPIOptions) => {
      return fetchAPI(
        API_ENDPOINTS.GET_TRANSACTIONS_BY_WALLET(walletAddress),
        {},
        callbacks
      );
    },
    [fetchAPI]
  );

  return {
    loading,
    error,
    fetchAPI,
    // Application methods
    submitApplication,
    getApplicationsByWallet,
    getApplicationsByPool,
    checkApplicationExists,
    // OTP methods
    sendOTP,
    verifyOTP,
    // Admin methods
    approveApplication,
    rejectApplication,
    markAsPaid,
    batchApprove,
    getStatistics,
    getAllApplications,
    // Transaction methods
    getTransactionsByWallet,
  };
};
