"use client";

import { useGlobalLoading } from '@/lib/global-loading-context';
import { UniversalLoading } from '@/components/universal-loading';

export function GlobalLoadingOverlay() {
  const { loadingState } = useGlobalLoading();
  
  return (
    <UniversalLoading
      isLoading={loadingState.isLoading}
      message={loadingState.message}
      showProgress={loadingState.showProgress}
      overlay={true}
    />
  );
}