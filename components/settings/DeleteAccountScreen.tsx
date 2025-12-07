
import React, { useState } from 'react';
import { BackIcon } from '../icons';
import { useTranslation } from '../../i18n';

interface DeleteAccountScreenProps {
    onBack: () => void;
    onDelete: () => void;
}

const DeleteAccountScreen: React.FC<DeleteAccountScreenProps> = ({ onBack, onDelete }) => {
    const { t } = useTranslation();
    const [confirmText, setConfirmText] = useState('');
    const isConfirmed = confirmText.toLowerCase() === 'delete';

    return (
        <div className="flex flex-col h-full bg-black">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-gray-800">
                <button onClick={onBack} className="absolute"><BackIcon className="w-6 h-6" /></button>
                <div className="flex-grow text-center"><h1 className="text-xl font-bold text-red-500">{t('settings.deleteAccount.title')}</h1></div>
                <div className="w-6"></div>
            </header>
            <main className="flex-grow p-6 flex flex-col justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Tem certeza?</h2>
                    <p className="text-gray-400 mb-4">Esta ação é irreversível. Todos os seus dados, incluindo perfil, diamantes, ganhos e histórico, serão permanentemente excluídos.</p>
                    <p className="text-gray-400">Para confirmar, digite <strong className="text-red-400">DELETE</strong> no campo abaixo.</p>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="w-full bg-[#2C2C2E] text-white rounded-lg p-3 mt-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="DELETE"
                    />
                </div>
                <button 
                    onClick={onDelete}
                    disabled={!isConfirmed}
                    className="w-full bg-red-600 text-white font-bold py-4 rounded-full transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    Excluir minha conta permanentemente
                </button>
            </main>
        </div>
    );
};

export default DeleteAccountScreen;
