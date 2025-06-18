"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useParticipantTranslation } from '@/lib/participant-i18n';

export function ParticipantLanguageSwitcher() {
  const { locale, setLocale } = useParticipantTranslation();

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'km' : 'en');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
    >
      <Globe className="h-4 w-4" />
      {locale === 'en' ? 'ខ្មែរ' : 'English'}
    </Button>
  );
}