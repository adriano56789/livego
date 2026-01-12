import React from 'react';
import { BackIcon, ChevronRightIcon } from '../icons';

const NotificationSettingsScreen: React.FC<{ onBack: () => void, navigateTo: (p: string) => void }> = ({ onBack, navigateTo }) => {
    return (
        <div className="flex flex-col h-full bg-[#111]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                <button onClick={onBack}><BackIcon className="w-6 h-6 text-white" /></button>
                <div className="flex-grow text-center mr-6"><h1 className="text-lg font-bold text-white">Notificações</h1></div>
            </header>
            <div className="flex-grow pt-2">
                <button 
                    onClick={() => navigateTo('push_settings')}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-800/50 transition-colors"
                >
                    <span className="text-white">Configurações de Push</span>
                    <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                </button>
            </div>
        </div>
    );
};

export default NotificationSettingsScreen;