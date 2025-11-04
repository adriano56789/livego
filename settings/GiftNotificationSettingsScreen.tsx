import React, { useState, useMemo } from 'react';
import { BackIcon, YellowDiamondIcon } from '../icons';
import { Gift, User } from '../../types';
import { useTranslation } from '../../i18n';

const GiftItem: React.FC<{ gift: Gift, isEnabled: boolean, onToggle: () => void, disabled?: boolean }> = ({ gift, isEnabled, onToggle, disabled = false }) => (
     <div className={`flex items-center justify-between w-full p-3 bg-[#1C1C1E] ${disabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
                {gift.component ? gift.component : <span className="text-3xl">{gift.icon}</span>}
            </div>
            <div>
                <p className="text-white">{gift.name} {gift.category === 'Efeito' && <span className="text-xs text-yellow-400 font-bold ml-1">VIP</span>}</p>
                {gift.price && (
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                        <YellowDiamondIcon className="w-4 h-4 text-yellow-400" />
                        <span>{gift.price.toLocaleString('pt-BR')}</span>
                    </div>
                )}
            </div>
        </div>
        <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <input type="checkbox" checked={isEnabled} onChange={onToggle} className="sr-only peer" disabled={disabled} />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
    </div>
);


const GiftNotificationSettingsScreen: React.FC<{ onBack: () => void; user: User; onOpenVIPCenter: () => void; gifts: Gift[] }> = ({ onBack, user, onOpenVIPCenter, gifts }) => {
    const { t } = useTranslation();
    const [enabledGifts, setEnabledGifts] = useState<Record<string, boolean>>(
        gifts.reduce((acc, gift) => ({ ...acc, [gift.name]: true }), {})
    );

    const handleToggle = (giftName: string) => {
        setEnabledGifts(prev => ({ ...prev, [giftName]: !prev[giftName] }));
    };

    const enabledCount = useMemo(() => {
        return Object.values(enabledGifts).filter(Boolean).length;
    }, [enabledGifts]);

    return (
        <div className="flex flex-col h-full bg-black">
            <header className="relative flex items-center justify-center p-4 flex-shrink-0">
                <button onClick={onBack} className="absolute left-4">
                    <BackIcon className="w-6 h-6 text-gray-300 hover:text-white transition-colors" />
                </button>
                <h1 className="text-xl font-bold text-center px-12 truncate">{t('settings.gifts.title')}</h1>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar p-4 space-y-4">
                <p className="text-gray-400 text-sm">{t('settings.gifts.description')}</p>
                
                {!user.isVIP && (
                    <div className="bg-yellow-800/50 border border-yellow-700 text-yellow-300 text-sm p-3 rounded-lg flex justify-between items-center">
                        <span>{t('settings.gifts.becomeVip')}</span>
                        <button onClick={onOpenVIPCenter} className="bg-yellow-500 text-black font-bold px-4 py-1 rounded-full text-xs hover:bg-yellow-600 transition-colors">{t('vip.subscribe')}</button>
                    </div>
                )}

                <div className="bg-green-900/50 border border-green-700 text-green-300 text-sm p-3 rounded-lg">
                    ✅ {t('settings.gifts.enabledCount', { count: enabledCount })} - {enabledCount === gifts.length ? t('settings.gifts.allEnabled') : t('settings.gifts.someHidden')}.
                </div>

                <div className="space-y-px">
                    {gifts.map(gift => (
                        <GiftItem 
                            key={gift.name} 
                            gift={gift} 
                            isEnabled={enabledGifts[gift.name]} 
                            onToggle={() => handleToggle(gift.name)}
                            disabled={gift.category === 'Efeito' && !user.isVIP}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default GiftNotificationSettingsScreen;
