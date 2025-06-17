"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useTrainingTranslation } from '@/lib/training-i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TrainingLanguageSwitcher() {
  const { locale, setLocale } = useTrainingTranslation();
  
  const languages = [
    { code: 'en' as const, name: 'English', nativeName: 'English' },
    { code: 'km' as const, name: 'Khmer', nativeName: 'ខ្មែរ' }
  ];
  
  const currentLanguage = languages.find(lang => lang.code === locale);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {currentLanguage?.nativeName || 'English'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLocale(language.code)}
            className={locale === language.code ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}