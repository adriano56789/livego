import React from 'react';
import { BackIcon } from '../icons';

const DeleteAccountScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="flex flex-col h-full bg-[#111]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-white/5">
                <button onClick={onBack}><BackIcon className="w-6 h-6 text-white" /></button>
                <div className="flex-grow text-center mr-6"><h1 className="text-lg font-bold text-white">Excluir Conta</h1></div>
            </header>
            <div className="p-8 text-center">
                <div className="mb-6 text-red-500 font-bold text-lg">Atenção! Esta ação é permanente.</div>
                <p className="text-gray-400 text-sm mb-8">Ao excluir sua conta, você perderá todos os seus diamantes, seguidores e histórico de transmissões.</p>
                <button className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 active:scale-95 transition-all">
                    EU ENTENDO, EXCLUIR CONTA
                </button>
            </div>
        </div>
    );
};

export default DeleteAccountScreen;