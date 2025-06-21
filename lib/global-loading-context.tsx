"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

interface GlobalLoadingContextType {
  loadingState: LoadingState;
  setLoading: (loading: boolean, options?: { message?: string; showProgress?: boolean }) => void;
  setProgress: (progress: number) => void;
  showLoading: (message?: string, showProgress?: boolean) => void;
  hideLoading: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: undefined,
    progress: 0,
    showProgress: false,
  });

  const setLoading = useCallback((loading: boolean, options?: { message?: string; showProgress?: boolean }) => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: loading,
      message: loading ? (options?.message || prev.message) : undefined,
      showProgress: loading ? (options?.showProgress ?? prev.showProgress) : false,
      progress: loading ? prev.progress : 0,
    }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
    }));
  }, []);

  const showLoading = useCallback((message?: string, showProgress?: boolean) => {
    setLoading(true, { message, showProgress });
  }, [setLoading]);

  const hideLoading = useCallback(() => {
    setLoading(false);
  }, [setLoading]);

  const value: GlobalLoadingContextType = {
    loadingState,
    setLoading,
    setProgress,
    showLoading,
    hideLoading,
  };

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
}