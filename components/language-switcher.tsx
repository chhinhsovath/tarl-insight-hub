"use client";

import { Globe } from "lucide-react";
import { useGlobalLanguage } from "@/lib/global-language-context";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useGlobalLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 ${className}`}
      title={`Switch to ${language === 'en' ? 'ខ្មែរ' : 'English'}`}
    >
      <Globe className="w-4 h-4 mr-2" />
      <span className={language === 'kh' ? 'font-khmer' : ''}>
        {language === 'en' ? 'EN' : 'ខ្មែរ'}
      </span>
    </button>
  );
}