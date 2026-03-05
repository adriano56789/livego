
import React from 'react';
import { BackIcon } from '../icons';
import { useTranslation } from '../../i18n';

const PushSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col h-full bg-black">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onBack} className="absolute"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('settings.push.title')}</h1></div>
            </header>
            <main className="flex-grow p-4">
                <p className="text-red-500">{t('settings.push.error')}</p>
            </main>
        </div>
    );
};

export default PushSettingsScreen;