import React from 'react';
import { BackIcon } from '../icons';

const GiftNotificationSettingsScreen: React.FC<{ onBack: () => void, user: any, onOpenVIPCenter: () => void, gifts: any[] }> = ({ onBack }) => {
    return (
        <div className="flex flex-col h-full bg-[#111]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                <button onClick={onBack}><BackIcon className="w-6 h-6 text-white" /></button>
                <div className="flex-grow text-center mr-6"><h1 className="text-lg font-bold text-white">Avisos de Presentes</h1></div>
            </header>
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-white">Animações de Presentes</span>
                    <div className="w-10 h-6 bg-purple-600 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                </div>
            </div>
        </div>
    );
};

export default GiftNotificationSettingsScreen;