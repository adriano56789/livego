
import React from 'react';
import { BackIcon } from '../icons';
import { useTranslation } from '../../i18n';

const CopyrightScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col h-full bg-black text-white">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
                <button onClick={onBack} className="absolute"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('settings.copyright.title')}</h1></div>
            </header>
            <main className="flex-grow overflow-y-auto p-6 space-y-6 text-gray-300 no-scrollbar text-sm">
                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">{t('settings.copyright.section1Title')}</h2>
                    <p>{t('settings.copyright.section1p1')}</p>
                </section>
                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">{t('settings.copyright.section2Title')}</h2>
                    <p>{t('settings.copyright.section2p1')}</p>
                </section>
                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">{t('settings.copyright.section3Title')}</h2>
                    <p>{t('settings.copyright.section3p1')}</p>
                </section>
                <section>
                    <h2 className="text-lg font-semibold text-white mb-2">{t('settings.copyright.section4Title')}</h2>
                    <p>{t('settings.copyright.section4p1')}</p>
                    <p className="mt-2">{t('settings.copyright.section4p2')}</p>
                    <a href="mailto:copyright@livego.com" className="text-purple-400 hover:underline">copyright@livego.com</a>
                </section>
            </main>
        </div>
    );
};

export default CopyrightScreen;
