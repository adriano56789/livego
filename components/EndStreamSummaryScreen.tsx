import React from 'react';
import { User, StreamSummaryData } from '../types';
import { BrazilFlagIcon } from './icons';

interface EndStreamSummaryScreenProps {
    currentUser: User;
    summaryData: StreamSummaryData;
    onClose: () => void;
}

const EndStreamSummaryScreen: React.FC<EndStreamSummaryScreenProps> = ({ currentUser, summaryData, onClose }) => {
    return (
        <div className="fixed inset-0 z-[300] bg-[#121212] flex flex-col items-center justify-center font-sans">
            <h1 className="text-white text-3xl font-bold mb-10 tracking-wide">A transmissão terminou.</h1>

            {/* Profile Section */}
            <div className="flex flex-col items-center mb-10">
                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full p-[3px] bg-gray-700">
                        <img 
                            src={currentUser.avatarUrl} 
                            alt={currentUser.name} 
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    {/* Flag Badge */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full border-2 border-[#121212] overflow-hidden shadow-md">
                        <BrazilFlagIcon className="w-full h-full object-cover" />
                    </div>
                </div>
                <h2 className="text-white text-lg font-medium">Live de {currentUser.name}</h2>
            </div>

            {/* Stats Grid */}
            <div className="w-full max-w-sm px-8 grid grid-cols-2 gap-y-8 gap-x-4 mb-16">
                
                {/* Row 1 */}
                <div className="flex flex-col items-center">
                    <span className="text-white text-2xl font-bold mb-1">+{summaryData.viewers}</span>
                    <span className="text-gray-500 text-xs font-medium">Número de espectadores</span>
                </div>
                
                <div className="flex flex-col items-center">
                    <span className="text-white text-2xl font-bold mb-1">{summaryData.duration}</span>
                    <span className="text-gray-500 text-xs font-medium">Duração ao vivo</span>
                </div>

                {/* Coins Centered in Logic (Using Grid) */}
                <div className="col-span-2 flex flex-col items-center mt-4">
                    <span className="text-white text-3xl font-bold mb-1">{summaryData.coins}</span>
                    <span className="text-gray-500 text-xs font-medium">Moedas</span>
                </div>

                {/* Row 2 */}
                <div className="flex justify-between w-full col-span-2 mt-4 px-2">
                    <div className="flex flex-col items-center">
                        <span className="text-white text-xl font-bold mb-1">{summaryData.followers}</span>
                        <span className="text-gray-500 text-xs font-medium">Seguidores</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-white text-xl font-bold mb-1">{summaryData.members}</span>
                        <span className="text-gray-500 text-xs font-medium">Membro</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-white text-xl font-bold mb-1">{summaryData.fans}</span>
                        <span className="text-gray-500 text-xs font-medium">Fãs</span>
                    </div>
                </div>
            </div>

            {/* Footer Button */}
            <div className="w-full max-w-xs px-4">
                <button 
                    onClick={onClose}
                    className="w-full bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-bold py-3.5 rounded-full transition-colors shadow-lg active:scale-95"
                >
                    Voltar para a página inicial
                </button>
            </div>
        </div>
    );
};

export default EndStreamSummaryScreen;