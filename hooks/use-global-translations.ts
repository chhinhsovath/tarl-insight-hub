"use client";

import { useGlobalLanguage } from '@/lib/global-language-context';
import { globalTranslations, enTranslations, type GlobalTranslations } from '@/lib/global-translations';

export function useGlobalTranslations(): GlobalTranslations {
  try {
    const { language } = useGlobalLanguage();
    return globalTranslations[language] || enTranslations;
  } catch {
    // Fallback if context is not available
    return enTranslations;
  }
}