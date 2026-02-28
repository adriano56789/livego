
import React from 'react';
import { BackIcon } from './icons';
import { useTranslation } from '../i18n';

const FAQScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
      <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
        <button onClick={onClose} className="absolute"><BackIcon className="w-6 h-6" /></button>
        <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('profile.menu.faq')}</h1></div>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <p className="text-gray-500">FAQ Screen</p>
      </main>
    </div>
  );
};

export default FAQScreen;