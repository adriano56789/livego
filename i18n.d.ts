import * as React from 'react';

type Translations = {
  [key: string]: string | Translations;
};

interface TranslationContextType {
  t: (key: string, options?: Record<string, unknown>) => string;
  language: string;
  setLanguage: (lang: string) => void;
  i18n: any;
  ready: boolean;
}

declare const useTranslation: () => TranslationContextType;
declare const t: (key: string, options?: Record<string, unknown>) => string;
declare const setLanguage: (lang: string) => void;
declare const getCurrentLanguage: () => string;

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: string;
  translations?: Record<string, Translations>;
}

declare const LanguageProvider: React.FC<LanguageProviderProps>;

export {
  useTranslation,
  t,
  setLanguage,
  getCurrentLanguage,
  LanguageProvider,
  TranslationContextType,
  Translations,
  LanguageProviderProps
};

export default {
  useTranslation,
  LanguageProvider,
  t,
  setLanguage,
  getCurrentLanguage
};
