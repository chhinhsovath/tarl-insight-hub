"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TrainingLocale, TrainingTranslations, trainingTranslations, enTranslations, TrainingLocaleContext } from '@/lib/training-i18n';

interface TrainingLocaleProviderProps {
  children: ReactNode;
}

export function TrainingLocaleProvider({ children }: TrainingLocaleProviderProps) {
  const [locale, setLocale] = useState<TrainingLocale>('en');
  
  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('training-locale') as TrainingLocale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'km')) {
      setLocale(savedLocale);
    }
  }, []);
  
  // Save locale to localStorage when it changes
  const handleSetLocale = (newLocale: TrainingLocale) => {
    setLocale(newLocale);
    localStorage.setItem('training-locale', newLocale);
  };
  
  const t = trainingTranslations[locale] || enTranslations;
  
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