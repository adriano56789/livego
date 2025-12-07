import React from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import pt from './locales/pt.json';

// Initialize i18next
const initializeI18n = async () => {
  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        pt: { translation: pt }
      },
      lng: 'pt',
      fallbackLng: 'pt',
      interpolation: {
        escapeValue: false // React already escapes values
      },
      react: {
        useSuspense: false
      }
    });
  
  return i18n;
};

// Create a promise that resolves when i18n is initialized
const i18nInstance = initializeI18n();

export { i18nInstance as i18n };

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [ready, setReady] = React.useState(false);
  
  React.useEffect(() => {
    i18nInstance.then(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <>{children}</>;
};

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);

  const changeLanguage = (language: string) => {
    return i18n.changeLanguage(language).then(() => {
      setCurrentLanguage(language);
    });
  };

  return {
    t: (key: string, options?: Record<string, unknown>) => i18n.t(key, options),
    i18n,
    ready: true,
    language: currentLanguage,
    setLanguage: changeLanguage
  };
};
