
import React from 'react';
import { BackIcon, LiveGoLogo } from '../icons';
import { useTranslation } from '../../i18n';

const AppVersionScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col h-full bg-black">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onBack} className="absolute"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('settings.appVersion.title')}</h1></div>
            </header>
            <main className="flex-grow flex flex-col items-center pt-16 px-4">
                <LiveGoLogo className="w-48 h-auto mb-4" />
                <p className="text-gray-400 mt-1">{t('settings.appVersion.current')}</p>

                <div className="w-full mt-12 bg-[#1C1C1E] rounded-lg p-4 space-y-4 text-base">
                    <div className="flex justify-between">
                        <span className="text-gray-300">{t('settings.appVersion.latest')}</span>
                        <span className="text-white">1.0.0</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-300">{t('settings.appVersion.status')}</span>
                        <span className="text-green-400">{t('settings.appVersion.upToDate')}</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AppVersionScreen;
