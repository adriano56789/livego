import * as React from 'react';

// Define translation type
type Translations = {
  [key: string]: string | Translations;
};

interface TranslationContextType {
  t: (key: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
}

const defaultTranslations: Record<string, Translations> = {
  en: {
    // Add your translations here
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
    },
    // Add more translations as needed
  },
  // Add other languages as needed
};

const TranslationContext = React.createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = React.useContext(TranslationContext);
  if (!context) {
    // Return a default implementation if used outside of provider
    return {
      t: (key: string) => key,
      language: 'en',
      setLanguage: () => {},
    };
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: string;
  translations?: Record<string, Translations>;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  initialLanguage = 'en',
  translations = defaultTranslations,
}) => {
  const [language, setLanguage] = React.useState(initialLanguage);

  const t = React.useCallback(
    (key: string): string => {
      const keys = key.split('.');
      let result: any = translations[language] || translations.en || {};
      
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          return key; // Return the key if translation not found
        }
      }
      
      return typeof result === 'string' ? result : key;
    },
    [language, translations]
  );

  const value = React.useMemo(
    () => ({
      t,
      language,
      setLanguage: (lang: string) => setLanguage(lang),
    }),
    [t, language]
  );

  return React.createElement(
    TranslationContext.Provider,
    { value },
    children
  );
};

// Default export for backward compatibility
export default {
  useTranslation,
  LanguageProvider,
};
