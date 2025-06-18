"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TrainingLocale, TrainingTranslations, trainingTranslations, enTranslations, TrainingLocaleContext } from '@/lib/training-i18n';

interface TrainingLocaleProviderProps {
  children: ReactNode;
}

export function TrainingLocaleProvider({ children }: TrainingLocaleProviderProps) {
  const [locale, setLocale] = useState<TrainingLocale>('en');
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Load locale from localStorage on mount
  useEffect(() => {
    setIsHydrated(true);
    const savedLocale = localStorage.getItem('training-locale') as TrainingLocale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'km')) {
      setLocale(savedLocale);
    }
  }, []);
  
  // Save locale to localStorage when it changes
  const handleSetLocale = (newLocale: TrainingLocale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('training-locale', newLocale);
    }
  };
  
  // Always use English translations during SSR to prevent hydration mismatch
  const t = isHydrated ? (trainingTranslations[locale] || enTranslations) : enTranslations;
  
  const value = {
    locale: isHydrated ? locale : 'en' as TrainingLocale,
    setLocale: handleSetLocale,
    t
  };
  
  return (
    <TrainingLocaleContext.Provider value={value}>
      {children}
    </TrainingLocaleContext.Provider>
  );
}