import React from 'react';
import { BackIcon } from '../icons';
import { useTranslation } from '../../i18n';

const EarningsInfoScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col h-full bg-black text-white">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
                <button onClick={onBack} className="absolute"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('settings.earnings.title')}</h1></div>
            </header>
            <main className="flex-grow overflow-y-auto p-6 space-y-6 text-gray-300 no-scrollbar text-sm">
                <h2 className="text-2xl font-bold text-white text-center mb-4">{t('settings.earnings.policyTitle')}</h2>
                <section>
                    <h3 className="text-lg font-semibold text-white mb-2">{t('settings.earnings.conversionTitle')}</h3>
                    <p>{t('settings.earnings.conversionBody')}</p>
                </section>
                <section>
                    <h3 className="text-lg font-semibold text-white mb-2">{t('settings.earnings.feeTitle')}</h3>
                    <p>{t('settings.earnings.feeBody')}</p>
                    <ul className="list-none mt-4 space-y-3">
                        <li className="bg-[#1c1c1e] p-4 rounded-lg">
                            <strong className="text-white text-base block mb-1">{t('settings.earnings.streamerShareTitle')}</strong>
                            <p>{t('settings.earnings.streamerShareBody')}</p>
                        </li>
                        <li className="bg-[#1c1c1e] p-4 rounded-lg">
                            <strong className="text-white text-base block mb-1">{t('settings.earnings.platformShareTitle')}</strong>
                            <p>{t('settings.earnings.platformShareBody')}</p>
                        </li>
                    </ul>
                </section>
            </main>
        </div>
    );
};

export default EarningsInfoScreen;
