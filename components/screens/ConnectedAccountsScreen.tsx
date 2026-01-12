import React from 'react';
import { BackIcon, ChevronRightIcon, GoogleIcon, FacebookIcon } from '../icons';

const ConnectedAccountsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="flex flex-col h-full bg-[#111]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                <button onClick={onBack}><BackIcon className="w-6 h-6 text-white" /></button>
                <div className="flex-grow text-center mr-6"><h1 className="text-lg font-bold text-white">Contas Conectadas</h1></div>
            </header>
            <div className="flex-grow p-4 space-y-4">
                <button className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-4">
                        <GoogleIcon className="w-6 h-6" />
                        <span className="text-white font-medium">Google</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">Não vinculado</span>
                        <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                    </div>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-4">
                        <FacebookIcon className="w-6 h-6 text-blue-600" />
                        <span className="text-white font-medium">Facebook</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">Não vinculado</span>
                        <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default ConnectedAccountsScreen;