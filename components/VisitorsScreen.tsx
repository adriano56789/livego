

import React, { useState, useEffect } from 'react';
import { User, ToastType, Visitor } from '../types';
import { BackIcon } from './icons';
import { useTranslation } from '../i18n';
import { api } from '../services/api';
import { LoadingSpinner } from './Loading';

interface VisitorsScreenProps {
  onBack: () => void;
  onViewProfile: (user: User) => void;
  currentUser: User;
  addToast: (type: ToastType, message: string) => void;
}

const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffDays = Math.floor(diffSeconds / 86400);

    if (diffDays === 0) {
        return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1) {
        return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('pt-BR');
};


const VisitorItem: React.FC<{ visitor: Visitor; onClick: () => void }> = ({ visitor, onClick }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-800/50 cursor-pointer" onClick={onClick}>
            <div className="flex items-center space-x-4">
                <img src={visitor.avatarUrl} alt={visitor.name} className="w-14 h-14 rounded-full object-cover" />
                <div>
                    <h3 className="font-semibold text-white">{visitor.name}</h3>
                    <p className="text-sm text-gray-400">{t('profile.id')}: {visitor.identification}</p>
                </div>
            </div>
            <span className="text-sm text-gray-500">{formatTimestamp(visitor.visitTimestamp)}</span>
        </div>
    );
};


const VisitorsScreen: React.FC<VisitorsScreenProps> = ({ onBack, onViewProfile, currentUser, addToast }) => {
    const { t } = useTranslation();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        api.getVisitors(currentUser.id)
            .then(data => setVisitors(data || []))
            .catch(() => addToast(ToastType.Error, 'Falha ao carregar visitantes.'))
            .finally(() => setIsLoading(false));
    }, [currentUser.id, addToast]);
    
    const handleClear = async () => {
        try {
            await api.clearVisitors(currentUser.id);
            setVisitors([]);
            addToast(ToastType.Success, 'Histórico de visitantes limpo.');
        } catch {
            addToast(ToastType.Error, 'Falha ao limpar histórico.');
        }
    };

    return (
        <div className="absolute inset-0 bg-[#111] z-50 flex flex-col text-white">
            <header className="flex items-center p-4 border-b border-gray-800 flex-shrink-0">
                <button onClick={onBack} className="absolute">
                    <BackIcon className="w-6 h-6" />
                </button>
                <div className="flex-grow text-center">
                    <h1 className="text-lg font-semibold">{t('userLists.visitors.title')}</h1>
                </div>
                <button onClick={handleClear} className="absolute right-4 text-sm text-gray-300 hover:text-white">Limpar</button>
            </header>
            <main className="flex-grow overflow-y-auto no-scrollbar">
                 {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <LoadingSpinner />
                    </div>
                ) : visitors.length > 0 ? (
                    visitors.map(user => <VisitorItem key={`${user.id}-${user.visitTimestamp}`} visitor={user} onClick={() => onViewProfile(user)} />)
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>{t('userLists.visitors.noUsers')}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default VisitorsScreen;