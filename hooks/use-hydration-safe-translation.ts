"use client";

import { useEffect, useState } from 'react';
import { useTrainingTranslation } from '@/lib/training-i18n';

/**
 * Hook to prevent hydration mismatches when using translations
 * Returns English text during SSR, then switches to selected language after hydration
 */
export function useHydrationSafeTranslation() {
  const { t, locale } = useTrainingTranslation();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Return a function that can provide fallback text during SSR
  const getSafeText = (translatedText: string, fallbackText?: string) => {
    if (!isHydrated && fallbackText) {
      return fallbackText;
    }
    return translatedText;
  };

  return {
    t,
    locale,
    isHydrated,
    getSafeText
  };
}