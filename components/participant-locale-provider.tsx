"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ParticipantLocale, ParticipantTranslations, participantTranslations, participantEnTranslations, ParticipantLocaleContext } from '@/lib/participant-i18n';

interface ParticipantLocaleProviderProps {
  children: ReactNode;
}

export function ParticipantLocaleProvider({ children }: ParticipantLocaleProviderProps) {
  const [locale, setLocale] = useState<ParticipantLocale>('en');
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Load locale from localStorage on mount
  useEffect(() => {
    setIsHydrated(true);
    const savedLocale = localStorage.getItem('participant-locale') as ParticipantLocale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'km')) {
      setLocale(savedLocale);
    }
  }, []);
  
  // Save locale to localStorage when it changes
  const handleSetLocale = (newLocale: ParticipantLocale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('participant-locale', newLocale);
    }
  };
  
  // Always use English translations during SSR to prevent hydration mismatch
  const t = isHydrated ? (participantTranslations[locale] || participantEnTranslations) : participantEnTranslations;
  
  const value = {
    locale: isHydrated ? locale : 'en' as ParticipantLocale,
    setLocale: handleSetLocale,
    t
  };
  
  return (
    <ParticipantLocaleContext.Provider value={value}>
      {children}
    </ParticipantLocaleContext.Provider>
  );
}