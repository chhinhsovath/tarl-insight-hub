"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  currentLanguage: 'km' | 'en';
  onLanguageChange: (language: 'km' | 'en') => void;
  className?: string;
}

export function SchoolRegistrationLanguageToggle({ 
  currentLanguage, 
  onLanguageChange, 
  className = "" 
}: LanguageToggleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4 text-gray-600" />
      <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Button
          variant={currentLanguage === 'km' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onLanguageChange('km')}
          className={`rounded-none px-3 py-1 text-sm font-medium transition-colors ${
            currentLanguage === 'km' 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          ខ្មែរ
        </Button>
        <Button
          variant={currentLanguage === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onLanguageChange('en')}
          className={`rounded-none px-3 py-1 text-sm font-medium transition-colors ${
            currentLanguage === 'en' 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          EN
        </Button>
      </div>
    </div>
  );
}