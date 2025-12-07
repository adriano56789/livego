import React from 'react';
import { BackIcon, CheckCircleIcon, VIPIcon, VIPBadgeIcon } from './icons';
import { User } from '../types';
import { useTranslation } from '../i18n';

interface VIPCenterScreenProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSubscribe: () => void;
}

const PrivilegeItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center space-x-3">
        <CheckCircleIcon className="w-6 h-6 text-yellow-400" />
        <span className="text-gray-300">{children}</span>
    </div>
);

const SubscriptionPlan: React.FC<{ title: string; price: string; onSubscribe: () => void; isVIP: boolean }> = ({ title, price, onSubscribe, isVIP }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-[#2C2C2E] rounded-lg p-4 flex justify-between items-center">
            <div>
                <p className="font-bold text-white text-lg">{title}</p>
                <p className="text-yellow-400 font-semibold">{price}</p>
            </div>
            <button onClick={onSubscribe} className="bg-yellow-500 text-black font-bold px-8 py-2 rounded-full hover:bg-yellow-600 transition-colors">
                {isVIP ? t('vip.renew') : t('vip.subscribe')}
            </button>
        </div>
    );
};


const VIPCenterScreen: React.FC<VIPCenterScreenProps> = ({ isOpen, onClose, user, onSubscribe }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a2558] to-[#111111] z-50 flex flex-col text-white font-sans">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onClose} className="absolute z-10"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold">{t('vip.centerTitle')}</h1></div>
            </header>

            <main className="flex-grow overflow-y-auto p-4 space-y-6 no-scrollbar">
                <div className="bg-black/20 rounded-lg p-4 flex items-center space-x-4">
                    <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
                    <div>
                        <div className="flex items-center space-x-2">
                           <p className="font-bold text-lg">{user.name}</p>
                           {user.isVIP && <VIPBadgeIcon className="w-6 h-6" />}
                        </div>
                        <p className="text-sm text-gray-400">{t('vip.status')}: <span className={user.isVIP ? "text-yellow-400" : "text-gray-500"}>{user.isVIP ? t('vip.memberUntil', {date: user.vipExpirationDate}) : t('vip.notMember')}</span></p>
                        {user.isVIP && user.vipSubscriptionDate && (
                            <p className="text-xs text-gray-500 mt-1">
                                {t('vip.subscribedOn', {date: user.vipSubscriptionDate})}
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-black/20 rounded-lg p-4">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                        <VIPIcon className="w-6 h-6 text-yellow-400"/>
                        <span>{t('vip.privileges')}</span>
                    </h2>
                    <div className="space-y-3">
                        <PrivilegeItem>{t('vip.privilege1')}</PrivilegeItem>
                        <PrivilegeItem>{t('vip.privilege2')}</PrivilegeItem>
                        <PrivilegeItem>{t('vip.privilege3')}</PrivilegeItem>
                        <PrivilegeItem>{t('vip.privilege4')}</PrivilegeItem>
                    </div>
                </div>

                 <div className="space-y-3">
                    <SubscriptionPlan title={t('vip.monthly')} price="R$ 29,99" onSubscribe={onSubscribe} isVIP={user.isVIP || false} />
                    <SubscriptionPlan title={t('vip.quarterly')} price="R$ 79,99" onSubscribe={onSubscribe} isVIP={user.isVIP || false} />
                    <SubscriptionPlan title={t('vip.yearly')} price="R$ 299,99" onSubscribe={onSubscribe} isVIP={user.isVIP || false} />
                </div>
            </main>
        </div>
    );
};

export default VIPCenterScreen;