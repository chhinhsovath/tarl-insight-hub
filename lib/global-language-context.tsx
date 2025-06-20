"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type GlobalLocale = 'en' | 'kh';

interface GlobalLanguageContextType {
  language: GlobalLocale;
  setLanguage: (lang: GlobalLocale) => void;
}

const GlobalLanguageContext = createContext<GlobalLanguageContextType | undefined>(undefined);

interface GlobalLanguageProviderProps {
  children: ReactNode;
}

export function GlobalLanguageProvider({ children }: GlobalLanguageProviderProps) {
  // Get initial language from localStorage if available (client-side only)
  const getInitialLanguage = (): GlobalLocale => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('global-language') as GlobalLocale;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'kh')) {
        return savedLanguage;
      }
    }
    return 'en';
  };

  const [language, setLanguageState] = useState<GlobalLocale>(getInitialLanguage);
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Save language to localStorage when it changes
  const setLanguage = (newLanguage: GlobalLocale) => {
    setLanguageState(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('global-language', newLanguage);
    }
  };
  
  // During SSR and before hydration, we use English as default
  if (!mounted) {
    return (
      <GlobalLanguageContext.Provider value={{
        language: 'en',
        setLanguage: () => {}
      }}>
        <div suppressHydrationWarning>
          {children}
        </div>
      </GlobalLanguageContext.Provider>
    );
  }
  
  const value = {
    language,
    setLanguage
  };
  
  return (
    <GlobalLanguageContext.Provider value={value}>
      <div className={language === 'kh' ? 'font-khmer' : ''} data-lang={language}>
        {children}
      </div>
    </GlobalLanguageContext.Provider>
  );
}

export function useGlobalLanguage() {
  const context = useContext(GlobalLanguageContext);
  if (context === undefined) {
    throw new Error('useGlobalLanguage must be used within a GlobalLanguageProvider');
  }
  return context;
}