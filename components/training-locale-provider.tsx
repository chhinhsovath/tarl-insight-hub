"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TrainingLocale, TrainingTranslations, trainingTranslations, enTranslations, TrainingLocaleContext } from '@/lib/training-i18n';

interface TrainingLocaleProviderProps {
  children: ReactNode;
}

export function TrainingLocaleProvider({ children }: TrainingLocaleProviderProps) {
  // Get initial locale from localStorage if available (client-side only)
  const getInitialLocale = (): TrainingLocale => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('training-locale') as TrainingLocale;
      if (savedLocale && (savedLocale === 'en' || savedLocale === 'km')) {
        return savedLocale;
      }
    }
    return 'en';
  };

  const [locale, setLocale] = useState<TrainingLocale>(getInitialLocale);
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Save locale to localStorage when it changes
  const handleSetLocale = (newLocale: TrainingLocale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('training-locale', newLocale);
    }
  };
  
  // Use the current locale translations
  const t = trainingTranslations[locale] || enTranslations;
  
  // During SSR and before hydration, we suppress any locale-dependent rendering
  // by returning a loading state for components that use translations
  if (!mounted) {
    return (
      <TrainingLocaleContext.Provider value={{
        locale: 'en',
        setLocale: () => {},
        t: enTranslations
      }}>
        <div suppressHydrationWarning>
          {children}
        </div>
      </TrainingLocaleContext.Provider>
    );
  }
  
  const value = {
    locale,
    setLocale: handleSetLocale,
    t
  };
  
  return (
    <TrainingLocaleContext.Provider value={value}>
      {children}
    </TrainingLocaleContext.Provider>
  );
}